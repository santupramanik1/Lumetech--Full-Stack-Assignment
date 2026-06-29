from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.user import User
from schemas.user import UserRegister
from config.security import get_password_hash

async def get_user_by_email(db: AsyncSession, email: str):
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()

async def regsiter_user(db: AsyncSession, user: UserRegister):
    # Hash the password securely
    hashed_password = get_password_hash(user.password)
    
    # Build the database model
    db_user = User(
        email=user.email,
        password_hash=hashed_password,
        role=user.role
    )
    
    # Save to PostgreSQL
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user