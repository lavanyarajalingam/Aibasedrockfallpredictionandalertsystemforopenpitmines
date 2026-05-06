// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';  // ← ADD THIS
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyA8d-A_L-HMxCYlhsP4eHloGqml8bjOJQY",
  authDomain: "mineguard-ai-cb181.firebaseapp.com",
  databaseURL: "https://mineguard-ai-cb181-default-rtdb.firebaseio.com",
  projectId: "mineguard-ai-cb181",
  storageBucket: "mineguard-ai-cb181.firebasestorage.app",
  messagingSenderId: "122920110480",
  appId: "1:122920110480:web:4c8ee47a52466fd0954b15"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);        // ← ADD THIS
export const database = getDatabase(app);
export default app;