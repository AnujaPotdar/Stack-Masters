from fastapi import APIRouter, Depends
from pydantic import BaseModel
import google.generativeai as genai
import os
import asyncio # Added asyncio import


router = APIRouter(prefix="/counseling", tags=["counseling"])

class VoiceRequest(BaseModel):
    text: str

sys_prompt = """You are MindGuard AI, an empathetic and professional voice counselor. 
The user is speaking to you. Respond in a highly conversational, validating, and supportive manner.
Keep your responses relatively brief (1-3 sentences) because they will be read aloud through text-to-speech.
Do NOT use markdown or bullet points, only plain text that sounds natural when spoken.
"""

@router.post("/speak")
async def process_voice_input(request: VoiceRequest):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        current_model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=sys_prompt)
        response = await current_model.generate_content_async(request.text)
        
        return {"reply": response.text}
    except Exception as e:
        print(f"Counseling AI Error: {e}")
        return {"reply": "I'm sorry, I'm having trouble analyzing your request right now. Please try again."}

from fastapi import HTTPException
import google.api_core.exceptions
import schemas
from database import get_mongo_db
from routers.auth import get_current_user
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import json

counseling_interaction_prompt = """You are MindGuard AI, an empathetic, professional psychological counselor.
The user is a student or an adult interacting with you directly via a secure audio/video feed.
Your goal is to assess their current mental condition, general well-being, and latent stress levels through a natural, empathetic, and spoken dialogue.
Analyze the user's facial expression from the provided visual snapshot and detect voice tone from the text.
Ask ONE brief, thought-provoking question at a time. Keep it conversational and easy to understand when spoken aloud.
If it's the very first message, start with a welcoming, brief opening question about how they are doing today or what's on their mind.
If they answer, ask an appropriate follow-up question based on their response and visual cues. Do not give a final diagnosis yet."""

@router.post("/interaction-session", response_model=schemas.LiveQuestionResponse)
async def generate_interaction_session_reply(
    data: schemas.LiveSessionRequest
):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=counseling_interaction_prompt)
        
        chat = model.start_chat(history=[])
        
        for msg in data.messages[:-1]: 
             role = "user" if msg["role"] == "user" else "model"
             parts = [msg["content"]]
             if msg.get("image_data"):
                 parts.append({"mime_type": "image/jpeg", "data": msg["image_data"]})
             chat.history.append({"role": role, "parts": parts})
             
        latest_msg = data.messages[-1] if data.messages else {"content": "Start the conversation."}
        parts = [latest_msg.get("content", "Start the conversation.")]
        if type(latest_msg) == dict and latest_msg.get("image_data"):
            parts.append({"mime_type": "image/jpeg", "data": latest_msg["image_data"]})
            
        response = await chat.send_message_async(parts)
        
        return schemas.LiveQuestionResponse(question=response.text.strip())
    except google.api_core.exceptions.ResourceExhausted as e:
        print(f"Gemini API Quota Exceeded: {str(e)}")
        return {"question": "Are you feeling overwhelmed or stressed lately?"}
    except Exception as e:
        print(f"Failed to generate online interaction question: {str(e)}")
        return {"question": "Are you doing okay today?"}

counseling_analyze_prompt = """You are an expert psychological counselor.
Review the provided transcript and visual snapshots of a live voice/video interaction session between you and the user (Student/Adult).
Using established psychological theories, carefully analyze their overall responses, visual facial expressions, text tone, and spoken content.
Your ultimate goal is to provide a comprehensive diagnosis of their final mental condition.
Format your response as a JSON object:
{
  "mental_state": "<short label: e.g. Healthy, Mild Stress, Moderate Anxiety, Depressive Symptoms, Needs Professional Help>",
  "analysis": "<A 3-4 sentence comprehensive final assessment explaining their mental condition based on the conversation and facial expressions.>",
  "facial_expression_analysis": "<1-2 sentences analyzing their facial expressions, micro-expressions, and visual cues.>",
  "voice_tone_analysis": "<1-2 sentences analyzing their voice tone, speech patterns, and text sentiment from the transcript.>"
}
Return ONLY valid JSON."""

@router.post("/interaction-analyze", response_model=schemas.LiveAnalyzeResponse)
async def analyze_live_response_counseling(
    data: schemas.LiveAnalyzeRequest,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=counseling_analyze_prompt)
        
        prompt_parts = ["Analyze the user's mental state based on this Session Transcript and any attached visual snapshots:\n"]
        for m in data.messages:
            role_name = 'User' if m['role'] == 'user' else 'Counselor'
            prompt_parts.append(f"{role_name}: {m['content']}\n")
            if m.get("image_data"):
                prompt_parts.append({"mime_type": "image/jpeg", "data": m["image_data"]})
        
        response = await asyncio.wait_for(model.generate_content_async(prompt_parts), timeout=5.0) # Wrapped with asyncio.wait_for
        response_text = response.text.strip()
        
        if response_text.startswith("```json"): response_text = response_text[7:]
        if response_text.startswith("```"): response_text = response_text[3:]
        if response_text.endswith("```"): response_text = response_text[:-3]
            
        result_json = json.loads(response_text)
        result_json["analysis"] = result_json.get("analysis", "") + " (Generated by Online AI)"
        
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
        await mongo_db.health_data.insert_one(doc)
        
        return schemas.LiveAnalyzeResponse(**result_json)
    except Exception as e:
        print("Live analysis error, falling back to offline dummy analysis:", repr(e))
        # Provide a basic offline structural JSON when API fails completely
        offline_result = {
            "mental_state": "Offline Mode Active",
            "analysis": "Unable to provide comprehensive analysis due to offline mode. Please consult a human professional if you feel distressed. (Generated by Offline AI Mode)",
            "facial_expression_analysis": "Offline mode cannot process image data.",
            "voice_tone_analysis": "Offline mode active."
        }
        return schemas.LiveAnalyzeResponse(**offline_result)
