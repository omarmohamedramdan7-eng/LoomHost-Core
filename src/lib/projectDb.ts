/**
 * @file projectDb.ts
 * @description Secure data bridge for LoomHost AI / Omar AI. Handles real Firestore queries
 * mapping userIds to projects, and falls back gracefully to localStorage when keys are unconfigured.
 */

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  orderBy, 
  deleteDoc,
  getDocFromServer
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

// Operation Enum for system-skill diagnostics
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

/**
 * Diagnostic error wrapper required by system guidelines to log precise context on permission / quota errors
 */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('[Firestore Error Diagnostic]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserProjectData {
  projectId: string;
  userId: string;
  name: string;
  description: string;
  html: string;
  css: string;
  js: string;
  updatesCount: number;
  visitorsCount: number;
  isPublished: boolean;
  publishedUrl: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Utility to verify if real Firebase configuration has been customized by the developer
 */
export function isFirebaseConfigured(): boolean {
  try {
    const fromEnv = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
    if (fromEnv && fromEnv !== "YOUR_API_KEY_HERE" && fromEnv.length > 5) {
      return true;
    }
  } catch (e) {}
  
  try {
    const apiKey = auth?.app?.options?.apiKey;
    if (apiKey && apiKey !== "YOUR_API_KEY_HERE" && !apiKey.includes("Placeholder") && apiKey.length > 5) {
      return true;
    }
  } catch (e) {}
  
  return false;
}

/**
 * FEATURE C: saveProjectToFirestore
 * Writes a generated web design project data to user specific nested collection users/{userId}/projects/{projectId}
 */
export async function saveProjectToFirestore(
  userId: string,
  project: Omit<UserProjectData, "userId" | "createdAt" | "updatedAt">
): Promise<UserProjectData> {
  const isReal = isFirebaseConfigured();
  
  const payload: UserProjectData = {
    ...project,
    userId,
    createdAt: isReal ? serverTimestamp() : new Date().toISOString(),
    updatedAt: isReal ? serverTimestamp() : new Date().toISOString()
  };

  if (isReal) {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("انتهاك أمان عزل البيانات: لا يُسمح بالوصول لقاعدة البيانات لغير صاحب الهوية النشطة وبشكل معزول.");
    }

    const path = `users/${userId}/projects/${project.projectId}`;
    try {
      // Direct high-integrity write to nested firestore path
      await setDoc(doc(db, "users", userId, "projects", project.projectId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // Dual persistence offline fallback to ensure absolute uptime & flawless previews
  const localList = localStorage.getItem(`loom_projects_${userId}`);
  let projects: UserProjectData[] = localList ? JSON.parse(localList) : [];
  
  // Filter out preexisting project ID if updating
  projects = projects.filter(p => p.projectId !== project.projectId);
  projects.unshift(payload);
  
  localStorage.setItem(`loom_projects_${userId}`, JSON.stringify(projects));
  return payload;
}

/**
 * FEATURE D: fetchProjectsFromFirestore
 * Retrieves all web projects restricted strictly to active logged-in users/{userId}/projects
 */
export async function fetchProjectsFromFirestore(userId: string): Promise<UserProjectData[]> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("انتهاك أمان عزل البيانات: لا يُسمح بالوصول لقاعدة البيانات لغير صاحب الهوية النشطة وبشكل معزول.");
    }

    const path = `users/${userId}/projects`;
    try {
      // Test remote connectivity beforehand
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (e) {}

      const q = query(
        collection(db, "users", userId, "projects")
      );
      
      const querySnapshot = await getDocs(q);
      const list: UserProjectData[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as UserProjectData);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  // Fallback read from localStorage
  const localList = localStorage.getItem(`loom_projects_${userId}`);
  return localList ? JSON.parse(localList) : [];
}

/**
 * Extra capability: deleteProject
 * Easily deletes a project with strict permission checks
 */
export async function deleteProjectFromFirestore(userId: string, projectId: string): Promise<void> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("انتهاك أمان عزل البيانات: لا يُسمح بالوصول لقاعدة البيانات لغير صاحب الهوية النشطة وبشكل معزول.");
    }

    const path = `users/${userId}/projects/${projectId}`;
    try {
      await deleteDoc(doc(db, "users", userId, "projects", projectId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  const localList = localStorage.getItem(`loom_projects_${userId}`);
  if (localList) {
    let projects: UserProjectData[] = JSON.parse(localList);
    projects = projects.filter(p => p.projectId !== projectId);
    localStorage.setItem(`loom_projects_${userId}`, JSON.stringify(projects));
  }
}
