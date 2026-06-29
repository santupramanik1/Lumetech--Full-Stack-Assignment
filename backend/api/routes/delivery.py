from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from config.db import get_db
from schemas.order import OrderResponse
from models.user import User, UserRole
from models.order import Order, OrderStatus
from models.orderitems import OrderItem
from api.dependencies import require_role

router = APIRouter()

@router.get("/orders/available", response_model=List[OrderResponse])
async def get_available_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DELIVERY_RIDER]))
):
    # Fetch all orders currently in the DISPATCHED state
    orders_query = select(Order).filter(Order.status == OrderStatus.DISPATCHED)
    orders_result = await db.execute(orders_query)
    orders = orders_result.scalars().all()

    # Fetch all items for these orders to populate OrderResponse schema
    order_ids = [order.id for order in orders]
    items_by_order = {}
    if order_ids:
        items_query = select(OrderItem).filter(OrderItem.order_id.in_(order_ids))
        items_result = await db.execute(items_query)
        items = items_result.scalars().all()
        for item in items:
            items_by_order.setdefault(item.order_id, []).append(item)

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
