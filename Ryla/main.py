from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from models import UserInput, ProcessedResponse
from src.assistant import MultilingualAssistant
from datetime import datetime

from config import get_settings
settings = get_settings()

import logging
from datetime import datetime

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
    allow_origins=["http://localhost:8081"],  # Update this with your React Native app's URL in production
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

@app.post("/initialize_session")
async def initialize_session(user_id: str):
    try:
        # Retrieve user preferences from Firebase
        user_ref = db.reference(f'users/{user_id}/model_data')
        user_data = user_ref.get() or {}
        
        # Default values if not found in Firebase
        language = user_data.get('lang_to_learn', 'en')
        proficiency = user_data.get('proficiency_level', 'intermediate')
        target = user_data.get('target_use', 'grammar_correction')
        
        # Initialize user session
        session_result = await assistant.initialize_user_session(
            user_id=user_id, 
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

# @app.post("/process_text", response_model=ProcessedResponse)
# async def process_text(user_input: UserInput):
#     try:
#         # For testing without Firebase, use hardcoded values
#         user_data = {
#             'lang_to_learn': 'fr',  # or 'fr'
#             'proficiency_level': 'beginner',  # or 'beginner' or 'expert'
#         }
        
#         result = await assistant.process_input(
#             text=user_input.text,
#             language=user_data['lang_to_learn'],
#             proficiency=user_data['proficiency_level'],
#             target="grammar_correction"
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
