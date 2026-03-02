from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.transport import BusRouteCreate, StudentTransportCreate
from app.crud.crud_transport import (
    create_route, get_routes, get_route, update_route,
    assign_transport, get_transport_by_student
)
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/transport", tags=["Transport"])

@router.post("/routes", status_code=201)
def create_new_route(data: BusRouteCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.transport_mgr, RoleEnum.school_admin))):
    return create_route(db, data)

@router.get("/routes")
def list_routes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_routes(db)

@router.get("/routes/{route_id}")
def get_single_route(route_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    route = get_route(db, route_id)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@router.put("/routes/{route_id}")
def update_single_route(route_id: int, data: dict, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.transport_mgr, RoleEnum.school_admin))):
    route = update_route(db, route_id, data)
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@router.post("/assign", status_code=201)
def assign_student_transport(data: StudentTransportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return assign_transport(db, data)

@router.get("/student/{student_id}")
def get_student_transport(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transport = get_transport_by_student(db, student_id)
    if not transport:
        raise HTTPException(status_code=404, detail="No transport assigned")
    return transport
