'''

The following code is :

last updated on 14-01-2024 22.49

issues : none

TBD : 
    integrating voice
    change DB to realtime DB
change py format to pth


'''

import pyttsx3
import torch
import os
from typing import Dict, Optional
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from transformers import (
    AutoTokenizer,
    BlenderbotTokenizer, 
    BlenderbotForConditionalGeneration,
    AutoModelForSeq2SeqLM,
    CamembertTokenizer,
    CamembertForCausalLM
)

class MultilingualAssistant:
    def __init__(self):
        # Initialize TTS engine
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.engine.setProperty('volume', 0.9)
        
        # Language configurations
        self.language_configs = {
            'fr': {
                'grammar_model': "PoloHuggingface/French_grammar_error_corrector",
                'chat_model': "camembert-base",
                'tokenizer_class': CamembertTokenizer,
                'model_class': CamembertForCausalLM
            },
            'en': {
                'grammar_model': "grammarly/coedit-large",
                'chat_model': "facebook/blenderbot-400M-distill",
                'tokenizer_class': BlenderbotTokenizer,
                'model_class': BlenderbotForConditionalGeneration
            }
        }

        # Target uses for each language
        self.target_uses = {
            'fr': {
                'grammar_correction': {'prompt': "", 'weight': 1.0},
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
                    'fr': [" "],
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
        self.current_language = None
        self.current_proficiency = None
        self.current_target = None

    def load_language_models(self, language: str):
        if language not in self.language_configs:
            raise ValueError(f"Unsupported language: {language}")

        if not self.models[language]:
            config = self.language_configs[language]
            try:
                print(f"\nLoading grammar model for {language}...")
                self.models[language]['grammar_tokenizer'] = AutoTokenizer.from_pretrained(config['grammar_model'])
                self.models[language]['grammar_model'] = AutoModelForSeq2SeqLM.from_pretrained(config['grammar_model'])

                print(f"Loading chat model for {language}...")
                self.models[language]['chat_tokenizer'] = config['tokenizer_class'].from_pretrained(config['chat_model'])
                self.models[language]['chat_model'] = config['model_class'].from_pretrained(config['chat_model'])
                
                print(f"Models loaded successfully for {language}")
                
            except Exception as e:
                print(f"Error loading models for {language}: {e}")
                raise

    def correct_grammar(self, input_text: str) -> Optional[str]:
        if len(input_text.split()) <= 1:
            return None

        try:
            target = self.target_uses[self.current_language][self.current_target]
            grammar_input = f"{target['prompt']}{input_text}"
            
            models = self.models[self.current_language]
            input_ids = models['grammar_tokenizer'](grammar_input, return_tensors="pt").input_ids
            
            with torch.no_grad():
                outputs = models['grammar_model'].generate(
                    input_ids,
                    max_length=256,
                    num_beams=5,
                    do_sample=True,
                    temperature=target['weight'],
                    top_p=0.9,
                    repetition_penalty=1.1,
                    early_stopping=True
                )
            
            corrected = models['grammar_tokenizer'].decode(outputs[0], skip_special_tokens=True)
            
            return corrected if corrected.lower() != input_text.lower() else None

        except Exception as e:
            print(f"Grammar correction error: {e}")
            return None

    def generate_response(self, input_text: str) -> str:
        try:
            config = self.model_configs[self.current_proficiency]
            import random
            context = random.choice(config['context_prompts'][self.current_language])
            modified_input = f"{context}{input_text}"
            
            models = self.models[self.current_language]
            input_data = models['chat_tokenizer'](modified_input, return_tensors="pt")
            
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
            print(f"Response generation error: {e}")
            return "I'm having trouble understanding. Could you rephrase that?"

    def speak(self, text):
        self.engine.say(text)
        self.engine.runAndWait()

    def run(self):
        # Language selection
        while True:
            print("\nSelect language / Sélectionnez la langue:")
            print("1. English")
            print("2. Français")
            choice = input("Enter choice / Entrez votre choix (1-2): ")
            
            lang_map = {'1': 'en', '2': 'fr'}
            if choice in lang_map:
                self.current_language = lang_map[choice]
                self.load_language_models(self.current_language)
                break
            else:
                print("Invalid choice / Choix invalide")

        # Proficiency selection
        while True:
            if self.current_language == 'en':
                print("\nSelect your proficiency level:")
                print("1. Beginner")
                print("2. Intermediate")
                print("3. Expert")
            else:
                print("\nSélectionnez votre niveau:")
                print("1. Débutant")
                print("2. Intermédiaire")
                print("3. Expert")
                
            choice = input("Enter choice / Entrez votre choix (1-3): ")
            prof_map = {'1': 'beginner', '2': 'intermediate', '3': 'expert'}
            
            if choice in prof_map:
                self.current_proficiency = prof_map[choice]
                break

        # Target use selection
        target_uses = self.target_uses[self.current_language]
        while True:
            print("\nSelect target use / Sélectionnez l'utilisation cible:")
            for i, target in enumerate(target_uses.keys(), 1):
                print(f"{i}. {target}")
            choice = input(f"Enter choice / Entrez votre choix (1-{len(target_uses)}): ")
            
            try:
                target_list = list(target_uses.keys())
                self.current_target = target_list[int(choice) - 1]
                break
            except (ValueError, IndexError):
                print("Invalid choice / Choix invalide")

        print("\nAssistant is ready! / L'assistant est prêt!")
        
        while True:
            try:
                user_input = input("You / Vous: ")
                
                if user_input.lower() in ['exit', 'quit', 'bye', 'au revoir']:
                    farewell = "Goodbye!" if self.current_language == 'en' else "Au revoir!"
                    print(f"Assistant: {farewell}")
                    self.speak(farewell)
                    break

                # Grammar correction
                correction = self.correct_grammar(user_input)
                if correction:
                    print(f"Assistant (Grammar): {correction}")
                
                # Generate response
                response = self.generate_response(correction or user_input)
                print(f"Assistant: {response}")
                self.speak(response)

            except KeyboardInterrupt:
                print("\nSession ended / Session terminée")
                break
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    assistant = MultilingualAssistant()
    assistant.run()