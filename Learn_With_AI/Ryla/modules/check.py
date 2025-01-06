'''
#To check working of a model

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
import torch
from gramformer import Gramformer
from typing import List

def setup_gramformer(seed: int = 1212, use_gpu: bool = False) -> Gramformer:
    """Initialize Gramformer with specified settings."""
    torch.manual_seed(seed)
    if torch.cuda.is_available() and use_gpu:
        torch.cuda.manual_seed_all(seed)
    return Gramformer(models=1, use_gpu=use_gpu)  # 1=corrector

def correct_sentences(sentences: List[str], gf: Gramformer) -> None:
    """Process and correct each sentence, handling potential errors."""
    for sentence in sentences:
        print("\n[Input]", sentence.strip())
        try:
            corrections = gf.correct(sentence, max_candidates=1)
            for correction in corrections:
                print("[Correction]", correction)
        except Exception as e:
            print(f"Error processing sentence: {e}")
        print("-" * 80)

def main_check():
    # Test sentences
    sentences = [
        "He are moving here.",
        "I am doing fine. How is you?",
        "How is they?",
        "Matt like fish",
        "the collection of letters was original used by the ancient Romans",
        "We enjoys horror movies",
        "Anna and Mike is going skiing",
        "I walk to the store and I bought milk",
        "We all eat the fish and then made dessert",
        "I will eat fish for dinner and drink milk",
        "what be the reason for everyone leave the company"
    ]

    try:
        gf = setup_gramformer()
        correct_sentences(sentences, gf)
    except Exception as e:
        print(f"Failed to initialize Gramformer: {e}")

if __name__ == "__main__":
    main_check()