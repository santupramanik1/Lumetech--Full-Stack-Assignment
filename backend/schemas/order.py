from pydantic import BaseModel
from typing import List, Optional
from models.order import OrderStatus

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_latitude: float
    customer_longitude: float
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    order_id: int
    product_id: int
    quantity: int

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    store_id: int
    delivery_rider_id: Optional[int] = None
    total_amount: float
    status: OrderStatus
    customer_lat: float
    customer_lng: float
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
