import pyttsx3
import torch
import random

import os
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

class RylaAssistant:

    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.engine.setProperty('volume', 0.9)

        self.target_uses = {
            'grammar_correction': {
                'prompt': "Corriger la grammaire: ",
                'correction_weight': 1.0
            },
            'text_coherent': {
                'prompt': "Rendre ce texte plus cohérent: ",
                'correction_weight': 0.8
            },
            'easier_understanding': {
                'prompt': "Simplifier ce texte: ",
                'correction_weight': 0.6
            },
            'paraphrasing': {
                'prompt': "Paraphraser ce texte: ",
                'correction_weight': 0.7
            },
            'formal_tone': {
                'prompt': "Rendre le texte plus formel: ",
                'correction_weight': 0.9
            },
            'neutral_tone': {
                'prompt': "Convertir le texte en ton neutre: ",
                'correction_weight': 0.8
            }
        }

        self.model_configs = {
            'beginner': {
                'model_name': "microsoft/DialoGPT-medium",
                'complexity': 0.1,
                'max_length': 50,
                'context_prompts': ["Répondre de manière très basique: ",
                "Répondre d'une façon simple à comprendre"]
            },
            'intermediate': {
                'model_name': "microsoft/DialoGPT-medium",
                'complexity': 0.6,
                'max_length': 100,
                'context_prompts': ["Répondre en utilisant une variété de mots: "]
            },
            'expert': {
                'model_name': "microsoft/DialoGPT-medium",
                'complexity': 1.0,
                'max_length': 150,
                'context_prompts': ["Répondre en utilisant des phrases complexes et une grande variété de mots: "]
            }
        }

        try:
            print("Chargement du modèle de correction grammaticale...")
            self.grammar_tokenizer = AutoTokenizer.from_pretrained("PoloHuggingface/French_grammar_error_corrector")
            self.grammar_model = AutoModelForSeq2SeqLM.from_pretrained("PoloHuggingface/French_grammar_error_corrector")
            print("Modèle de grammaire chargé avec succès...")
        except Exception as e:
            print(f"Erreur lors du chargement du modèle de grammaire: {e}")
            raise 

    def load_chat_model(self, proficiency):
        try:
            config = self.model_configs[proficiency]
            model_name = config['model_name']
            
            print(f"\n Chargement du modèle de chat pour le niveau {proficiency}...")
            self.chat_tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.chat_model = AutoModelForCausalLM.from_pretrained(model_name)
            self.current_proficiency = proficiency
            print(f"Chargement réussi de {model_name}")
            
        except Exception as e:
            print(f"Erreur lors du chargement du modèle de chat pour {proficiency}: {e}")
            if proficiency != 'intermediate':
                print("Retour au modèle intermédiaire...")
                self.load_chat_model('intermediate')

    def gram_model_correction(self, input_text):
        try:
            if len(input_text.split()) == 1:
                return "Aucune modification nécessaire"

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
            
            return corrected_text if input_stripped != corrected_stripped else "Aucune modification nécessaire"

        except Exception as e:
            print(f"Erreur dans le traitement du texte: {e}")
            return input_text

    def convo_model_response(self, input_text):
        try:
            config = self.model_configs[self.current_proficiency]
            context_prompt = random.choice(config['context_prompts'])
            modified_input = f"{context_prompt} {input_text}"

            # Encode the input text
            input_ids = self.chat_tokenizer.encode(modified_input + self.chat_tokenizer.eos_token, return_tensors='pt')
            
            with torch.no_grad():
                reply_ids = self.chat_model.generate(
                    input_ids,
                    max_length=config['max_length'],
                    num_beams=4,
                    do_sample=True,
                    temperature=config['complexity'],
                    top_p=0.9,
                    repetition_penalty=1.2,
                    pad_token_id=self.chat_tokenizer.eos_token_id,
                    early_stopping=True
                )

            reply = self.chat_tokenizer.decode(
                reply_ids[:, input_ids.shape[-1]:][0], 
                skip_special_tokens=True
            )

            return reply

        except Exception as e:
            print(f"Erreur dans le modèle de conversation: {e}")
            return "J'ai du mal à comprendre. Pourriez-vous reformuler?"

    def set_proficiency(self, level):
        level = level.lower()
        if level in self.model_configs:
            if level != self.current_proficiency:
                self.load_chat_model(level)
            print(f"Niveau de compétence défini sur: {self.current_proficiency}")
        else:
            print("Niveau de compétence invalide. Utilisez 'beginner', 'intermediate', ou 'expert'.")

    def set_target_use(self, target):
        target = target.lower()
        if target in self.target_uses:
            self.current_target = target
            print(f"Utilisation cible définie sur: {self.current_target}")
        else:
            print("Utilisation cible invalide. Veuillez choisir parmi:", ", ".join(self.target_uses.keys()))

    def speak(self, text):
        self.engine.say(text)
        self.engine.runAndWait()

    def run(self):
        # Selection du niveau de compétence
        while True:
            print("\nVeuillez sélectionner votre niveau de compétence:")
            print("1. Débutant")
            print("2. Intermédiaire")
            print("3. Expert")
            choice = input("Entrez votre choix (1-3): ")
            
            proficiency_map = {
                '1': 'beginner',
                '2': 'intermediate',
                '3': 'expert'
            }
            
            if choice in proficiency_map:
                self.load_chat_model(proficiency_map[choice])
                break
            else:
                print("Choix invalide. Veuillez réessayer.")

        # Selection de l'utilisation cible
        while True:
            print("\nVeuillez sélectionner votre utilisation cible:")
            for i, target in enumerate(self.target_uses.keys(), 1):
                print(f"{i}. {target}")
            choice = input(f"Entrez votre choix (1-{len(self.target_uses)}): ")
            
            try:
                target_list = list(self.target_uses.keys())
                selected_target = target_list[int(choice) - 1]
                self.set_target_use(selected_target)
                break
            except (ValueError, IndexError):
                print("Choix invalide. Veuillez réessayer.")

        print("\nRyla est prête!")
        print("Niveau de compétence actuel:", self.current_proficiency)
        print("Utilisation cible actuelle:", self.current_target)

        while True:
            try:
                user_input = input("Vous: ")
                
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

                if user_input.lower() in ['exit', 'quit', 'bye', 'au revoir']:
                    print("Ryla: Au revoir!")
                    self.speak("Au revoir")
                    break

                processed_text = self.gram_model_correction(user_input)
                print(f"Ryla (Traitement): {processed_text}")

                if processed_text != "Aucune modification nécessaire":
                    convo_response = self.convo_model_response(processed_text)
                else:
                    convo_response = self.convo_model_response(user_input)
                print(f"Ryla (Réponse): {convo_response}")

                self.speak(convo_response)

            except KeyboardInterrupt:
                print("\nRyla: Au revoir!")
                break
            except Exception as e:
                print(f"Une erreur inattendue s'est produite: {e}")