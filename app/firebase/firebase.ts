import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBHC5tZP6ojRJifuEqYFnKKy86Ji1qGZMw",
  authDomain: "rylaang-64c80.firebaseapp.com",
  databaseURL: "https://rylaang-64c80-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rylaang-64c80",
  storageBucket: "rylaang-64c80.firebasestorage.app",
  messagingSenderId: "888934332474",
  appId: "1:888934332474:web:68d1dfc2b6e61a3304dd03",
  measurementId: "G-28Y7281B9H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

export { app, auth, database, storage };

// Add default export to fix warning
export default { app, auth, database, storage };
