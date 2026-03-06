from pydantic import BaseModel, Field
from typing import List, Optional

class UserBase(BaseModel):
    email: str
    name: str

class UserCreate(UserBase):
    password: str
    role: str = "adult"
    college: Optional[str] = None

class DefenceScreening(BaseModel):
    mood: int # 1-5 scale
    sleep_hours: float
    fatigue: int # 1-5 scale
    anxiety: int # 1-5 scale
    nightmares: int # 1-5 scale
    flashbacks: int # 1-5 scale
    emotional_numbness: int # 1-5 scale
    hyper_alertness: int # 1-5 scale

class DefenceScreeningResult(BaseModel):
    stress_score: str
    ptsd_risk: str

class LiveQuestionResponse(BaseModel):
    question: str

class LiveSessionRequest(BaseModel):
    messages: List[dict] # { "role": "user"|"ai", "content": "...", "image_data": Optional[str] }

class LiveAnalyzeRequest(BaseModel):
    messages: List[dict]

class LiveAnalyzeResponse(BaseModel):
    mental_state: str
    analysis: str
    facial_expression_analysis: Optional[str] = None
    voice_tone_analysis: Optional[str] = None

class User(UserBase):
    id: str # Now using MongoDB string ObjectIds
    role: str = "user"
    college: Optional[str] = None
    readiness_score: float = 100.0
    risk_level: str = "Low"

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ChatMessage(BaseModel):
    text: str
    sender: str # "user" or "bot"

class ChatHistory(BaseModel):
    user_id: str
    messages: List[ChatMessage]

class ScreeningAnswers(BaseModel):
    answers: List[str] # List of text answers for sentiment/risk analysis

class ScreeningResult(BaseModel):
    user: User
    feedback: str

class PeerPostCreate(BaseModel):
    title: str
    content: str
    topic: str
    is_anonymous: bool = True

class PeerPost(BaseModel):
    id: str
    title: str
    content: str
    topic: str
    author_id: str
    is_anonymous: bool
    created_at: str
    flags: List[str] = []

    class Config:
        from_attributes = True

class PeerCommentCreate(BaseModel):
    content: str
    is_anonymous: bool = True

class PeerComment(BaseModel):
    id: str
    post_id: str
    content: str
    author_id: str
    is_anonymous: bool
    created_at: str

    class Config:
        from_attributes = True

class BlogPostCreate(BaseModel):
    title: str
    content: str
    category: str
    is_anonymous: bool = True

class BlogPost(BaseModel):
    id: str
    title: str
    content: str
    category: str
    author_id: str
    author_name: str
    is_anonymous: bool
    created_at: str
    flags: List[str] = []

    class Config:
        from_attributes = True

class BlogCommentCreate(BaseModel):
    content: str
    is_anonymous: bool = True

class BlogComment(BaseModel):
    id: str
    post_id: str
    content: str
    author_id: str
    author_name: str
    is_anonymous: bool
    created_at: str

    class Config:
        from_attributes = True
