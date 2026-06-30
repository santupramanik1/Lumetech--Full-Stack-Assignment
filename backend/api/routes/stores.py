from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from config.db import get_db
from schemas.store import StoreCreate, StoreResponse
from schemas.order import OrderResponse
from models.darkstore import DarkStore
from models.user import User, UserRole
from models.order import Order, OrderStatus
from models.orderitems import OrderItem
from api.dependencies import require_role

router = APIRouter()

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_in: StoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STORE_MANAGER]))
):
    db_store = DarkStore(
        name=store_in.name,
        latitude=store_in.latitude,
        longitude=store_in.longitude,
        manager_id=current_user.id
    )
    db.add(db_store)
    await db.commit()
    await db.refresh(db_store)
    return db_store

@router.get("/managed", response_model=StoreResponse)
async def get_managed_store(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STORE_MANAGER]))
):
    result = await db.execute(select(DarkStore).filter(DarkStore.manager_id == current_user.id))
    store = result.scalars().first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You do not have a registered dark store"
        )
    return store

@router.get("/{store_id}/orders", response_model=List[OrderResponse])
async def get_store_orders(
    store_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STORE_MANAGER]))
):
    # Verify dark store exists
    store_result = await db.execute(select(DarkStore).filter(DarkStore.id == store_id))
    store = store_result.scalars().first()
    if not store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dark store not found"
        )

    # Verify authorization
    if store.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to manage this dark store"
        )

    # Fetch active orders
    orders_query = select(Order).filter(Order.store_id == store_id, Order.status != OrderStatus.DELIVERED)
    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()

    # Fetch all items for these orders
    order_ids = [order.id for order in orders]
    items_by_order = {}
    if order_ids:
        items_query = select(OrderItem).filter(OrderItem.order_id.in_(order_ids))
        items_result = await db.execute(items_query)
        items = items_result.scalars().all()
        for item in items:
            items_by_order.setdefault(item.order_id, []).append(item)

    # Construct the response matching OrderResponse schema
    response_orders = []
    for order in orders:
        response_orders.append({
            "id": order.id,
            "customer_id": order.customer_id,
            "store_id": order.store_id,
            "delivery_rider_id": order.delivery_rider_id,
            "total_amount": order.total_amount,
            "status": order.status,
            "customer_lat": order.customer_lat,
            "customer_lng": order.customer_lng,
            "items": items_by_order.get(order.id, [])
        })

    return response_orders

