from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from models import UserInput, ProcessedResponse
from src.assistant import MultilingualAssistant
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.responses import JSONResponse

from config import get_settings
settings = get_settings()

import logging
from datetime import datetime

class UserSessionInit(BaseModel):
    user_id: str
    language: Optional[str] = 'en'
    proficiency: Optional[str] = 'intermediate'
    target: Optional[str] = 'grammar_correction'

class UserInput(BaseModel):
    user_id: str
    text: str
    language: Optional[str] = 'en'
    proficiency: Optional[str] = 'intermediate'
    target: Optional[str] = 'grammar_correction'

class ProcessedResponse(BaseModel):
    original_text: str
    corrected_text: str
    response: str
    metadata: Dict[str, Any]

def initialize_firebase():
    try:
        firebase_admin.get_app()
    except ValueError:
        cred = credentials.Certificate(settings.firebase_credentials_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': settings.firebase_database_url
        })

# Initialize FastAPI
app = FastAPI(
    title="Multilingual Assistant API",
    description="API for processing multilingual text with grammar correction and response generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://192.168.137.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the assistant
assistant = MultilingualAssistant()

@app.on_event("startup")
async def startup_event():
    initialize_firebase()
    logging.info("Application started, Firebase initialized")

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logging.error(f"HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.post("/initialize_session")
async def initialize_session(session_data: UserSessionInit):
    try:
        # Retrieve user preferences from Firebase
        user_ref = db.reference(f'users/{session_data.user_id}/model_data')
        user_data = user_ref.get() or {}
        
        # Use provided values or fallback to Firebase data or defaults
        language = session_data.language or user_data.get('lang_to_learn', 'en')
        proficiency = session_data.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = session_data.target or user_data.get('target_use', 'grammar_correction')
        
        # Initialize user session
        session_result = await assistant.initialize_user_session(
            user_id=session_data.user_id,
            language=language,
            proficiency=proficiency,
            target=target
        )
        
        return session_result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_text")
async def process_text(user_input: UserInput):
    try:
        # Retrieve user preferences from Firebase
        user_ref = db.reference(f'users/{user_input.user_id}/model_data')
        user_data = user_ref.get() or {}
        
        # Default values if not found in Firebase
        language = user_data.get('lang_to_learn', 'en')
        proficiency = user_data.get('proficiency_level', 'intermediate')
        target = user_data.get('target_use', 'grammar_correction')
        
        result = await assistant.process_input(
            text=user_input.text,
            language=language,
            proficiency=proficiency,
            target=target
        )
        
        return ProcessedResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.post("/process_text_static", response_model=ProcessedResponse)
# async def process_text_static(user_input: UserInput):
#     try:
#         # For testing without Firebase, use hardcoded values
#         user_data = {
#             'lang_to_learn': 'en',  # or 'fr'
#             'proficiency_level': 'intermediate',  # or 'beginner' or 'expert'
#             'target_use': 'grammar_correction'  # or paraphrasing or any
#         }
        
#         result = await assistant.process_input(
#             text=user_input.text,
#             language=user_data['lang_to_learn'],
#             proficiency=user_data['proficiency_level'],
#             target=user_data['target_use']
#         )
        
#         return ProcessedResponse(**result)
        
#     except Exception as e:
#         logging.error(f"Error processing text: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": str(datetime.now()),
        "environment": settings.environment
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    ) 
