from sqlalchemy import Column, String, Integer, DateTime, Float, Text, ForeignKey, Boolean, Enum
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class TransactionTypeEnum(str, enum.Enum):
    purchase = "purchase"
    issued   = "issued"
    returned = "returned"
    damaged  = "damaged"
    disposed = "disposed"

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id          = Column(Integer, primary_key=True, index=True)
    item_code   = Column(String(100), unique=True, nullable=False, index=True)
    name        = Column(String(255), nullable=False)
    category    = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    unit        = Column(String(50), nullable=True)
    quantity    = Column(Integer, default=0)
    min_stock   = Column(Integer, default=0)
    unit_price  = Column(Float, default=0)
    location    = Column(String(200), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class InventoryTransaction(Base):
    __tablename__ = "inventory_transactions"

    id              = Column(Integer, primary_key=True, index=True)
    item_id         = Column(Integer, ForeignKey("inventory_items.id"), nullable=False, index=True)
    transaction_type= Column(Enum(TransactionTypeEnum), nullable=False)
    quantity        = Column(Integer, nullable=False)
    unit_price      = Column(Float, default=0)
    total_price     = Column(Float, default=0)
    reference_no    = Column(String(100), nullable=True)
    remarks         = Column(Text, nullable=True)
    transacted_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
