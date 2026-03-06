from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, chat, screening, counseling, defence, admin, peer_support, blog

app = FastAPI(title="MindGuard AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(screening.router)
app.include_router(counseling.router)
app.include_router(defence.router)
app.include_router(admin.router)
app.include_router(peer_support.router)
app.include_router(blog.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to MindGuard AI Backend"}
