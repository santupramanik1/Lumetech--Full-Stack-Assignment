from fastapi import FastAPI
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()

app=FastAPI(
    title="Lumetech API",
    description="Backend for the Lumetech Full-Stack Assignment",
    version="1.0.0"
)

@app.get("/")
def healt_check():
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