'''
The following code is :

last updated on 30-12-2024 15.02

issues : none

TBD : integrating voice, optimize the reply speed, optimize memory, optimize connection with gram bot
'''

import pyttsx3
import torch
import random

import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration
from transformers import AutoTokenizer, T5ForConditionalGeneration

class RylaAssistant:

    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.engine.setProperty('volume', 0.9)

        self.target_uses = {
            'grammar_correction': {
                'prompt': "Correct the grammar: ",
                'correction_weight': 1.0
            },
            'text_coherent': {
                'prompt': "Make this text more coherent: ",
                'correction_weight': 0.8
            },
            'easier_understanding': {
                'prompt': "Simplify this text: ",
                'correction_weight': 0.6
            },
            'paraphrasing': {
                'prompt': "Paraphrase this text: ",
                'correction_weight': 0.7
            },
            'formal_tone': {
                'prompt': "Make the text more formal: ",
                'correction_weight': 0.9
            },
            'neutral_tone': {
                'prompt': "Convert text to a neutral tone: ",
                'correction_weight': 0.8
            }
        }

        self.model_configs = {
            'beginner': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 0.1,
                'max_length': 50,
                'context_prompts': ["Reply in a very basic manner: ",
                "Reply in a way baby can understand"]
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

        try:
            print("Loading grammar correction model...")
            self.grammar_tokenizer = AutoTokenizer.from_pretrained("grammarly/coedit-large")
            self.grammar_model = T5ForConditionalGeneration.from_pretrained("grammarly/coedit-large")
            print("Grammar model loaded successfully...")
        except Exception as e:
            print(f"Error loading grammar model: {e}")
            raise 

    def load_chat_model(self, proficiency):
        try:
            config = self.model_configs[proficiency]
            model_name = config['model_name']
            
            print(f"\n Loading chat model for {proficiency} level...")
            self.chat_tokenizer = BlenderbotTokenizer.from_pretrained(model_name)
            self.chat_model = BlenderbotForConditionalGeneration.from_pretrained(model_name)
            self.current_proficiency = proficiency
            print(f"Successfully loaded {model_name}")
            
        except Exception as e:
            print(f"Error loading chat model for {proficiency}: {e}")
            if proficiency != 'intermediate':
                print("Falling back to intermediate model...")
                self.load_chat_model('intermediate')

    def gram_model_correction(self, input_text):
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

    def convo_model_response(self, input_text):
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

            reply = self.chat_tokenizer.decode(
                reply_ids[0], 
                skip_special_tokens=True
            )

            return reply

        except Exception as e:
            print(f"Error in conversation model: {e}")
            return "I'm having trouble understanding. Could you rephrase that?"

    def set_proficiency(self, level):
        level = level.lower()
        if level in self.model_configs:
            if level != self.current_proficiency:
                self.load_chat_model(level)
            print(f"Proficiency set to: {self.current_proficiency}")
        else:
            print("Invalid proficiency level. Use 'beginner', 'intermediate', or 'expert'.")

    def set_target_use(self, target):
        target = target.lower()
        if target in self.target_uses:
            self.current_target = target
            print(f"Target use set to: {self.current_target}")
        else:
            print("Invalid target use. Please choose from:", ", ".join(self.target_uses.keys()))

    def speak(self, text):
        self.engine.say(text)
        self.engine.runAndWait()

    def run(self):
        # Proficiency selection
        while True:
            print("\nPlease select your proficiency level:")
            print("1. Beginner")
            print("2. Intermediate")
            print("3. Expert")
            choice = input("Enter your choice (1-3): ")
            
            proficiency_map = {
                '1': 'beginner',
                '2': 'intermediate',
                '3': 'expert'
            }
            
            if choice in proficiency_map:
                self.load_chat_model(proficiency_map[choice])
                break
            else:
                print("Invalid choice. Please try again.")

        # Target use selection
        while True:
            print("\nPlease select your target use:")
            for i, target in enumerate(self.target_uses.keys(), 1):
                print(f"{i}. {target}")
            choice = input(f"Enter your choice (1-{len(self.target_uses)}): ")
            
            try:
                target_list = list(self.target_uses.keys())
                selected_target = target_list[int(choice) - 1]
                self.set_target_use(selected_target)
                break
            except (ValueError, IndexError):
                print("Invalid choice. Please try again.")

        print("\nRyla is ready!")
        print("Current Proficiency:", self.current_proficiency)
        print("Current Target Use:", self.current_target)

        while True:
            try:
                user_input = input("You: ")
                
                if user_input.lower().startswith('/proficiency'):
                    parts = user_input.split()
                    if len(parts) > 1:
                        self.set_proficiency(parts[1])
                        continue
                
                if user_input.lower().startswith('/target'):
                    parts = user_input.split()
                    if len(parts) > 1:
                        self.set_target_use(parts[1])
                        continue

                if user_input.lower() in ['exit', 'quit', 'bye']:
                    print("Ryla: Goodbye!")
                    self.speak("Goodbye")
                    break

                processed_text = self.gram_model_correction(user_input)
                print(f"Ryla (Processing): {processed_text}")

                if processed_text != "No changes needed":
                    convo_response = self.convo_model_response(processed_text)
                else:
                    convo_response = self.convo_model_response(user_input)
                print(f"Ryla (Response): {convo_response}")

                self.speak(convo_response)

            except KeyboardInterrupt:
                print("\nRyla: Goodbye!")
                break
            except Exception as e:
                print(f"An unexpected error occurred: {e}")