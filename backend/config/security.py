import os
import jwt 
from datetime import datetime ,timedelta,timezone
from passlib.context import CryptContext

SECRET_KEY=os.getenv("SECRET_KEY","your_super_secret_jwt_key_here_at_least_32_bytes")
ALGORITHM=os.getenv("ALGORITHM","HS256")
ACCESS_TOKEN_EXPIRY=int(os.getenv("ACCESS_TOKEN_EXPIRY",1440))

# Setup Bcrypt for password hashing
pwd_context=CryptContext(schemes=["bcrypt"],deprecated="auto")

def verify_password(plain_password:str,hashed_password:str)->bool:
    return pwd_context.verify(plain_password,hashed_password)

def get_password_hash(password:str)->str:
    return pwd_context.hash(password)

def create_access_token(data:dict)->str:
    to_encode=data.copy()
    expire=datetime.now(timezone.utc)+timedelta(minutes=ACCESS_TOKEN_EXPIRY)
    to_encode.update({"exp":expire})

    # Generate the JWT string
    encode_jwt=jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encode_jwt


