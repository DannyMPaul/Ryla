------------ALL OF THE BELOW CODES ARE TO BE RUN ON THE TERMINAL------------------

#VM for windows
python -m venv ryla_env

#Activate VM for windows
ryla_env\Scripts\activate

#Open ryla folder
cd Ryla

#Install requirement
pip install -r requirements.txt

#Execute backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000