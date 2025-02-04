##. Main Script (main.py)
# main.py

from data.preprocess import preprocess_data
from models.train import train_model
from models.evaluate import evaluate_model

def main_train():
    # Step 1: Preprocess the data
    train_dataset, val_dataset = preprocess_data()

    # Step 2: Train the model
    train_model(train_dataset, val_dataset)

    # Step 3: Evaluate the model
    evaluate_model()

if __name__ == "__main__":
    main_train()
