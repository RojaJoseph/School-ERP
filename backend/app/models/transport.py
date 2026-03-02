from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean, Float
from sqlalchemy.sql import func
from app.db.session import Base

class BusRoute(Base):
    __tablename__ = "bus_routes"

    id           = Column(Integer, primary_key=True, index=True)
    route_name   = Column(String(200), nullable=False)
    route_no     = Column(String(50), unique=True, nullable=False)
    driver_name  = Column(String(150), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    vehicle_no   = Column(String(50), nullable=True)
    capacity     = Column(Integer, default=0)
    stops        = Column(Text, nullable=True)   # JSON string of stops
    is_active    = Column(Boolean, default=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

class StudentTransport(Base):
    __tablename__ = "student_transport"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    route_id    = Column(Integer, ForeignKey("bus_routes.id"), nullable=False)
    stop_name   = Column(String(200), nullable=True)
    pickup_time = Column(String(20), nullable=True)
    drop_time   = Column(String(20), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
