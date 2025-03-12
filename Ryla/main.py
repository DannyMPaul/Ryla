from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.responses import JSONResponse
from src.translation_service import TranslationService
translation_service = TranslationService()
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

# class ProcessingError(Exception):
#     "Custom exception for processing errors"
#     pass

class UserSessionInit(BaseModel):
    user_id: str
    language: Optional[str] = 'fr'
    proficiency: Optional[str] = 'intermediate'
    target: Optional[str] = 'grammar_correction'

class UserInput(BaseModel):
    user_id: str
    text: str
    language: Optional[str] = 'fr'
    proficiency: Optional[str] = 'intermediate'
    target: Optional[str] = 'grammar_correction'

class ProcessedResponse(BaseModel):
    original_text: str
    corrected_text: str
    response: str
    metadata: Dict[str, Any]

class TranslationRequest(BaseModel):
    text: str
    source_language: str
    target_language: str
    user_id: Optional[str] = None

class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    success: bool
    error: Optional[str] = None

def initialize_firebase():
    try:
        firebase_admin.get_app()
        logging.info("Firebase app already initialized")
    except ValueError:
        try:
            cred = credentials.Certificate(settings.firebase_credentials_path)
            # The key part: add the databaseAuthVariableOverride
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.firebase_database_url,
                'databaseAuthVariableOverride': {
                    'uid': 'admin-service-account'  # This will be passed as auth.uid
                }
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
    start_time = datetime.utcnow()
    request_id = f"req-{start_time.strftime('%Y%m%d%H%M%S')}-{session_data.user_id[:8]}"
    
    logging.info(f"[{request_id}] Session initialization request for user {session_data.user_id}")
    
    try:
        # Set default values in case of any failures
        user_data = {}
        firebase_status = "not_attempted"
        
        # Attempt to retrieve user preferences from Firebase
        try:
            user_ref = db.reference(f'users/{session_data.user_id}/model_data')
            
            # Use timeout to prevent hanging requests
            user_data = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, user_ref.get),
                timeout=5.0
            ) or {}
            
            if user_data:
                logging.info(f"[{request_id}] Successfully retrieved Firebase data for user {session_data.user_id}")
                firebase_status = "success"
            else:
                logging.warning(f"[{request_id}] No data found in Firebase for user {session_data.user_id}")
                firebase_status = "no_data"
        except asyncio.TimeoutError:
            logging.warning(f"[{request_id}] Firebase timeout after 5s for user {session_data.user_id}")
            firebase_status = "timeout"
        except Exception as firebase_error:
            error_type = type(firebase_error).__name__
            logging.error(f"[{request_id}] Firebase error ({error_type}): {str(firebase_error)}")
            firebase_status = f"error:{error_type}"
        
        # Use provided values or fallback to Firebase data or defaults with precedence
        # Client values override Firebase values, which override system defaults
        language = session_data.language or user_data.get('lang_to_learn', 'en')
        proficiency = session_data.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = session_data.target or user_data.get('target_use', 'grammar_correction')
        
        # Validate settings
        if language not in ["en", "fr"]:  # Add other supported languages as needed
            logging.warning(f"[{request_id}] Unsupported language {language}, defaulting to 'en'")
            language = "en"
            
        if proficiency not in ["beginner", "intermediate", "expert"]:
            logging.warning(f"[{request_id}] Invalid proficiency {proficiency}, defaulting to 'intermediate'")
            proficiency = "intermediate"
        
        # Check if language models are available before proceeding
        models_available = await assistant.check_language_models(language)
        if not models_available:
            logging.warning(f"[{request_id}] Language models for {language} not available")
        
        # Initialize user session - this method should be made resilient in the MultilingualAssistant class
        session_result = await assistant.initialize_user_session(
            user_id=session_data.user_id,
            language=language,
            proficiency=proficiency,
            target=target
        )
        
        # Add diagnostic information to the response
        session_result.update({
            "metadata": {
                "firebase_status": firebase_status,
                "models_available": models_available,
                "request_id": request_id,
                "processing_time_ms": int((datetime.utcnow() - start_time).total_seconds() * 1000)
            }
        })
        
        logging.info(f"[{request_id}] Session initialized successfully in "
                     f"{int((datetime.utcnow() - start_time).total_seconds() * 1000)}ms")
        
        return session_result
    
    except Exception as e:
        error_type = type(e).__name__
        error_detail = str(e)
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        # Log the full exception for debugging
        logging.error(
            f"[{request_id}] Session initialization failed with {error_type}: {error_detail}",
            exc_info=True
        )
        
        # Return a structured error response that doesn't expose sensitive details
        return JSONResponse(
            status_code=500,
            content={
                "error": "session_initialization_failed",
                "message": "Unable to initialize user session",
                "user_id": session_data.user_id,
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "processing_time_ms": processing_time
            }
        )

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate text from source language to target language with enhanced error handling.
    
    Args:
        request: TranslationRequest with text and language parameters
        
    Returns:
        TranslationResponse with translated text or appropriate error
    """
    try:
        # Log the translation request
        logging.info(f"Translation request: {len(request.text)} chars from {request.source_language} to {request.target_language}")
        
        # Quick validation to avoid unnecessary processing
        if not request.text.strip():
            return TranslationResponse(
                translated_text="",
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
            
        # Same language - no translation needed
        if request.source_language == request.target_language:
            return TranslationResponse(
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
        
        # Perform the translation with timeout
        try:
            translated_text = await asyncio.wait_for(
                translation_service.translate_text(
                    text=request.text,
                    source_lang=request.source_language,
                    target_lang=request.target_language
                ),
                timeout=15.0  # Increase timeout for slower translation services
            )
            
            # If translation returns None, it's a service error
            if translated_text is None:
                raise Exception("Translation service unavailable")
                
            # Return the successful response
            return TranslationResponse(
                translated_text=translated_text,
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
            
        except asyncio.TimeoutError:
            logging.warning(f"Translation service timeout after 15 seconds")
            return TranslationResponse(
                translated_text=request.text,  # Return original text on timeout
                source_language=request.source_language,
                target_language=request.target_language,
                success=False,
                error="Translation service timeout"
            )
            
    except Exception as e:
        # Log the error with traceback for debugging
        error_message = f"Translation error: {str(e)}"
        logging.error(f"{error_message}\n{traceback.format_exc()}")
        
        # Return error response with original text
        return TranslationResponse(
            translated_text=request.text,  # Return original text on error
            source_language=request.source_language,
            target_language=request.target_language,
            success=False,
            error=str(e)
        )


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

        # Process the input text with better error handling around model loading
        try:
            # First, check if the models are available
            models_available = await assistant.check_language_models(language)
            
            if not models_available:
                # If models aren't available, handle gracefully
                logging.warning(f"Language models for {language} not available, using fallback mode")
                metadata['model_status'] = 'unavailable'
                
                # Simple fallback for when models aren't available
                # Return the input text with a helpful message
                result = {
                    'corrected_text': user_input.text,
                    'response': "I'm currently unable to process text in this language. Please try again later or try English."
                }
            else:
                # Models are available, proceed with normal processing
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
            
            # Create a fallback response when processing fails
            metadata['error_type'] = 'processing'
            metadata['error_details'] = error_details
            
            fallback_response = ProcessedResponse(
                original_text=user_input.text,
                corrected_text=user_input.text,  # Return original text unchanged
                response="I'm having trouble processing your text right now. Please try again later.",
                metadata=metadata
            )
            
            return fallback_response

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