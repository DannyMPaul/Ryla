import pandas as pd

# Define data
data = {
    "input_text": [
        "How are you doing?",
        "I has a apple.",
        "What is your favorite color?",
        "She don't likes the movie.",
        "Where can I find a good book?",
        "She don't like apples.",
        "He go to school everyday.",
        "The cat was sat on the mat.",
        "I am agree with you.",
        "He don't knows the answer.",
        "I has too many books to read.",
        "She didn't told me about it.",
        "You was right all along.",
        "We is going to the park later.",
        "He don't like pizza."
    ],
    "output_text": [
        "Conversational: I'm doing well, thank you! How about you? Correction: *N/A*",
        "Conversational: I see you like apples! Correction: I have an apple.",
        "Conversational: My favorite color is blue. What's yours? Correction: *N/A*",
        "Conversational: That's okay, not everyone likes movies. Correction: She doesn't like the movie.",
        "Conversational: You can check the library or online. Correction: *N/A*",
        "Conversational: Why doesn't she like apples? Correction: She doesn't like apples",
        "Conversational: What time does he go to school? Correction: He goes to school every day",
        "Conversational: How long was it sitting there? Correction: The cat was sitting on the mat",
        "Conversational: That's great, do you have more thoughts Correction: I agree with you.",
        "Conversational: Maybe he just needs more time. Correction: He doesn't know the answer",
        "Conversational: I'm doing well, thank you! How about you? Correction: I have too many books to read.",
        "Conversational: Did she forget to tell you? Correction: She didn't tell me about it.",
        "Conversational: Were you surprised? What's yours? Correction: You were right all along.",
        "Conversational: Are you excited about it? Correction: We are going to the park later.",
        "Conversational: Does he have a different favorite food? Correction: He doesn't like pizza."
    ]
}

# Create a DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv("autotrain_dataset.csv", index=False)
