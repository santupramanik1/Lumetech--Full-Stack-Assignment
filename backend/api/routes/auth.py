from fastapi import APIRouter,Depends ,HTTPException,status
from sqlalchemy.ext.asyncio import AsyncSession

from config.db import get_db
from config.security import verify_password, create_access_token
from schemas.user import UserRegister, UserResponse, UserLogin
from crud import user_repo

router = APIRouter()

@router.post("/register",response_model=UserResponse,status_code=status.HTTP_201_CREATED)
async def register_user(user:UserRegister,db:AsyncSession=Depends(get_db)):

    # Check if the email is already exist or not
    existing_user=await user_repo.get_user_by_email(db,email=user.email)
    if existing_user:
       raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Email already exists"
        )
    
    # Create new user
    return await user_repo.regsiter_user(db=db,user=user)

@router.post("/login")
async def login_user(user_credentials:UserLogin,db:AsyncSession=Depends(get_db)):
    # Find the user by email
    user=await user_repo.get_user_by_email(db,email=user_credentials.email)

    # Check if user exists and password matches
    if not user or not verify_password(user_credentials.password,user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
         )
    
    access_token=create_access_token(data={
        "sub":str(user.id),
        "role":user.role.value
    })

    return {
        "token":access_token,
        "role":user.role
    }

    


