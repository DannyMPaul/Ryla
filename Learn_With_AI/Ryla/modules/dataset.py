'''
FOR THE CHATBOT
'''

##LOADING DATASETS
from datasets import load_dataset

# Load a dataset (replace with your desired dataset)
dataset = load_dataset("daily_dialog")

##PREPROCESSING DATASETS
from transformers import BlenderbotTokenizer

# Initialize tokenizer
model_name = "facebook/blenderbot-400M-distill"
tokenizer = BlenderbotTokenizer.from_pretrained(model_name)

# Tokenize the dataset
def preprocess_function(examples):
    inputs = examples["dialog"]  # Replace "dialog" with the appropriate column
    model_inputs = tokenizer(inputs, max_length=128, truncation=True, padding="max_length")
    return model_inputs

# Apply preprocessing
tokenized_dataset = dataset.map(preprocess_function, batched=True)

##PREPARING FOR TRAINING
# Split dataset
train_dataset = tokenized_dataset["train"]
val_dataset = tokenized_dataset["validation"]

from transformers import DataCollatorForSeq2Seq

# Data collator for dynamic padding
data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model_name)

##LOADING THE MODEL
from transformers import DataCollatorForSeq2Seq

# Data collator for dynamic padding
data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model_name)


##SETTING UP TRAINING
from transformers import TrainingArguments

training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    learning_rate=5e-5,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    weight_decay=0.01,
    save_total_limit=2,
    predict_with_generate=True,
    logging_dir="./logs",
    logging_steps=10,
)


##TRAINING THE MODEL
from transformers import Trainer

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=val_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator,
)

# Start training
trainer.train()

##EVALUATION
# Evaluate
trainer.evaluate()

# Save the model
model.save_pretrained("./trained_blenderbot")
tokenizer.save_pretrained("./trained_blenderbot")


'''
FOR THE GRAMMAR CORRECTION
'''
##Configuration (utils/config.py)
# utils/config.py

MODEL_NAME = "t5-base"  # Pre-trained T5 model
DATASET_NAME = "jfleg"  # Example dataset for grammar correction
BATCH_SIZE = 8
EPOCHS = 3
OUTPUT_DIR = "./saved_model"


## Data Preprocessing (data/preprocess.py)
# data/preprocess.py

from datasets import load_dataset
from transformers import T5Tokenizer

def preprocess_data():
    tokenizer = T5Tokenizer.from_pretrained("t5-base")
    dataset = load_dataset("jfleg")  # Example dataset for grammar correction

    def preprocess_function(examples):
        inputs = ["correct grammar: " + sentence for sentence in examples["sentence"]]
        targets = examples["corrected"]
        model_inputs = tokenizer(inputs, max_length=128, truncation=True, padding="max_length")
        labels = tokenizer(targets, max_length=128, truncation=True, padding="max_length").input_ids
        model_inputs["labels"] = labels
        return model_inputs

    tokenized_datasets = dataset.map(preprocess_function, batched=True)
    return tokenized_datasets["train"], tokenized_datasets["validation"]


##Model Training (models/train.py)
# models/train.py

from transformers import T5ForConditionalGeneration, Seq2SeqTrainer, Seq2SeqTrainingArguments

def train_model(train_dataset, val_dataset):
    model = T5ForConditionalGeneration.from_pretrained("t5-base")

    training_args = Seq2SeqTrainingArguments(
        output_dir="./results",
        evaluation_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        num_train_epochs=3,
        weight_decay=0.01,
        save_total_limit=3,
        predict_with_generate=True,
        logging_dir="./logs",
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
    )

    trainer.train()
    model.save_pretrained("./saved_model")


##Model Evaluation (models/evaluate.py)
# models/evaluate.py

from transformers import T5ForConditionalGeneration, T5Tokenizer

def evaluate_model():
    tokenizer = T5Tokenizer.from_pretrained("t5-base")
    model = T5ForConditionalGeneration.from_pretrained("./saved_model")

    test_sentences = [
        "This are a example sentence.",
        "She do not went to school yesterday."
    ]
    inputs = tokenizer(["correct grammar: " + sentence for sentence in test_sentences], return_tensors="pt", padding=True)
    outputs = model.generate(inputs["input_ids"], max_length=128)

    corrected_sentences = [tokenizer.decode(output, skip_special_tokens=True) for output in outputs]
    for original, corrected in zip(test_sentences, corrected_sentences):
        print(f"Original: {original}")
        print(f"Corrected: {corrected}")


##. Main Script (main.py)
# main.py

from data.preprocess import preprocess_data
from models.train import train_model
from models.evaluate import evaluate_model

def main():
    # Step 1: Preprocess the data
    train_dataset, val_dataset = preprocess_data()

    # Step 2: Train the model
    train_model(train_dataset, val_dataset)

    # Step 3: Evaluate the model
    evaluate_model()

if __name__ == "__main__":
    main()
