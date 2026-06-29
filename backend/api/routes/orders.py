from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from contextlib import AsyncExitStack
from typing import List

from config.db import get_db
from config.redis import acquire_lock
from api.dependencies import require_role
from models.user import User, UserRole
from models.product import Product
from models.order import Order, OrderStatus
from models.orderitems import OrderItem
from schemas.order import OrderCreate, OrderResponse

router = APIRouter()

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.CUSTOMER]))
):
    if not order_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item"
        )

    # Sort items by product_id to prevent deadlocks when locking multiple products
    sorted_items = sorted(order_in.items, key=lambda x: x.product_id)

    async with AsyncExitStack() as stack:
        # Acquire Redis locks for all products in the order sequentially
        for item in sorted_items:
            try:
                await stack.enter_async_context(
                    acquire_lock(f"lock:product:{item.product_id}", acquire_timeout=5.0, lock_timeout=10.0)
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"Could not lock product {item.product_id} for checking. Please try again."
                )

        # Now all locks are held. Let's fetch products and verify stock.
        product_ids = [item.product_id for item in sorted_items]
        result = await db.execute(select(Product).filter(Product.id.in_(product_ids)))
        db_products = {p.id: p for p in result.scalars().all()}

        # Verify that all products exist
        for item in sorted_items:
            if item.product_id not in db_products:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product with id {item.product_id} not found"
                )

        # Verify all products belong to the same store
        first_product = db_products[sorted_items[0].product_id]
        store_id = first_product.store_id
        for p_id in db_products:
            if db_products[p_id].store_id != store_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="All products in an order must belong to the same dark store"
                )

        # Verify stock and calculate total amount
        total_amount = 0.0
        for item in sorted_items:
            product = db_products[item.product_id]
            if product.stock_quantity < item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for product '{product.name}' (Requested: {item.quantity}, Available: {product.stock_quantity})"
                )
            total_amount += product.price * item.quantity

        # Deduct stock in DB
        for item in sorted_items:
            product = db_products[item.product_id]
            product.stock_quantity -= item.quantity

        # Create Order
        db_order = Order(
            customer_id=current_user.id,
            store_id=store_id,
            total_amount=total_amount,
            status=OrderStatus.PLACED,
            customer_lat=order_in.customer_latitude,
            customer_lng=order_in.customer_longitude
        )
        db.add(db_order)
        # Flush to get the order ID before adding order items
        await db.flush()

        # Create OrderItems
        db_order_items = []
        for item in sorted_items:
            db_item = OrderItem(
                order_id=db_order.id,
                product_id=item.product_id,
                quantity=item.quantity
            )
            db.add(db_item)
            db_order_items.append(db_item)

        # Commit all changes to the database
        await db.commit()

        # Refresh objects
        await db.refresh(db_order)
        for item in db_order_items:
            await db.refresh(item)

        return {
            "id": db_order.id,
            "customer_id": db_order.customer_id,
            "store_id": db_order.store_id,
            "delivery_rider_id": db_order.delivery_rider_id,
            "total_amount": db_order.total_amount,
            "status": db_order.status,
            "customer_lat": db_order.customer_lat,
            "customer_lng": db_order.customer_lng,
            "items": db_order_items
        }
