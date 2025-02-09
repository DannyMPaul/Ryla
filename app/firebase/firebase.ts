import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

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

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services
const auth = getAuth(app);
const database = getDatabase(app);

// Initialize analytics only in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, auth, database, analytics };
