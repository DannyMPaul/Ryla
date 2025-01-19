from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from models import UserInput, ProcessedResponse
from src.assistant import MultilingualAssistant

from config import get_settings
settings = get_settings()

import logging
from datetime import datetime

# # Initialize Firebase
# cred = credentials.Certificate(settings.firebase_credentials_path)
# firebase_admin.initialize_app(cred, {
#     'databaseURL': settings.firebase_database_url
# })

# Initialize Firebase only if not already initialized
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
    allow_origins=["*"],  # Update this with your React Native app's URL in production
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

@app.post("/process_text", response_model=ProcessedResponse)
async def process_text(user_input: UserInput):
    try:
        user_ref = db.reference(f'users/{user_input.user_id}/model_data')
        user_data = user_ref.get()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User preferences not found")
        
        result = await assistant.process_input(
            text=user_input.text,
            language=user_data['lang_to_learn'],
            proficiency=user_data['proficiency_level'],
            target=user_data['target_use']
        )
        
        return ProcessedResponse(**result)
        
    except Exception as e:
        logging.error(f"Error processing text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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