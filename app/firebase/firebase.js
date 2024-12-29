import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAZa-4_hE28MzOYp3STMZlIdVU4IXVJbOw",
  authDomain: "rylang-c9742.firebaseapp.com",
  projectId: "rylang-c9742",
  storageBucket: "rylang-c9742.firebasestorage.app",
  messagingSenderId: "106165605904",
  appId: "1:106165605904:web:82494dd7947fa3dbc99c95",
  measurementId: "G-YW6HDE23G1"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);