from sqlalchemy.orm import Session
from app.models.transport import BusRoute, StudentTransport
from app.schemas.transport import BusRouteCreate, StudentTransportCreate
from typing import Optional

def create_route(db: Session, data: BusRouteCreate) -> BusRoute:
    obj = BusRoute(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_routes(db: Session):
    return db.query(BusRoute).filter(BusRoute.is_active == True).all()

def get_route(db: Session, route_id: int) -> Optional[BusRoute]:
    return db.query(BusRoute).filter(BusRoute.id == route_id).first()

def update_route(db: Session, route_id: int, data: dict) -> Optional[BusRoute]:
    obj = get_route(db, route_id)
    if not obj:
        return None
    for k, v in data.items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def assign_transport(db: Session, data: StudentTransportCreate) -> StudentTransport:
    existing = db.query(StudentTransport).filter(StudentTransport.student_id == data.student_id).first()
    if existing:
        for k, v in data.model_dump().items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    obj = StudentTransport(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_transport_by_student(db: Session, student_id: int) -> Optional[StudentTransport]:
    return db.query(StudentTransport).filter(StudentTransport.student_id == student_id).first()
