import pyttsx3
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration

class RylaAssistant:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 150)
        self.engine.setProperty('volume', 0.9)

        self.model_configs = {
            'beginner': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 0.3,
                'max_length': 50,
                'context_prompts': [
                    "Explain this simply:",
                    "Use basic words:",
                    "Keep it simple:"
                ]
            },
            'intermediate': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 0.6,
                'max_length': 100,
                'context_prompts': [
                    "Explain clearly:",
                    "Provide context:",
                    "Discuss this:"
                ]
            },
            'expert': {
                'model_name': "facebook/blenderbot-400M-distill",
                'complexity': 0.9,
                'max_length': 150,
                'context_prompts': [
                    "Analyze in depth:",
                    "Explain technically:",
                    "Elaborate comprehensively:"
                ]
            }
        }

        try:
            self.gram_model_name = "vennify/t5-base-grammar-correction"
            self.gram_tokenizer = AutoTokenizer.from_pretrained(self.gram_model_name)
            self.gram_model = AutoModelForSeq2SeqLM.from_pretrained(self.gram_model_name)
            print("Grammar model loaded successfully...")
        except Exception as e:
            print(f"Error loading grammar model: {e}")
            raise

    def load_chat_model(self, proficiency):
        try:
            config = self.model_configs[proficiency]
            model_name = config['model_name']
            
            print(f"Loading chat model for {proficiency} level...")
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
            if len(input_text.split()) <= 2:
                return input_text

            grammar_input = "grammar: " + input_text
            input_ids = self.gram_tokenizer.encode(grammar_input, return_tensors="pt")

            with torch.no_grad():
                outputs = self.gram_model.generate(
                    input_ids,
                    max_length=128,
                    num_beams=4,
                    early_stopping=True
                )

            corrected_text = self.gram_tokenizer.decode(
                outputs[0],
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True
            )

            if corrected_text.startswith("grammar: "):
                corrected_text = corrected_text[len("grammar: "):]

            if len(corrected_text.split()) < len(input_text.split()) / 2:
                return input_text

            return "Grammar correct" if corrected_text.strip() == input_text.strip() else corrected_text

        except Exception as e:
            print(f"Error in grammar correction: {e}")
            return input_text

    def convo_model_response(self, input_text):
        try:
            config = self.model_configs[self.current_proficiency]
            import random
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

    def speak(self, text):
        self.engine.say(text)
        self.engine.runAndWait()

    def run(self):
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

        print("\nRyla is ready!")
        print("Current Proficiency: ", self.current_proficiency)

        while True:
            try:
                user_input = input("You: ")
                
                if user_input.lower().startswith('/proficiency'):
                    parts = user_input.split()
                    if len(parts) > 1:
                        self.set_proficiency(parts[1])
                        continue

                if user_input.lower() in ['exit', 'quit', 'bye']:
                    print("Ryla: Goodbye!")
                    self.speak("Goodbye")
                    break

                gram_response = self.gram_model_correction(user_input)
                print(f"Ryla (Correction): {gram_response}")

                if gram_response == "Grammar correct":
                    convo_response = self.convo_model_response(user_input)
                    print(f"Ryla (Convo): {convo_response}")
                else:
                    convo_response = self.convo_model_response(gram_response)
                    print(f"Ryla (Convo): {convo_response}")

                self.speak(convo_response)

            except KeyboardInterrupt:
                print("\nRyla: Goodbye!")
                break
            except Exception as e:
                print(f"An unexpected error occurred: {e}")

def main():
    try:
        ryla = RylaAssistant()
        ryla.run()
    except Exception as e:
        print(f"Failed to initialize Ryla: {e}")

if __name__ == "__main__":
    main()