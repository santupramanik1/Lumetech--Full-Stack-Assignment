from pydantic import BaseModel,EmailStr
from models.user import UserRole

# Base properties
class UserBase(BaseModel):
    email:EmailStr

# Payload For Register
class UserRegister(UserBase):
    role:UserRole=UserRole.CUSTOMER
    password:str 

#Payload For login
class UserLogin(BaseModel):
    email:EmailStr
    password:str

# Repsponse
class UserResponse(UserBase):
    id:int 
    role:UserRole

    class Config:
        from_attributes=True
