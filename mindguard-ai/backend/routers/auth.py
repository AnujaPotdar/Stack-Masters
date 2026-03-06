from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import bcrypt
from jose import JWTError, jwt
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from database import get_mongo_db
import schemas

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

SECRET_KEY = os.getenv("SECRET_KEY", "mindguard_super_secret_dev_key_2024") # Static key for persistent sessions
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))

async def verify_password(plain_password, hashed_password):
    return await asyncio.to_thread(bcrypt.checkpw, plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

async def get_password_hash(password):
    return await asyncio.to_thread(
        lambda p: bcrypt.hashpw(p.encode('utf-8'), bcrypt.gensalt(rounds=4)).decode('utf-8'),
        password
    )

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    user = await mongo_db.users.find_one({"email": token_data.username})
    if user is None:
        raise credentials_exception
        
    user['id'] = str(user['_id'])
    return schemas.User(**user)

@router.post("/register", response_model=schemas.User)
async def register(user: schemas.UserCreate, mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    db_user = await mongo_db.users.find_one({"email": user.email})
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = await get_password_hash(user.password)
    
    new_user_dict = {
        "email": user.email,
        "name": user.name,
        "hashed_password": hashed_password,
        "role": user.role,
        "college": user.college,
        "readiness_score": 100.0,
        "risk_level": "Low"
    }
    
    result = await mongo_db.users.insert_one(new_user_dict)
    new_user_dict['id'] = str(result.inserted_id)
    
    return schemas.User(**new_user_dict)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)):
    user = await mongo_db.users.find_one({"email": form_data.username})
    
    if not user or not await verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
async def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user
