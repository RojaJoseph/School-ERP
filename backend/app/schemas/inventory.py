from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class TransactionTypeEnum(str, Enum):
    purchase = "purchase"
    issued   = "issued"
    returned = "returned"
    damaged  = "damaged"
    disposed = "disposed"

class InventoryItemCreate(BaseModel):
    item_code:   str
    name:        str
    category:    Optional[str] = None
    description: Optional[str] = None
    unit:        Optional[str] = None
    quantity:    int = 0
    min_stock:   int = 0
    unit_price:  float = 0
    location:    Optional[str] = None

class InventoryItemResponse(InventoryItemCreate):
    id:         int
    is_active:  bool
    created_at: datetime
    class Config:
        from_attributes = True

class InventoryTransactionCreate(BaseModel):
    item_id:          int
    transaction_type: TransactionTypeEnum
    quantity:         int
    unit_price:       float = 0
    reference_no:     Optional[str] = None
    remarks:          Optional[str] = None

class InventoryTransactionResponse(InventoryTransactionCreate):
    id:          int
    total_price: float
    created_at:  datetime
    class Config:
        from_attributes = True
