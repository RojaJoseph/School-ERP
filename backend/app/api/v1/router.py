from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, students, admissions, attendance, exams,
    fees, payroll, transport, library, inventory,
    communication, reports, timetable, permissions, portal,
    teacher_attendance,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(admissions.router)
api_router.include_router(attendance.router)
api_router.include_router(exams.router)
api_router.include_router(fees.router)
api_router.include_router(payroll.router)
api_router.include_router(transport.router)
api_router.include_router(library.router)
api_router.include_router(inventory.router)
api_router.include_router(communication.router)
api_router.include_router(reports.router)
api_router.include_router(timetable.router)
api_router.include_router(permissions.router)
api_router.include_router(portal.router)
api_router.include_router(teacher_attendance.router)
