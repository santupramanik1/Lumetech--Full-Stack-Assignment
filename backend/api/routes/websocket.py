from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from config.redis import redis_client

router = APIRouter()

@router.websocket("/ws/stores/{store_id}/live-orders")
async def store_live_orders(websocket: WebSocket, store_id: int):
    await websocket.accept()
    
    # Subscribe to the Redis Pub/Sub channel for the store
    pubsub = redis_client.pubsub()
    await pubsub.subscribe(f"store:{store_id}:orders")
    
    try:
        while True:
            # Check for new messages from Redis Pub/Sub channel
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.5)
            if message:
                data = message['data']
                await websocket.send_text(data)
            await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe(f"store:{store_id}:orders")
        await pubsub.close()
