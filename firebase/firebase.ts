import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAizBi4X54TLNuv5KwYOv_vxdtKl9vZrA",
  authDomain: "rylang-afb7c.firebaseapp.com",
  databaseURL: "https://rylang-afb7c-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rylang-afb7c",
  storageBucket: "rylang-afb7c.firebasestorage.app",
  messagingSenderId: "1086073935202",
  appId: "1:1086073935202:web:3d531194b4b0f0ef2f883b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);  // Simplified auth initialization
export const database = getDatabase(app);
export { app };
