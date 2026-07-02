import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Credentials loaded dynamically from Vite environment variables (stored securely in .env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBwmm-nDfCZPoKdIrddeUaJHI61ASa0KOc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "creonex-viz.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "creonex-viz",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "creonex-viz.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1030787773238",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1030787773238:web:3bc5f2c517744e01e7f997"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
