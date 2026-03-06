from fastapi import APIRouter, Depends, HTTPException, status
import google.generativeai as genai
import os
from datetime import datetime
from bson import ObjectId
from typing import List
import json

from database import get_mongo_db
from routers.auth import get_current_user
import schemas
from motor.motor_asyncio import AsyncIOMotorDatabase


router = APIRouter(prefix="/peer-support", tags=["peer-support"])

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# Simple AI Monitoring
async def analyze_content(text: str) -> dict:
    sys_prompt = """You are an AI moderator for a mental health peer support forum.
Analyze the following text.
Return ONLY a valid JSON object.
{
  "is_safe": true/false,
  "reason": "<string: why it is safe or unsafe>",
  "severe_distress": true/false
}
severe_distress should be true ONLY if the user talks about immediate severe self-harm, suicide, or extreme despair.
Examples of unsafe: bullying, hate speech, trolling, encouraging self-harm.
Examples of safe: sharing depression, venting, asking for help, general stress.
"""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash", system_instruction=sys_prompt)
        response = await model.generate_content_async(text)
        res_text = response.text.strip()
        if res_text.startswith("```json"): res_text = res_text[7:]
        if res_text.startswith("```"): res_text = res_text[3:]
        if res_text.endswith("```"): res_text = res_text[:-3]
        
        return json.loads(res_text)
    except Exception as e:
        print(f"Content analysis failed: {str(e)}")
        # Default fallback if API fails completely
        return {"is_safe": True, "reason": "Automated moderation offline.", "severe_distress": False}

@router.get("/topics")
async def get_topics():
    return ["All", "Academic Stress", "Anxiety", "Homesickness", "Depression", "General Support", "Relationships"]

@router.post("/posts", response_model=schemas.PeerPost)
async def create_post(
    post: schemas.PeerPostCreate,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    # 1. AI Monitoring
    analysis = await analyze_content(post.title + "\n" + post.content)
    
    if not analysis.get("is_safe", True):
        raise HTTPException(status_code=400, detail="Your post contains content that violates our community guidelines for safety and respect: " + analysis.get("reason", ""))
        
    flags = []
    if analysis.get("severe_distress", False):
        flags.append("SEVERE_DISTRESS")

    # 2. Save
    new_post = {
        "title": post.title,
        "content": post.content,
        "topic": post.topic,
        "author_id": current_user.id,
        "is_anonymous": post.is_anonymous,
        "created_at": datetime.utcnow().isoformat(),
        "flags": flags
    }
    
    result = await mongo_db.peer_posts.insert_one(new_post.copy())
    new_post["id"] = str(result.inserted_id)
    
    # We return the post. If flags contains 'SEVERE_DISTRESS', frontend will show a banner.
    return schemas.PeerPost(**new_post)


@router.get("/posts/{topic}", response_model=List[schemas.PeerPost])
async def get_posts_by_topic(
    topic: str,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    query = {}
    if topic != "All":
        query["topic"] = topic
        
    cursor = mongo_db.peer_posts.find(query).sort("created_at", -1).limit(50)
    posts = await cursor.to_list(length=50)
    
    for p in posts:
        p["id"] = str(p["_id"])
        
    return [schemas.PeerPost(**p) for p in posts]


@router.post("/comments/{post_id}", response_model=schemas.PeerComment)
async def create_comment(
    post_id: str,
    comment: schemas.PeerCommentCreate,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    analysis = await analyze_content(comment.content)
    
    if not analysis.get("is_safe", True):
        raise HTTPException(status_code=400, detail="Your comment violates community guidelines: " + analysis.get("reason", ""))

    new_comment = {
        "post_id": post_id,
        "content": comment.content,
        "author_id": current_user.id,
        "is_anonymous": comment.is_anonymous,
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await mongo_db.peer_comments.insert_one(new_comment.copy())
    new_comment["id"] = str(result.inserted_id)
    
    return schemas.PeerComment(**new_comment)


@router.get("/posts/detail/{post_id}")
async def get_post_details(
    post_id: str,
    current_user: schemas.User = Depends(get_current_user),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo_db)
):
    post = await mongo_db.peer_posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    post["id"] = str(post["_id"])
    
    cursor = mongo_db.peer_comments.find({"post_id": post_id}).sort("created_at", 1)
    comments = await cursor.to_list(length=100)
    for c in comments:
        c["id"] = str(c["_id"])
        
    return {
        "post": schemas.PeerPost(**post),
        "comments": [schemas.PeerComment(**c) for c in comments]
    }
