import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIk2DNHfsjc6wnOKZePobT2920henqVJc",
  authDomain: "pixel-leadflow.firebaseapp.com",
  projectId: "pixel-leadflow",
  storageBucket: "pixel-leadflow.firebasestorage.app",
  messagingSenderId: "273686951001",
  appId: "1:273686951001:web:f884067e647e4c30e2ad48",
  measurementId: "G-5SQ9XQH6WB"
};

// Initialize Firebase app (check if already initialized for Next.js hot-reloading)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Customize Google provider settings
googleProvider.setCustomParameters({ prompt: "select_account" });

export { app, auth, db, googleProvider };
