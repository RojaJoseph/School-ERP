from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BusRouteCreate(BaseModel):
    route_name:   str
    route_no:     str
    driver_name:  Optional[str] = None
    driver_phone: Optional[str] = None
    vehicle_no:   Optional[str] = None
    capacity:     int = 0
    stops:        Optional[str] = None

class BusRouteResponse(BusRouteCreate):
    id:         int
    is_active:  bool
    created_at: datetime
    class Config:
        from_attributes = True

class StudentTransportCreate(BaseModel):
    student_id:  int
    route_id:    int
    stop_name:   Optional[str] = None
    pickup_time: Optional[str] = None
    drop_time:   Optional[str] = None

class StudentTransportResponse(StudentTransportCreate):
    id:         int
    is_active:  bool
    created_at: datetime
    class Config:
        from_attributes = True
