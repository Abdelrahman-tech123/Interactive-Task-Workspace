import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter(
    prefix="/api/todos",
    tags=["todos"]
)


# 1. Define the exact SHAPE you are sending from the frontend
class TodoDatabaseSchema(BaseModel):
    todos: List[str]
    completed: List[str]

JSON_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "database.json")

def write_json_db(data: dict):
    # os.path.dirname(JSON_FILE_PATH) finds the 'app/' folder
    os.makedirs(os.path.dirname(JSON_FILE_PATH), exist_ok=True)
    
    # Open the file (creates it automatically if missing because of "w" mode)
    with open(JSON_FILE_PATH, "w") as file:
        json.dump(data, file, indent=4)



def read_json_db() -> dict:
    default_structure = {"todos": [], "completed": []}
    try:
        if not os.path.exists(JSON_FILE_PATH):
            # if file missing return default structure and make new file
            write_json_db(default_structure)
            return default_structure
        with open(JSON_FILE_PATH, "r") as file:
            # read file
            return json.load(file)
    except (json.JSONDecodeError, FileNotFoundError):
        # if not structred good make new one and return deafult
        write_json_db(default_structure)
        return default_structure
    

@router.get("/" , response_model=TodoDatabaseSchema)
def get_all_todos():
    return read_json_db()


@router.post("/" , response_model=TodoDatabaseSchema)
def update_all_todos(payload: TodoDatabaseSchema):
    # payload.model_dump() converts the entire incoming shape straight into a clean dictionary
    json_ready_data = payload.model_dump()

    write_json_db(json_ready_data)
    
    return payload