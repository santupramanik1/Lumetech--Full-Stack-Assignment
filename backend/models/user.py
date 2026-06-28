import enum
from sqlalchemy import Column,String,Integer,Enum
from config.db import Base

class UserRole(str,enum.Enum):
    CUSTOMER="CUSTOMER"
    STORE_MANAGER = "STORE_MANAGER"
    DELIVERY_RIDER = "DELIVERY_RIDER"

class User(Base):
    __tablename__="users"

    id=Column(Integer,primary_key=True,index=True)
    email=Column(String,unique=True,index=True,nullable=False)
    password_hash=Column(String,nullable=False)
    role=Column(Enum(UserRole),nullable=False,default=UserRole.CUSTOMER)
