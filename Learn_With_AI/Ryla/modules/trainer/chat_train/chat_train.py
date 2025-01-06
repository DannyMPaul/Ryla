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