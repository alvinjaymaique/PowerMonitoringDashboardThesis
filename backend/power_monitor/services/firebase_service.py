import os
import firebase_admin
from firebase_admin import credentials, firestore

class FirebaseService:
    _instance = None  # Singleton instance

    def __new__(cls):
        """Ensures only one instance of FirebaseService exists."""
        if cls._instance is None:
            cls._instance = super(FirebaseService, cls).__new__(cls)
            cls._instance.initialize()
        return cls._instance

    def initialize(self):
        """Initialize Firebase."""
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        FIREBASE_CRED_PATH = os.path.join(BASE_DIR, 'firebase', 'your-firebase-key.json')

        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_CRED_PATH)
            firebase_admin.initialize_app(cred)

        self.db = firestore.client()

    def get_collection(self, collection_name):
        """Fetch all documents from a collection."""
        collection_ref = self.db.collection(collection_name)
        return [doc.to_dict() for doc in collection_ref.stream()]
