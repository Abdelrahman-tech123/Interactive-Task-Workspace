from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import todos

# uvicorn app.main:app --reload

app = FastAPI(
    title="Todo API Server",
    description="A fast backend for handling user tasks",
    version="1.0.0"
)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://interactive-task-workspace.vercel.app"
]
# Configure CORS so your Frontend (Next.js) can communicate with it safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routes we are creating in the next step
app.include_router(todos.router)

@app.get("/")
def read_root():
    return {"status": "healthy", "message": "Welcome to the FastAPI Server"}