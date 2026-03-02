from sqlalchemy.orm import Session
from app.models.inventory import InventoryItem, InventoryTransaction
from app.schemas.inventory import InventoryItemCreate, InventoryTransactionCreate
from typing import Optional

def create_item(db: Session, data: InventoryItemCreate) -> InventoryItem:
    obj = InventoryItem(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_items(db: Session, category: Optional[str] = None, low_stock: bool = False, skip=0, limit=50):
    q = db.query(InventoryItem).filter(InventoryItem.is_active == True)
    if category:
        q = q.filter(InventoryItem.category == category)
    if low_stock:
        q = q.filter(InventoryItem.quantity <= InventoryItem.min_stock)
    total = q.count()
    return total, q.offset(skip).limit(limit).all()

def get_item(db: Session, item_id: int) -> Optional[InventoryItem]:
    return db.query(InventoryItem).filter(InventoryItem.id == item_id).first()

def create_transaction(db: Session, data: InventoryTransactionCreate, transacted_by: int) -> Optional[InventoryTransaction]:
    item = get_item(db, data.item_id)
    if not item:
        return None
    total = data.quantity * data.unit_price
    obj = InventoryTransaction(**data.model_dump(), total_price=total, transacted_by=transacted_by)
    # Update stock
    if data.transaction_type == "purchase":
        item.quantity += data.quantity
    elif data.transaction_type in ["issued", "damaged", "disposed"]:
        item.quantity = max(0, item.quantity - data.quantity)
    elif data.transaction_type == "returned":
        item.quantity += data.quantity
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_transactions(db: Session, item_id: Optional[int] = None, skip=0, limit=50):
    q = db.query(InventoryTransaction)
    if item_id:
        q = q.filter(InventoryTransaction.item_id == item_id)
    return q.offset(skip).limit(limit).all()
