// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaqtGS9Fjep0aKXJuAV3UI9f02BwkbWM0",
  authDomain: "forge-d4c86.firebaseapp.com",
  projectId: "forge-d4c86",
  storageBucket: "forge-d4c86.firebasestorage.app",
  messagingSenderId: "396125174556",
  appId: "1:396125174556:web:3df372eb8a824384d198d9",
  measurementId: "G-TEV2HNJESN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app; 