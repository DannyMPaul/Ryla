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
