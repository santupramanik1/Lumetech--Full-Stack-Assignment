from sqlalchemy import String,Float,ForeignKey,Integer,Column
from config.db import Base
from sqlalchemy.orm import relationship

class DarkStore(Base):
    __tablename__="dark_stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
