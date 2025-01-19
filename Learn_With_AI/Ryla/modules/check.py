#To check working of a model
'''

from transformers import AutoModelForCausalLM, AutoTokenizer

# Define the model name
model_name = "microsoft/DialoGPT-medium"

# Load the tokenizer and model
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

print("Model loaded successfully!")
'''

#---------------------------------------------------------------------------------------------

#NOT WORKING (reason - ?)

'''
#TTS

from TTS.tts.configs.xtts_config import XttsConfig
from TTS.tts.models.xtts import Xtts

config = XttsConfig()
config.load_json("/path/to/xtts/config.json")
model = Xtts.init_from_config(config)
model.load_checkpoint(config, checkpoint_dir="/path/to/xtts/", eval=True)
model.cuda()

outputs = model.synthesize(
    "It took me quite a long time to develop a voice and now that I have it I am not going to be silent.",
    config,
    speaker_wav="/data/TTS-public/_refclips/3.wav",
    gpt_cond_len=3,
    language="en",
)
'''


'''
from transformers import AutoTokenizer, T5ForConditionalGeneration
import torch

def correct_french_grammar(text):

    model_name = "cmarkea/bart-base-fr"  # French BART model
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = T5ForConditionalGeneration.from_pretrained(model_name)
    
    # Prepare the input text with a specific prompt
    prompt = f"Correct this French text: {text}"
    inputs = tokenizer(prompt, return_tensors="pt", padding=True, truncation=True, max_length=512)
    
    # Generate correction
    outputs = model.generate(
        **inputs,
        max_length=512,
        num_beams=4,
        length_penalty=1.0,
        early_stopping=True
    )
    corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return corrected_text

if __name__ == "__main__":
    # Example sentences with grammar mistakes
    test_sentences = [
        "Je suis allé à la magasins hier",  # Incorrect verb form
        "Le chat noir il dort sur le canapé",  # Redundant subject pronoun
    ]
    
    print("French Grammar Correction Tool")
    print("-----------------------------")
    
    for sentence in test_sentences:
        print("\nOriginal:", sentence)

'''

#To do : model has to reject english sentences and give the translation of it

# from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# def load_model():
#     model_name = "PoloHuggingface/French_grammar_error_corrector"
#     print("Loading model...")
#     tokenizer = AutoTokenizer.from_pretrained(model_name)
#     model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
#     print("Model loaded successfully.")
#     return tokenizer, model

# def correct_grammar(input_text, tokenizer, model):
#     inputs = tokenizer(input_text, return_tensors="pt", max_length=512, truncation=True)

#     outputs = model.generate(**inputs, max_length=512, num_beams=5, early_stopping=True)

#     corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
#     return corrected_text

# def main():
#     tokenizer, model = load_model()

#     print("\nFrench Grammar Error Corrector :\n")
#     while True:
#         input_text = input("Enter a French sentence (or 'exit' to quit): ")
#         if input_text.lower() == 'exit':
#             print("Exiting the program. Au revoir!")
#             break

#         corrected_text = correct_grammar(input_text, tokenizer, model)

#         print(f"Corrected Sentence: {corrected_text}\n")

# if __name__ == "__main__":
#     main()

#---------------------------------------------------------------------------------

# from happytransformer import HappyTextToText, TTSettings

# happy_tt = HappyTextToText("T5", "fdemelo/t5-base-spell-correction-fr")
# args = TTSettings(num_beams=5, min_length=1)

# result = happy_tt.generate_text("grammaire: my name is draco and i have the goods", args=args)
# print(result.text)

#-------------------------------------------------------------------------------------

from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)


def chat_with_bot(input_text):
    new_user_input_ids = tokenizer.encode(input_text + tokenizer.eos_token, return_tensors='pt')
    chat_history.append(new_user_input_ids)

    bot_input_ids = chat_history[-1]
    bot_output = model.generate(bot_input_ids, max_length=1000, pad_token_id=tokenizer.eos_token_id, no_repeat_ngram_size=2, temperature=0.7)

    bot_reply = tokenizer.decode(bot_output[:, bot_input_ids.shape[-1]:][0], skip_special_tokens=True)
    chat_history.append(bot_output)

    return bot_reply

print("Bot: Bonjour! Comment puis-je vous aider aujourd'hui?")
while True:
    user_input = input("You: ")
    if user_input.lower() == 'exit':
        print("Bot: Au revoir!")
        break
    response = chat_with_bot(user_input)
    print(f"Bot: {response}")

