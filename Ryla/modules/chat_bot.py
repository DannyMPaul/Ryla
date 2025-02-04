from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration

def chatbot():
    # Base model to be used from HF
    model_name = "facebook/blenderbot-400M-distill"
    
    tokenizer = BlenderbotTokenizer.from_pretrained(model_name)
    
    model = BlenderbotForConditionalGeneration.from_pretrained(model_name)

    print("Model processing complete and loaded successfully!")
    print("Chatbot is ready. Type 'exit' to quit.")
    
    #Conversation Lopp
    while True:
        # User IP
        user_input = input("You: ")
        
        if user_input.lower() == "exit":
            print("Chatbot: Goodbye!")
            break

        # Tokenizing the user IP
        inputs = tokenizer(user_input, return_tensors="pt")
        
        # Generating a response using the model
        reply_ids = model.generate(**inputs)
        
        # Decoding the generated tokens
        reply = tokenizer.decode(reply_ids[0], skip_special_tokens=True)
        
        # Response OP
        print(f"Chatbot: {reply}")

if __name__ == "__main__":
    chatbot()
