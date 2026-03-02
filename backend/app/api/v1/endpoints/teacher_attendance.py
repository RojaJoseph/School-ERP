from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel
import json, math, os, uuid, shutil, numpy as np

from app.db.base import get_db
from app.models.teacher_attendance import TeacherFaceProfile, TeacherAttendance, TeacherAttendanceStatusEnum
from app.models.user import User, RoleEnum
from app.core.config import settings
from app.core.dependencies import get_current_user, require_roles

router = APIRouter(prefix="/teacher-attendance", tags=["Teacher Attendance"])

UPLOAD_DIR = "uploads/teacher_selfies"
FACE_DIR   = "uploads/teacher_faces"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(FACE_DIR, exist_ok=True)


# ── Haversine ─────────────────────────────────────────
def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlam/2)**2
    return 2 * R * math.asin(math.sqrt(a))


# ── Attendance status from time ───────────────────────
def get_status(check_time: str) -> TeacherAttendanceStatusEnum:
    h, m = map(int, check_time.split(":"))
    mins = h * 60 + m
    on_h, on_m     = map(int, settings.ATTENDANCE_ONTIME_BEFORE.split(":"))
    late_h, late_m = map(int, settings.ATTENDANCE_LATE_BEFORE.split(":"))
    if mins <= on_h * 60 + on_m:
        return TeacherAttendanceStatusEnum.present
    elif mins <= late_h * 60 + late_m:
        return TeacherAttendanceStatusEnum.late
    else:
        return TeacherAttendanceStatusEnum.absent


# ── Extract face embedding via DeepFace ───────────────
def extract_embedding(image_path: str) -> list:
    """Extract 128-d face embedding using DeepFace (Facenet model)."""
    try:
        from deepface import DeepFace
        result = DeepFace.represent(
            img_path   = image_path,
            model_name = "Facenet",
            enforce_detection = True,
            detector_backend  = "opencv",
        )
        return result[0]["embedding"]
    except Exception as e:
        raise HTTPException(400, f"Face not detected clearly. Please ensure good lighting and look directly at the camera. ({str(e)})")


# ── Compare two embeddings ────────────────────────────
def compare_embeddings(emb1: list, emb2: list) -> float:
    """Returns cosine similarity (0-1). Higher = more similar."""
    a = np.array(emb1)
    b = np.array(emb2)
    cosine = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
    return float(cosine)


# ══════════════════════════════════════════════════════
# PHASE 1 — FACE REGISTRATION (Admin)
# ══════════════════════════════════════════════════════

@router.post("/register-face/{user_id}")
async def register_face(
    user_id:  int,
    photo:    UploadFile = File(...),
    db: Session          = Depends(get_db),
    current_user: User   = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    """
    Admin registers teacher face.
    Step 1: Save uploaded photo
    Step 2: DeepFace extracts embedding on backend
    Step 3: Store embedding in DB
    """
    teacher = db.query(User).filter(User.id == user_id).first()
    if not teacher:
        raise HTTPException(404, "Teacher not found")

    # Save photo
    ext      = (photo.filename or "face.jpg").rsplit(".", 1)[-1]
    filename = f"face_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"
    path     = os.path.join(FACE_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(photo.file, f)

    # Extract embedding using DeepFace on backend
    try:
        embedding = extract_embedding(path)
    except HTTPException:
        os.remove(path)  # cleanup bad photo
        raise

    # Save to DB
    profile = db.query(TeacherFaceProfile).filter(TeacherFaceProfile.user_id == user_id).first()
    if profile:
        # Remove old photo
        if profile.photo_path and os.path.exists(profile.photo_path):
            os.remove(profile.photo_path)
        profile.embedding  = json.dumps(embedding)
        profile.photo_path = path
        profile.is_active  = True
    else:
        profile = TeacherFaceProfile(
            user_id    = user_id,
            embedding  = json.dumps(embedding),
            photo_path = path,
        )
        db.add(profile)
    db.commit()

    return {
        "message":          f"✅ Face registered for {teacher.full_name}",
        "photo_path":       path,
        "embedding_dims":   len(embedding),
        "model":            "Facenet (DeepFace)",
    }


# ── Face Status ───────────────────────────────────────
@router.get("/face-status/{user_id}")
def face_status(
    user_id: int,
    db: Session        = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    p = db.query(TeacherFaceProfile).filter(
        TeacherFaceProfile.user_id   == user_id,
        TeacherFaceProfile.is_active == True,
    ).first()
    return {
        "registered":    p is not None,
        "photo_path":    p.photo_path if p else None,
        "registered_at": str(p.registered_at) if p else None,
    }


# ══════════════════════════════════════════════════════
# PHASE 2 — MARK ATTENDANCE (Teacher)
# ══════════════════════════════════════════════════════

@router.post("/mark")
async def mark_attendance(
    selfie:       UploadFile    = File(...),
    latitude:     float         = Form(...),
    longitude:    float         = Form(...),
    gps_accuracy: float         = Form(...),
    check_time:   Optional[str] = Form(None),
    db: Session   = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Full secure flow:
    Step 1: Validate GPS accuracy < 30m
    Step 2: Validate distance from school < 100m
    Step 3: Save selfie
    Step 4: DeepFace extracts embedding from selfie
    Step 5: Compare with stored embedding in DB
    Step 6: If similarity > threshold → mark attendance
    """
    today      = date.today()
    check_time = check_time or datetime.now().strftime("%H:%M")

    # ── Step 1: GPS Accuracy ──────────────────────────
    if gps_accuracy > 30:
        raise HTTPException(400,
            f"GPS accuracy too low ({gps_accuracy:.0f}m). "
            "Please move to an open area and try again.")

    # ── Step 2: Distance from school ──────────────────
    distance = haversine(latitude, longitude, settings.SCHOOL_LATITUDE, settings.SCHOOL_LONGITUDE)
    if distance > settings.SCHOOL_RADIUS_METERS:
        raise HTTPException(400,
            f"You are {distance:.0f}m away from school. "
            f"Must be within {settings.SCHOOL_RADIUS_METERS}m to mark attendance.")

    # ── Already marked today? ─────────────────────────
    existing = db.query(TeacherAttendance).filter(
        TeacherAttendance.user_id == current_user.id,
        TeacherAttendance.date    == today,
    ).first()
    if existing:
        raise HTTPException(400,
            f"Attendance already marked today at {existing.check_in_time} ({existing.status})")

    # ── Get stored embedding from DB ──────────────────
    profile = db.query(TeacherFaceProfile).filter(
        TeacherFaceProfile.user_id   == current_user.id,
        TeacherFaceProfile.is_active == True,
    ).first()
    if not profile:
        raise HTTPException(403,
            "Your face is not registered. Please contact admin to register your face first.")

    stored_embedding = json.loads(profile.embedding)

    # ── Step 3: Save selfie ───────────────────────────
    ext      = (selfie.filename or "selfie.jpg").rsplit(".", 1)[-1]
    filename = f"selfie_{current_user.id}_{today}_{uuid.uuid4().hex[:6]}.{ext}"
    path     = os.path.join(UPLOAD_DIR, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(selfie.file, f)

    # ── Step 4: Extract embedding from selfie ─────────
    try:
        live_embedding = extract_embedding(path)
    except HTTPException as e:
        os.remove(path)  # cleanup
        raise

    # ── Step 5: Compare embeddings ────────────────────
    similarity = compare_embeddings(live_embedding, stored_embedding)

    if similarity < settings.FACE_MATCH_THRESHOLD:
        os.remove(path)  # don't keep failed selfie
        raise HTTPException(400,
            f"Face verification failed (similarity: {similarity:.0%}). "
            "Please ensure good lighting and look directly at the camera.")

    # ── Step 6: Determine attendance status ───────────
    status = get_status(check_time)

    # ── Step 7: Insert attendance record ──────────────
    record = TeacherAttendance(
        user_id         = current_user.id,
        date            = today,
        status          = status,
        check_in_time   = check_time,
        latitude        = latitude,
        longitude       = longitude,
        distance_meters = round(distance, 1),
        face_confidence = round(similarity, 4),
        selfie_path     = path,
        marked_by       = "face_deepface",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    emoji = {"present": "✅", "late": "⚠️", "absent": "❌"}.get(status, "✅")
    return {
        "success":         True,
        "status":          status,
        "check_in_time":   check_time,
        "distance_meters": round(distance, 1),
        "face_similarity": round(similarity * 100, 1),
        "message":         f"{emoji} Attendance marked as {status.upper()} at {check_time}",
    }


# ══════════════════════════════════════════════════════
# MY STATUS (Teacher checks own status)
# ══════════════════════════════════════════════════════

@router.get("/my-status")
def my_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    today   = date.today()
    record  = db.query(TeacherAttendance).filter(
        TeacherAttendance.user_id == current_user.id,
        TeacherAttendance.date    == today,
    ).first()
    profile = db.query(TeacherFaceProfile).filter(
        TeacherFaceProfile.user_id   == current_user.id,
        TeacherFaceProfile.is_active == True,
    ).first()
    return {
        "face_registered": profile is not None,
        "marked_today":    record is not None,
        "status":          record.status if record else None,
        "check_in_time":   record.check_in_time if record else None,
        "distance_meters": record.distance_meters if record else None,
        "face_similarity": round((record.face_confidence or 0) * 100, 1) if record else None,
        "school_config": {
            "ontime_before": settings.ATTENDANCE_ONTIME_BEFORE,
            "late_before":   settings.ATTENDANCE_LATE_BEFORE,
            "radius_meters": settings.SCHOOL_RADIUS_METERS,
            "threshold":     settings.FACE_MATCH_THRESHOLD,
        }
    }


# ══════════════════════════════════════════════════════
# PHASE 3 — ADMIN DASHBOARD
# ══════════════════════════════════════════════════════

@router.get("/today")
def today_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    today     = date.today()
    excluded  = [RoleEnum.student, RoleEnum.parent]
    all_staff = db.query(User).filter(
        User.is_active == True,
        ~User.role.in_(excluded),
    ).all()
    records  = {r.user_id: r for r in db.query(TeacherAttendance).filter(TeacherAttendance.date == today).all()}
    profiles = {p.user_id: p for p in db.query(TeacherFaceProfile).filter(TeacherFaceProfile.is_active == True).all()}

    result = [{
        "user_id":         u.id,
        "name":            u.full_name,
        "role":            u.role,
        "email":           u.email,
        "face_registered": u.id in profiles,
        "photo_path":      profiles[u.id].photo_path if u.id in profiles else None,
        "status":          records[u.id].status if u.id in records else "absent",
        "check_in_time":   records[u.id].check_in_time if u.id in records else None,
        "distance_meters": records[u.id].distance_meters if u.id in records else None,
        "face_similarity": round((records[u.id].face_confidence or 0) * 100, 1) if u.id in records else None,
        "selfie_path":     records[u.id].selfie_path if u.id in records else None,
        "marked_by":       records[u.id].marked_by if u.id in records else None,
    } for u in all_staff]

    present = sum(1 for r in result if r["status"] == "present")
    late    = sum(1 for r in result if r["status"] == "late")
    absent  = sum(1 for r in result if r["status"] == "absent")

    return {
        "date":    str(today),
        "summary": {"total": len(result), "present": present, "late": late, "absent": absent},
        "staff":   result,
    }


# ── Monthly Report ────────────────────────────────────
@router.get("/monthly/{user_id}")
def monthly_report(
    user_id: int, year: int, month: int,
    db: Session        = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from calendar import monthrange
    records = db.query(TeacherAttendance).filter(
        TeacherAttendance.user_id == user_id,
        func.strftime("%Y", TeacherAttendance.date) == str(year),
        func.strftime("%m", TeacherAttendance.date) == f"{month:02d}",
    ).all()
    rec_map  = {str(r.date): r for r in records}
    days_in  = monthrange(year, month)[1]

    days = []
    for d in range(1, days_in + 1):
        key = f"{year}-{month:02d}-{d:02d}"
        rec = rec_map.get(key)
        days.append({
            "date":          key,
            "status":        rec.status if rec else "absent",
            "check_in_time": rec.check_in_time if rec else None,
        })

    return {
        "user_id": user_id, "year": year, "month": month,
        "present": sum(1 for d in days if d["status"] == "present"),
        "late":    sum(1 for d in days if d["status"] == "late"),
        "absent":  sum(1 for d in days if d["status"] == "absent"),
        "days":    days,
    }


# ── Manual Override ───────────────────────────────────
class ManualMarkRequest(BaseModel):
    user_id:    int
    date:       date
    status:     str
    note:       Optional[str] = None
    check_time: Optional[str] = None

@router.post("/manual-mark")
def manual_mark(
    data: ManualMarkRequest,
    db: Session        = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.super_admin, RoleEnum.school_admin)),
):
    check_time = data.check_time or datetime.now().strftime("%H:%M")
    existing   = db.query(TeacherAttendance).filter(
        TeacherAttendance.user_id == data.user_id,
        TeacherAttendance.date    == data.date,
    ).first()
    if existing:
        existing.status        = data.status
        existing.note          = data.note
        existing.check_in_time = check_time
        existing.marked_by     = "admin"
    else:
        db.add(TeacherAttendance(
            user_id       = data.user_id,
            date          = data.date,
            status        = data.status,
            check_in_time = check_time,
            note          = data.note,
            marked_by     = "admin",
        ))
    db.commit()
    return {"message": "✅ Attendance updated"}


# ── Config ────────────────────────────────────────────
@router.get("/config")
def get_config(current_user: User = Depends(get_current_user)):
    return {
        "school_lat":    settings.SCHOOL_LATITUDE,
        "school_lng":    settings.SCHOOL_LONGITUDE,
        "radius_meters": settings.SCHOOL_RADIUS_METERS,
        "ontime_before": settings.ATTENDANCE_ONTIME_BEFORE,
        "late_before":   settings.ATTENDANCE_LATE_BEFORE,
        "threshold":     settings.FACE_MATCH_THRESHOLD,
    }
