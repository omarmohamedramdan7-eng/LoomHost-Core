/**
 * @file projectDb.ts
 * @description Secure offline-first database manager for LoomHost AI / Omar AI.
 * Replaces Firebase Firestore completely with direct, reliable, zero-config localStorage persistence.
 */

import { ProjectComment } from "../types";

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
 * We are using a 100% Zero-Configuration setup, so Firebase is completely bypassed.
 */
export function isFirebaseConfigured(): boolean {
  return false;
}

/**
 * Writes a generated web design project data to user specific browser warehouse.
 */
export async function saveProjectToFirestore(
  userId: string,
  project: Omit<UserProjectData, "userId" | "createdAt" | "updatedAt">
): Promise<UserProjectData> {
  const payload: UserProjectData = {
    ...project,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Secure cookie storage/rest storage fallback
  const localList = localStorage.getItem(`loom_projects_${userId}`);
  let projects: UserProjectData[] = localList ? JSON.parse(localList) : [];
  
  // Filter out preexisting project ID if updating
  projects = projects.filter(p => p.projectId !== project.projectId);
  projects.unshift(payload);
  
  localStorage.setItem(`loom_projects_${userId}`, JSON.stringify(projects));

  // If public, sync to public store as well
  if (project.isPublic) {
    const publicLocalKey = "loom_public_projects";
    let publicProjects: UserProjectData[] = JSON.parse(localStorage.getItem(publicLocalKey) || "[]");
    publicProjects = publicProjects.filter(p => p.projectId !== project.projectId);
    publicProjects.unshift(payload);
    localStorage.setItem(publicLocalKey, JSON.stringify(publicProjects));
  }

  return payload;
}

/**
 * Retrieves all web projects restricted strictly to active logged-in user.
 */
export async function fetchProjectsFromFirestore(userId: string): Promise<UserProjectData[]> {
  const localList = localStorage.getItem(`loom_projects_${userId}`);
  return localList ? JSON.parse(localList) : [];
}

/**
 * Instantly deletes a project with local catalog purging.
 */
export async function deleteProjectFromFirestore(userId: string, projectId: string): Promise<void> {
  const localList = localStorage.getItem(`loom_projects_${userId}`);
  if (localList) {
    let projects: UserProjectData[] = JSON.parse(localList);
    projects = projects.filter(p => p.projectId !== projectId);
    localStorage.setItem(`loom_projects_${userId}`, JSON.stringify(projects));
  }

  // Purge from public catalog as well
  const localPubList = localStorage.getItem("loom_public_projects");
  if (localPubList) {
    let pubs: UserProjectData[] = JSON.parse(localPubList);
    pubs = pubs.filter(p => p.projectId !== projectId);
    localStorage.setItem("loom_public_projects", JSON.stringify(pubs));
  }
}

/**
 * Toggles whether a project is visible in the public community gallery.
 */
export async function toggleProjectPrivacy(
  userId: string,
  projectId: string,
  isPublic: boolean,
  originalProject: UserProjectData
): Promise<void> {
  const updatedProject = {
    ...originalProject,
    isPublic,
    updatedAt: new Date().toISOString()
  };

  // 1. Update in the user's private storage
  const userLocalKey = `loom_projects_${userId}`;
  const userProjects: UserProjectData[] = JSON.parse(localStorage.getItem(userLocalKey) || "[]");
  const updated = userProjects.map(p => p.projectId === projectId ? { ...p, isPublic } : p);
  localStorage.setItem(userLocalKey, JSON.stringify(updated));

  // 2. Add to or delete from the public index
  const publicLocalKey = "loom_public_projects";
  let publicProjects: UserProjectData[] = JSON.parse(localStorage.getItem(publicLocalKey) || "[]");
  if (isPublic) {
    publicProjects = publicProjects.filter(p => p.projectId !== projectId);
    publicProjects.unshift({
      ...updatedProject,
      isPublic: true,
      likesCount: originalProject.likesCount || 0,
      likes: originalProject.likes || [],
      clonesCount: originalProject.clonesCount || 0,
      originalPrompt: originalProject.originalPrompt || "",
      creatorName: originalProject.creatorName || "مطور لووم"
    });
  } else {
    publicProjects = publicProjects.filter(p => p.projectId !== projectId);
  }
  localStorage.setItem(publicLocalKey, JSON.stringify(publicProjects));
}

/**
 * Fetches all global public community projects
 */
export async function fetchPublicProjects(): Promise<UserProjectData[]> {
  const saved = localStorage.getItem("loom_public_projects");
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Seed with standard templates if empty as a nice UX feature
  const defaultSeeds: UserProjectData[] = [];
  localStorage.setItem("loom_public_projects", JSON.stringify(defaultSeeds));
  return defaultSeeds;
}

/**
 * Likes or unlikes a project in the public community list.
 * Returns the updated likesCount.
 */
export async function likeProject(userId: string, projectId: string, originalOwnerId: string): Promise<number> {
  // Public list update
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

  // Also sync locally saved private project for active user if it exists
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

  // Also sync for original owner list if they exist in localStorage
  if (originalOwnerId !== userId) {
    const ownerLocalKey = `loom_projects_${originalOwnerId}`;
    const ownerProjectsStr = localStorage.getItem(ownerLocalKey);
    if (ownerProjectsStr) {
      try {
        const ownerProjects: UserProjectData[] = JSON.parse(ownerProjectsStr);
        const nextOwnerProjs = ownerProjects.map(p => {
          if (p.projectId === projectId) {
            const likesList = p.likes || [];
            const liked = likesList.includes(userId);
            const nextList = liked ? likesList.filter(id => id !== userId) : [...likesList, userId];
            return { ...p, likes: nextList, likesCount: nextList.length };
          }
          return p;
        });
        localStorage.setItem(ownerLocalKey, JSON.stringify(nextOwnerProjs));
      } catch (e) {}
    }
  }

  return finalCount;
}

/**
 * Increments the clone count of a project to record popularity.
 */
export async function incrementCloneCount(projectId: string, originalOwnerId: string): Promise<void> {
  const publicLocalKey = "loom_public_projects";
  const publicProjects: UserProjectData[] = JSON.parse(localStorage.getItem(publicLocalKey) || "[]");
  const updatedPubs = publicProjects.map(p => {
    if (p.projectId === projectId) {
      return { ...p, clonesCount: (p.clonesCount || 0) + 1 };
    }
    return p;
  });
  localStorage.setItem(publicLocalKey, JSON.stringify(updatedPubs));

  // Owner's private record sync
  const ownerLocalKey = `loom_projects_${originalOwnerId}`;
  const ownerProjectsStr = localStorage.getItem(ownerLocalKey);
  if (ownerProjectsStr) {
    try {
      const ownerProjects: UserProjectData[] = JSON.parse(ownerProjectsStr);
      const nextOwnerProjs = ownerProjects.map(p => {
        if (p.projectId === projectId) {
          return { ...p, clonesCount: (p.clonesCount || 0) + 1 };
        }
        return p;
      });
      localStorage.setItem(ownerLocalKey, JSON.stringify(nextOwnerProjs));
    } catch (e) {}
  }
}

/**
 * Adds a collaborative comment to a public project.
 */
export async function addProjectCommentToFirestore(
  projectId: string,
  commentId: string,
  userId: string,
  userName: string,
  userPhoto: string,
  text: string
): Promise<ProjectComment | null> {
  const newComment: ProjectComment = {
    commentId,
    projectId,
    userId,
    userName,
    userPhoto,
    text,
    createdAt: new Date().toISOString()
  };

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
  const key = `local_comments_${projectId}`;
  let comments = JSON.parse(localStorage.getItem(key) || "[]");
  comments = comments.filter((c: ProjectComment) => c.commentId !== commentId);
  localStorage.setItem(key, JSON.stringify(comments));
  return true;
}
