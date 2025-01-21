from TTS.api import TTS

# Load the XTTS-v2 model
model_name = "coqui/XTTS-v2"  # Replace with the specific XTTS-v2 model if required
tts = TTS(model_name)

# Generate speech from text
text = "Bonjour! Welcome to the world of multilingual text-to-speech synthesis."
output_file = "output.wav"

# Synthesize and save the speech
tts.tts_to_file(text=text, file_path=output_file)

print(f"Speech has been synthesized and saved to {output_file}")
