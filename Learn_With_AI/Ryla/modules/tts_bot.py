from TTS.api import TTS

# Initialize TTS with English model
tts = TTS("tts_models/en/ljspeech/tacotron2-DDC")

# Generate speech
tts.tts_to_file(text="Hello, this is a test.", file_path="output.wav")