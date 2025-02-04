------------ALL OF THE BELOW CODES ARE TO BE RUN ON TEH TERMINAL------------------

#VM for windows
python -m venv ryla_env

#Activate VM for windows
ryla_env\Scripts\activate

#Install requirement
pip install -r requirements.txt

#TTS engine
pip install pyttsx3

#Plan : 
-host the model in google consel
-connect the consel and the firebase
-api key then use sockets

#to do :
-voice recognition model for fr/en {react-native-voice}
-tts model for fr and en {react-native-tts}
-integrating the entire project into a single application


# backend/requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
firebase-admin==6.2.0
torch==2.1.0
transformers==4.34.1
python-dotenv==1.0.0
pydantic==2.4.2
gunicorn==21.2.0

# backend/.env
FIREBASE_CREDENTIALS_PATH="path/to/your/firebase-credentials.json"
FIREBASE_DATABASE_URL="https://your-project.firebaseio.com"
MODEL_CACHE_DIR="./model_cache"
PORT=8000
HOST="0.0.0.0"
ENVIRONMENT="production"

# backend/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    firebase_credentials_path: str
    firebase_database_url: str
    model_cache_dir: str
    port: int
    host: str
    environment: str

    class Config:
        env_file = ".env"

settings = Settings()

# backend/models.py
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

# backend/assistant.py
import torch
from transformers import (
    AutoTokenizer,
    BlenderbotTokenizer,
    BlenderbotForConditionalGeneration,
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM
)
from typing import Optional, Dict, Any
import os
from config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultilingualAssistant:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        self.language_configs = {
            'fr': {
                'grammar_model': "PoloHuggingface/French_grammar_error_corrector",
                'chat_model': "microsoft/DialoGPT-medium",
                'tokenizer_class': AutoTokenizer,
                'model_class': AutoModelForCausalLM
            },
            'en': {
                'grammar_model': "grammarly/coedit-large",
                'chat_model': "facebook/blenderbot-400M-distill",
                'tokenizer_class': BlenderbotTokenizer,
                'model_class': BlenderbotForConditionalGeneration
            }
        }
        
        self.target_uses = {
            'fr': {
                'grammar_correction': {'prompt': "Corriger la grammaire: ", 'weight': 1.0},
                'text_coherent': {'prompt': "Rendre ce texte plus cohérent: ", 'weight': 0.8},
                'easier_understanding': {'prompt': "Simplifier ce texte: ", 'weight': 0.6},
                'paraphrasing': {'prompt': "Paraphraser ce texte: ", 'weight': 0.7},
                'formal_tone': {'prompt': "Rendre le texte plus formel: ", 'weight': 0.9},
                'neutral_tone': {'prompt': "Convertir le texte en ton neutre: ", 'weight': 0.8}
            },
            'en': {
                'grammar_correction': {'prompt': "Correct the grammar: ", 'weight': 1.0},
                'text_coherent': {'prompt': "Make this text more coherent: ", 'weight': 0.8},
                'easier_understanding': {'prompt': "Simplify this text: ", 'weight': 0.6},
                'paraphrasing': {'prompt': "Paraphrase this text: ", 'weight': 0.7},
                'formal_tone': {'prompt': "Make the text more formal: ", 'weight': 0.9},
                'neutral_tone': {'prompt': "Convert text to a neutral tone: ", 'weight': 0.8}
            }
        }
        
        self.model_configs = {
            'beginner': {
                'complexity': 0.1,
                'max_length': 50,
                'context_prompts': {
                    'fr': ["Répondre de manière très basique: "],
                    'en': ["Reply in a very basic manner: "]
                }
            },
            'intermediate': {
                'complexity': 0.6,
                'max_length': 100,
                'context_prompts': {
                    'fr': ["Répondre en utilisant une variété de mots: "],
                    'en': ["Reply using variety of words: "]
                }
            },
            'expert': {
                'complexity': 1.0,
                'max_length': 150,
                'context_prompts': {
                    'fr': ["Répondre en utilisant des phrases complexes: "],
                    'en': ["Reply using complex sentences: "]
                }
            }
        }
        
        self.models = {'fr': {}, 'en': {}}
        os.makedirs(settings.model_cache_dir, exist_ok=True)

    async def load_language_models(self, language: str):
        if language not in self.models or not self.models[language]:
            config = self.language_configs[language]
            try:
                logger.info(f"Loading models for {language}")
                
                # Load models with cache
                cache_dir = os.path.join(settings.model_cache_dir, language)
                
                self.models[language] = {
                    'grammar_tokenizer': AutoTokenizer.from_pretrained(
                        config['grammar_model'],
                        cache_dir=cache_dir
                    ),
                    'grammar_model': AutoModelForSeq2SeqLM.from_pretrained(
                        config['grammar_model'],
                        cache_dir=cache_dir
                    ).to(self.device),
                    'chat_tokenizer': config['tokenizer_class'].from_pretrained(
                        config['chat_model'],
                        cache_dir=cache_dir
                    ),
                    'chat_model': config['model_class'].from_pretrained(
                        config['chat_model'],
                        cache_dir=cache_dir
                    ).to(self.device)
                }
                
                logger.info(f"Successfully loaded models for {language}")
            except Exception as e:
                logger.error(f"Error loading models for {language}: {e}")
                raise

    async def process_input(self, text: str, language: str, proficiency: str, target: str) -> Dict[str, Any]:
        await self.load_language_models(language)
        
        # Process in parallel using asyncio
        import asyncio
        correction_task = asyncio.create_task(self.correct_grammar(text, language, target))
        
        correction = await correction_task
        response = await self.generate_response(correction or text, language, proficiency)
        
        return {
            "original_text": text,
            "corrected_text": correction if correction else text,
            "response": response,
            "metadata": {
                "language": language,
                "proficiency": proficiency,
                "target": target,
                "processed_timestamp": str(datetime.now())
            }
        }

    async def correct_grammar(self, input_text: str, language: str, target: str) -> Optional[str]:
        if len(input_text.split()) <= 1:
            return None

        try:
            target_config = self.target_uses[language][target]
            grammar_input = f"{target_config['prompt']}{input_text}"
            
            models = self.models[language]
            input_ids = models['grammar_tokenizer'](
                grammar_input,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            ).input_ids.to(self.device)
            
            with torch.no_grad():
                outputs = models['grammar_model'].generate(
                    input_ids,
                    max_length=min(512, len(input_text.split()) * 2),
                    num_beams=5,
                    do_sample=True,
                    temperature=target_config['weight'],
                    top_p=0.9,
                    repetition_penalty=1.1,
                    early_stopping=True
                )
            
            corrected = models['grammar_tokenizer'].decode(outputs[0], skip_special_tokens=True)
            return corrected if corrected.lower() != input_text.lower() else None

        except Exception as e:
            logger.error(f"Grammar correction error: {e}")
            return None

    async def generate_response(self, input_text: str, language: str, proficiency: str) -> str:
        try:
            config = self.model_configs[proficiency]
            import random
            context = random.choice(config['context_prompts'][language])
            modified_input = f"{context}{input_text}"
            
            models = self.models[language]
            input_data = models['chat_tokenizer'](
                modified_input,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=512
            ).to(self.device)
            
            with torch.no_grad():
                output_ids = models['chat_model'].generate(
                    **input_data,
                    max_length=config['max_length'],
                    num_beams=4,
                    do_sample=True,
                    temperature=config['complexity'],
                    top_p=0.9,
                    repetition_penalty=1.2,
                    early_stopping=True
                )
            
            return models['chat_tokenizer'].decode(output_ids[0], skip_special_tokens=True)

        except Exception as e:
            logger.error(f"Response generation error: {e}")
            return "I'm having trouble understanding. Could you rephrase that?"

# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, db
from models import UserInput, ProcessedResponse
from assistant import MultilingualAssistant
from config import settings
import logging
from datetime import datetime

# Initialize Firebase
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

@app.post("/process_text", response_model=ProcessedResponse)
async def process_text(user_input: UserInput):
    try:
        # Get user preferences from Firebase
        user_ref = db.reference(f'users/{user_input.user_id}')
        user_data = user_ref.get()
        
        if not user_data:
            raise HTTPException(status_code=404, detail="User preferences not found")
        
        # Process the input
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

# frontend/api.ts

import { Alert } from 'react-native';

const API_URL = 'http://localhost:8000';  // Replace with your actual backend URL

interface ProcessTextResponse {
    original_text: string;
    corrected_text: string;
    response: string;
    metadata?: {
        language: string;
        proficiency: string;
        target: string;
        processed_timestamp: string;
    };
}

export async function processText(text: string, userId: string): Promise<ProcessTextResponse> {
    try {
        const response = await fetch(`${API_URL}/process_text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                user_id: userId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Network response was not ok');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error processing text:', error);
        Alert.alert(
            'Error',
            'Failed to process text. Please try again.',
            [{ text: 'OK' }]
        );
        throw error;
    }
}

export async function checkServerHealth(): Promise<{
    status: string;
    timestamp: string;
    environment: string;
}> {
    try {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) {
            throw new Error('Health check failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Health check failed:', error);
        Alert.alert(
            'Server Error',
            'Unable to connect to the server. Please try again later.',
            [{ text: 'OK' }]
        );
        throw error;
    }
}