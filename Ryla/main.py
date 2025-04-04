from fastapi import FastAPI, HTTPException, UploadFile, File
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
import tempfile
from vosk import Model, KaldiRecognizer
import os
import wave
import json
from pydub import AudioSegment
from pydub.utils import which

AudioSegment.converter = (
    which("ffmpeg") or r"C:\\Users\\DAN\\OneDrive\\Desktop\\Git Up\\Project-MWS-01\\FFmpeg\\bin\\ffmpeg.exe"
)

from config import get_settings
settings = get_settings()

import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

VOSK_MODEL_PATH = os.environ.get("VOSK_MODEL_PATH", r"C:\Users\DAN\OneDrive\Desktop\Git Up\Project-MWS-01\Ryla\vosk-model-small-fr-0.22")
_vosk_model = None

firebase_available = False

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

def get_vosk_model():
    global _vosk_model
    if _vosk_model is None:
        try:
            logging.info(f"Loading Vosk model from: {VOSK_MODEL_PATH}")
            _vosk_model = Model(VOSK_MODEL_PATH)
            logging.info("Vosk model loaded successfully")
        except Exception as e:
            logging.error(f"Failed to load Vosk model: {str(e)}")
            raise RuntimeError(f"Could not load speech recognition model: {str(e)}")
    return _vosk_model

def initialize_firebase():
    global firebase_available
    try:
        firebase_admin.get_app()
        firebase_available = True
        logging.info("Firebase app already initialized")
    except ValueError:
        try:
            if not firebase_admin._apps:
                if not os.path.exists(settings.firebase_credentials_path):
                    logging.error(f"Firebase credentials file not found: {settings.firebase_credentials_path}")
                    firebase_available = False
                    return False
                
                cred = credentials.Certificate(settings.firebase_credentials_path)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': settings.firebase_database_url,
                })
                firebase_available = True
                logging.info("Firebase initialized successfully")
        except Exception as e:
            firebase_available = False
            logging.error(f"Firebase initialization error: {str(e)}")
    
    return firebase_available

app = FastAPI(
    title="Multilingual Assistant API",
    description="API for processing multilingual text with grammar correction and response generation",
    version="1.0.0"
)

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

from src.assistant import MultilingualAssistant
assistant = MultilingualAssistant()

@app.on_event("startup")
async def startup_event():
    initialize_firebase()
    logging.info(f"Application started, Firebase availability: {firebase_available}")

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
        user_data = {}
        firebase_status = "not_attempted"
        
        if firebase_available:
            try:
                user_ref = db.reference(f'users/{session_data.user_id}/model_data')
                
                loop = asyncio.get_event_loop()
                user_data = await loop.run_in_executor(None, lambda: user_ref.get() or {})
                
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
        else:
            firebase_status = "firebase_unavailable"
            logging.warning(f"[{request_id}] Firebase is not available, using default values")
        
        language = session_data.language or user_data.get('lang_to_learn', 'en')
        proficiency = session_data.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = session_data.target or user_data.get('target_use', 'grammar_correction')
        
        if language not in ["en", "fr"]:
            logging.warning(f"[{request_id}] Unsupported language {language}, defaulting to 'en'")
            language = "en"
            
        if proficiency not in ["beginner", "intermediate", "expert"]:
            logging.warning(f"[{request_id}] Invalid proficiency {proficiency}, defaulting to 'intermediate'")
            proficiency = "intermediate"
        
        models_available = await assistant.check_language_models(language)
        if not models_available:
            logging.warning(f"[{request_id}] Language models for {language} not available")
        
        session_result = await assistant.initialize_user_session(
            user_id=session_data.user_id,
            language=language,
            proficiency=proficiency,
            target=target
        )
        
        session_result.update({
            "metadata": {
                "firebase_status": firebase_status,
                "firebase_available": firebase_available,
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
        
        logging.error(
            f"[{request_id}] Session initialization failed with {error_type}: {error_detail}",
            exc_info=True
        )
        
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
    try:
        logging.info(f"Translation request: {len(request.text)} chars from {request.source_language} to {request.target_language}")
        
        if not request.text.strip():
            return TranslationResponse(
                translated_text="",
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
            
        if request.source_language == request.target_language:
            return TranslationResponse(
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
        
        try:
            translated_text = await asyncio.wait_for(
                translation_service.translate_text(
                    text=request.text,
                    source_lang=request.source_language,
                    target_lang=request.target_language
                ),
                timeout=15.0
            )
            
            if translated_text is None:
                raise Exception("Translation service unavailable")
                
            return TranslationResponse(
                translated_text=translated_text,
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
            
        except asyncio.TimeoutError:
            logging.warning(f"Translation service timeout after 15 seconds")
            return TranslationResponse(
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                success=False,
                error="Translation service timeout"
            )
            
    except Exception as e:
        error_message = f"Translation error: {str(e)}"
        logging.error(f"{error_message}\n{traceback.format_exc()}")
        
        return TranslationResponse(
            translated_text=request.text,
            source_language=request.source_language,
            target_language=request.target_language,
            success=False,
            error=str(e)
        )

@app.post("/process_text")
async def process_text(user_input: UserInput) -> ProcessedResponse:
    default_preferences = {
        'lang_to_learn': 'en',
        'proficiency_level': 'intermediate',
        'target_use': 'grammar_correction'
    }
    
    if not user_input.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text input cannot be empty"
        )
    
    if not user_input.user_id:
        logging.warning("User ID is missing, using anonymous user")
        user_input.user_id = "anonymous"

    try:
        metadata: Dict[str, Any] = {
            'processed_timestamp': datetime.utcnow().isoformat(),
            'success': False,
            'firebase_available': firebase_available
        }

        user_data = default_preferences.copy()
        
        if firebase_available:
            try:
                user_ref = db.reference(f'users/{user_input.user_id}/model_data')
                loop = asyncio.get_event_loop()
                firebase_data = await loop.run_in_executor(None, lambda: user_ref.get() or {})
                
                if firebase_data:
                    user_data.update(firebase_data)
                    metadata['firebase_status'] = 'success'
                else:
                    metadata['firebase_status'] = 'no_data'
                        
            except asyncio.TimeoutError:
                logging.warning(f"Firebase timeout for user {user_input.user_id}")
                metadata['firebase_status'] = 'timeout'
                
            except Exception as firebase_error:
                logging.error(f"Firebase error: {str(firebase_error)}")
                metadata['firebase_status'] = 'error'
                metadata['firebase_error'] = str(firebase_error)
        else:
            metadata['firebase_status'] = 'unavailable'

        language = user_input.language or user_data.get('lang_to_learn', 'en')
        proficiency = user_input.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = user_input.target or user_data.get('target_use', 'grammar_correction')

        metadata.update({
            'language': language,
            'proficiency': proficiency,
            'target': target,
            'input_length': len(user_input.text)
        })

        try:
            models_available = await assistant.check_language_models(language)
            
            if not models_available:
                logging.warning(f"Language models for {language} not available, using fallback mode")
                metadata['model_status'] = 'unavailable'
                
                result = {
                    'corrected_text': user_input.text,
                    'response': "I'm currently unable to process text in this language. Please try again later or try English."
                }
            else:
                result = await assistant.process_input(
                    text=user_input.text,
                    language=language,
                    proficiency=proficiency,
                    target=target
                )
            
            metadata['success'] = True
            
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
            
            metadata['error_type'] = 'processing'
            metadata['error_details'] = error_details
            
            fallback_response = ProcessedResponse(
                original_text=user_input.text,
                corrected_text=user_input.text,
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
    
@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    request_id = f"stt-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    temp_wav_path = None
    temp_input_path = None

    try:
        temp_input_path = os.path.join(tempfile.gettempdir(), f"input_{request_id}")
        with open(temp_input_path, "wb") as buffer:
            buffer.write(await audio.read())

        temp_wav_path = temp_input_path + ".wav"
        audio_segment = AudioSegment.from_file(temp_input_path)
        audio_segment = audio_segment.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        audio_segment.export(temp_wav_path, format="wav")

        with wave.open(temp_wav_path, "rb") as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
                logging.error(f"[{request_id}] WAV format incorrect")
                return JSONResponse(status_code=400, content={"error": "Invalid WAV format", "request_id": request_id})

            recognizer = KaldiRecognizer(get_vosk_model(), 16000)
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                recognizer.AcceptWaveform(data)

            result = json.loads(recognizer.FinalResult())
            final_text = result.get("text", "")

        return JSONResponse(status_code=200, content={"text": final_text, "request_id": request_id})

    except Exception as e:
        logging.error(f"[{request_id}] Error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e), "request_id": request_id})

    finally:
        for path in [temp_input_path, temp_wav_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception as cleanup_err:
                    logging.warning(f"[{request_id}] Failed to delete {path}: {cleanup_err}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": str(datetime.now()),
        "environment": settings.environment,
        "firebase_available": firebase_available
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )