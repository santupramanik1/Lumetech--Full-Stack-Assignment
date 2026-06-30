from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config.db import get_db
from schemas.product import ProductCreate, ProductResponse, ProductUpdate
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


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STORE_MANAGER]))
):
    result = await db.execute(select(Product).filter(Product.id == product_id))
    db_product = result.scalars().first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Verify dark store exists and belongs to the manager
    store_result = await db.execute(select(DarkStore).filter(DarkStore.id == db_product.store_id))
    store = store_result.scalars().first()
    if not store or store.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage products in this dark store"
        )
        
    db_product.name = product_in.name
    db_product.price = product_in.price
    db_product.stock_quantity = product_in.stock_quantity
    
    await db.commit()
    await db.refresh(db_product)
    return db_product
