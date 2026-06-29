from pydantic import BaseModel
from models.order import OrderStatus

class OrderStatusUpdate(BaseModel):
    status: OrderStatus
