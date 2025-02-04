------------ALL OF THE BELOW CODES ARE TO BE RUN ON TEH TERMINAL------------------

#VM for windows
python -m venv ryla_env

#Activate VM for windows
ryla_env\Scripts\activate

#Install requirement
pip install -r requirements.txt

#TTS engine
pip install pyttsx3

#Execute backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000


#Plan : 
-host the model in google consel
-connect the consel and the firebase
-api key then use sockets

#to do :
-voice recognition model for fr/en {react-native-voice}
