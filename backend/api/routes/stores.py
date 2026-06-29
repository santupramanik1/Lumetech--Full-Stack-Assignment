from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from config.db import get_db
from schemas.store import StoreCreate, StoreResponse
from models.darkstore import DarkStore
from models.user import User, UserRole
from api.dependencies import require_role

router = APIRouter()

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def create_store(
    store_in: StoreCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.STORE_MANAGER]))
):
    db_store = DarkStore(
        name=store_in.name,
        latitude=store_in.latitude,
        longitude=store_in.longitude,
        manager_id=current_user.id
    )
    db.add(db_store)
    await db.commit()
    await db.refresh(db_store)
    return db_store
