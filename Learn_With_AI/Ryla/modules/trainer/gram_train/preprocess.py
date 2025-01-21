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
