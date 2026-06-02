/**
 * @file firebaseConfig.ts
 * @description Firebase SDK initialization for LoomHost AI / Omar AI.
 * Users can update the values here or populate them via env variables.
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import appletConfig from "../firebase-applet-config.json";

// We combine both the automatically provisioned applet config and Vite environment overrides
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "YOUR_API_KEY_HERE",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "YOUR_AUTH_DOMAIN_HERE",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "YOUR_PROJECT_ID_HERE",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "YOUR_MESSAGING_SENDER_ID_HERE",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || appletConfig.appId || "YOUR_APP_ID_HERE"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication & export
export const auth = getAuth(app);

// Initialize Google Auth Provider & export
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore & export
// CRITICAL: The app will fail to communicate if we do not specify the correct database ID (e.g. enterprise instance id)
const dbId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;
export const db = getFirestore(app, dbId);

export default app;
