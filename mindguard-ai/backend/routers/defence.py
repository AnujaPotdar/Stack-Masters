from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import schemas
from database import get_mongo_db
from routers.auth import get_current_user

router = APIRouter(prefix="/defence", tags=["defence"])

def calculate_stress_score(mood: int, sleep: float, fatigue: int, anxiety: int) -> str:
    """
    Calculates operational stress readiness score.
    Higher mood is good (1-5), more sleep is good. Higher fatigue/anxiety is bad.
    """
    # Simple algorithm
    base = mood * 4 
    sleep_points = 10 if sleep >= 7 else sleep * 1.5
    penalty = (fatigue * 3) + (anxiety * 3)
    
    score = base + sleep_points - penalty
    
    if score > 15:
        return "Ready"
    elif score > 5:
        return "Monitor"
    else:
        return "Needs Support"

def calculate_ptsd_risk(nightmares: int, flashbacks: int, numbness: int, alertness: int) -> str:
    """
    Calculates PTSD & Trauma Risk based on symptoms severity (1-5 scale).
    """
    total = nightmares + flashbacks + numbness + alertness
    if total >= 12:
        return "High"
    elif total >= 8:
        return "Medium"
    else:
        return "Low"

@router.post("/screening", response_model=schemas.DefenceScreeningResult)
async def submit_screening(
    screening: schemas.DefenceScreening,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    stress = calculate_stress_score(screening.mood, screening.sleep_hours, screening.fatigue, screening.anxiety)
    ptsd = calculate_ptsd_risk(screening.nightmares, screening.flashbacks, screening.emotional_numbness, screening.hyper_alertness)
    
    doc = {
        "user_id": current_user.id,
        "timestamp": datetime.utcnow(),
        "screening_data": screening.dict(),
        "stress_score": stress,
        "ptsd_risk": ptsd,
        "anonymous": False
    }
    await mongo_db.defence_data.insert_one(doc)
    
    return schemas.DefenceScreeningResult(stress_score=stress, ptsd_risk=ptsd)

@router.post("/anonymous-screening", response_model=schemas.DefenceScreeningResult)
async def submit_anonymous_screening(
    screening: schemas.DefenceScreening,
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    stress = calculate_stress_score(screening.mood, screening.sleep_hours, screening.fatigue, screening.anxiety)
    ptsd = calculate_ptsd_risk(screening.nightmares, screening.flashbacks, screening.emotional_numbness, screening.hyper_alertness)
    
    doc = {
        "user_id": "anonymous",
        "timestamp": datetime.utcnow(),
        "screening_data": screening.dict(),
        "stress_score": stress,
        "ptsd_risk": ptsd,
        "anonymous": True
    }
    await mongo_db.defence_data.insert_one(doc)
    return schemas.DefenceScreeningResult(stress_score=stress, ptsd_risk=ptsd)

import google.generativeai as genai
import google.api_core.exceptions
import os

live_interaction_prompt = """You are an expert military psychologist providing a voice-based live psychological screening via an Alexa-like conversational interface.
The soldier is interacting with you directly via a secure audio/video feed.
Your goal is to assess their current mental condition, readiness, and latent stress levels through a natural, empathetic, and spoken dialogue.
Analyze the user's facial expression from the provided visual snapshot and detect voice tone from the text.
Ask ONE brief, thought-provoking question at a time. Keep it conversational and easy to understand when spoken aloud.
If it's the very first message, start with a welcoming, brief opening question about how they are doing or their recent experiences.
If they answer, ask an appropriate follow-up question based on their response and visual cues. Do not give a final diagnosis yet."""

@router.post("/interaction-session", response_model=schemas.LiveQuestionResponse)
async def generate_interaction_session_reply(
    data: schemas.LiveSessionRequest
):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=live_interaction_prompt)
        
        # Build chat history for Gemini
        chat = model.start_chat(history=[])
        
        # We manually feed previous history if any exists
        for msg in data.messages[:-1]: 
             role = "user" if msg["role"] == "user" else "model"
             parts = [msg["content"]]
             if msg.get("image_data"):
                 parts.append({"mime_type": "image/jpeg", "data": msg["image_data"]})
             chat.history.append({"role": role, "parts": parts})
             
        # Send the latest user message
        latest_msg = data.messages[-1] if data.messages else {"content": "Start the conversation."}
        parts = [latest_msg.get("content", "Start the conversation.")]
        if type(latest_msg) == dict and latest_msg.get("image_data"):
            parts.append({"mime_type": "image/jpeg", "data": latest_msg["image_data"]})
            
        response = await chat.send_message_async(parts)
        
        return schemas.LiveQuestionResponse(question=response.text.strip())
    except google.api_core.exceptions.ResourceExhausted as e:
        print("Rate limit exceeded:", repr(e))
        raise HTTPException(status_code=429, detail="AI Quota Exceeded. Please try again later.")
    except Exception as e:
        print("Interaction session error:", repr(e))
        raise HTTPException(status_code=500, detail="Internal AI Error. Please check backend connection.")

live_analyze_prompt = """You are an expert military psychologist.
Review the provided transcript and visual snapshots of a live voice/video interaction session between you (the AI Psychologist) and the Soldier.
Using established psychological theories, profoundly analyze the soldier's overall responses, visual facial expressions, text tone, and spoken content.
Your ultimate goal is to provide a comprehensive diagnosis of their final mental condition.
Format your response as a JSON object:
{
  "mental_state": "<short clinical label: e.g. Operational Readiness High, Acute Stress Response, Combat Fatigue Mild, Needs Immediate Support>",
  "analysis": "<A 3-4 sentence comprehensive final clinical diagnosis explaining their mental condition based on the conversation and facial expressions.>",
  "facial_expression_analysis": "<1-2 sentences analyzing their facial expressions, micro-expressions, and visual cues.>",
  "voice_tone_analysis": "<1-2 sentences analyzing their voice tone, speech patterns, and text sentiment from the transcript.>"
}
Return ONLY valid JSON."""

import json

@router.post("/interaction-analyze", response_model=schemas.LiveAnalyzeResponse)
async def analyze_live_response(
    data: schemas.LiveAnalyzeRequest,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=live_analyze_prompt)
        
        # Format the transcript with images
        prompt_parts = ["Analyze the soldier's mental state based on this Session Transcript and any attached visual snapshots:\n"]
        for m in data.messages:
            role_name = 'Soldier' if m['role'] == 'user' else 'Psychologist'
            prompt_parts.append(f"{role_name}: {m['content']}\n")
            if m.get("image_data"):
                prompt_parts.append({"mime_type": "image/jpeg", "data": m["image_data"]})
        
        response = await model.generate_content_async(prompt_parts)
        response_text = response.text.strip()
        
        # Clean up JSON formatting
        if response_text.startswith("```json"): response_text = response_text[7:]
        if response_text.startswith("```"): response_text = response_text[3:]
        if response_text.endswith("```"): response_text = response_text[:-3]
            
        result_json = json.loads(response_text)
        
        doc = {
            "user_id": current_user.id,
            "timestamp": datetime.utcnow(),
            "type": "live_interaction_full_session",
            "messages": data.messages,
            "mental_state": result_json.get("mental_state", "Unknown"),
            "analysis": result_json.get("analysis", "Unable to analyze."),
            "facial_expression_analysis": result_json.get("facial_expression_analysis"),
            "voice_tone_analysis": result_json.get("voice_tone_analysis")
        }
        await mongo_db.defence_data.insert_one(doc)
        
        return schemas.LiveAnalyzeResponse(**result_json)
    except Exception as e:
        print("Live analysis error:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to analyze response.")
