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

# @app.post("/process_text", response_model=ProcessedResponse)
# async def process_text(user_input: UserInput):
#     try:
#         user_ref = db.reference(f'users/uUaWUUcfiTcjPlBKYmrZu4E5yyJ2/model_data')
#         user_data = user_ref.get()
        
#         if not user_data:
#             raise HTTPException(status_code=404, detail="User preferences not found")
        
#         result = await assistant.process_input(
#             text=user_input.text,
#             language=user_data['lang_to_learn'],
#             proficiency=user_data['proficiency_level'],
#             target="grammar_correction" #user_data['target_use']
#         )
        
#         return ProcessedResponse(**result)
        
#     except Exception as e:
#         logging.error(f"Error processing text: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/process_text", response_model=ProcessedResponse)
async def process_text(user_input: UserInput):
    try:
        # For testing without Firebase, use hardcoded values
        user_data = {
            'lang_to_learn': 'en',  # or 'fr'
            'proficiency_level': 'intermediate',  # or 'beginner' or 'expert'
        }
        
        result = await assistant.process_input(
            text=user_input.text,
            language=user_data['lang_to_learn'],
            proficiency=user_data['proficiency_level'],
            target="grammar_correction"
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





# # main.py
# from fastapi import FastAPI, WebSocket, HTTPException, Depends
# from fastapi.middleware.cors import CORSMiddleware
# import firebase_admin
# from firebase_admin import credentials, db
# from models import UserInput, ProcessedResponse, UserPreferences
# import redis
# import json
# import asyncio
# from datetime import datetime
# from typing import Dict, Optional
# from src.assistant import MultilingualAssistant
# from config import get_settings
# settings = get_settings()

# app = FastAPI()

# # Redis Configuration
# REDIS_HOST = "localhost"
# REDIS_PORT = 6379
# REDIS_DB = 0
# redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

# # CORS Configuration
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Update with your production domains
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Initialize Firebase
# def initialize_firebase():
#     try:
#         firebase_admin.get_app()
#     except ValueError:
#         cred = credentials.Certificate("path/to/your/firebase_credentials.json")
#         firebase_admin.initialize_app(cred, {
#             'databaseURL': 'your_firebase_url'
#         })

# # Initialize assistant
# assistant = MultilingualAssistant()

# # User preferences cache
# async def get_user_preferences(user_id: str) -> Optional[Dict]:
#     # Try to get from Redis first
#     cached_prefs = redis_client.get(f"user_prefs:{user_id}")
#     if cached_prefs:
#         return json.loads(cached_prefs)
    
#     # If not in Redis, get from Firebase
#     user_ref = db.reference(f'users/{user_id}/model_data')
#     prefs = user_ref.get()
    
#     if prefs:
#         # Cache in Redis for 1 hour
#         redis_client.setex(f"user_prefs:{user_id}", 3600, json.dumps(prefs))
#         return prefs
    
#     return None

# # WebSocket connection manager
# class ConnectionManager:
#     def __init__(self):
#         self.active_connections: Dict[str, WebSocket] = {}

#     async def connect(self, websocket: WebSocket, client_id: str):
#         await websocket.accept()
#         self.active_connections[client_id] = websocket

#     def disconnect(self, client_id: str):
#         self.active_connections.pop(client_id, None)

#     async def send_message(self, message: str, client_id: str):
#         if client_id in self.active_connections:
#             await self.active_connections[client_id].send_text(message)

# manager = ConnectionManager()

# @app.websocket("/ws/{client_id}")
# async def websocket_endpoint(websocket: WebSocket, client_id: str):
#     await manager.connect(websocket, client_id)
#     try:
#         while True:
#             data = await websocket.receive_text()
#             input_data = json.loads(data)
            
#             # Get user preferences
#             user_prefs = await get_user_preferences(input_data['user_id'])
#             if not user_prefs:
#                 await websocket.send_text(json.dumps({
#                     "error": "User preferences not found"
#                 }))
#                 continue

#             # Process the message
#             result = await assistant.process_input(
#                 text=input_data['text'],
#                 language=user_prefs['lang_to_learn'],
#                 proficiency=user_prefs['proficiency_level'],
#                 target="grammar_correction"
#             )
            
#             # Send response
#             await websocket.send_text(json.dumps(result))
            
#     except Exception as e:
#         print(f"WebSocket error: {e}")
#     finally:
#         manager.disconnect(client_id)

# @app.post("/process_text", response_model=ProcessedResponse)
# async def process_text(user_input: UserInput):
#     try:
#         # Get user preferences
#         user_prefs = await get_user_preferences(user_input.user_id)
#         if not user_prefs:
#             raise HTTPException(status_code=404, detail="User preferences not found")
        
#         result = await assistant.process_input(
#             text=user_input.text,
#             language=user_prefs['lang_to_learn'],
#             proficiency=user_prefs['proficiency_level'],
#             target="grammar_correction"
#         )
        
#         return ProcessedResponse(**result)
        
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# async def health_check():
#     return {
#         "status": "healthy",
#         "timestamp": str(datetime.now()),
#         "environment": settings.environment
#     }

# if __name__ == "__main__":
#     import uvicorn
#     initialize_firebase()
#     uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)