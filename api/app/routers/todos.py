import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

router = APIRouter(
    prefix="/api/todos",
    tags=["todos"]
)

# --- 1. POSTGRES DATABASE CONFIGURATION ---
# Replace with your production connection string (e.g., from Neon, Supabase, or Aiven)
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://neondb_owner:npg_uM0FONPfLVv1@ep-shiny-sunset-a2ccenns.eu-central-1.aws.neon.tech/neondb?sslmode=require"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. SQLALCHEMY MODELS (Database Tables) ---
class UserORM(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)

class TodoORM(Base):
    __tablename__ = "todos"
    id = Column(Integer, primary_key=True, index=True)
    task_text = Column(Text, nullable=False)
    status = Column(String, nullable=False)  # "active" or "completed"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

# Create the tables automatically if they don't exist
Base.metadata.create_all(bind=engine)

# Database dependency injection helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. PYDANTIC SCHEMAS (Frontend Data Validation) ---
class TodoDatabaseSchema(BaseModel):
    todos: List[str]
    completed: List[str]


# --- 4. API ENDPOINTS ---

# 👈 GET todos for a specific user
@router.get("/{username}", response_model=TodoDatabaseSchema)
def get_user_todos(username: str, db: Session = Depends(get_db)):
    clean_name = username.strip().lower()
    
    # Check if user exists
    user = db.query(UserORM).filter(UserORM.username == clean_name).first()
    if not user:
        # Create user automatically on their first visit
        user = UserORM(username=clean_name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"todos": [], "completed": []}
    
    # Query all tasks for this user
    tasks = db.query(TodoORM).filter(TodoORM.user_id == user.id).all()
    
    # Separate them back into arrays matching your frontend state layout
    active_list = [t.task_text for t in tasks if getattr(t, "status") == "active"]
    completed_list = [t.task_text for t in tasks if getattr(t, "status") == "completed"]
    
    return {"todos": active_list, "completed": completed_list}


# 👈 POST/SAVE todos for a specific user
@router.post("/{username}", response_model=TodoDatabaseSchema)
def update_user_todos(username: str, payload: TodoDatabaseSchema, db: Session = Depends(get_db)):
    clean_name = username.strip().lower()
    
    # Find the user
    user = db.query(UserORM).filter(UserORM.username == clean_name).first()
    if not user:
        user = UserORM(username=clean_name)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Wipe their previous task state list to safely overwrite it with the new layout tracking
    db.query(TodoORM).filter(TodoORM.user_id == user.id).delete()
    
    # Bulk insert the new active todos
    for task in payload.todos:
        db.add(TodoORM(task_text=task, status="active", user_id=user.id))
        
    # Bulk insert the new completed todos
    for task in payload.completed:
        db.add(TodoORM(task_text=task, status="completed", user_id=user.id))
        
    db.commit()
    return payload