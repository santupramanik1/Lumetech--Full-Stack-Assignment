from fastapi import FastAPI,Depends
import uvicorn
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from config.db import test_db_connection,Base,engine,get_db
from sqlalchemy.ext.asyncio import AsyncSession
from models.user import User
from models.darkstore import DarkStore
from models.product import Product
from models.order import Order
from models.orderitems import OrderItem
from api.routes import auth, stores, products, orders, websocket, delivery

from config.redis import test_redis_connection

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run async database connection check
    await test_db_connection()
    # Run Redis connection check
    await test_redis_connection()
    # Create tables asynchronously
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

from fastapi.middleware.cors import CORSMiddleware

app=FastAPI(
    title="Lumetech API",
    description="Backend for the Lumetech Full-Stack Assignment",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local and staging frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,prefix="/api/auth",tags=["Authentication"])
app.include_router(stores.router,prefix="/api/stores",tags=["Stores"])
app.include_router(products.router,prefix="/api/products",tags=["Products"])
app.include_router(orders.router,prefix="/api/orders",tags=["Orders"])
app.include_router(websocket.router, tags=["WebSockets"])
app.include_router(delivery.router, prefix="/api/delivery", tags=["Delivery"])


@app.get("/")
async def health_check(db:AsyncSession=Depends(get_db)):
    return {
        "success":True,
        "message":"Backend Server is healthy"
    }


PORT=int(os.getenv("PORT",8000))
if __name__=="__main__":
    print("Server is running at PORT",PORT)

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=PORT,
        reload=True,
        log_level="warning"
     )
