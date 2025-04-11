# import firebase_admin
# from firebase_admin import credentials, db

# def initialize_firebase():
#     try:
#         firebase_admin.get_app()
#     except ValueError:
#         cred = credentials.Certificate("..\Ryla\Firebase_connection.json")
#         firebase_admin.initialize_app(cred, {
#             'databaseURL': 'https:'
#         })

import firebase_admin
from firebase_admin import credentials, db

# Initialize Firebase (Ensure your service account JSON is correct)
cred = credentials.Certificate(r"..\Ryla\Firebase_connection.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https:'
})

def fetch_user_data(user_id):
    try:
        # Reference to the user's model_data
        user_ref = db.reference(f'users/{user_id}/model_data')
        
        # Fetch the data
        user_data = user_ref.get()

        if user_data:
            print(f"User Data for {user_id}: {user_data}")
        else:
            print(f"No data found for user {user_id}")

        return user_data
    except Exception as e:
        print(f"Error fetching user data: {e}")
        return None

# 🔹 Test the function with a sample user_id
test_user_id = "1q8TBIfz8HZQJySF3H34VCs31II2"
fetch_user_data(test_user_id)
