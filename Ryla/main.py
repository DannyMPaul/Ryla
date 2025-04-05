from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from pydantic import BaseModel
from typing import Optional, Dict, Any
from fastapi.responses import JSONResponse
from src.translation_service import TranslationService
from src.assistant import MultilingualAssistant
import asyncio
import traceback
import tempfile
import os
import wave
import json
import logging
from datetime import datetime
from vosk import Model, KaldiRecognizer
from pydub import AudioSegment
from pydub.utils import which
from config import get_settings
from firebase_admin import auth as firebase_auth
from fastapi import Header

# Initialize services and settings
settings = get_settings()
translation_service = TranslationService()
assistant = MultilingualAssistant()
AudioSegment.converter = which("ffmpeg") or r"..\\..\\FFmpeg\\bin\\ffmpeg.exe"

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Global variables
VOSK_MODEL_PATH_FR = os.environ.get("VOSK_MODEL_PATH_FR", r"..\Ryla\vosk-model-small-fr-0.22")
_vosk_model_fr = None
VOSK_MODEL_PATH_EN = os.environ.get("VOSK_MODEL_PATH_EN", r"..\Ryla\vosk-model-small-en-us-0.15")
_vosk_model_en = None
firebase_available = False

# Model definitions
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

# Helper functions
def get_vosk_model_fr():
    global _vosk_model_fr
    if _vosk_model_fr is None:
        try:
            logging.info(f"Loading French Vosk model from: {VOSK_MODEL_PATH_FR}")
            _vosk_model_fr = Model(VOSK_MODEL_PATH_FR)
            logging.info("French Vosk model loaded successfully")
        except Exception as e:
            logging.error(f"Failed to load French Vosk model: {str(e)}")
            raise RuntimeError(f"Could not load French speech recognition model: {str(e)}")
    return _vosk_model_fr

def get_vosk_model_en():
    global _vosk_model_en
    if _vosk_model_en is None:
        try:
            logging.info(f"Loading English Vosk model from: {VOSK_MODEL_PATH_EN}")
            _vosk_model_en = Model(VOSK_MODEL_PATH_EN)
            logging.info("English Vosk model loaded successfully")
        except Exception as e:
            logging.error(f"Failed to load English Vosk model: {str(e)}")
            raise RuntimeError(f"Could not load English speech recognition model: {str(e)}")
    return _vosk_model_en

def get_vosk_model(language):
    if language == "en":
        return get_vosk_model_fr()
    elif language == "fr":
        return get_vosk_model_en()
    else:
        # Default to English if language is not recognized
        logging.warning(f"Unrecognized language '{language}', defaulting to English model")
        return get_vosk_model_en()

async def extract_user_id_from_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None

    id_token = authorization.split(" ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token.get("uid")
    except Exception as e:
        logging.warning(f"Token verification failed: {str(e)}")
        return None

def initialize_firebase():
    global firebase_available
    try:
        firebase_admin.get_app()
        firebase_available = True
        logging.info("Firebase app already initialized")
    except ValueError:
        try:
            cred = credentials.Certificate(r"C:\Users\DAN\OneDrive\Desktop\Git Up\Project-MWS-01\Ryla\Firebase_connection.json")
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://rylaang-64c80-default-rtdb.asia-southeast1.firebasedatabase.app/'
            })
            firebase_available = True
            logging.info("Firebase initialized successfully (direct setup)")
        except Exception as e:
            firebase_available = False
            logging.error(f"Firebase initialization error: {str(e)}")
    return firebase_available


# FastAPI app setup
app = FastAPI(
    title="Multilingual Assistant API",
    description="API for processing multilingual text with grammar correction and response generation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081", "http://192.168.137.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    initialize_firebase()
    logging.info(f"Application started, Firebase availability: {firebase_available}")

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logging.error(f"HTTP error: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

@app.post("/initialize_session")
async def initialize_session(
    session_data: UserSessionInit,
    authorization: Optional[str] = Header(None)
):
    start_time = datetime.utcnow()
    user_id = await extract_user_id_from_token(authorization) or session_data.user_id
    request_id = f"req-{start_time.strftime('%Y%m%d%H%M%S')}-{user_id[:8]}"
    logging.info(f"[{request_id}] Session initialization request for user {user_id}")
    
    try:
        user_data = {}
        firebase_status = "not_attempted"

        if firebase_available:
            try:
                user_ref = db.reference(f'users/{user_id}/model_data')
                user_data = await asyncio.get_event_loop().run_in_executor(None, lambda: user_ref.get() or {})
                firebase_status = "success" if user_data else "no_data"
            except asyncio.TimeoutError:
                firebase_status = "timeout"
            except Exception as firebase_error:
                firebase_status = f"error:{type(firebase_error).__name__}"
        else:
            firebase_status = "firebase_unavailable"

        language = session_data.language or user_data.get('lang_to_learn', "en")
        proficiency = session_data.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = session_data.target or user_data.get('target_use', 'grammar_correction')

        if language not in ["en", "fr"]:
            language = "en"
        if proficiency not in ["beginner", "intermediate", "expert"]:
            proficiency = "intermediate"

        models_available = await assistant.check_language_models(language)
        session_result = await assistant.initialize_user_session(
            user_id=user_id,
            language=language,
            proficiency=proficiency,
            target=target
        )

        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        session_result["metadata"] = {
            "firebase_status": firebase_status,
            "firebase_available": firebase_available,
            "models_available": models_available,
            "request_id": request_id,
            "processing_time_ms": processing_time
        }

        return session_result

    except Exception as e:
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        logging.error(f"[{request_id}] Session initialization failed: {str(e)}", exc_info=True)

        return JSONResponse(
            status_code=500,
            content={
                "error": "session_initialization_failed",
                "message": "Unable to initialize user session",
                "user_id": user_id,
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat(),
                "processing_time_ms": processing_time
            }
        )

@app.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    try:
        # Quick returns for empty text or same language
        if not request.text.strip() or request.source_language == request.target_language:
            return TranslationResponse(
                translated_text=request.text,
                source_language=request.source_language,
                target_language=request.target_language,
                success=True
            )
        
        # Perform translation
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
            logging.warning("Translation service timeout after 15 seconds")
            raise Exception("Translation service timeout")
            
    except Exception as e:
        logging.error(f"Translation error: {str(e)}")
        return TranslationResponse(
            translated_text=request.text,
            source_language=request.source_language,
            target_language=request.target_language,
            success=False,
            error=str(e)
        )

@app.post("/process_text")
async def process_text(
    user_input: UserInput,
    authorization: Optional[str] = Header(None)
) -> ProcessedResponse:
    if not user_input.text.strip():
        raise HTTPException(status_code=400, detail="Text input cannot be empty")
    
    user_id = await extract_user_id_from_token(authorization) or user_input.user_id or "anonymous"

    try:
        metadata = {
            'processed_timestamp': datetime.utcnow().isoformat(),
            'success': False,
            'firebase_available': firebase_available
        }

        user_data = {
            'lang_to_learn': "en",
            'proficiency_level': 'intermediate',
            'target_use': 'grammar_correction'
        }

        if firebase_available:
            try:
                user_ref = db.reference(f'users/{user_id}/model_data')
                firebase_data = await asyncio.get_event_loop().run_in_executor(None, lambda: user_ref.get() or {})
                
                if firebase_data:
                    user_data.update(firebase_data)
                    metadata['firebase_status'] = 'success'
                else:
                    metadata['firebase_status'] = 'no_data'
            except Exception as e:
                metadata['firebase_status'] = 'error' if not isinstance(e, asyncio.TimeoutError) else 'timeout'
        else:
            metadata['firebase_status'] = 'unavailable'

        language = user_input.language or user_data.get('lang_to_learn', "en")
        proficiency = user_input.proficiency or user_data.get('proficiency_level', 'intermediate')
        target = user_input.target or user_data.get('target_use', 'grammar_correction')

        metadata.update({
            'language': language,
            'proficiency': proficiency,
            'target': target,
            'input_length': len(user_input.text)
        })

        models_available = await assistant.check_language_models(language)

        if not models_available:
            result = {
                'corrected_text': user_input.text,
                'response': "I'm currently unable to process text in this language. Please try again later or try English."
            }
            metadata['model_status'] = 'unavailable'
        else:
            result = await assistant.process_input(
                text=user_input.text,
                language=language,
                proficiency=proficiency,
                target=target
            )

        metadata['success'] = True

        return ProcessedResponse(
            original_text=user_input.text,
            corrected_text=result.get('corrected_text', user_input.text),
            response=result.get('response', ''),
            metadata=metadata
        )

    except Exception as e:
        error_id = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        logging.error(f"Error ID: {error_id}\nUnhandled error: {str(e)}", exc_info=True)

        if 'metadata' in locals():
            metadata['error_type'] = type(e).__name__
            metadata['error_details'] = str(e)

            return ProcessedResponse(
                original_text=user_input.text,
                corrected_text=user_input.text,
                response="I'm having trouble processing your text right now. Please try again later.",
                metadata=metadata
            )
        else:
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "An unexpected error occurred",
                    "error_id": error_id,
                    "error_type": type(e).__name__
                }
            )

    
@app.post("/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    request_id = f"stt-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    temp_paths = []

    try:
        # Get user ID and language preference
        user_id = await extract_user_id_from_token(authorization) or "anonymous"
        language = "fr"  # Default language
        
        # Try to get user's language preference from Firebase
        if firebase_available and user_id != "anonymous":
            try:
                user_ref = db.reference(f'users/{user_id}/model_data')
                user_data = await asyncio.get_event_loop().run_in_executor(None, lambda: user_ref.get() or {})
                if user_data and 'lang_to_learn' in user_data:
                    language = user_data['lang_to_learn']
                    logging.info(f"[{request_id}] Using user language preference: {language}")
            except Exception as e:
                logging.warning(f"[{request_id}] Failed to fetch user language preference: {str(e)}")
        
        # Only accept "en" or "fr" as valid languages
        if language not in ["en", "fr"]:
            language = "en"  # Default to English for unrecognized languages
        
        # Save and convert audio
        temp_input_path = os.path.join(tempfile.gettempdir(), f"input_{request_id}")
        temp_wav_path = temp_input_path + ".wav"
        temp_paths = [temp_input_path, temp_wav_path]
        
        with open(temp_input_path, "wb") as buffer:
            buffer.write(await audio.read())
        
        AudioSegment.from_file(temp_input_path).set_frame_rate(16000).set_channels(1).set_sample_width(2).export(temp_wav_path, format="wav")

        # Process audio with Vosk using the appropriate model
        with wave.open(temp_wav_path, "rb") as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
                return JSONResponse(status_code=400, content={"error": "Invalid WAV format", "request_id": request_id})

            # Get the appropriate language model
            model = get_vosk_model(language)
            logging.info(f"[{request_id}] Using {language} Vosk model for speech recognition")
            
            recognizer = KaldiRecognizer(model, 16000)
            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                recognizer.AcceptWaveform(data)

            final_text = json.loads(recognizer.FinalResult()).get("text", "")
            return JSONResponse(
                status_code=200, 
                content={
                    "text": final_text, 
                    "language": language,
                    "request_id": request_id
                }
            )

    except Exception as e:
        logging.error(f"[{request_id}] Error: {str(e)}")
        return JSONResponse(status_code=500, content={"error": str(e), "request_id": request_id})

    finally:
        for path in temp_paths:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

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