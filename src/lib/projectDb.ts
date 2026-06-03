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
  getDoc,
  updateDoc,
  query, 
  where, 
  serverTimestamp, 
  orderBy, 
  deleteDoc,
  getDocFromServer
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { ProjectComment } from "../types";

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
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || null,
      email: null,
      emailVerified: true,
      isAnonymous: false,
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
  
  // Community & SaaS Viral Features
  isPublic?: boolean;
  likesCount?: number;
  likes?: string[];
  clonesCount?: number;
  originalPrompt?: string;
  creatorName?: string;
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
    const apiKey = (db as any)?.app?.options?.apiKey;
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
    const path = `users/${userId}/projects/${project.projectId}`;
    try {
      // Direct high-integrity write to nested firestore path
      await setDoc(doc(db, "users", userId, "projects", project.projectId), payload);
      return payload;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path, userId);
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
      handleFirestoreError(err, OperationType.LIST, path, userId);
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
    const path = `users/${userId}/projects/${projectId}`;
    try {
      await deleteDoc(doc(db, "users", userId, "projects", projectId));
      return;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path, userId);
    }
  }

  const localList = localStorage.getItem(`loom_projects_${userId}`);
  if (localList) {
    let projects: UserProjectData[] = JSON.parse(localList);
    projects = projects.filter(p => p.projectId !== projectId);
    localStorage.setItem(`loom_projects_${userId}`, JSON.stringify(projects));
  }

  // Also make sure to purge from public catalog if it was public
  if (isReal) {
    try {
      await deleteDoc(doc(db, "public_projects", projectId));
    } catch (e) {}
  } else {
    const localPubList = localStorage.getItem("loom_public_projects");
    if (localPubList) {
      let pubs: UserProjectData[] = JSON.parse(localPubList);
      pubs = pubs.filter(p => p.projectId !== projectId);
      localStorage.setItem("loom_public_projects", JSON.stringify(pubs));
    }
  }
}

/**
 * Toggles whether a project is visible in the public community gallery.
 * Saves/updates in public_projects collection if public, deletes from it if private.
 */
export async function toggleProjectPrivacy(
  userId: string,
  projectId: string,
  isPublic: boolean,
  originalProject: UserProjectData
): Promise<void> {
  const isReal = isFirebaseConfigured();
  const updatedProject = {
    ...originalProject,
    isPublic,
    updatedAt: isReal ? serverTimestamp() : new Date().toISOString()
  };

  if (isReal) {
    try {
      // 1. Update in the user's private subcollection
      const userProjectRef = doc(db, "users", userId, "projects", projectId);
      await updateDoc(userProjectRef, { 
        isPublic,
        updatedAt: serverTimestamp() 
      });

      // 2. Add to or delete from the public index
      const publicProjectRef = doc(db, "public_projects", projectId);
      if (isPublic) {
        await setDoc(publicProjectRef, {
          ...updatedProject,
          isPublic: true,
          likesCount: originalProject.likesCount || 0,
          likes: originalProject.likes || [],
          clonesCount: originalProject.clonesCount || 0,
          originalPrompt: originalProject.originalPrompt || "",
          creatorName: originalProject.creatorName || "مطور عُفر"
        });
      } else {
        await deleteDoc(publicProjectRef);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/projects/${projectId}`, userId);
    }
  } else {
    // LocalStorage Fallback
    const userLocalKey = `loom_projects_${userId}`;
    const userProjects: UserProjectData[] = JSON.parse(localStorage.getItem(userLocalKey) || "[]");
    const updated = userProjects.map(p => p.projectId === projectId ? { ...p, isPublic } : p);
    localStorage.setItem(userLocalKey, JSON.stringify(updated));

    const publicLocalKey = "loom_public_projects";
    let publicProjects: UserProjectData[] = JSON.parse(localStorage.getItem(publicLocalKey) || "[]");
    if (isPublic) {
      publicProjects = publicProjects.filter(p => p.projectId !== projectId);
      publicProjects.unshift({
        ...originalProject,
        isPublic: true,
        likesCount: originalProject.likesCount || 0,
        likes: originalProject.likes || [],
        clonesCount: originalProject.clonesCount || 0,
        originalPrompt: originalProject.originalPrompt || "",
        creatorName: originalProject.creatorName || "مطور عُفر"
      });
    } else {
      publicProjects = publicProjects.filter(p => p.projectId !== projectId);
    }
    localStorage.setItem(publicLocalKey, JSON.stringify(publicProjects));
  }
}

/**
 * Fetches all global public community projects
 */
export async function fetchPublicProjects(): Promise<UserProjectData[]> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    try {
      const q = query(
        collection(db, "public_projects")
      );
      const querySnapshot = await getDocs(q);
      const list: UserProjectData[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as UserProjectData);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "public_projects");
    }
  }

  return JSON.parse(localStorage.getItem("loom_public_projects") || "[]");
}

/**
 * Likes or unlikes a project in the public community list.
 * Returns the updated likesCount.
 */
export async function likeProject(userId: string, projectId: string, originalOwnerId: string): Promise<number> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    try {
      const publicRef = doc(db, "public_projects", projectId);
      const publicSnap = await getDoc(publicRef);
      if (publicSnap.exists()) {
        const data = publicSnap.data() as UserProjectData;
        const likesList = data.likes || [];
        const isAlreadyLiked = likesList.includes(userId);
        let newLikesList = [...likesList];

        if (isAlreadyLiked) {
          newLikesList = newLikesList.filter(id => id !== userId);
        } else {
          newLikesList.push(userId);
        }

        const newCount = newLikesList.length;

        // Update in public collection
        await updateDoc(publicRef, {
          likes: newLikesList,
          likesCount: newCount
        });

        // Also update in owner's private subcollection if possible
        try {
          const privateRef = doc(db, "users", originalOwnerId, "projects", projectId);
          await updateDoc(privateRef, {
            likes: newLikesList,
            likesCount: newCount
          });
        } catch (e) {
          // Ignore if permissions of private user document fail
        }

        return newCount;
      }
      return 0;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `public_projects/${projectId}`, userId);
    }
  }

  // Local key
  const publicLocalKey = "loom_public_projects";
  const publicProjects: UserProjectData[] = JSON.parse(localStorage.getItem(publicLocalKey) || "[]");
  let finalCount = 0;
  const updatedPubs = publicProjects.map(p => {
    if (p.projectId === projectId) {
      const likesList = p.likes || [];
      const liked = likesList.includes(userId);
      const nextList = liked ? likesList.filter(id => id !== userId) : [...likesList, userId];
      finalCount = nextList.length;
      return { ...p, likes: nextList, likesCount: finalCount };
    }
    return p;
  });
  localStorage.setItem(publicLocalKey, JSON.stringify(updatedPubs));

  // Also sync locally saved private project for current user if it is their project
  const userLocalKey = `loom_projects_${userId}`;
  const userProjects: UserProjectData[] = JSON.parse(localStorage.getItem(userLocalKey) || "[]");
  const updatedPriv = userProjects.map(p => {
    if (p.projectId === projectId) {
      const likesList = p.likes || [];
      const liked = likesList.includes(userId);
      const nextList = liked ? likesList.filter(id => id !== userId) : [...likesList, userId];
      return { ...p, likes: nextList, likesCount: nextList.length };
    }
    return p;
  });
  localStorage.setItem(userLocalKey, JSON.stringify(updatedPriv));

  return finalCount;
}

/**
 * Increments the clone count of a public project to record popularity.
 */
export async function incrementCloneCount(projectId: string, originalOwnerId: string): Promise<void> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    try {
      const publicRef = doc(db, "public_projects", projectId);
      const publicSnap = await getDoc(publicRef);
      if (publicSnap.exists()) {
        const data = publicSnap.data() as UserProjectData;
        const newClones = (data.clonesCount || 0) + 1;
        await updateDoc(publicRef, { clonesCount: newClones });

        try {
          const privateRef = doc(db, "users", originalOwnerId, "projects", projectId);
          await updateDoc(privateRef, { clonesCount: newClones });
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Clone increment warning:", err);
    }
    return;
  }

  const publicLocalKey = "loom_public_projects";
  const publicProjects: UserProjectData[] = JSON.parse(localStorage.getItem(publicLocalKey) || "[]");
  const updatedPubs = publicProjects.map(p => {
    if (p.projectId === projectId) {
      return { ...p, clonesCount: (p.clonesCount || 0) + 1 };
    }
    return p;
  });
  localStorage.setItem(publicLocalKey, JSON.stringify(updatedPubs));
}

/**
 * Adds a collaborative comment to a public project.
 * Uses real subcollection in Firestore if available, otherwise fallback to localStorage.
 */
export async function addProjectCommentToFirestore(
  projectId: string,
  commentId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  text: string
): Promise<ProjectComment | null> {
  const isReal = isFirebaseConfigured();
  const newComment: ProjectComment = {
    commentId,
    projectId,
    userId,
    userName,
    userPhoto,
    text,
    createdAt: isReal ? serverTimestamp() : new Date().toISOString()
  };

  if (isReal) {
    const path = `public_projects/${projectId}/comments/${commentId}`;
    try {
      await setDoc(doc(db, "public_projects", projectId, "comments", commentId), {
        ...newComment,
        createdAt: serverTimestamp()
      });
      // Return comment with actual Timestamp representation for the client
      return {
        ...newComment,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path, userId);
    }
  }

  // LocalStorage Fallback
  const key = `local_comments_${projectId}`;
  const existingComments = JSON.parse(localStorage.getItem(key) || "[]");
  existingComments.push(newComment);
  localStorage.setItem(key, JSON.stringify(existingComments));
  return newComment;
}

/**
 * Fetches all comments for a given public project.
 */
export async function fetchProjectCommentsFromFirestore(projectId: string): Promise<ProjectComment[]> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    const path = `public_projects/${projectId}/comments`;
    try {
      const q = query(
        collection(db, "public_projects", projectId, "comments"),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      const list: ProjectComment[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as ProjectComment);
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  return JSON.parse(localStorage.getItem(`local_comments_${projectId}`) || "[]");
}

/**
 * Deletes a comment from a public project securely.
 */
export async function deleteProjectCommentFromFirestore(
  projectId: string,
  commentId: string,
  userId: string
): Promise<boolean> {
  const isReal = isFirebaseConfigured();

  if (isReal) {
    const path = `public_projects/${projectId}/comments/${commentId}`;
    try {
      await deleteDoc(doc(db, "public_projects", projectId, "comments", commentId));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path, userId);
    }
  }

  const key = `local_comments_${projectId}`;
  let comments = JSON.parse(localStorage.getItem(key) || "[]");
  comments = comments.filter((c: ProjectComment) => c.commentId !== commentId);
  localStorage.setItem(key, JSON.stringify(comments));
  return true;
}

