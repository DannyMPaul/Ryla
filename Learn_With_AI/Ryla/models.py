from pydantic import BaseModel
from typing import Optional, Dict, Any

class UserInput(BaseModel):
    text: str
    user_id: str

class UserPreferences(BaseModel):
    lang_to_learn: str
    proficiency_level: str
    target_use: str

class ProcessedResponse(BaseModel):
    original_text: str
    corrected_text: str
    response: str
    metadata: Optional[Dict[str, Any]] = None