from pydantic import BaseModel

class StoreCreate(BaseModel):
    name: str
    latitude: float
    longitude: float

class StoreResponse(BaseModel):
    id: int
    name: str
    manager_id: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True
