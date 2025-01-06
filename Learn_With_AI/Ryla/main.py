from src.test_ryla import RylaAssistant

def main():
    try:
        firebase_key_path = r"C:\Users\DAN\OneDrive\Desktop\Ryla\Firebase_connection.json"
        user_id = input("Enter your user ID: ")
        assistant = RylaAssistant(firebase_key_path)
        assistant.run(user_id)
    except Exception as e:
        print(f"Failed to initialize Ryla: {e}")

if __name__ == "__main__":
    main()