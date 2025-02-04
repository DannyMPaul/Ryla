from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Loading the tokenizer and model
tokenizer = AutoTokenizer.from_pretrained("samadpls/t5-base-grammar-checker")
model = AutoModelForSeq2SeqLM.from_pretrained("samadpls/t5-base-grammar-checker")

print("Model processing and load : Success...")

def grammar_correction(input_text):
    # Corrects the grammar of the input text or indicates if it's correct.

    # Add the "grammar:" prefix required by the model
    input_text = "grammar: " + input_text

    # IP is tokenised and encoded
    input_ids = tokenizer.encode(input_text, return_tensors="pt")

    # OP generated
    outputs = model.generate(input_ids, max_length=128, num_beams=4, early_stopping=True)

    # Generated text is decoded
    corrected_text = tokenizer.decode(outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)

    # Compares Generated text and Original text
    if corrected_text.strip() == input_text[len("grammar: "):].strip():
        return "Grammar correct"
    else:
        return corrected_text

if __name__ == "__main__":
    print("Grammar Bot is ready!")

    while True:
        # User IP
        user_input = input("You: ")
        if user_input.lower() == "exit":
            print("Bot: Goodbye!")
            break

        # Response of grammar stats
        response = grammar_correction(user_input)
        print(f"Bot: {response}")
