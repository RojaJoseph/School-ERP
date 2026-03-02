from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.base import get_db
from app.schemas.inventory import InventoryItemCreate, InventoryTransactionCreate
from app.crud.crud_inventory import (
    create_item, get_items, get_item, create_transaction, get_transactions
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.post("/items", status_code=201)
def add_item(data: InventoryItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_item(db, data)

@router.get("/items")
def list_items(category: Optional[str] = None, low_stock: bool = False, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    total, items = get_items(db, category, low_stock, skip, per_page)
    return {"total": total, "page": page, "per_page": per_page, "items": items}

@router.get("/items/{item_id}")
def get_single_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    item = get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.post("/transactions", status_code=201)
def add_transaction(data: InventoryTransactionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = create_transaction(db, data, current_user.id)
    if not obj:
        raise HTTPException(status_code=404, detail="Item not found")
    return obj

@router.get("/transactions")
def list_transactions(item_id: Optional[int] = None, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    return get_transactions(db, item_id, skip, per_page)
