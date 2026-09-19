import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const env = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) ? import.meta.env : ({} as any);

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAosm8TMAw0Mjqs_Rtzi4ezCFoJosDWPYU",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "portfoliohubs-8d806.firebaseapp.com",
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || "https://portfoliohubs-8d806-default-rtdb.firebaseio.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "portfoliohubs-8d806",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "portfoliohubs-8d806.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1036205184140",
  appId: env.VITE_FIREBASE_APP_ID || "1:1036205184140:web:005e74a6e1d5e3d4ef97a9",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || "G-Z7R1Q31W52"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Analytics safely (supported only in client browser environments)
let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {
    // Analytics initialization failed or unsupported in this environment
  });
}

// Prevent Firebase Storage SDK from retrying failed uploads for minutes
try {
  storage.maxUploadRetryTime = 6000;
  storage.maxOperationRetryTime = 6000;
} catch {
  // Ignore in environments where storage properties are read-only
}

export { app, auth, db, storage, analytics };
