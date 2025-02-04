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
