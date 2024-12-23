from src.ryla import RylaAssistant

def main():
    try:
        ryla = RylaAssistant()
        ryla.run()
    except Exception as e:
        print(f"Failed to initialize Ryla: {e}")

if __name__ == "__main__":
    main()