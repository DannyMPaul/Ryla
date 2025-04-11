import firebase_admin
from firebase_admin import credentials, firestore, db
from google.cloud.firestore_v1.base_query import FieldFilter,Or

cred = credentials.Certificate(r"..\Ryla\Firebase_connection.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

#to get a single doc
def get_doc(doc_ID):
    doc_ref=db.collection('INFO').document(doc_ID)
    print(doc_ref)
    doc=doc_ref.get()
    print(doc)
    if doc.exists:
        return doc.to_dict()
    else: 
        print(f,"Doc '{doc_ID}' not found in '{Coll_name}'.")
        return None

print(get_doc('User_1'))