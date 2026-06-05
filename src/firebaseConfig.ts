/**
 * @file firebaseConfig.ts
 * @description Firebase SDK initialization for LoomHost AI / Omar AI.
 * Users can update the values here or populate them via env variables.
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import appletConfig from "../firebase-applet-config.json";

// We prioritize the environment variables and fallback to local metadata/hardcoded defaults for loomhost-ai
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "AIzaSyBNxUaEJGy1MI6ZdeMWM8KvBbD8pI03XxU",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "loomhost-ai.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "loomhost-ai",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "loomhost-ai.firebasestorage.app",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "1042530707945",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || appletConfig.appId || "1:1042530707945:web:56741d40058577455ec378",
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || "G-LPK0E04GZZ"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// If VITE_FIREBASE_DATABASE_ID is explicitly set, or fallback to the applet database ID.
// For standard Firebase projects using the default instance, we can configure without specifying a database ID.
const dbId = (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || appletConfig.firestoreDatabaseId;

export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);
export const auth = getAuth(app);

export default app;
