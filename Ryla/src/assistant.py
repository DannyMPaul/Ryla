import torch
from firebase_admin import db
from transformers import (
    AutoTokenizer,
    BlenderbotTokenizer,
    BlenderbotForConditionalGeneration,
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    pipeline
)
from typing import Dict, Any, Optional
import os
import asyncio
from datetime import datetime
import logging
import random

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MultilingualAssistant:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")
        
        self.language_configs = {
            "fr": {
                'grammar_model': "grammarly/coedit-large",
                'chat_model': "facebook/blenderbot-400M-distill",
                'tokenizer_class': BlenderbotTokenizer,
                'model_class': BlenderbotForConditionalGeneration
            },
            # 'fr': {
            #     'grammar_model': "PoloHuggingface/French_grammar_error_corrector",
            #     'chat_model': "microsoft/DialoGPT-medium",
            #     'tokenizer_class': AutoTokenizer,
            #     'model_class': AutoModelForCausalLM
            # },
            "en": {
                'grammar_model': "grammarly/coedit-large",
                'chat_model': "facebook/blenderbot-400M-distill",
                'tokenizer_class': BlenderbotTokenizer,
                'model_class': BlenderbotForConditionalGeneration
            }
        }
        
        self.target_uses = {
            "fr": {
                'grammar_correction': {'prompt': "Correct the grammar: ", 'weight': 1.0},
                'text_coherent': {'prompt': "Make this text more coherent: ", 'weight': 0.8},
                'easier_understanding': {'prompt': "Simplify this text: ", 'weight': 0.6},
                'paraphrasing': {'prompt': "Paraphrase this text: ", 'weight': 0.7},
                'formal_tone': {'prompt': "Make the text more formal: ", 'weight': 0.9},
                'neutral_tone': {'prompt': "Convert text to a neutral tone: ", 'weight': 0.8}
            },
            # 'fr': {
            #     'grammar_correction': {'prompt': "Corriger la grammaire: ", 'weight': 1.0},
            #     'text_coherent': {'prompt': "Rendre ce texte plus cohérent: ", 'weight': 0.8},
            #     'easier_understanding': {'prompt': "Simplifier ce texte: ", 'weight': 0.6},
            #     'paraphrasing': {'prompt': "Paraphraser ce texte: ", 'weight': 0.7},
            #     'formal_tone': {'prompt': "Rendre le texte plus formel: ", 'weight': 0.9},
            #     'neutral_tone': {'prompt': "Convertir le texte en ton neutre: ", 'weight': 0.8}
            # },
            "en": {
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
                    "en": ["Reply in a very basic manner: "]
                }
            },
            'intermediate': {
                'complexity': 0.6,
                'max_length': 100,
                'context_prompts': {
                    'fr': ["Répondre en utilisant une variété de mots: "],
                    "en": ["Reply using variety of words: "]
                }
            },
            'expert': {
                'complexity': 1.0,
                'max_length': 150,
                'context_prompts': {
                    'fr': ["Répondre en utilisant des phrases complexes: "],
                    "en": ["Reply using complex sentences: "]
                }
            }
        }
        
        self.models = {'fr': {}, "en": {}}
        self.is_loading = {'fr': False, "en": False}
        self.load_lock = asyncio.Lock()
        self.user_sessions = {}
        
        # Pre-load English models at initialization
        # asyncio.create_task(self.load_language_models("en"))

    async def initialize_user_session(self, user_id: str, language: str = "en", proficiency: str = 'intermediate', target: str = 'grammar_correction') -> Dict[str, Any]:
        try:
            logger.info(f"Session initialization request for user {user_id}")
            # Fetch user preferences from Firebase
            user_ref = db.reference(f'users/{user_id}/model_data')
            try:
                user_data = await asyncio.wait_for(
                    asyncio.get_event_loop().run_in_executor(None, user_ref.get),
                    timeout=5.0
                ) or {}
                logger.info(f"Retrieved user data for {user_id}: {user_data}")
            except asyncio.TimeoutError:
                logger.warning(f"Firebase timeout for user {user_id}")
                user_data = {}
            except Exception as firebase_error:
                logger.error(f"Firebase error for user {user_id}: {str(firebase_error)}")
                # Use empty user data instead of raising error
                user_data = {}
                
            # Use provided values or fallback to defaults
            language = user_data.get('lang_to_learn', language)
            proficiency = user_data.get('proficiency_level', proficiency)
            target = user_data.get('target_use', target)

            # Ensure language models are loaded
            await self.load_language_models(language)
            
            # Store user-specific session configuration
            self.user_sessions[user_id] = {
                'language': language,
                'proficiency': proficiency,
                'target': target,
                'last_interaction': datetime.now()
            }
            
            # Generate a welcoming, contextual greeting
            greeting_prompts = {
                "en": [
                    "Hello! How are you doing today?",
                    "Hey there, a wonderful day, is it not?",
                    "Greetings! Ready to practice some language skills?",
                    "Welcome! I'm here to help you learn and improve."
                ],
                'fr': [
                    "Bonjour! Comment allez-vous aujourd'hui?",
                    "Salut! Prêt à pratiquer votre français?",
                    "Bienvenue! Je suis là pour vous aider à apprendre.",
                    "Bonjour! C'est un plaisir de vous aider avec votre français."
                ]
            }
            
            # Generate greeting using response generation method
            greeting = await self.generate_response(
                random.choice(greeting_prompts.get(language, greeting_prompts["en"])), 
                language, 
                proficiency
            )
            
            return {
                "user_id": user_id,
                "language": language,
                "proficiency": proficiency,
                "target": target,
                "greeting": greeting,
                "initialized": True
            }
        
        except Exception as e:
            logger.error(f"User session initialization error: {e}")
            return {
                "error": "Could not initialize user session",
                "details": str(e),
                "initialized": False
            }

    async def load_language_models(self, language: str):
        async with self.load_lock:
            if language not in self.models or not self.models[language]:
                if self.is_loading[language]:
                    while self.is_loading[language]:
                        await asyncio.sleep(0.1)
                    return
                
                self.is_loading[language] = True
                config = self.language_configs[language]
                
                try:
                    logger.info(f"Loading models for {language}")
                    
                    # Load models with pipeline for optimization
                    self.models[language] = {
                        'grammar': pipeline(
                            "text2text-generation",
                            model=config['grammar_model'],
                            device=0 if torch.cuda.is_available() else -1
                        ),
                        'grammar_tokenizer': AutoTokenizer.from_pretrained(config['grammar_model']),
                        'grammar_model': AutoModelForSeq2SeqLM.from_pretrained(config['grammar_model']).to(self.device),
                        'chat_tokenizer': config['tokenizer_class'].from_pretrained(config['chat_model']),
                        'chat_model': config['model_class'].from_pretrained(config['chat_model']).to(self.device),
                        'response': pipeline(
                            "text2text-generation",
                            model=config['chat_model'],
                            device=0 if torch.cuda.is_available() else -1
                        )
                    }
                    
                    logger.info(f"Successfully loaded models for {language}")
                except Exception as e:
                    logger.error(f"Error loading models for {language}: {e}")
                    raise
                finally:
                    self.is_loading[language] = False

    async def process_input(self, text: str, language: str, proficiency: str, target: str) -> Dict[str, Any]:
        if not text.strip():
            return {
                "original_text": text,
                "corrected_text": text,
                "response": "Please provide some text to process.",
                "metadata": {"language": language, "processed_timestamp": str(datetime.now())}
            }
        
        if not text.strip():
            raise ValueError("Empty input text provided")

        if language not in self.language_configs:
            raise ValueError(f"Unsupported language: {language}")

        # Start loading models if not already loaded
        load_task = asyncio.create_task(self.load_language_models(language))
        await load_task

        # Process text
        try:
            correction = await self.correct_grammar(text, language, target)
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
        except Exception as e:
            logger.error(f"Processing error: {e}")
            return {
                "original_text": text,
                "corrected_text": text,
                "response": "An error occurred while processing your text.",
                "metadata": {"error": str(e)}
            }

    async def correct_grammar(self, input_text: str, language: str, target: str) -> Optional[str]:
        if len(input_text.split()) <= 1:
            return None

        try:
            target_config = self.target_uses[language][target]
            grammar_input = f"{target_config['prompt']}{input_text}"
            
            # Try using the pipeline first (faster)
            try:
                result = self.models[language]['grammar'](
                    grammar_input,
                    max_length=min(512, len(input_text.split()) * 2),
                    num_beams=5,
                    do_sample=True,
                    temperature=target_config['weight']
                )
                corrected = result[0]['generated_text']
            except:
                # Fallback to traditional method if pipeline fails
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

    async def check_language_models(self, language: str) -> bool:
        """
        Check if language models are available or can be loaded
        
        Args:
            language: The language code to check
            
        Returns:
            bool: True if models are available, False otherwise
        """
        try:
            if language not in self.language_configs:
                logger.warning(f"Unsupported language: {language}")
                return False
                
            # If models are already loaded, return True
            if language in self.models and self.models[language]:
                return True
                
            # Try loading the models if not already loaded
            await self.load_language_models(language)
            return language in self.models and bool(self.models[language])
            
        except Exception as e:
            logger.error(f"Error checking language models: {e}")
            return False

    async def generate_response(self, input_text: str, language: str, proficiency: str) -> str:
        try:
            config = self.model_configs[proficiency]
            context = random.choice(config['context_prompts'][language])
            modified_input = f"{context}{input_text}"
            
            # Try using the pipeline first (faster)
            try:
                result = self.models[language]['response'](
                    modified_input,
                    max_length=config['max_length'],
                    num_beams=4,
                    do_sample=True,
                    temperature=config['complexity']
                )
                return result[0]['generated_text']
            except:
                # Fallback to traditional method if pipeline fails
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