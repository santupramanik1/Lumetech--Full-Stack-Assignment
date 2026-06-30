from pydantic import BaseModel

class ProductCreate(BaseModel):
    store_id: int
    name: str
    price: float
    stock_quantity: int

class ProductUpdate(BaseModel):
    name: str
    price: float
    stock_quantity: int

class ProductResponse(BaseModel):
    id: int
    store_id: int
    name: str
    price: float
    stock_quantity: int

    class Config:
        from_attributes = True
