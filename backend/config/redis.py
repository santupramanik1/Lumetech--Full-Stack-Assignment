import os
import redis.asyncio as redis
from contextlib import asynccontextmanager

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create a connection pool
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

async def test_redis_connection():
    try:
        await redis_client.ping()
        print("Connected to Redis successfully!\n")
    except Exception as e:
        print("ERROR: Redis connection failed!")
        print(f"Details: {e}\n")

@asynccontextmanager
async def acquire_lock(lock_name: str, acquire_timeout: float = 10.0, lock_timeout: float = 10.0):
    """
    Simple Redis-based distributed lock context manager using SETNX.
    - lock_name: the key in Redis to set.
    - acquire_timeout: max time to wait to acquire the lock.
    - lock_timeout: expire time for the lock (to avoid deadlocks).
    """
    import asyncio
    import time
    
    end = time.time() + acquire_timeout
    locked = False
    
    while time.time() < end:
        # px defines expiration time in milliseconds
        if await redis_client.set(lock_name, "locked", px=int(lock_timeout * 1000), nx=True):
            locked = True
            break
        await asyncio.sleep(0.05)
        
    if not locked:
        raise Exception(f"Failed to acquire lock for {lock_name}")
        
    try:
        yield
    finally:
        if locked:
            await redis_client.delete(lock_name)
