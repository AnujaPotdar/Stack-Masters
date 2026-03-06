import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB setup for All Application Data (Users, Chat history, Readiness scores)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
mongo_db = client.mindguard_db

def get_mongo_db():
    return mongo_db
