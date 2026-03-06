from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import motor.motor_asyncio
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

# We connect to the exact same MongoDB database as the main application
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.mindguard_db

app = FastAPI(title="MindGuard AI - Project Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Project Admin API is running"}

@app.get("/api/statistics")
async def get_project_statistics():
    try:
        # Get total users
        total_users = await db.users.count_documents({})
        
        # Breakdown by role
        total_students = await db.users.count_documents({"role": "student"})
        total_soldiers = await db.users.count_documents({"role": "soldier"})
        total_adults = await db.users.count_documents({"role": "adult"})
        
        # Usage stats (chats and specific screenings)
        total_chat_sessions = await db.chat_history.count_documents({})
        
        # Get risk level distributions globally
        critical_risk = await db.users.count_documents({"risk_level": "Critical"})
        moderate_risk = await db.users.count_documents({"risk_level": "Moderate"})
        low_risk = await db.users.count_documents({"risk_level": "Low"})

        return {
            "total_users": total_users,
            "roles": {
                "students": total_students,
                "soldiers": total_soldiers,
                "adults": total_adults,
                "other": total_users - (total_students + total_soldiers + total_adults)
            },
            "total_chat_sessions": total_chat_sessions,
            "global_risk_distribution": {
                "critical": critical_risk,
                "moderate": moderate_risk,
                "low": low_risk
            }
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

if __name__ == "__main__":
    # Run on an isolated port to not conflict with main backend (8000) or frontend (5173)
    uvicorn.run(app, host="0.0.0.0", port=8005)
