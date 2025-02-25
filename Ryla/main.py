from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.responses import JSONResponse
import asyncio
import traceback

from config import get_settings
settings = get_settings()

import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class ProcessingError(Exception):
    """Custom exception for processing errors"""
    pass

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
        logging.info("Firebase app already initialized")
    except ValueError:
        try:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.firebase_database_url
            })
            logging.info("Firebase initialized successfully")
        except Exception as e:
            logging.error(f"Firebase initialization error: {str(e)}")
            raise

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
        # Add more origins for production
        "*",  # Consider restricting this in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the assistant
from src.assistant import MultilingualAssistant
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
        
        try:
            user_data = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, user_ref.get),
                timeout=5.0
            ) or {}
        except asyncio.TimeoutError:
            logging.warning(f"Firebase timeout for user {session_data.user_id}")
            user_data = {}
        except Exception as e:
            logging.error(f"Firebase error: {str(e)}")
            user_data = {}
        
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
        logging.error(f"Session initialization error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_text")
async def process_text(user_input: UserInput) -> ProcessedResponse:
    """
    Process user text input with comprehensive error handling.
    
    Args:
        user_input (UserInput): User input model containing text and preferences
        
    Returns:
        ProcessedResponse: Processed text with corrections and metadata
        
    Raises:
        HTTPException: For various error conditions with appropriate status codes
    """
    # Default preferences if Firebase fails
    default_preferences = {
        'lang_to_learn': 'en',
        'proficiency_level': 'intermediate',
        'target_use': 'grammar_correction'
    }
    
    # Request validation
    if not user_input.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text input cannot be empty"
        )
    
    if not user_input.user_id:
        raise HTTPException(
            status_code=400,
            detail="User ID is required"
        )

    try:
        # Initialize response metadata
        metadata: Dict[str, Any] = {
            'processed_timestamp': datetime.utcnow().isoformat(),
            'success': False
        }

        # Fetch user preferences from Firebase with timeout
        try:
            user_ref = db.reference(f'users/{user_input.user_id}/model_data')
            user_data = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, user_ref.get),
                timeout=5.0
            ) or default_preferences
            
        except asyncio.TimeoutError:
            logging.warning(f"Firebase timeout for user {user_input.user_id}")
            user_data = default_preferences
            metadata['firebase_status'] = 'timeout'
            
        except Exception as firebase_error:
            logging.error(f"Firebase error: {str(firebase_error)}")
            user_data = default_preferences
            metadata['firebase_status'] = 'error'
            metadata['firebase_error'] = str(firebase_error)

        # Extract preferences with fallbacks
        language = user_input.language or user_data.get('lang_to_learn', 'en')
        proficiency = user_input.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = user_input.target or user_data.get('target_use', 'grammar_correction')

        # Update metadata with processing parameters
        metadata.update({
            'language': language,
            'proficiency': proficiency,
            'target': target,
            'input_length': len(user_input.text)
        })

        # Process the input text
        try:
            result = await assistant.process_input(
                text=user_input.text,
                language=language,
                proficiency=proficiency,
                target=target
            )
            
            metadata['success'] = True
            
            # Combine results with metadata
            response = ProcessedResponse(
                original_text=user_input.text,
                corrected_text=result.get('corrected_text', user_input.text),
                response=result.get('response', ''),
                metadata=metadata
            )
            
            return response

        except Exception as processing_error:
            error_details = str(processing_error)
            logging.error(f"Processing error: {error_details}\n{traceback.format_exc()}")
            raise ProcessingError(f"Text processing failed: {error_details}")

    except ProcessingError as pe:
        raise HTTPException(
            status_code=422,
            detail=str(pe)
        )
    
    except Exception as e:
        error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        logging.error(f"Error ID: {error_id}\nUnhandled error: {str(e)}\n{traceback.format_exc()}")
        
        raise HTTPException(
            status_code=500,
            detail={
                "message": "An unexpected error occurred",
                "error_id": error_id,
                "error_type": type(e).__name__
            }
        )

# Error handler for ProcessingError
@app.exception_handler(ProcessingError)
async def processing_error_handler(request, exc: ProcessingError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

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