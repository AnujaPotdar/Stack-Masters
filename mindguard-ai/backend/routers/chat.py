from fastapi import APIRouter, Depends
import google.generativeai as genai
import os

from database import get_mongo_db
from routers.auth import get_current_user
import schemas
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/chat", tags=["chat"])

# Initialize Gemini Client
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Simple heuristic risk keywords for real-time escalation
CRITICAL_KEYWORDS = ["suicide", "kill myself", "want to die", "end it all", "give up", "no point living"]

@router.post("/message")
async def send_message(
    message: schemas.ChatMessage,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    user_msg = message.text
    
    # 1. Simple Risk Escalation Check
    is_critical = any(kw in user_msg.lower() for kw in CRITICAL_KEYWORDS)
    escalation_alert = False
    
    if is_critical:
        new_score = max(0, current_user.readiness_score - 40)
        
        # Update User directly in MongoDB
        await mongo_db.users.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"risk_level": "Critical", "readiness_score": new_score}}
        )
        escalation_alert = True
        
        system_prompt = "You are MindGuard AI, an empathetic and highly professional crisis intervention first-aid chatbot. The user is in severe distress. Provide immediate psychological stabilization, validate their feelings, and gently encourage them to contact emergency helplines (e.g., 988 or local emergency). Keep it supportive and short."
    else:
        system_prompt = "You are MindGuard AI, a supportive psychological readiness and early intervention chatbot. Help the user reflect on their stress, provide coping mechanisms, and be empathetic."
        
    # 2. Generate Response Using Gemini
    try:
        current_model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=system_prompt)
        response = await current_model.generate_content_async(user_msg)
        bot_reply = response.text
    except Exception as e:
        error_msg = str(e)
        print(f"Chatbot AI Error: {error_msg}")
        bot_reply = "I'm having trouble connecting to my neural network right now. Please try again later."
        
    # 3. Save to MongoDB
    chat_log = {
        "user_id": current_user.id,
        "user_message": user_msg,
        "bot_reply": bot_reply,
        "is_critical": is_critical,
        "timestamp": datetime.utcnow()
    }
    await mongo_db.chat_history.insert_one(chat_log)
    
    # Return response along with any alerts
    return {
        "reply": bot_reply,
        "escalation_alert": escalation_alert,
        "escalation_message": "Immediate escalation required! Connecting to emergency counselor..." if escalation_alert else None
    }

@router.get("/history")
async def get_history(
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    cursor = mongo_db.chat_history.find({"user_id": current_user.id}).sort("timestamp", -1).limit(50)
    history = await cursor.to_list(length=50)
    # convert ObjectId to string to return as JSON
    for h in history:
        h["_id"] = str(h["_id"])
    return history
