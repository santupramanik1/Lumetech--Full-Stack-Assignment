from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config.db import get_db
from schemas.product import ProductCreate, ProductResponse
from models.product import Product
from models.darkstore import DarkStore
from models.user import User, UserRole
from api.dependencies import require_role

router = APIRouter()

@router.get("/search", response_model=List[ProductResponse])
async def search_products(
    q: str = Query(..., description="Filter products by name"),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Product).filter(Product.name.ilike(f"%{q}%")))
    products = result.scalars().all()
    return products


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_in: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STORE_MANAGER]))
):
    # Verify the dark store exists
    result = await db.execute(select(DarkStore).filter(DarkStore.id == product_in.store_id))
    store = result.scalars().first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dark store not found"
        )
    
    # Verify that the store is managed by the current store manager
    if store.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage this dark store"
        )
        
    db_product = Product(
        store_id=product_in.store_id,
        name=product_in.name,
        price=product_in.price,
        stock_quantity=product_in.stock_quantity
    )
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product
