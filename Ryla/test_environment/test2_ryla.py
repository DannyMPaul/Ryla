"""
Ryla Assistant - A conversational AI with text processing capabilities
Last updated: 10-01-2025
Features: Speech synthesis, grammar correction, conversation, user preferences
Database: Firebase Realtime Database
"""

import pyttsx3
import torch
import random
import os
from typing import Dict, Optional, Any, Union

os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import firebase_admin
from firebase_admin import credentials, db
from transformers import (
    BlenderbotTokenizer, 
    BlenderbotForConditionalGeneration,
    AutoTokenizer, 
    T5ForConditionalGeneration
)

class RylaAssistant:
    def __init__(self, firebase_key_path: str, database_url: str):
        # Initialize Firebase
        self._initialize_firebase(firebase_key_path, database_url)
        
        # Initialize TTS engine
        self._initialize_tts()
        
        # Initialize configurations
        self._initialize_configs()
        
        # Initialize models as None - will be loaded on demand
        self.grammar_tokenizer = None
        self.grammar_model = None
        self.chat_tokenizer = None
        self.chat_model = None
        self.current_proficiency = None
        self.current_target = None

    def _initialize_firebase(self, firebase_key_path: str, database_url: str) -> None:
        try:
            cred = credentials.Certificate(firebase_key_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': "https://rylang-c9742-default-rtdb.asia-southeast1.firebasedatabase.app/"
            })
            self.db = db.reference()
            print("Firebase initialized successfully...")
        except Exception as e:
            print(f"Error initializing Firebase: {e}")
            raise

    def _initialize_tts(self) -> None:
        try:
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 150)
            self.engine.setProperty('volume', 0.9)
        except Exception as e:
            print(f"Error initializing TTS: {e}")
            self.engine = None

    def _initialize_configs(self) -> None:
        # Target use configurations
        self.target_uses = {
            'grammar_correction': {'prompt': "Correct the grammar: ", 'correction_weight': 1.0},
            'text_coherent': {'prompt': "Make this text more coherent: ", 'correction_weight': 0.8},
            'easier_understanding': {'prompt': "Simplify this text: ", 'correction_weight': 0.6},
            'paraphrasing': {'prompt': "Paraphrase this text: ", 'correction_weight': 0.7},
            'formal_tone': {'prompt': "Make the text more formal: ", 'correction_weight': 0.9},
            'neutral_tone': {'prompt': "Convert text to a neutral tone: ", 'correction_weight': 0.8}
        }

        # Model configurations
        self.model_configs = {
            'beginner': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 0.1,
                'max_length': 50,
                'context_prompts': ["Reply in a very basic manner: "]
            },
            'intermediate': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 0.6,
                'max_length': 100,
                'context_prompts': ["Reply using variety of words: "]
            },
            'expert': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 1.0,
                'max_length': 150,
                'context_prompts': ["Reply using complex sentences and wide variety of words: "]
            }
        }

        # Mapping dictionaries
        self.prof_level_map = {1: 'beginner', 2: 'intermediate', 3: 'expert'}
        self.prof_level_map_reverse = {v: k for k, v in self.prof_level_map.items()}
        
        self.target_use_map = {
            1: 'grammar_correction',
            2: 'text_coherent',
            3: 'easier_understanding',
            4: 'paraphrasing',
            5: 'formal_tone',
            6: 'neutral_tone'
        }
        self.target_use_map_reverse = {v: k for k, v in self.target_use_map.items()}

    def get_user_preferences(self, user_id: str) -> Dict[str, str]:
        try:
            user_ref = self.db.child('INFO').child(user_id)
            user_data = user_ref.get()
            
            if user_data:
                proficiency = self.prof_level_map.get(
                    user_data.get('proficiency_level'), 'intermediate'
                )
                target = self.target_use_map.get(
                    user_data.get('target_use'), 'grammar_correction'
                )
                
                return {
                    'proficiency_level': proficiency,
                    'target_use': target,
                    'user_name': user_data.get('user_name', 'User')
                }
                
            return self._get_default_preferences()

        except Exception as e:
            print(f"Error fetching user preferences: {e}")
            return self._get_default_preferences()

    def _get_default_preferences(self) -> Dict[str, str]:
        """Return default user preferences."""
        return {
            'proficiency_level': 'intermediate',
            'target_use': 'grammar_correction',
            'user_name': 'User'
        }

    def update_user_preferences(self, user_id: str, 
                              proficiency_level: Optional[str] = None, 
                              target_use: Optional[str] = None) -> None:
        """Update user preferences in Firebase."""
        try:
            user_ref = self.db.child('INFO').child(user_id)
            update_data = {}
            
            if proficiency_level:
                update_data['proficiency_level'] = self.prof_level_map_reverse.get(
                    proficiency_level.lower()
                )
            if target_use:
                update_data['target_use'] = self.target_use_map_reverse.get(
                    target_use.lower()
                )
                
            if update_data:
                user_ref.update(update_data)
                print(f"Updated preferences for user {user_id}")
        except Exception as e:
            print(f"Error updating user preferences: {e}")

    def load_chat_model(self, proficiency: str) -> None:
        """Load chat and grammar models for specified proficiency level."""
        try:
            # Load grammar model if not already loaded
            if not self.grammar_tokenizer:
                print("Loading grammar correction model...")
                self.grammar_tokenizer = AutoTokenizer.from_pretrained("grammarly/coedit-large")
                self.grammar_model = T5ForConditionalGeneration.from_pretrained("grammarly/coedit-large")
                print("Grammar model loaded successfully...")

            # Load chat model for specified proficiency
            config = self.model_configs[proficiency]
            model_name = config['model_name']
            
            print(f"\nLoading chat model for {proficiency} level...")
            self.chat_tokenizer = BlenderbotTokenizer.from_pretrained(model_name)
            self.chat_model = BlenderbotForConditionalGeneration.from_pretrained(model_name)
            self.current_proficiency = proficiency
            print(f"Successfully loaded model for {proficiency} level")
            
        except Exception as e:
            print(f"Error loading models: {e}")
            if proficiency != 'intermediate':
                print("Falling back to intermediate model...")
                self.load_chat_model('intermediate')

    def gram_model_correction(self, input_text: str) -> str:
        """Apply grammar correction to input text."""
        try:
            if len(input_text.split()) == 1:
                return "No changes needed"

            target_prompt = self.target_uses[self.current_target]['prompt']
            correction_weight = self.target_uses[self.current_target]['correction_weight']
            
            grammar_input = f"{target_prompt}{input_text}"
            input_ids = self.grammar_tokenizer(grammar_input, return_tensors="pt").input_ids
            
            with torch.no_grad():
                outputs = self.grammar_model.generate(
                    input_ids,
                    max_length=256,
                    num_beams=5,
                    do_sample=True,
                    temperature=correction_weight,
                    top_p=0.9,
                    repetition_penalty=1.1,
                    early_stopping=True
                )
            
            corrected_text = self.grammar_tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            input_stripped = ' '.join(input_text.lower().split())
            corrected_stripped = ' '.join(corrected_text.lower().split())
            
            return corrected_text if input_stripped != corrected_stripped else "No changes needed"

        except Exception as e:
            print(f"Error in text processing: {e}")
            return input_text

    def convo_model_response(self, input_text: str) -> str:
        """Generate conversation response for input text."""
        try:
            config = self.model_configs[self.current_proficiency]
            context_prompt = random.choice(config['context_prompts'])
            modified_input = f"{context_prompt} {input_text}"

            convo_input = self.chat_tokenizer(modified_input, return_tensors="pt")
            
            with torch.no_grad():
                reply_ids = self.chat_model.generate(
                    **convo_input,
                    max_length=config['max_length'],
                    num_beams=4,
                    do_sample=True,
                    temperature=config['complexity'],
                    top_p=0.9,
                    repetition_penalty=1.2,
                    early_stopping=True
                )

            return self.chat_tokenizer.decode(reply_ids[0], skip_special_tokens=True)

        except Exception as e:
            print(f"Error in conversation model: {e}")
            return "I'm having trouble understanding. Could you rephrase that?"

    def set_proficiency(self, level: str) -> None:
        """Set proficiency level and load appropriate model."""
        level = level.lower()
        if level in self.model_configs:
            if level != self.current_proficiency:
                self.load_chat_model(level)
            print(f"Proficiency set to: {self.current_proficiency}")
        else:
            print("Invalid proficiency level. Use 'beginner', 'intermediate', or 'expert'.")

    def set_target_use(self, target: str) -> None:
        """Set target use for text processing."""
        target = target.lower()
        if target in self.target_uses:
            self.current_target = target
            print(f"Target use set to: {self.current_target}")
        else:
            print("Invalid target use. Please choose from:", ", ".join(self.target_uses.keys()))

    def speak(self, text: str) -> None:
        """Convert text to speech if TTS engine is available."""
        if self.engine:
            try:
                self.engine.say(text)
                self.engine.runAndWait()
            except Exception as e:
                print(f"Error in text-to-speech: {e}")

    def run(self, user_id: str) -> None:
        """Main execution loop for the assistant."""
        # Initialize user preferences
        preferences = self.get_user_preferences(user_id)
        user_name = preferences['user_name']
        
        # Load models with user preferences
        self.load_chat_model(preferences['proficiency_level'])
        self.current_target = preferences['target_use']

        print(f"\nWelcome {user_name}!")
        print("Ryla is ready!")
        print("Current Proficiency:", self.current_proficiency)
        print("Current Target Use:", self.current_target)

        while True:
            try:
                user_input = input(f"{user_name}: ").strip()
                
                # Handle command inputs
                if user_input.lower() in ['exit', 'quit', 'bye']:
                    print(f"Ryla: Goodbye, {user_name}!")
                    self.speak(f"Goodbye, {user_name}")
                    break

                if user_input.lower().startswith('/proficiency'):
                    self._handle_proficiency_command(user_input, user_id)
                    continue
                
                if user_input.lower().startswith('/target'):
                    self._handle_target_command(user_input, user_id)
                    continue

                # Process input and generate response
                processed_text = self.gram_model_correction(user_input)
                print(f"Ryla (Processing): {processed_text}")

                convo_response = self.convo_model_response(
                    processed_text if processed_text != "No changes needed" else user_input
                )
                print(f"Ryla (Response): {convo_response}")
                self.speak(convo_response)

            except KeyboardInterrupt:
                print(f"\nRyla: Goodbye, {user_name}!")
                break
            except Exception as e:
                print(f"An unexpected error occurred: {e}")

    def _handle_proficiency_command(self, command: str, user_id: str) -> None:
        """Handle proficiency change command."""
        parts = command.split()
        if len(parts) > 1:
            new_proficiency = parts[1].lower()
            if new_proficiency in self.model_configs:
                self.set_proficiency(new_proficiency)
                self.update_user_preferences(user_id, proficiency_level=new_proficiency)
                print(f"Proficiency level updated to {new_proficiency}")
            else:
                print("Invalid proficiency level. Use 'beginner', 'intermediate', or 'expert'.")

    def _handle_target_command(self, command: str, user_id: str) -> None:
        """Handle target use change command."""
        parts = command.split()
        if len(parts) > 1:
            new_target = parts[1].lower()
            if new_target in self.target_uses:
                self.set_target_use(new_target)
                self.update_user_preferences(user_id, target_use=new_target)
                print(f"Target use updated to {new_target}")
            else:
                print("Invalid target use. Please choose from:", ", ".join(self.target_uses.keys()))

# Example usage
if __name__ == "__main__":
    firebase_key_path = "path/to/your/firebase_credentials.json"
    database_url = "https://your-database-url.firebaseio.com"