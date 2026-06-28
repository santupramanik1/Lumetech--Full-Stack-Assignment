import enum

from sqlalchemy import String,Float,ForeignKey,Integer,Column,Enum
from config.db import Base

class OrderStatus(str, enum.Enum):
    PLACED = "PLACED"
    PACKING = "PACKING"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_id = Column(Integer, ForeignKey("dark_stores.id"), nullable=False)
    delivery_rider_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable
    total_amount = Column(Float, nullable=False)
    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PLACED)
    customer_lat = Column(Float, nullable=False)
    customer_lng = Column(Float, nullable=False)