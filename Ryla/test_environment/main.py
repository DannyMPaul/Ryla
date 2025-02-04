from src.fr_ryla import RylaAssistant

def main():
    try:
        # database_url="https://rylang-c9742-default-rtdb.asia-southeast1.firebasedatabase.app/" #RTDB connection

        # firebase_key_path = r"C:\Users\DAN\OneDrive\Desktop\Ryla\Firebase_connection.json" #Normal DB connection
        # user_id = input("Enter your user ID: ")
        # assistant = RylaAssistant(firebase_key_path,database_url)
        # assistant.run(user_id)

        assistant = RylaAssistant()
        assistant.run()

    except Exception as e:
        print(f"Failed to initialize Ryla: {e}")

if __name__ == "__main__":
    main()