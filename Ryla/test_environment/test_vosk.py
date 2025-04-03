from vosk import Model, KaldiRecognizer
import wave
import json

VOSK_MODEL_PATH = r"C:\Users\DAN\OneDrive\Desktop\Git Up\Project-MWS-01\Ryla\vosk-model-small-fr-0.22"  # Adjust path if needed

model = Model(VOSK_MODEL_PATH)
recognizer = KaldiRecognizer(model, 16000)

with wave.open("fixed_test.wav", "rb") as wf:  # Use an actual recorded file from your app
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        recognizer.AcceptWaveform(data)

    result = json.loads(recognizer.FinalResult())
    print("Transcription:", result.get("text", "No transcription received"))
