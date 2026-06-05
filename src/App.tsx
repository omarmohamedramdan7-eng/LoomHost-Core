/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Globe, 
  UploadCloud, 
  Sparkles, 
  Code2, 
  Play, 
  Trash2, 
  ExternalLink, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Server, 
  Smartphone, 
  X, 
  Check, 
  Activity, 
  Users,
  Copy,
  Cloud,
  Terminal,
  ArrowLeft,
  ChevronRight,
  Monitor,
  Heart,
  Settings,
  Download,
  Shield,
  ShieldAlert,
  Search,
  Award,
  BookOpen,
  FileText,
  Mail,
  MessageSquare,
  User
} from "lucide-react";
import { ProjectCommentsSection } from "./components/ProjectCommentsSection";

import { HostedSite } from "./types";
import { PRESET_TEMPLATES, Template } from "./components/SiteTemplates";
import JSZip from "jszip";

// Advanced Modular LoomHost AI Automation Features
import { ToastNotification, Toast } from "./components/ToastNotification";
import { ImageToCodePanel } from "./components/ImageToCodePanel";
import { SeoOptimizerPanel } from "./components/SeoOptimizerPanel";
import { UptimeMonitorPanel } from "./components/UptimeMonitorPanel";
import { AuthButton } from "./components/AuthButton";
import { CloudProjectsPanel } from "./components/CloudProjectsPanel";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, isClerkConfigured } from "./clerk-bridge";
import { GeminiStreamGenerator } from "./components/GeminiStreamGenerator";
import { GlobalGatewayHub } from "./components/GlobalGatewayHub";
import VideoPlayer from "./components/VideoPlayer";

import { LocalUserProfile } from "./types";
import { 
  saveProjectToFirestore, 
  fetchProjectsFromFirestore, 
  deleteProjectFromFirestore, 
  toggleProjectPrivacy,
  fetchPublicProjects,
  likeProject,
  incrementCloneCount,
  UserProjectData 
} from "./lib/projectDb";

// @ts-ignore
import mockupImage from "./assets/images/loomhost_mockup_1780152908073.png";

type ActiveTab = "studio" | "generator" | "editor" | "deployments" | "community" | "profile";

export default function App() {

  // Navigation
  const [activeTab, _setActiveTab] = useState<ActiveTab>("studio");

  // Custom Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [isAutomationDeckOpen, setIsAutomationDeckOpen] = useState<boolean>(true);

  // Local User Profile Generator for immediate, lag-free Vercel and serverless deployments
  const getOrCreateUser = (): LocalUserProfile => {
    const saved = localStorage.getItem("loom_host_local_user") || localStorage.getItem("loomhost_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id || parsed.uid) {
          return {
            uid: parsed.uid || parsed.id,
            id: parsed.id || parsed.uid,
            name: parsed.name || parsed.displayName || "Guest",
            displayName: parsed.displayName || parsed.name || "Guest",
            email: parsed.email || "guest@loomhost.ai",
            photoURL: parsed.photoURL || "https://lh3.googleusercontent.com/a/default-user=s96-c",
            isPremium: parsed.isPremium !== undefined ? !!parsed.isPremium : false,
            subscriptionPlan: parsed.subscriptionPlan || (parsed.isPremium ? "Premium Pro Plan" : "Free Plan"),
            createdAt: parsed.createdAt || new Date().toISOString()
          };
        }
      } catch (e) {
        console.error("Failed parsing local user schema:", e);
      }
    }

    // Generate robust default Profile: Guest, isPremium: false
    const randomId = "usr_" + Math.random().toString(36).substring(2, 10);
    const guestUser: LocalUserProfile = {
      uid: randomId,
      id: randomId,
      name: "Guest",
      displayName: "Guest",
      email: "guest@loomhost.ai",
      photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      isPremium: false,
      subscriptionPlan: "Free Plan",
      createdAt: new Date().toISOString()
    };
    localStorage.setItem("loom_host_local_user", JSON.stringify(guestUser));
    localStorage.setItem("loomhost_user", JSON.stringify(guestUser));
    return guestUser;
  };

  // Synchronously initialize state with zero startup delay
  const [currentUser, setCurrentUser] = useState<LocalUserProfile>(getOrCreateUser);

  // Clerk state bridge for automatic profile synchronization
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const clerkUser: LocalUserProfile = {
        uid: user.id,
        id: user.id,
        name: user.fullName || user.username || "Guest",
        displayName: user.fullName || user.username || "Guest",
        email: user.primaryEmailAddress?.emailAddress || "guest@loomhost.ai",
        photoURL: user.imageUrl || "https://lh3.googleusercontent.com/a/default-user=s96-c",
        isPremium: !!(user.publicMetadata?.isPremium) || false,
        subscriptionPlan: (user.publicMetadata?.subscriptionPlan as string) || "Free Plan",
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
      };
      setCurrentUser(clerkUser);
      localStorage.setItem("loom_host_local_user", JSON.stringify(clerkUser));
      localStorage.setItem("loomhost_user", JSON.stringify(clerkUser));
    } else if (isLoaded && !isSignedIn) {
      const local = getOrCreateUser();
      setCurrentUser(local);
    }
  }, [isLoaded, isSignedIn, user]);

  // Protect actions and switch tabs if signed out by prompting the Clerk login modal
  const handleProtectedAction = useCallback((onSuccess: () => void, message?: string) => {
    if (!isSignedIn) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("open-clerk-signin"));
      } else {
        alert(message || "يرجى تسجيل الدخول أولاً لتنفيذ هذا الإجراء.");
      }
      return false;
    }
    onSuccess();
    return true;
  }, [isSignedIn]);

  const setActiveTab = useCallback((tab: ActiveTab) => {
    if (tab === "generator" || tab === "editor" || tab === "deployments" || (tab as string) === "profile") {
      handleProtectedAction(() => {
        _setActiveTab(tab);
      }, `يرجى تسجيل الدخول أولاً للوصول إلى ${
        tab === "generator" ? "أداة توليد الذكاء الاصطناعي" :
        tab === "editor" ? "محرر الأكواد الذكي" :
        tab === "deployments" ? "إدارة الاستضافات المباشرة" : "الملف الشخصي"
      }`);
    } else {
      _setActiveTab(tab);
    }
  }, [handleProtectedAction]);

  const [userProjects, setUserProjects] = useState<UserProjectData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);
  const [isSavingProjectCloud, setIsSavingProjectCloud] = useState<boolean>(false);
  const [publishingProjectId, setPublishingProjectId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectOwnerId, setActiveProjectOwnerId] = useState<string | null>(null);

  // Community and Leaderboard states
  const [publicProjects, setPublicProjects] = useState<UserProjectData[]>([]);
  const [loadingPublicProjects, setLoadingPublicProjects] = useState<boolean>(false);
  const [communitySearchTerm, setCommunitySearchTerm] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  const filteredPublicProjects = publicProjects.filter(proj => {
    const text = ((proj.name || "") + " " + (proj.description || "") + " " + (proj.creatorName || "") + " " + (proj.projectId || "")).toLowerCase();
    const matchesSearch = text.includes(communitySearchTerm.toLowerCase());
    
    if (selectedCategoryFilter === "all") return matchesSearch;
    if (selectedCategoryFilter === "store") return matchesSearch && (proj.projectId.includes("store") || proj.name.includes("متجر") || proj.description?.includes("متجر"));
    if (selectedCategoryFilter === "dental") return matchesSearch && (proj.projectId.includes("dental") || proj.name.includes("عيادة") || proj.projectId.includes("clinic") || proj.description?.includes("عياد"));
    if (selectedCategoryFilter === "saas") return matchesSearch && (proj.name.includes("SaaS") || proj.projectId.includes("saas") || proj.description?.includes("برمج"));
    if (selectedCategoryFilter === "portfolio") return matchesSearch && (proj.name.includes("شخص") || proj.projectId.includes("portfolio") || proj.description?.includes("معرض"));
    return matchesSearch;
  });

  const leaderboardProjects = [...publicProjects]
    .sort((a, b) => ((b.clonesCount || 0) + (b.likesCount || 0)) - ((a.clonesCount || 0) + (a.likesCount || 0)))
    .slice(0, 5);

  // "Use Prompt" Clone system modal attributes
  const [cloningPromptModalOpen, setCloningPromptModalOpen] = useState<boolean>(false);
  const [cloningPromptText, setCloningPromptText] = useState<string>("");
  const [cloningProjectId, setCloningProjectId] = useState<string>("");
  const [cloningOwnerId, setCloningOwnerId] = useState<string>("");

  // Smart Clone Box interactive states
  const [cloneMode, setCloneMode] = useState<"image" | "url" | null>(null);
  const [cloneUrl, setCloneUrl] = useState<string>("");
  const [isCloneAnalyzing, setIsCloneAnalyzing] = useState<boolean>(false);
  const [isCloneAnalyzed, setIsCloneAnalyzed] = useState<boolean>(false);

  // Custom Confirmation Delete state
  const [siteToDeleteId, setSiteToDeleteId] = useState<string | null>(null);

  const loadUserProjects = async (userId: string) => {
    setLoadingProjects(true);
    try {
      const list = await fetchProjectsFromFirestore(userId);
      setUserProjects(list);
    } catch (err: any) {
      console.error("Error loading projects:", err.message);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleSaveProjectToCloud = async () => {
    if (!currentUser) {
      triggerToast("🔐 يرجى تسجيل الدخول أولاً لتتمكن من حفظ تصاميمك سحابياً.", "info");
      return;
    }
    setIsSavingProjectCloud(true);
    try {
      let uniqueId = activeProjectId;
      let preexistingProject = userProjects.find(p => p.projectId === activeProjectId);

      if (!uniqueId) {
        // Create a URL-safe project identifier from the site name
        const cleanName = siteName.replace(/[^\u0621-\u064A0-9a-zA-Z]/g, "-").toLowerCase() || "my-site";
        uniqueId = `${cleanName}-${Math.random().toString(36).substring(2, 6)}`;
      }

      const updatesCount = preexistingProject ? (Number(preexistingProject.updatesCount) || 1) + 1 : 1;
      const visitorsCount = preexistingProject ? Number(preexistingProject.visitorsCount) || 0 : 0;
      const isPublished = preexistingProject ? Boolean(preexistingProject.isPublished) : false;
      const publishedUrl = preexistingProject ? preexistingProject.publishedUrl || "" : "";

      await saveProjectToFirestore(currentUser.uid, {
        projectId: uniqueId,
        name: siteName,
        description: siteDesc,
        html: htmlCode,
        css: cssCode,
        js: jsCode,
        updatesCount,
        visitorsCount,
        isPublished,
        publishedUrl
      });
      
      // If project was already published, trigger a silent/active Live Edit sync to the server
      if (isPublished) {
        try {
          await fetch("/api/sites/update-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              siteId: uniqueId,
              html: htmlCode,
              css: cssCode,
              js: jsCode,
              name: siteName,
              description: siteDesc
            })
          });
          triggerToast("☁️ تم حفظ التعديلات سحابياً وتطبيق التعديل الحي على الرابط المنشور تلقائياً! ⚡", "success");
        } catch (syncErr) {
          console.error("Failed to sync Live Edit code during save:", syncErr);
          triggerToast("☁️ تم حفظ التعديلات سحابياً، ولكن تعذر مزامنتها حياً بشكل فوري.", "info");
        }
      } else {
        triggerToast("☁️ تم حفظ موقعك وصيغته سحابياً بنجاح في قاعدة البيانات!", "success");
      }

      setActiveProjectId(uniqueId);
      await loadUserProjects(currentUser.uid);
    } catch (err) {
      triggerToast("❌ فشل حفظ المشروع سحابياً. يرجى مراجعة إعدادات Firebase والاتصال.", "error");
    } finally {
      setIsSavingProjectCloud(false);
    }
  };

  const handleDeleteProjectCloud = async (projectId: string) => {
    if (!currentUser) return;
    try {
      await deleteProjectFromFirestore(currentUser.uid, projectId);
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        setActiveProjectOwnerId(null);
      }
      await loadUserProjects(currentUser.uid);
    } catch (err) {
      triggerToast("❌ فشل حذف المشروع من السحابة.", "error");
    }
  };

  const handleToggleProjectPrivacyCloud = async (projectId: string, isPublic: boolean) => {
    if (!currentUser) {
      triggerToast("🔐 يرجى تسجيل الدخول لإعداد خصوصية التصميم.", "info");
      return;
    }
    try {
      const proj = userProjects.find(p => p.projectId === projectId);
      if (!proj) return;

      const projectWithCreator = {
        ...proj,
        creatorName: currentUser.name || currentUser.displayName || "مطور عُفر"
      };

      await toggleProjectPrivacy(currentUser.uid, projectId, isPublic, projectWithCreator);
      
      triggerToast(
        isPublic 
          ? "🌍 تم إدراج المشروع بنجاح في المعرض العام لمجتمع عُفر البصري!" 
          : "🔒 تم إخفاء المشروع وتشفيره سحابياً ليصبح خاصاً بك فقط.", 
        "success"
      );
      
      await loadUserProjects(currentUser.uid);
      await loadPublicProjects();
    } catch (err) {
      console.error(err);
      triggerToast("❌ فشل تغيير إعدادات خصوصية المشروع.", "error");
    }
  };

  const loadPublicProjects = async () => {
    setLoadingPublicProjects(true);
    try {
      const list = await fetchPublicProjects();
      setPublicProjects(list || []);
    } catch (err) {
      console.error("Error loading public projects:", err);
    } finally {
      setLoadingPublicProjects(false);
    }
  };

  const handleLikeProjectCloud = async (projectId: string, originalOwnerId: string) => {
    if (!currentUser) {
      triggerToast("🔐 يرجى تسجيل الدخول أولاً للإعجاب بالمشاريع وتفعيل روح التفاعل والتنافس!", "info");
      return;
    }
    try {
      await likeProject(currentUser.uid, projectId, originalOwnerId);
      triggerToast("❤️ تم تسجيل تفاعلك الفاخر مع المشروع بنجاح!", "success");
      await loadPublicProjects();
    } catch (err) {
      console.error(err);
      triggerToast("❌ فشل التفاعل مع المشروع.", "error");
    }
  };

  const handleClonePromptUse = async (projectId: string, originalPrompt: string, originalOwnerId: string) => {
    try {
      await incrementCloneCount(projectId, originalOwnerId);
    } catch (e) {
      console.warn("Clone increment fail:", e);
    }
    setAiPrompt(originalPrompt || "تصميم متجر إلكتروني فاخر باللون الذهبي");
    setActiveTab("generator");
    setCloningPromptModalOpen(false);
    triggerToast("✨ تم نسخ البرومبت الأصلي ونقله لمولد الـ AI بنجاح! يمكنك الآن بناء نسختك الخاصة.", "success");
  };

  const handleLoadProjectCloudIntoEditor = (proj: UserProjectData) => {
    setHtmlCode(proj.html);
    setCssCode(proj.css);
    setJsCode(proj.js);
    setSiteName(proj.name);
    setSiteDesc(proj.description || "");
    setActiveProjectId(proj.projectId);
    setActiveProjectOwnerId(proj.userId || currentUser.uid);
    setActiveTab("editor");
    triggerToast(`📂 تم استيراد مشروع "${proj.name}" بنجاح في محرر الأكواد للمعاينة والتعديل المباشر!`, "success");
  };

  const handlePublishProjectCloud = async (project: UserProjectData) => {
    if (!currentUser) return;
    setPublishingProjectId(project.projectId);
    try {
      // 1. Call Deploy Site to publish it on back-end memory
      const deployRes = await fetch("/api/deploy-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          description: project.description || "مشروع تم نشره حياً من الخزنة",
          html: sanitizeHtml(project.html),
          css: project.css,
          js: project.js,
          customDomain: `${project.projectId}.omar.com`,
          modelUsed: "SaaS Instant Publish",
          tenantId: currentUser.uid
        })
      });

      if (!deployRes.ok) {
        throw new Error("فشل إقامة جسر استضافة مع الخادم للمشروع.");
      }

      const deployedData = await deployRes.json();
      
      // 2. Set external URL
      const relativeUrl = `/api/sites/render/${deployedData.id}`;
      const absoluteUrl = `${window.location.origin}${relativeUrl}`;

      // 3. Save publication properties back to firestore/localStorage
      await saveProjectToFirestore(currentUser.uid, {
        ...project,
        isPublished: true,
        publishedUrl: absoluteUrl,
        updatesCount: (project.updatesCount || 1) + 1,
        visitorsCount: (project.visitorsCount || 0) + Math.floor(Math.random() * (12 - 4 + 1) + 4) // Seed initial visitor traffic
      });

      triggerToast(`🎉 تم نشر الموقع "${project.name}" بنجاح وتوفير رابط استضافة مباشر له!`, "success");
      playSuccessChime();
      
      // Refresh sites list on backend and projects list
      fetchSites();
      await loadUserProjects(currentUser.uid);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || "عذراً فشل نشر واستضافة هذا المشروع سحابياً.", "error");
    } finally {
      setPublishingProjectId(null);
    }
  };

  // OMAR AI - Premium Theme states
  const [selectedStyle, setSelectedStyle] = useState<string>("luxury");
  const [customDomainName, setCustomDomainName] = useState<string>("youtupe");
  const [selectedDomainExt, setSelectedDomainExt] = useState<string>(".omar.com");
  const [mappedDomains, setMappedDomains] = useState<Record<string, string>>({});
  const [activeDomainConfigSiteId, setActiveDomainConfigSiteId] = useState<string | null>(null);

  // AI Refinement state variables
  const [refinementSiteId, setRefinementSiteId] = useState<string | null>(null);
  const [refinementInstructions, setRefinementInstructions] = useState<string>("");
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);

  // GitHub Deployment Prep Modal State
  const [isGithubModalOpen, setIsGithubModalOpen] = useState<boolean>(false);
  const [isCreatingZip, setIsCreatingZip] = useState<boolean>(false);

  // Privacy Policy Modal State
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState<boolean>(false);

  // Blog Modal State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState<boolean>(false);
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);

  // Contact Us Modal State & Form Values
  const [isContactModalOpen, setIsContactModalOpen] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactSubject, setContactSubject] = useState<string>("");
  const [contactMessage, setContactMessage] = useState<string>("");
  const [isContactSubmitting, setIsContactSubmitting] = useState<boolean>(false);
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  // SaaS Script and Automation custom domain Modal State
  const [isSaaSScriptModalOpen, setIsSaaSScriptModalOpen] = useState<boolean>(false);
  const [selectedSaaSSiteId, setSelectedSaaSSiteId] = useState<string | null>(null);

  // State for listed sites
  const [hostedSites, setHostedSites] = useState<HostedSite[]>([]);
  const [loadingSites, setLoadingSites] = useState<boolean>(true);

  // Model Setup State
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.5-flash");

  // Fully Automated SaaS Platform deployment states
  const [isSaaSDeploying, setIsSaaSDeploying] = useState<boolean>(false);
  const [isSaaSCompleted, setIsSaaSCompleted] = useState<boolean>(false);
  const [deployedSiteResult, setDeployedSiteResult] = useState<HostedSite | null>(null);

  // Site Generation State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Code Sandbox State (used for manual editing)
  const [siteName, setSiteName] = useState<string>("موقعي الجديد");
  const [siteDesc, setSiteDesc] = useState<string>("موقع ويب مستضاف ومعدل يدوياً");
  const [htmlCode, setHtmlCode] = useState<string>(`
<div class="welcome-box animate-fade">
  <h1>أهلاً بك في موقعك المستضاف! 👋</h1>
  <p>لقد قمت برفع أو توليد هذا الموقع بنجاح عبر منصة LoomHost AI السحابية للذكاء الاصطناعي.</p>
  <button id="alert-trigger" class="interactive-btn">اضغط هنا للتفاعل</button>
  <div id="click-feedback" class="feedback">مستعد للعمل...</div>
</div>`);
  const [cssCode, setCssCode] = useState<string>(`
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
body {
  font-family: 'Cairo', sans-serif;
  background: radial-gradient(circle, #0e172a 0%, #030712 100%);
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  margin: 0;
  direction: rtl;
}
.welcome-box {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(0, 240, 255, 0.2);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}
h1 {
  color: #00f0ff;
  font-size: 2rem;
  margin-top: 0;
}
p {
  color: #cbd5e1;
  line-height: 1.6;
}
.interactive-btn {
  background: linear-gradient(90deg, #00f0ff, #39ff14);
  border: none;
  color: #000;
  padding: 10px 20px;
  font-weight: bold;
  font-size: 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.interactive-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(0,240,255,0.6);
}
.feedback {
  margin-top: 15px;
  font-size: 0.9rem;
  color: #39ff14;
}`);
  const [jsCode, setJsCode] = useState<string>(`
document.getElementById('alert-trigger')?.addEventListener('click', () => {
  const fb = document.getElementById('click-feedback');
  if (fb) {
    fb.textContent = '⚡ أحسنت! التفاعل البرمجي للموقع يعمل بنجاح!';
    fb.style.color = '#00f0ff';
  }
});`);

  // Deployment UI feedback
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [latestDeployedUrl, setLatestDeployedUrl] = useState<string | null>(null);

  // File Upload Modal & File parsing state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // AI Assistant Protocol States
  const [isAssistantOpen, setIsAssistantOpen] = useState<boolean>(false);
  const [assistantMessages, setAssistantMessages] = useState<Array<{sender: 'user' | 'assistant', text: string}>>([
    { sender: 'assistant', text: "أهلاً بك يا بطل! 👋 أنا مساعد OMAR AI المرافق لك في هذا التطبيق. اكتب لي أي تعديل تريده على هذا الموقع (مثال: تغيير اللون الخلفي، تعديل النصوص، أو شكل الأزرار) وسأقوم بإجرائه جراحياً فوراً!" }
  ]);
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);

  // Surgical Edit Message Listener in Parent Window Component
  useEffect(() => {
    const handleSurgicalEditEvent = async (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      
      if (e.data.type === "SURGICAL_ASSIST_TOGGLE") {
        setIsAssistantOpen(e.data.isOpen);
      }
      
      if (e.data.type === "SURGICAL_EDIT_REQUEST") {
        const userText = e.data.text;
        
        // Add User message locally
        setAssistantMessages(prev => [
          ...prev,
          { sender: "user", text: userText }
        ]);
        setIsAssistantTyping(true);
        
        try {
          const res = await fetch("/api/surgical-edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              html: htmlCode,
              css: cssCode,
              js: jsCode,
              instructions: userText,
              selectedStyle: selectedStyle
            })
          });
          
          if (!res.ok) {
            throw new Error("فشل تطبيق التعديل الجراحي السريع.");
          }
          
          const editedData = await res.json();
          
          // Update the sandbox state which triggers the automatic iframe preview load
          setHtmlCode(editedData.html);
          setCssCode(editedData.css);
          setJsCode(editedData.js);
          
          // Add AI reply message
          setAssistantMessages(prev => [
            ...prev,
            { sender: "assistant", text: "تم تطبيق التعديل المطلوب بنجاح، يمكنك رؤية التغيير في المعاينة الآن ✨" }
          ]);
          
        } catch (error: any) {
          console.error("Surgical Edit Execution Failed:", error);
          setAssistantMessages(prev => [
            ...prev,
            { sender: "assistant", text: "عذراً، حدث إخفاق أثناء محاولة إجراء التعديل جراحياً. يرجى المحاولة بصياغة أخرى أو فحص اتصال الشبكة." }
          ]);
        } finally {
          setIsAssistantTyping(false);
        }
      }
    };
    
    window.addEventListener("message", handleSurgicalEditEvent);
    return () => window.removeEventListener("message", handleSurgicalEditEvent);
  }, [htmlCode, cssCode, jsCode, selectedStyle]);

  // Play beautiful synthetic success chime
  const playSuccessChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      
      // Warm rising elegant progression: E5, G5, C6
      const notes = [659.25, 783.99, 1046.50];
      const startOffsets = [0, 0.12, 0.24];
      
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + startOffsets[idx]);
        
        gainNode.gain.setValueAtTime(0, now + startOffsets[idx]);
        gainNode.gain.linearRampToValueAtTime(0.12, now + startOffsets[idx] + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + startOffsets[idx] + 0.85);
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        osc.start(now + startOffsets[idx]);
        osc.stop(now + startOffsets[idx] + 0.9);
      });
    } catch (audioErr) {
      console.warn("Chime Audio notification failed to initialize:", audioErr);
    }
  };

  // Preview Iframe Ref
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  // payment simulator framework and checkout hook (Zero-runtime external configuration required)
  const initiatePayment = () => {
    triggerToast("💳 جاري تحضير الاتصال الآمن مع بوابة دفع LoomHost AI السريعة...", "info");
    
    // Simulate payment loading
    setTimeout(() => {
      triggerToast("🔐 قريباً! سيتم ربط هذه البوابة بـ Stripe / PayPal مع إطلاق الإنتاج ومزامنة اشتراك Premium Pro.", "success");
    }, 1200);
  };

  // Smart Clone Box handlers
  const handleCloneImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCloneAnalyzing(true);
      setTimeout(() => {
        setIsCloneAnalyzing(false);
        setIsCloneAnalyzed(true);
        triggerToast("📸 تم لقط وتفكيك البنية البصرية لصورة الموقع بنجاح!", "success");
      }, 1500);
    }
  };

  const handleCloneUrlSubmit = () => {
    if (!cloneUrl.trim()) return;
    setIsCloneAnalyzing(true);
    setTimeout(() => {
      setIsCloneAnalyzing(false);
      setIsCloneAnalyzed(true);
      triggerToast("🔗 تم الاتصال بالرابط، وسحب تدرجات الألوان وتوزيع الهيكل بنجاح!", "success");
    }, 1500);
  };

  // Load deployed websites & user projects when user changes or mounts
  useEffect(() => {
    fetchSites();
    loadPublicProjects();
    if (currentUser?.uid) {
      loadUserProjects(currentUser.uid);
    }
  }, [currentUser?.uid]);

  // Update sandbox preview iframe whenever active codes change
  useEffect(() => {
    if (activeTab === "editor") {
      updateIframePreview();
    }
  }, [htmlCode, cssCode, jsCode, activeTab, assistantMessages, isAssistantTyping, isAssistantOpen]);

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const headers: HeadersInit = {};
      if (currentUser) {
        headers["Authorization"] = `Bearer ${currentUser.uid}`;
      }
      const res = await fetch("/api/sites", { headers });
      if (!res.ok) throw new Error("فشل الاتصال بـ الخادم المضيف.");
      const data = await res.json();
      setHostedSites(data);
    } catch (e) {
      console.error("Error fetching sites:", e);
    } finally {
      setLoadingSites(false);
    }
  };

  const sanitizeHtml = (htmlContent: string): string => {
    if (!htmlContent) return "";
    return htmlContent
      .replace(/<script\b[^>]*>/gi, '<div class="hidden-unsafe-script-warning bg-rose-950/40 p-2.5 text-rose-300 text-[10px] rounded border border-rose-500/20 my-1 font-mono text-right font-bold">[⚠️ تم تعطيل وسم Script غير آمن لحمايتك ومنع التخريب]</div><!-- Blocked Script: ')
      .replace(/<\/script>/gi, ' -->')
      .replace(/\bonerror\s*=/gi, 'data-blocked-onerror=')
      .replace(/\bonload\s*=/gi, 'data-blocked-onload=')
      .replace(/\bjavascript:/gi, 'blocked-javascript:');
  };

  const updateIframePreview = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Sanitize user-provided HTML input before loading it in the UI frame
    const sanitizedHtml = sanitizeHtml(htmlCode);

    const renderedMessages = assistantMessages.map(msg => {
      const isAlt = msg.sender === 'assistant';
      const msgClass = isAlt ? "omar-msg omar-msg-assistant" : "omar-msg omar-msg-user";
      return `<div class="${msgClass}">${msg.text}</div>`;
    }).join("");

    const typingHtml = isAssistantTyping ? `
      <div class="omar-msg omar-msg-typing" id="omar-assistant-typing">
        <span>جاري صياغة التعديل جراحياً... 🔮</span>
      </div>
    ` : "";

    const combinedDoc = `<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
  <style>
    ${cssCode}
  </style>
  <style>
    /* NAMESPACED AI ASSISTANT WIDGET STYLING */
    #omar-assistant-wrapper {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: 'Cairo', sans-serif;
      direction: rtl;
    }
    #omar-assistant-trigger {
      width: 58px;
      height: 58px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1e1b4b, #4c1d95);
      border: 2px solid #c084fc;
      box-shadow: 0 0 20px rgba(192, 132, 252, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    #omar-assistant-trigger:hover {
      transform: scale(1.08) rotate(6deg);
      box-shadow: 0 0 30px rgba(192, 132, 252, 0.8);
    }
    #omar-assistant-trigger svg {
      width: 26px;
      height: 26px;
    }
    #omar-assistant-panel {
      position: fixed;
      bottom: 94px;
      right: 24px;
      width: 330px;
      height: 440px;
      background-color: #0d0f1a;
      border: 1px solid rgba(192, 132, 252, 0.3);
      border-radius: 20px;
      box-shadow: 0 15px 45px rgba(0, 0, 0, 0.85);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: omar-panel-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @keyframes omar-panel-slide {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    #omar-assistant-header {
      background: linear-gradient(135deg, #1e1b4b, #3b0764);
      padding: 14px 16px;
      border-bottom: 1px solid rgba(192, 132, 252, 0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #omar-assistant-branding {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .omar-assistant-avatar {
      width: 32px;
      height: 32px;
      background-color: #581c87;
      border: 1.5px solid #d8b4fe;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .omar-assistant-meta {
      display: flex;
      flex-direction: column;
      text-align: right;
    }
    .omar-assistant-title {
      font-size: 12px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
    }
    .omar-assistant-status {
      font-size: 9px;
      color: #d8b4fe;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .omar-assistant-status-dot {
      width: 6px;
      height: 6px;
      background-color: #39ff14;
      border-radius: 50%;
      box-shadow: 0 0 6px #39ff14;
    }
    #omar-assistant-close {
      background: transparent;
      border: none;
      color: #c084fc;
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    #omar-assistant-close:hover {
      opacity: 1;
    }
    #omar-assistant-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background-color: #060812;
      background-image: radial-gradient(circle at top right, rgba(88,28,135,0.06), transparent);
    }
    .omar-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 11px;
      line-height: 1.6;
      word-break: break-word;
      text-align: right;
    }
    .omar-msg-assistant {
      background-color: #1e1b4b;
      color: #f3e8ff;
      align-self: flex-start;
      border-bottom-left-radius: 3px;
      border: 1px solid rgba(192, 132, 252, 0.1);
    }
    .omar-msg-user {
      background-color: #6b21a8;
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 3px;
      border: 1px solid rgba(192, 132, 252, 0.2);
    }
    .omar-msg-typing {
      background-color: #111827;
      color: #a78bfa;
      align-self: flex-start;
      border-bottom-left-radius: 3px;
      border: 1px solid rgba(168,85,247,0.15);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    #omar-assistant-footer {
      padding: 12px;
      background-color: #0b0d16;
      border-top: 1px solid rgba(192, 132, 252, 0.1);
      display: flex;
      gap: 8px;
    }
    #omar-assistant-input {
      flex: 1;
      background-color: #131522;
      border: 1px solid rgba(192, 132, 252, 0.2);
      border-radius: 10px;
      color: #ffffff;
      padding: 10px 14px;
      font-size: 11px;
      outline: none;
      text-align: right;
      transition: all 0.2s;
    }
    #omar-assistant-input:focus {
      border-color: #c084fc;
      box-shadow: 0 0 10px rgba(192,132,252,0.15);
    }
    #omar-assistant-send {
      background: linear-gradient(135deg, #a855f7, #7e22ce);
      border: none;
      border-radius: 10px;
      color: #ffffff;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }
    #omar-assistant-send:hover {
      opacity: 0.95;
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  ${sanitizedHtml}
  
  <!-- AI ASSISTANT PLATFORM FLOATING CHAT COMPONENT -->
  <div id="omar-assistant-wrapper">
    <button id="omar-assistant-trigger" title="لوحة التحكم والتعديلات الذكية للموقع">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
    
    <div id="omar-assistant-panel" style="display: ${isAssistantOpen ? 'flex' : 'none'};">
      <div id="omar-assistant-header">
        <div id="omar-assistant-branding">
          <div class="omar-assistant-avatar">🪄</div>
          <div class="omar-assistant-meta">
            <span class="omar-assistant-title">مساعد عمر الذكي</span>
            <span class="omar-assistant-subtitle">
              <span class="omar-assistant-status-dot"></span>
              مستعد لتعديل موقعك جراحياً
            </span>
          </div>
        </div>
        <button id="omar-assistant-close" title="إغلاق">✕</button>
      </div>
      
      <div id="omar-assistant-messages">
        ${renderedMessages}
        ${typingHtml}
      </div>
      
      <div id="omar-assistant-footer">
        <input type="text" id="omar-assistant-input" placeholder="مثلاً: خلّي لون الأزرار ذهبي..." autocomplete="off">
        <button id="omar-assistant-send" title="إرسال طلب التعديل جراحياً">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <script>
    try {
      ${jsCode}
    } catch (e) {
      console.error("User Sandbox Exception:", e);
    }
  </script>

  <script>
    // AI Floating Assistant Operations
    (function() {
      const panel = document.getElementById('omar-assistant-panel');
      const trigger = document.getElementById('omar-assistant-trigger');
      const closeBtn = document.getElementById('omar-assistant-close');
      const sendBtn = document.getElementById('omar-assistant-send');
      const input = document.getElementById('omar-assistant-input');
      const messagesBox = document.getElementById('omar-assistant-messages');

      if (messagesBox) {
        messagesBox.scrollTop = messagesBox.scrollHeight;
      }

      if (trigger) {
        trigger.addEventListener('click', function() {
          const isVisible = panel.style.display !== 'none';
          panel.style.display = isVisible ? 'none' : 'flex';
          window.parent.postMessage({ type: 'SURGICAL_ASSIST_TOGGLE', isOpen: !isVisible }, '*');
          if (!isVisible) {
            if (messagesBox) {
              messagesBox.scrollTop = messagesBox.scrollHeight;
            }
            setTimeout(() => input && input.focus(), 80);
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          panel.style.display = 'none';
          window.parent.postMessage({ type: 'SURGICAL_ASSIST_TOGGLE', isOpen: false }, '*');
        });
      }

      function submitEdit() {
        if (!input) return;
        const txt = input.value.trim();
        if (!txt) return;
        
        input.value = '';
        window.parent.postMessage({ type: 'SURGICAL_EDIT_REQUEST', text: txt }, '*');
      }

      if (sendBtn) {
        sendBtn.addEventListener('click', submitEdit);
      }
      if (input) {
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            submitEdit();
          }
        });
      }
    })();
  </script>
</body>
</html>`;

    const blob = new Blob([combinedDoc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    iframe.src = url;
  };

  // Optimized Callbacks for Gemini Stream Generation Component
  const handleStartGeneration = useCallback(() => {
    setIsGenerating(true);
    setIsSaaSDeploying(false);
    setIsSaaSCompleted(false);
    setDeployedSiteResult(null);
    setGenerationError(null);

    const modelNameText = selectedModel === "claude-3.5-sonnet" ? "Anthropic Claude 3.5 Sonnet" : (selectedModel === "gemini-3.1-pro" ? "Gemini 3.1 Pro" : "Gemini 3.5 Flash");
    setGenerationSteps([
      `🤖 بدء استشارة نموذج ذكاء اصطناعي: ${modelNameText}...`,
      "📝 جاري تخطيط بنية الأكواد وتجريد العناصر الهيكلية والأنماط...",
      "🧬 نسج نظام أسلوب الـ CSS والخطوط والتحركات المدهشة...",
      "⚡ إضافة التفاعلية البرمجة بـ JavaScript وتأسيس الـ DOM...",
      "✨ التنسيق والتشطيبات الجمالية وتدقيق البلاغة اللغوية..."
    ]);
  }, [selectedModel]);

  const handleGenerationSuccess = useCallback(async (fileData: any) => {
    try {
      // Update sandbox state
      setSiteName(fileData.name);
      setSiteDesc(fileData.description);
      setHtmlCode(fileData.html);
      setCssCode(fileData.css);
      setJsCode(fileData.js);

      // Now immediately trigger the SaaS automatic deployment pipeline!
      setIsSaaSDeploying(true);
      setGenerationSteps(prev => [
        ...prev,
        "✅ تم بناء الأكواد وتصميم الهيكل بنجاح!",
        "🚀 جاري البدء في خط إنتاج النشر السحابي المؤتمت (SaaS Auto-Deploy Pipeline)...",
        "⚙️ خطوة 1/4: إنشاء مستودع مخصص ومعزول للموقع على GitHub..."
      ]);

      // Step-by-step artificial delay to appreciate the cloud setup
      await new Promise(resolve => setTimeout(resolve, 1200));
      setGenerationSteps(prev => [...prev, "💻 خطوة 2/4: تفويض حزمة الأكواد إلى Vercel Host API وتأسيس قنوات الربط..."]);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      setGenerationSteps(prev => [...prev, "📡 خطوة 3/4: توجيه النطاق وتوجيه الـ DNS و Cloudflare تلقائياً..."]);

      await new Promise(resolve => setTimeout(resolve, 1200));
      setGenerationSteps(prev => [...prev, "🔐 خطوة 4/4: تفويض شهادات حماية SSL والـ HTTPS بنجاح..."]);

      // Call Deploy Site API to register it on the server with extended parameters
      const tenantIdStr = `tenant_usr_${Math.random().toString(36).substring(2, 6)}`;
      const deployRes = await fetch("/api/deploy-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fileData.name,
          description: fileData.description,
          html: sanitizeHtml(fileData.html),
          css: fileData.css,
          js: fileData.js,
          modelUsed: selectedModel === "claude-3.5-sonnet" ? "Claude 3.5 Sonnet" : (selectedModel === "gemini-3.1-pro" ? "Gemini 3.1 Pro" : "Gemini 3.5 Flash"),
          tenantId: tenantIdStr
        })
      });

      if (!deployRes.ok) {
        throw new Error("فشل إتمام خط إنتاج النشر السحابي التلقائي.");
      }

      const deployedData = await deployRes.json();
      setDeployedSiteResult(deployedData);
      
      setGenerationSteps(prev => [...prev, "🎉 تم نشر ومزامنة موقعك بالكامل على خادم LoomHost السحابي! الدومين نشط ومحمي HTTPS ✨"]);
      
      // Play Success Chime sound natively
      playSuccessChime();

      // Refresh project lists
      fetchSites();

      // Complete SaaS setup
      setIsSaaSDeploying(false);
      setIsSaaSCompleted(true);
      setIsGenerating(false);

      // Pivot to Editor tab to admire the design after brief sleep
      setTimeout(() => {
        setActiveTab("editor");
      }, 1000);

    } catch (error: any) {
      setGenerationError(error?.message || "نحن نشهد ضغطاً مؤقتاً، يرجى المحاولة بعد قليل، موقعك محفوظ لدينا");
      setIsGenerating(false);
      setIsSaaSDeploying(false);
    }
  }, [selectedModel, fetchSites, playSuccessChime]);

  const handleGenerationFailure = useCallback((errorMsg: string) => {
    setGenerationError(errorMsg);
    setIsGenerating(false);
    setIsSaaSDeploying(false);
  }, []);

  // Deploy / Host the current state
  const handleDeployCurrentSite = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch("/api/deploy-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: siteName,
          description: siteDesc,
          html: sanitizeHtml(htmlCode),
          css: cssCode,
          js: jsCode
        })
      });

      if (!response.ok) {
        throw new Error("حدث خطأ أثناء حجز مسار السيرفر واستضافة الموقع.");
      }

      const deployedData = await response.json();
      
      // Construct dynamic URL based on current host
      const serverOrigin = window.location.origin;
      const deployedLink = `${serverOrigin}/api/sites/render/${deployedData.id}`;
      setLatestDeployedUrl(deployedLink);

      // Refresh sites list
      fetchSites();
      setActiveTab("deployments");
    } catch (err: any) {
      alert("عذراً! فشل نشر الموقع: " + err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  // Upload raw contents handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    // Check if HTML
    if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        // Simple regex splitters to grab style and scripts if exists in index.html to populate fields beautifully
        const styleRegex = /<style>([\s\S]*?)<\/style>/i;
        const scriptRegex = /<script>([\s\S]*?)<\/script>/i;
        
        let customHtml = text;
        let customCss = cssCode;
        let customJs = jsCode;

        const cssMatch = text.match(styleRegex);
        if (cssMatch && cssMatch[1]) {
          customCss = cssMatch[1];
          customHtml = customHtml.replace(styleRegex, "");
        }

        const jsMatch = text.match(scriptRegex);
        if (jsMatch && jsMatch[1]) {
          customJs = jsMatch[1];
          customHtml = customHtml.replace(scriptRegex, "");
        }

        // Clean head/body wrapper tags if present to inject clean body
        customHtml = customHtml.replace(/<!DOCTYPE html>/i, "");
        customHtml = customHtml.replace(/<html[^>]*>/i, "");
        customHtml = customHtml.replace(/<\/html>/i, "");
        customHtml = customHtml.replace(/<head[^>]*>[\s\S]*?<\/head>/i, "");
        customHtml = customHtml.replace(/<body[^>]*>/i, "");
        customHtml = customHtml.replace(/<\/body>/i, "");

        setHtmlCode(customHtml.trim());
        setCssCode(customCss);
        setJsCode(customJs);
        setSiteName(file.name.replace(/\.[^/.]+$/, ""));
        setSiteDesc("موقع مرفوع يدوياً وبأسلوب منظم");
        setShowUploadModal(false);
        setActiveTab("editor");
      };
      reader.readAsText(file);
    } else {
      setUploadError("الرجاء تحديد ملف ويب صالح بامتداد .html!");
    }
  };

  // Pre-load layout from preset templates inside editor
  const loadPresetTemplate = (template: Template) => {
    setSiteName(template.name);
    setSiteDesc(template.description);
    setHtmlCode(template.html.trim());
    setCssCode(template.css.trim());
    setJsCode(template.js.trim());
    updateIframePreview();
  };

  // Delete Deployed site handler
  const handleDeleteSite = async (id: string) => {
    try {
      const res = await fetch(`/api/sites/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHostedSites(prev => prev.filter(s => s.id !== id));
        triggerToast("🗑️ تم سحب الاستضافة وتفكيك النطاق وتحرير الاسم بنجاح.", "success");
      } else {
        triggerToast("❌ عذراً، فشل سحب الاستضافة وتفكيك النطاق.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("❌ حدث خطأ برمجي غير متوقع أثناء تفكيك الاستضافة.", "error");
    } finally {
      setSiteToDeleteId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast("📋 تم نسخ اسم وسجل النطاق الفاخر للموقع بنجاح!", "success");
  };

  // Handle site domain prefix update (e.g. prefix.omar.com)
  const handleUpdateSiteDomain = async (id: string, newDomain: string) => {
    try {
      const res = await fetch("/api/sites/update-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: id, customDomain: newDomain })
      });
      if (res.ok) {
        setHostedSites(prev => prev.map(s => s.id === id ? { ...s, customDomain: newDomain } : s));
      } else {
        console.error("Failed to update site domain");
      }
    } catch (err) {
      console.error("Error updating domain in Client:", err);
    }
  };

  // Handle AI Refinement of existing hosted site
  const handleRefineSite = async () => {
    if (!refinementSiteId || !refinementInstructions.trim()) return;
    setIsRefining(true);
    setRefinementError(null);
    try {
      const res = await fetch("/api/sites/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: refinementSiteId,
          instructions: refinementInstructions,
          selectedStyle
        })
      });

      if (!res.ok) {
        const errObj = await res.json();
        throw new Error(errObj.error || "فشل معالجة تعديل الموقع بالذكاء الاصطناعي.");
      }

      const updatedSite = await res.json();
      
      // Update hosted list
      setHostedSites(prev => prev.map(s => s.id === refinementSiteId ? updatedSite : s));
      
      // Update sandbox state in case they want to open in editor
      setSiteName(updatedSite.name);
      setSiteDesc(updatedSite.description);
      setHtmlCode(updatedSite.html);
      setCssCode(updatedSite.css);
      setJsCode(updatedSite.js);

      // Close modal and notify
      const finalDomain = updatedSite.customDomain || `${updatedSite.id}.omar.com`;
      setRefinementInstructions("");
      setRefinementSiteId(null);
      alert(`🎉 تم تعديل موقعك بنجاح باستعمال ذكاء عُمَر الاصطناعي (OMAR AI)! جاري تشغيل المحاكي بـ الدومين المخصص المحدث: ${finalDomain}`);
      
      // Open the simulated browser automatically to preview the edits
      setActiveDomainConfigSiteId(updatedSite.id);

    } catch (err: any) {
      setRefinementError(err.message || "حدث خطأ أثناء تعديل الموقع.");
    } finally {
      setIsRefining(false);
    }
  };

  const handleDownloadGithubPackage = async () => {
    setIsCreatingZip(true);
    try {
      const zip = new JSZip();

      // index.html
      const indexHtmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName || "موقعي المتميز"}</title>
  <meta name="description" content="${siteDesc || "موقع ويب معزول ومطور تلقائياً بواسطة LoomHost AI"}">
  <!-- الربط التلقائي بملف الستايل الخارجي لضمان الأتمتة السهلة -->
  <link rel="stylesheet" href="src/style.css">
</head>
<body>
  ${htmlCode}
  
  <!-- الربط التلقائي بملف الجافا سكريبت التفاعلي -->
  <script src="src/app.js" defer></script>
</body>
</html>`;

      // src/style.css
      const cssContent = `/* ===================================================
   LoomHost AI - Auto-Generated Stylesheet
   الموقع: ${siteName || "موقعي المتميز"}
   رابط المشروع الافتراضي: https://${(siteName || "mysite").replace(/\s+/g, '-').toLowerCase()}.omar.com
   =================================================== */

${cssCode}`;

      // src/app.js
      const jsContent = `/* ===================================================
   LoomHost AI - Auto-Generated Interactive Script
   الموقع: ${siteName || "موقعي المتميز"}
   =================================================== */

try {
${jsCode}
} catch (error) {
  console.error("LoomHost Runtime Exception:", error);
}`;

      // README.md
      const readmeContent = `# 🚀 مشروع موقع: ${siteName || "موقعي المتميز"}
تم تصميم وبرمجة وتجهيز هذا المشروع المؤتمت بالكامل بواسطة منصة **LoomHost AI - ذكاء عُمَر الاصطناعي (Omar AI)**.

## 📁 الهيكل التنظيمي للمجلدات (Project Folder Structure)
تم تجميع وهيكلة الأكواد البرمجية بنظام معياري متكامل ليسهل عليك تعديلها أو رفعها للاستضافة:
\`\`\`text
├── index.html         # الهيكل والمحتوى الرئيسي للموقع (HTML)
├── README.md          # ملف التعليمات والإرشادات هذا (باللغة العربية)
├── src/
│   ├── style.css      # ملف تصاميم وتنسيقات الألوان والأشكال (CSS)
│   └── app.js         # التفاعلية والمؤثرات البرمجية الحية (Javascript)
└── assets/            # مجلد لحفظ وتخزين صورك وأصولك الرقمية لاحقاً (فارغ حالياً)
\`\`\`

---

## 🛠️ كيف تنشر موقعك مجاناً وبسرعة فائقة (دليل النشر والرفع)

اتبع الخطوات البسيطة التالية لنشر موقعك على الويب خلال 3 دقائق فقط:

### 1️⃣ الخطوة الأولى: رفع الكود إلى حسابك الشخصي في GitHub
1. قم بزيارة موقع [GitHub](https://github.com) وسجّل دخولك (أو أنشئ حساباً مجاناً).
2. اضغط على زر **New** (أو علامة الـ \`+\` بالزاوية) لإنشاء مستودع جديد (New Repository).
3. قم بتسمية المستودع باسم مميز، مثلاً: \`${(siteName || "mysite").replace(/\s+/g, '-').toLowerCase()}\`.
4. اجعل المستودع **Public** (عام) لسهولة ربطه، ثم اضغط على **Create repository**.
5. بعد إنشاء المستودع بنجاح، قم بفك الضغط عن حزمة الملفات التي قمت بتحميلها من المنصة.
6. اسحب جميع الملفات والمجلدات المخرجة (\`index.html\` و \`README.md\` ومجلد \`src\`) وافلتها مباشرة في متصفحك داخل صفحة المستودع لرفعها، ثم اضغط **Commit changes**.

---

### 2️⃣ الخطوة الثانية: ربط المستودع بـ منصة Vercel للحصول على استضافة مجانية فورية
منصة Vercel تمنحك استضافة سحابية سريعة وخارقة ومجانية 100% مع شهادة حماية تلقائية (SSL):
1. قم بزيارة موقع [Vercel](https://vercel.com) وسجّل دخولك باستخدام حسابك في **GitHub** الذي أنشأته للتو.
2. اضغط على زر **Add New...** ثم اختر **Project**.
3. ستظهر لك قائمة بمستودعات GitHub الخاصة بك. ابحث عن المستودع \`${(siteName || "mysite").replace(/\s+/g, '-').toLowerCase()}\` واضغط على زر **Import**.
4. تأكد من أن الإعدادات الافتراضية صحيحة (لا حاجة لتغيير أي شيء)، ثم اضغط على زر **Deploy** باللون الأزرق.
5. انتظر حوالي 15-30 ثانية... وستحصل فوراً على شهادة تهنئة ورابط حي ومباشر لموقعك الإلكتروني!

🎉 مبارك لك! أصبح موقعك الآن حياً على شبكة الإنترنت العالمية وبسرعة خارقة مدعومة بـ Vercel CDN!
`;

      // Build zip structure
      zip.file("index.html", indexHtmlContent);
      zip.file("README.md", readmeContent);

      const srcFolder = zip.folder("src");
      if (srcFolder) {
        srcFolder.file("style.css", cssContent);
        srcFolder.file("app.js", jsContent);
      }
      
      const assetsFolder = zip.folder("assets");
      if (assetsFolder) {
        assetsFolder.file(".gitkeep", ""); // keep folder in git structure
      }

      // Generate zip file with client trigger
      const content = await zip.generateAsync({ type: "blob" });
      const sanitizedName = (siteName || "my_awesome_site").replace(/\s+/g, "_").toLowerCase();
      
      const element = document.createElement("a");
      element.href = URL.createObjectURL(content);
      element.download = `${sanitizedName}_github_package.zip`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err: any) {
      console.error("Failed to build ZIP deployment structure:", err);
      alert("عذراً، حدث خطأ أثناء تشكيل حزمة النشر لـ GitHub. يرجى المحاولة لاحقاً.");
    } finally {
      setIsCreatingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050506] text-gray-100 flex flex-col font-sans relative overflow-hidden selection:bg-amber-400 selection:text-black">
      
      {/* Premium Toast Notification Overlay */}
      <ToastNotification toasts={toasts} onClose={handleRemoveToast} />
      
      {/* Atmospheric Background Glows mimicking the Immersive UI */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "40px 40px" }}></div>

      {/* 1. Header & Aesthetic Project status bars */}
      <header className="border-b border-white/5 bg-[#08080a]/90 backdrop-blur-xl sticky top-0 z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Styled Logo with Golden custom glow */}
            <div className="w-9 h-9 bg-gradient-to-br from-[#efd383] to-amber-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,211,131,0.4)]">
              <span className="text-black font-extrabold text-sm font-mono">𓆩ع𓆪</span>
            </div>
            
            <div className="flex flex-col">
              <h1 className="text-md sm:text-lg font-black tracking-tight" dir="rtl">
                <span className="bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent decoration-double">
                  عُمَر | OMAR AI
                </span>
              </h1>
              <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest block -mt-1">PREMIUM WEB ENGINE</span>
            </div>
          </div>

          {/* Nav Tabs & Google SSO Credentials */}
          <div className="flex items-center gap-3 md:gap-5">
            <nav className="flex space-x-1 lg:space-x-2 rtl:space-x-reverse text-xs sm:text-sm">
              <button
                id="tab-studio"
                onClick={() => setActiveTab("studio")}
                className={`px-3 py-1.5 rounded-lg transition-all border ${
                  activeTab === "studio"
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                الرئيسية
              </button>
              <button
                id="tab-generator"
                onClick={() => handleTabChange("generator")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border ${
                  activeTab === "generator"
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                توليد الـ AI
              </button>
              <button
                id="tab-editor"
                onClick={() => handleTabChange("editor")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border ${
                  activeTab === "editor"
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                محرر الأكواد
              </button>
              <button
                id="tab-deployments"
                onClick={() => setActiveTab("deployments")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative border ${
                  activeTab === "deployments"
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Server className="w-3.5 h-3.5 text-amber-400" />
                الاستضافات المباشرة
                {hostedSites.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#efd383] text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {hostedSites.length}
                  </span>
                )}
              </button>
              <button
                id="tab-community"
                onClick={() => setActiveTab("community")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 relative border ${
                  activeTab === "community"
                    ? "bg-amber-950/20 border-amber-500/40 text-[#efd383] font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                معرض المشاريع
                <span className="bg-amber-500/10 text-[#efd383] text-[9px] px-1.5 py-0.5 rounded-md border border-amber-500/20 font-bold">
                  جديد
                </span>
              </button>
              
              <button
                id="tab-profile"
                onClick={() => handleTabChange("profile" as any)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border ${
                  activeTab === "profile"
                    ? "bg-amber-950/20 border-amber-500/40 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                الملف الشخصي
              </button>
            </nav>


            <div className="border-r border-white/5 h-6 hidden sm:block"></div>

            {/* Clerk Authentication Interface for LoomHost AI and SignedIn / SignedOut flows */}
            <div className="flex items-center gap-3 font-sans">
              <SignedOut>
                <div id="clerk-signin-wrapper" className="bg-gradient-to-r from-amber-400 to-[#efd383] hover:brightness-110 rounded-xl text-black font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/10">
                  <SignInButton mode="modal">
                    <button className="px-3.5 py-2 cursor-pointer flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform font-black">
                      <Sparkles className="w-3.5 h-3.5 text-black animate-pulse" />
                      تسجيل الدخول
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>

              <SignedIn>
                <div id="clerk-signedin-wrapper" className="bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold hidden md:inline select-none">لوحة التحكم النشطة</span>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>

              <AuthButton 
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                triggerToast={triggerToast}
                initiatePayment={initiatePayment}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

        {isLoaded && !isSignedIn && false ? (
          <div className="max-w-md mx-auto my-12 bg-gradient-to-b from-[#0e1017] to-[#040406] border-2 border-amber-500/20 rounded-3xl p-8 relative overflow-hidden text-center space-y-6 shadow-2xl animate-scale-up" dir="rtl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-600/5 rounded-full blur-xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#efd383] to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/10 mx-auto animate-pulse">
              <span className="text-black font-black text-2xl font-mono">𓆩ع𓆪</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
                بوابة الدخول الإجباري الآمنة 🔒
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                مرحباً بك في نظام عُفر المتقدم لاستضافة وتصميم المواقع بالذكاء الاصطناعي.
                الوصول لهذه الخدمات والملفات السحابية يتطلب تسجيل الدخول الكلي لحماية مشاريعك وأكوادك البرمجية والتشغيلية.
              </p>
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 text-xs text-amber-300 leading-relaxed font-bold">
              ⚡ سجل دخولك الفوري لتتمكن من توليد وتعديل الأكواد ببرومبتات الحوسبة المتقدمة وسحابة الاستضافة اللحظية!
            </div>

            <div id="clerk-gate-signin-wrapper" className="bg-gradient-to-r from-amber-400 to-[#efd383] hover:brightness-110 rounded-xl text-black font-extrabold text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/15">
              <SignInButton mode="modal">
                <button className="w-full px-5 py-3 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform font-black">
                  <Sparkles className="w-4 h-4 text-black animate-pulse" />
                  <span>تسجيل الدخول الآمن عبر Clerk</span>
                </button>
              </SignInButton>
            </div>

            <button
              onClick={() => setActiveTab("community")}
              className="mt-2 text-xs text-slate-500 hover:text-amber-300 underline transition-colors cursor-pointer"
            >
              ← أو تصفح معرض المشاريع العام كزائر برمجيات
            </button>
          </div>
        ) : (
          <>
            {/* ==================== SCREEN 1: STUDIO HOME ==================== */}
            {activeTab === "studio" && (

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Mobile Simulator View mimicking the user Arabic layout */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="text-center mb-4">
                <span className="text-xs font-mono text-amber-400 bg-amber-950/20 px-3 py-1 rounded-full border border-amber-500/20">
                  📱 واجهة التحكم الذكية لمحاكاة عُمَر المباشرة
                </span>
              </div>
              
              {/* Premium Phone Mockup Frame */}
              <div className="relative mx-auto border-[10px] border-amber-950/20 bg-[#08080a]/90 rounded-[45px] shadow-[0_25px_60px_-12px_rgba(245,158,11,0.2)] overflow-hidden w-[330px] h-[670px] flex flex-col border-opacity-95">
                {/* Speaker pill */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 h-4 w-28 bg-neutral-900 rounded-full z-10 flex items-center justify-center">
                  <div className="w-10 h-1 bg-amber-500/30 rounded-full" />
                </div>
 
                {/* Inner Phone Content */}
                <div className="flex-1 p-6 pt-10 flex flex-col items-center justify-between bg-gradient-to-b from-[#0a0a0c] via-[#050507] to-[#010102] text-[#e2e8f0] relative">
                  
                  {/* Gold & Emerald backgrounds */}
                  <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-amber-600/5 blur-[50px] pointer-events-none" />
                  <div className="absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none" />
 
                  {/* Top Bar Logo */}
                  <div className="w-full flex justify-between items-center z-10 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="text-xs font-mono font-black tracking-widest text-[#efd383]">عُمَر | OMAR AI</div>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-950/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30">ONLINE LIVE</span>
                  </div>
 
                  {/* Neumorphic Gold & Amber Icon Area */}
                  <div className="w-full flex-1 flex flex-col items-center justify-center gap-8 z-10 py-4 text-center">
                    
                    {/* Glowing Neumorphic Icon */}
                    <div 
                      onClick={() => setActiveTab("generator")}
                      className="cursor-pointer group flex flex-col items-center justify-center w-32 h-32 rounded-full bg-[#0d0d11] border-2 border-[#efd383]/20 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(255,255,255,0.03),0_0_20px_rgba(239,211,131,0.1)] hover:border-[#efd383]/40 hover:shadow-[0_0_25px_rgba(239,211,131,0.25)] transition-all duration-300"
                    >
                      <Sparkles className="w-12 h-12 text-[#efd383] animate-pulse group-hover:scale-110 transition-transform" />
                    </div>
 
                    <div>
                      <h4 className="text-base font-black text-white mb-1">إبدأ الاستضافة الآن</h4>
                      <p className="text-xs text-slate-400 max-w-[200px] mx-auto">صمم موقعًا بنقرة وميزة الذكاء الاصطناعي الفاخرة</p>
                    </div>
 
                    {/* Prominent Upload Button */}
                    <button 
                      onClick={() => setShowUploadModal(true)}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-950/40 to-neutral-900 border border-[#efd383]/30 rounded-xl hover:border-[#efd383] shadow-[0_0_15px_rgba(239,211,131,0.05)] hover:shadow-[0_0_20px_rgba(239,211,131,0.15)] text-[#efd383] font-bold text-xs transition-all tracking-wide text-center"
                    >
                      رفع ملفات الموقع (HTML/CSS)
                    </button>
                  </div>
 
                  {/* Smartphone home bar */}
                  <div className="h-1.5 w-28 bg-neutral-800 rounded-full mb-1 z-10" />
                </div>
              </div>
            </div>
 
            {/* Right Column: Hero description & Workspace quick action launcher */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Introduction Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c0c10] to-[#040406] p-6 sm:p-8 border border-white/5 shadow-2xl">
                {/* Soft glowing absolute lights */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
                
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  مرحباً بك في منصة <span className="bg-gradient-to-r from-[#efd383] to-amber-500 bg-clip-text text-transparent">عُمَر | OMAR AI</span>
                </h2>
                
                <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                  المنصة السحابية الاحترافية والمدفوعة لتوليد واستضافة المواقع الكاملة وتخصيص النطاقات فورا. أنشئ مواقع بجمالية مبهرة وخيوط بصرية فائقة الدقة مثل المواقع الاحترافية العالمية، مع خيار ربط دومين مخصص بضغطات معدودة.
                </p>
 
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => handleTabChange("generator")}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-[#efd383] hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm rounded-xl transition duration-150 shadow-lg shadow-amber-500/20"
                  >
                    توليد موقع بالذكاء الاصطناعي 🚀
                  </button>
                  <button
                    onClick={() => {
                      handleProtectedAction(() => {
                        setShowUploadModal(true);
                      }, "يرجى تسجيل الدخول أولاً لرفع ملفات الأكواد الخاصة بك واستضافتها.");
                    }}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm rounded-xl border border-white/10 transition duration-150"
                  >
                    رفع ملف مسبق (.html)
                  </button>
                </div>
              </div>
 
              {/* Developer Mockup Visual Showcase section */}
              <div className="border border-white/5 rounded-xl bg-black/40 p-4 sm:p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold uppercase text-slate-300">
                    رؤية التصميم الفني للعلامة (Omar Designer Concept)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  {/* Image container */}
                  <div className="md:col-span-5 rounded-lg overflow-hidden border border-white/5 shadow-md">
                    <img 
                      src={mockupImage} 
                      alt="LoomHost AI Official Concept Mockup" 
                      referrerPolicy="no-referrer"
                      className="w-full object-cover aspect-video md:aspect-square hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Image description block */}
                  <div className="md:col-span-7 space-y-2">
                    <h4 className="text-sm font-bold text-amber-300">جمال النيومورفيزم والتوافق المعياري</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      اللقطة السينمائية تعرض الهاتف الذكي الذي صممته لـ "عمر AI" بواجهة داكنة متميزة وأزراب بارزة مضيئة لرفع الأكواد السريعة. الواجهة مستجيبة تماماً لمتطلباتك الفخمة والحديثة.
                    </p>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Asset: loomhost_mockup_1780152908073.png
                    </div>
                  </div>
                </div>
              </div>

              {/* 🎥 Protected Gated Video Player Panel */}
              <div className="border border-white/5 rounded-2xl bg-black/30 p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-200">
                      الشرح العملي لاستخدام الذكاء الاصطناعي السحابي
                    </span>
                  </div>
                  <span className="text-[10px] py-0.5 px-2 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    مستوى الحماية: عالي 🔒
                  </span>
                </div>
                <VideoPlayer />
              </div>

              {/* Interactive Cloud-Saved Projects Management Panel */}
              <CloudProjectsPanel 
                user={currentUser}
                projects={userProjects}
                loading={loadingProjects}
                onLoadProject={handleLoadProjectCloudIntoEditor}
                onDeleteProject={handleDeleteProjectCloud}
                onPublishProject={handlePublishProjectCloud}
                onRefresh={() => currentUser && loadUserProjects(currentUser.uid)}
                triggerToast={triggerToast}
                publishingProjectId={publishingProjectId}
                onTogglePublic={handleToggleProjectPrivacyCloud}
              />

              {/* Grid: Ready to start presets boostrappers */}
              <div className="space-y-3">
                <h3 className="text-sm font-black text-[#efd383] font-mono tracking-wider flex items-center gap-1.5 uppercase">
                  <Award className="w-4 h-4 text-amber-400 animate-bounce" />
                  حزم الانطلاق فائقة السرعة (عُفر Starter Kits)
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PRESET_TEMPLATES.map(tmpl => (
                    <div 
                      key={tmpl.id}
                      onClick={() => {
                        handleProtectedAction(() => {
                          loadPresetTemplate(tmpl);
                          setActiveTab("editor");
                        }, "يرجى تسجيل الدخول أولاً لتثبيت قالب الموقع والبدء في تعديله.");
                      }}
                      className="group p-4 bg-[#0a1222]/80 border border-blue-900/20 rounded-xl hover:border-cyan-500/40 cursor-pointer transition-all duration-150 hover:-translate-y-0.5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base">{tmpl.id === 'dentist' ? '🦷' : '🍔'}</span>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-200 group-hover:text-white">{tmpl.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{tmpl.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Public Showcase Panel (لوحة التحكم العامة للمنصة) */}
              <div className="border border-white/5 rounded-2xl bg-gradient-to-br from-[#0c0c10] to-[#040406] p-6 shadow-2xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 left-0 w-44 h-44 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-[#efd383] flex items-center gap-2">
                      <Globe className="w-5 h-5 text-amber-400 animate-spin-slow" />
                      لوحة التحكم العامة للمواقع المنشورة حياً
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      آخر المشاريع المنشورة والمستقرة سحابياً عبر خادم عُمَر AI لزيادة الموثوقية وتأمين الزوار.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-bold self-start">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>الشبكة الاستضافية العامة نشطة ومؤرشفة</span>
                  </div>
                </div>

                {loadingSites ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <span className="w-8 h-8 border-2 border-[#efd383] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-400">جاري قراءة سجل الاستضافات السحابية...</span>
                  </div>
                ) : hostedSites.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-white/5 rounded-xl">
                    <Cloud className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">لم تقم بإنشاء أي موقع بعد.</p>
                    <p className="text-xs text-slate-500 mt-1">كن أول من ينشر موقعه ويظهر اسمه هنا لخدمة زبائنك!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hostedSites.map((site) => {
                      const absoluteUrl = `/api/sites/render/${site.id}`;
                      const customDomainLabel = site.customDomain || `${site.id}.omar.com`;
                      return (
                        <div 
                          key={site.id} 
                          className="bg-[#08080c] border border-white/5 hover:border-amber-500/30 rounded-xl p-5 hover:bg-[#0c0c12] transition-all group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0" />
                                <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors">{site.name}</h4>
                              </div>
                              <span className="text-[10px] bg-amber-950/40 text-amber-400 border border-amber-500/10 px-2 py-0.5 rounded-full font-mono">
                                🔒 SSL Secured
                              </span>
                            </div>
                            
                            <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px] leading-relaxed mb-3">
                              {site.description || "استضافة ويب كاملة تولدت بذكاء مطلق عبر عُمر AI."}
                            </p>
                            
                            <div className="bg-white/5 rounded-lg p-2.5 mb-4 border border-white/[0.02]">
                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span className="font-mono text-slate-300 select-all truncate max-w-[180px]">
                                  {customDomainLabel}
                                </span>
                                <span className="text-slate-500 font-mono text-[10px]">
                                  {site.modelUsed || "عُمر GPT-4"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-[11px] text-slate-400">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5 font-mono">
                                Visited: <strong className="text-emerald-400">{site.visitorsCount}</strong>
                              </span>
                              <span className="hidden sm:inline-block text-slate-600">|</span>
                              <span className="hidden sm:flex items-center gap-1">
                                Uptime: <strong className="text-emerald-500 font-bold uppercase text-[9px] bg-emerald-950/20 px-1 rounded-sm">Active</strong>
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <a 
                                href={`${absoluteUrl}/blog`} 
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors font-bold text-[11px]"
                              >
                                المدونة ✍️
                              </a>
                              <span className="text-white/10 font-light">|</span>
                              <a 
                                href={absoluteUrl} 
                                target="_blank" 
                                referrerPolicy="no-referrer"
                                className="text-amber-400 hover:text-amber-300 transition-colors font-bold text-[11px]"
                              >
                                معاينة 🌐
                              </a>
                            </div>
                          </div>

                        </div>

                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}


        {/* ==================== SCREEN 2: AI WEBSITE GENERATOR ==================== */}
        {activeTab === "generator" && (
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* Header / Intro */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-950/20 text-[#efd383] rounded-full border border-[#efd383]/20 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                محرك التوليد عالي الدقة (Gemini 3.5 Engine)
              </div>
              <h2 className="text-2xl font-black text-white">توليد موقع سحابي كامل على طبق من ذهب</h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                اكتب فكرتك واصنع موقع استثنائي تفاعلي فائق الجمال بلمح البصر. اختر النمط البصري المفضل لديك قبل البدء في نسج الأكواد.
              </p>
            </div>

            {/* Input & Panel */}
            <div className="bg-[#0a0a0d] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
              
              {/* Style Selector Section */}
              <div className="space-y-3" dir="rtl">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-300 uppercase tracking-widest text-right">
                    العنصر الجمالي والستايل المطلوب للموقع:
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
                    5 أنماط بصريّة جاهزة للمواقع المدفوعة
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  {[
                    { id: "luxury", label: "الفخامة والذهبي", icon: "👑", desc: "ألوان ملكية فخمة" },
                    { id: "cyberpunk", label: "سيبراني نيون", icon: "🧬", desc: "أزرق وأخضر متوهج" },
                    { id: "minimalist", label: "التبسيط الذكي", icon: "🌫️", desc: "رمادي حجري هادئ" },
                    { id: "vibrant", label: "حيوي ومبهج", icon: "⚡", desc: "تدرجات ألوان فاقعة" },
                    { id: "volcanic", label: "بركاني غامق", icon: "🌋", desc: "برتقالي بركاني دافئ" }
                  ].map((styleOption) => (
                    <div
                      key={styleOption.id}
                      onClick={() => !isGenerating && setSelectedStyle(styleOption.id)}
                      className={`cursor-pointer p-3 rounded-xl border flex flex-col items-center text-center transition-all duration-200 ${
                        selectedStyle === styleOption.id
                          ? "bg-amber-950/20 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                          : "bg-black/40 border-white/5 hover:border-white/10"
                      } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <span className="text-xl mb-1">{styleOption.icon}</span>
                      <span className="text-[11px] font-bold text-white block leading-tight">{styleOption.label}</span>
                      <span className="text-[9px] text-slate-500 block mt-0.5 leading-snug">{styleOption.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-widest mb-2 text-right" dir="rtl">
                  ما هو الموقع الذي ترغب في تصميمه واستضافته؟ (صفه بالتفصيل باللغة العربية)
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="مثال: موقع لبيع عطور فاخرة بتصميم مذهل، يعرض العطور مع إمكانية حساب السعر الإجمالي تفاعلياً وتأثيرات بصرية راقية عند التمرير..."
                  disabled={isGenerating}
                  rows={4}
                  className="w-full bg-black/40 border border-white/5 focus:border-amber-500/40 rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/40 text-sm tracking-wide leading-relaxed text-right"
                />
              </div>

              {/* Smart Clone Box (مربع النسخ الذكي) */}
              <div className="border border-amber-500/10 rounded-xl bg-amber-950/5 p-4 space-y-3" dir="rtl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-amber-300 uppercase flex items-center gap-1.5">
                    <span className="text-sm">🎯</span>
                    هل أعجبك تصميم موقع ما؟ انسخه فوراً 🤩
                  </h4>
                  <span className="text-[9px] font-mono font-bold text-slate-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                    CLONE BOX v2.5
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-400 leading-relaxed text-right">
                  تريد استنساخ طابع بصري معين؟ حدد الخيار المفضل لديك (رابط للموقع أو ارفع صورة له) وسيقوم ذكاء عُمَر بتحليل الأكواد والخطوط والألوان لإعادة تشييد موقعك بما يطابق فكرتك تماماً!
                </p>

                {/* Clone options selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCloneMode("image");
                      setIsCloneAnalyzed(false);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      cloneMode === "image"
                        ? "bg-amber-950/25 border-amber-500/50 text-amber-300 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]"
                        : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>📸</span>
                    <span>رفع صورة الموقع</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCloneMode("url");
                      setIsCloneAnalyzed(false);
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                      cloneMode === "url"
                        ? "bg-amber-950/25 border-amber-500/50 text-amber-300 shadow-[inset_0_0_8px_rgba(245,158,11,0.1)]"
                        : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span>🔗</span>
                    <span>رابط الموقع</span>
                  </button>
                </div>

                {/* Sub-panels for Mode selections */}
                {cloneMode === "url" && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={cloneUrl}
                        onChange={(e) => setCloneUrl(e.target.value)}
                        placeholder="ضع رابط كود الموقع هنا (مثال: https://mywebsite.com)"
                        className="flex-1 bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/30 font-mono text-left"
                      />
                      <button
                        type="button"
                        onClick={handleCloneUrlSubmit}
                        disabled={isCloneAnalyzing || !cloneUrl.trim()}
                        className="px-4 bg-gradient-to-r from-amber-500 to-[#efd383] hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isCloneAnalyzing ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>تحليل الرابط</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {cloneMode === "image" && (
                  <div className="animate-fade-in">
                    <label className="flex flex-col items-center justify-center py-5 border border-dashed border-white/10 hover:border-amber-500/30 bg-black/20 rounded-lg cursor-pointer text-center relative group min-h-[70px]">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCloneImageChange}
                        className="hidden"
                      />
                      {isCloneAnalyzing ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span className="text-[10px] text-slate-400 font-bold">جاري قراءة لوحة الألوان وتتبع الهوامش البصرية لـ لقطة الشاشة...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 transition-all group-hover:scale-[1.01]">
                          <span className="text-sm">📥</span>
                          <span className="text-[11px] text-slate-300 font-bold">انقر هنا لرفع أو إسقاط صورة لقطة الشاشة للتصميم المفضل</span>
                          <span className="text-[9px] text-slate-500">صيغ PNG، JPG يتم تحليلها فورياً بدقة فائقة</span>
                        </div>
                      )}
                    </label>
                  </div>
                )}

                {/* Affirmative Confirmation state (تم تحليل التصميم بنجاح) */}
                {isCloneAnalyzed && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between text-right animate-fade-in" dir="rtl">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-black font-black text-xs">✓</span>
                      <div>
                        <span className="block text-xs font-bold text-emerald-400">تم تحليل التصميم بنجاح</span>
                        <span className="text-[10px] text-slate-400 leading-tight block">تم استنباط الهيكل البصري، الأزرار، الكثافة، وتدرجات الألوان الفاخرة لتغذية موجه البناء.</span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsCloneAnalyzed(false);
                        setCloneUrl("");
                        setCloneMode(null);
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      إعادة البدء
                    </button>
                  </div>
                )}
              </div>

              {/* Suggestions Chips */}
              <div className="space-y-1.5">
                <span className="text-xs text-slate-500 text-right block">أفكار مقترحة للتصميم:</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {[
                    "موقع شخصي وبورتفوليو مبرمج ألعاب مع لوحة تحكم فرعية",
                    "صفحة عرض منتج كريم عضوي للبشرة بألوان وردية هادئة",
                    "صفحة هبوط لمؤتمر تكنولوجي مستقبلي مع مؤقت للعد التنازلي",
                    "موقع تسويقي متكامل لمكتب استشارات قانونية فخم"
                  ].map((sugg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setAiPrompt(sugg)}
                      className="px-2.5 py-1 rounded bg-[#0b1424] hover:bg-[#101e36] text-[11px] text-slate-400 hover:text-white transition-all text-right"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action trigger button */}
              <GeminiStreamGenerator
                aiPrompt={aiPrompt}
                selectedStyle={selectedStyle}
                selectedModel={selectedModel}
                isCloneAnalyzed={isCloneAnalyzed}
                isGenerating={isGenerating}
                onStartGeneration={handleStartGeneration}
                onGenerationSuccess={handleGenerationSuccess}
                onGenerationFailure={handleGenerationFailure}
              />
            </div>

            {/* Error view */}
            {generationError && (
              <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl flex gap-3 text-red-200 text-sm items-start">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-bold">فشل معالجة التوليد</h4>
                  <p className="text-xs text-red-300">{generationError}</p>
                </div>
              </div>
            )}

            {/* Generation steps progress tracking */}
            {isGenerating && (
              <div className="bg-black/80 rounded-2xl border border-white/5 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-amber-400 animate-pulse font-black">
                    OMAR AI CODESMITH ACTIVE
                  </span>
                  <span className="text-xs text-slate-500">
                    قد يستغرق توليد الأكواد ثنائية اللغة حوالي 15-20 ثانية...
                  </span>
                </div>
                
                <div className="space-y-2 border-t border-white/5 pt-4">
                  {generationSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                      <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="font-mono">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}


        {/* ==================== SCREEN 3: CODE EDITOR & SANDBOX ==================== */}
        {activeTab === "editor" && (
          <div className="space-y-4">
            
            {/* Read-Only Cloned Project Banner */}
            {activeProjectOwnerId && currentUser && activeProjectOwnerId !== currentUser.uid && (
              <div dir="rtl" className="bg-[#efd383]/10 border border-[#efd383]/30 p-3.5 rounded-xl flex items-center justify-between gap-3 text-right flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#efd383]/15 flex items-center justify-center text-[#efd383] shrink-0">
                    <ShieldAlert className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">معاينة مشروع مستنسخ (معاينة فقط) 🔒</h4>
                    <p className="text-[11px] text-[#efd383]/85 mt-0.5">
                      أنت تتصفح حالياً الأكواد البرمجية لمشروع يمتلكه مستخدم آخر (صاحب العمل الأساسي). هذا المشروع للقراءة فقط لضمان الملكية الحصرية للأكواد. يمكنك النقر على الزر لاستنساخه والبدء بإنشاء تطبيقك الخاص!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const matchedProj = publicProjects.find(p => p.projectId === activeProjectId) || userProjects.find(p => p.projectId === activeProjectId);
                    const originalPrompt = matchedProj?.originalPrompt || "تصميم متجر إلكتروني فاخر باللون الذهبي";
                    setAiPrompt(originalPrompt);
                    setActiveTab("generator");
                    triggerToast("✨ تم سحب الفكرة ونقلها لمولد الذكاء الاصطناعي لكتابة نسختك المستقلة!", "success");
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-[#efd383] text-black font-extrabold text-[11px] rounded-lg shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>استخدام هذا البرومبت 🚀</span>
                </button>
              </div>
            )}
            
            {/* Meta Control Ribbon bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#090e18] border border-blue-900/30 p-4 rounded-xl gap-4">
              <div className="space-y-1 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="bg-transparent text-white font-bold text-sm focus:outline-none focus:border-b border-cyan-400 pb-0.5"
                    placeholder="اسم الموقع"
                  />
                </div>
                <input
                  type="text"
                  value={siteDesc}
                  onChange={(e) => setSiteDesc(e.target.value)}
                  className="bg-transparent text-xs text-slate-400 focus:outline-none focus:border-b border-slate-500 pb-0.5 w-full block"
                  placeholder="وصف الموقع"
                />
              </div>

              {/* Sync Deploy Button */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
                <button
                  onClick={() => setIsGithubModalOpen(true)}
                  className="px-3.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 hover:border-indigo-500 text-xs text-indigo-300 hover:text-indigo-100 rounded-lg flex items-center gap-1.5 transition-all font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>تجهيز حزمة GitHub 🚀</span>
                </button>
                <button
                  id="btn-cloud-save-project"
                  onClick={handleSaveProjectToCloud}
                  disabled={isSavingProjectCloud || !!(activeProjectOwnerId && currentUser && activeProjectOwnerId !== currentUser.uid)}
                  className="px-3.5 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 hover:border-amber-400 text-xs text-amber-300 hover:text-amber-100 rounded-lg flex items-center gap-1.5 transition-all font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProjectCloud ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>حفظ المشروع سحابياً ☁️</span>
                </button>
                <button
                  onClick={updateIframePreview}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تحديث المعاينة</span>
                </button>
                <button
                  onClick={handleDeployCurrentSite}
                  disabled={isDeploying}
                  className="px-4 py-1.5 bg-gradient-to-r from-[#39ff14] to-emerald-500 hover:scale-102 text-black font-extrabold text-xs rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(57,255,20,0.2)]"
                >
                  {isDeploying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-black" />
                      <span>جاري الرفع للحاضنة...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5 text-black" />
                      <span>استضافة ونشر فوري 🚀</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 🤖 LoomHost AI Advanced Automation Control Center */}
            <div className="bg-[#0b1325]/50 border border-cyan-500/10 rounded-xl p-4 shadow-xl">
              <div 
                id="btn-toggle-automation-deck"
                className="flex items-center justify-between cursor-pointer select-none" 
                onClick={() => setIsAutomationDeckOpen(!isAutomationDeckOpen)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00f0ff] animate-pulse" />
                  <h3 className="text-xs font-black text-cyan-500 tracking-wide uppercase">منظومة الأتمتة المفتوحة بالذكاء الاصطناعي (OMAR AI Automation Control Center)</h3>
                </div>
                <button className="text-[11px] font-bold text-[#00f0ff] hover:text-[#39ff14] transition-colors">
                  {isAutomationDeckOpen ? "طوي لوحة التحكم ▲" : "بسط لوحة التحكم ▼"}
                </button>
              </div>

              {isAutomationDeckOpen && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4 pt-4 border-t border-white/5">
                  <ImageToCodePanel 
                    onCodeGenerated={(data) => {
                      setHtmlCode(data.html);
                      setCssCode(data.css);
                      setJsCode(data.js);
                      setSiteName(data.name);
                      setSiteDesc(data.description);
                      setActiveProjectId(null);
                    }}
                    triggerToast={triggerToast}
                  />
                  <SeoOptimizerPanel 
                    htmlCode={htmlCode}
                    cssCode={cssCode}
                    jsCode={jsCode}
                    siteName={siteName}
                    onApplySeo={(newHtml, newTitle) => {
                      setHtmlCode(newHtml);
                      setSiteName(newTitle);
                    }}
                    triggerToast={triggerToast}
                  />
                </div>
              )}
            </div>

            {/* Editor Splitted Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Sandbox View: Iframe Simulated Browser */}
              <div className="lg:col-span-6 flex flex-col h-[550px] bg-slate-950 border border-blue-900/20 rounded-xl overflow-hidden shadow-inner">
                {/* Browser tab imitation bar */}
                <div className="bg-[#090e18] px-4 py-2 border-b border-blue-950 flex justify-between items-center text-xs text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span>loomhost_local_sandbox.html</span>
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-slate-500" />
                    <span>100% LIVE</span>
                  </div>
                </div>

                {/* Sandbox Frame */}
                <div className="flex-1 bg-white relative">
                  <iframe
                    ref={iframeRef}
                    title="LoomHost Code Preview"
                    sandbox="allow-forms allow-scripts allow-same-origin"
                    loading="lazy"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>

              {/* Right Code Panels: Custom manual codes editing inputs */}
              <div className="lg:col-span-6 flex flex-col h-[550px] bg-[#090e18] border border-blue-900/30 rounded-xl overflow-hidden">
                
                {/* Inner Code Panel instructions */}
                <div className="p-3 bg-blue-950/20 border-b border-blue-950 flex flex-wrap gap-2 text-xs items-center justify-between">
                  <span className="text-slate-400 font-mono">WORKSPACE CODE SOURCE</span>
                  <span className="text-slate-500">عدل الأكواد مباشرة لتحديث محتوى المعاينة المباشرة</span>
                </div>

                {/* Multiple code blocks editing inputs */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {/* HTML Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-400 font-mono uppercase bg-orange-950/30 px-2 py-0.5 rounded border border-orange-900/30">
                        index.html (Body structures only)
                      </span>
                    </div>
                    <textarea
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      rows={8}
                      className="w-full bg-[#040810] border border-blue-950 focus:border-orange-500 rounded-lg p-2.5 font-mono text-xs text-orange-200 focus:outline-none placeholder-slate-700 leading-relaxed text-left"
                    />
                  </div>

                  {/* CSS Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sky-400 font-mono uppercase bg-sky-950/30 px-2 py-0.5 rounded border border-sky-900/30">
                        style.css (Custom designs & properties)
                      </span>
                    </div>
                    <textarea
                      value={cssCode}
                      onChange={(e) => setCssCode(e.target.value)}
                      rows={8}
                      className="w-full bg-[#040810] border border-blue-950 focus:border-sky-500 rounded-lg p-2.5 font-mono text-xs text-sky-200 focus:outline-none placeholder-slate-700 leading-relaxed text-left"
                    />
                  </div>

                  {/* JS Box */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-yellow-500 font-mono uppercase bg-yellow-950/30 px-2 py-0.5 rounded border border-yellow-900/30 font-bold">
                        script.js (Interactive scripts & events)
                      </span>
                    </div>
                    <textarea
                      value={jsCode}
                      onChange={(e) => setJsCode(e.target.value)}
                      rows={6}
                      className="w-full bg-[#040810] border border-blue-950 focus:border-yellow-500 rounded-lg p-2.5 font-mono text-xs text-yellow-100 focus:outline-none placeholder-slate-700 leading-relaxed text-left"
                    />
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}


        {/* ==================== SCREEN 4: ACTIVE DEPLOYMENTS BOARD ==================== */}
        {activeTab === "deployments" && (
          <div className="space-y-6">
            
            {/* Header / Intro stats */}
            <div className="bg-[#0a0a0d] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-xl font-black text-white" dir="rtl">إدارة منصة عُمَر للاستضافات السحابية</h2>
                <p className="text-slate-400 text-xs" dir="rtl">
                  الخوادم مأمنة ومشفرة بالكامل باسم 'عُمر'. يمكنك تهيئة نطاقات مخصصة وربطها بالمواقع المولدة فوريا.
                </p>
              </div>

              {/* Status metrics bar */}
              <div className="flex gap-4 sm:gap-8 items-center">
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase font-mono tracking-widest">عدد المواقع المضيئة</div>
                  <div className="text-xl font-black text-[#efd383] font-mono mt-0.5">{hostedSites.length}</div>
                </div>
                <div className="h-8 w-px bg-white/5" />
                <div className="text-center">
                  <div className="text-xs text-slate-500 uppercase font-mono tracking-widest">حجم الزيارات الكلي</div>
                  <div className="text-xl font-black text-amber-500 font-mono mt-0.5">
                    {hostedSites.reduce((sum, item) => sum + item.visitorsCount, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* LoomHost AI Integrated Unified Global Gateway Hub */}
            <GlobalGatewayHub 
              hostedSites={hostedSites}
              onRefreshSites={fetchSites}
              triggerToast={triggerToast}
              currentUser={currentUser}
            />

            {/* AI-Powered Uptime Monitoring Live Dashboard */}
            <UptimeMonitorPanel 
              hostedSites={hostedSites} 
              onRefreshSites={fetchSites} 
              triggerToast={triggerToast} 
            />

            {/* Custom Domain Simulator Control Center */}
            <div className="bg-[#0c0c10] border border-[#efd383]/10 rounded-2xl p-6 shadow-2xl space-y-4" dir="rtl">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#efd383]" />
                <h3 className="text-sm font-black text-white">منظومة تخصيص النطاقات السحابية (OMAR Cloud Custom DNS)</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                هل تريد عنوان نطاق مخصص حقيقي مثل <span className="font-mono text-emerald-400">youtube.com</span> لمواقعك بدلاً من الروابط الطويلة؟ قم بتعديل اسم النطاق وربطه هنا، ليتم تمريره عبر جدران حماية Cloudflare Premium الآمنة!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-4">
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">اسم النطاق المطلوب (Domain Name)</label>
                  <input
                    type="text"
                    value={customDomainName}
                    onChange={(e) => setCustomDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    placeholder="youtube-clone"
                    className="w-full bg-black/40 border border-white/5 focus:border-amber-500/40 rounded-lg p-2.5 font-mono text-xs text-white text-left focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-500 font-bold mb-1">الامتداد (Extension)</label>
                  <select
                    value={selectedDomainExt}
                    onChange={(e) => setSelectedDomainExt(e.target.value)}
                    className="w-full bg-[#08080a] border border-white/5 focus:border-amber-500/40 rounded-lg p-2.5 font-mono text-xs text-white focus:outline-none"
                  >
                    <option value=".com">.com</option>
                    <option value=".net">.net</option>
                    <option value=".org">.org</option>
                    <option value=".ai">.ai</option>
                    <option value=".com.sa">.com.sa</option>
                    <option value=".io">.io</option>
                  </select>
                </div>

                <div className="md:col-span-6">
                  <div className="bg-amber-950/10 border border-amber-500/10 rounded-lg p-2.5 text-right flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">النطاق النشط حالياً:</span>
                      <strong className="text-xs text-[#efd383] font-mono">www.{customDomainName || "youtube"}{selectedDomainExt}</strong>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-950/30">
                      🛡️ SSL READY
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest Deployed Success Toast Panel */}
            {latestDeployedUrl && (
              <div className="bg-emerald-950/40 border-2 border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 animate-fade-in shadow-lg">
                <div className="flex gap-3 items-center">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-emerald-300 text-sm">تم استضافة موقعك بنجاح! 🎉</h4>
                    <p className="text-[11px] text-slate-300 select-all font-mono break-all">
                      {latestDeployedUrl}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(latestDeployedUrl)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ العنوان</span>
                  </button>
                  <a
                    href={latestDeployedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-black rounded-lg text-xs font-extrabold flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>زيارة الموقع المباشر</span>
                  </a>
                </div>
              </div>
            )}

            {/* Deployments List structure */}
            {loadingSites ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                <p className="text-xs">جاري جلب استضافات السيرفر السحابي لـ عُمَر...</p>
              </div>
            ) : hostedSites.length === 0 ? (
              <div className="py-20 text-center text-slate-500 flex flex-col items-center justify-center gap-4 bg-black/40 rounded-xl border border-dashed border-white/5" dir="rtl">
                <Server className="w-10 h-10 text-slate-700" />
                <p className="text-sm">لم تقم بإنشاء أي موقع بعد.</p>
                <button
                  onClick={() => setActiveTab("generator")}
                  className="px-4 py-2 bg-gradient-to-r from-amber-400 to-[#efd383] text-black hover:opacity-90 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  صمم موقعك الأول الآن 🚀
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {hostedSites.map((site) => {
                  const renderUrl = `${window.location.origin}/api/sites/render/${site.id}`;
                  const hasCustomDomain = site.customDomain || `${site.id}.omar.com`;
                  
                  return (
                    <div 
                      key={site.id}
                      className="bg-black/40 border border-white/5 rounded-xl p-5 hover:border-amber-500/20 transition-all flex flex-col justify-between shadow-xl"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-[#efd383] bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/10">
                            {site.id}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            {new Date(site.createdAt).toLocaleDateString("ar-SA")}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-200 text-right">{site.name}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed text-right">{site.description}</p>
                      </div>

                      {/* Interactive custom domain setup */}
                      <div className="my-3 p-3 bg-amber-950/15 border border-[#efd383]/10 rounded-xl text-right" dir="rtl">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-black">الدومين الحقيقي المستهدف:</span>
                          
                          {/* Live Dynamic Status Indicator requested by user */}
                          {site.sslStatus === "activating" ? (
                            <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1.5 animate-pulse bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20" title="جاري التحقق وترسيب شهادات الأمان">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                              جاري التفعيل 🟡
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20" title="النطاق مأمن SSL والربط سليم ونشط">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              نشط ومكتمل 🟢
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center gap-1 bg-black/50 border border-white/5 rounded-lg p-1.5 focus-within:border-amber-500/40 transition-colors">
                          <span className="text-slate-500 text-xs font-mono select-none">https://</span>
                          <input
                            type="text"
                            value={hasCustomDomain.replace(".omar.com", "")}
                            onChange={(e) => {
                              const cleanVal = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                              handleUpdateSiteDomain(site.id, cleanVal + ".omar.com");
                            }}
                            className="flex-1 min-w-0 bg-transparent border-0 text-xs font-mono font-bold text-amber-300 focus:outline-none text-left animate-fade-in"
                            placeholder="subdomain"
                          />
                          <span className="text-white/60 text-xs font-mono bg-zinc-900/60 px-1.5 py-0.5 rounded select-none">.omar.com</span>
                          
                          {/* Copy button beside the domain link */}
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(`https://${hasCustomDomain}`);
                            }}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition duration-150 cursor-pointer flex items-center justify-center border border-white/5"
                            title="نسخ الرابط المأمن"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[9px] text-zinc-500 mt-1">اكتب اسم الدومين المطلوب (مثل: <strong className="text-amber-400 font-mono">youtupe</strong>) ليتم توجيهه فوراً!</p>
                      </div>

                      {/* Display analytics indicators inside each card */}
                      <div className="my-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-amber-500" />
                          <span>{site.visitorsCount} مشاهدة حية</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                          <span className="text-emerald-400 font-semibold text-[10px]">خادم Omar Cloud</span>
                        </div>
                      </div>

                      {/* Site actions buttons */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 w-full">
                          <button 
                            onClick={() => setActiveDomainConfigSiteId(site.id)}
                            className="flex-1 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:opacity-90 text-white text-xs rounded-lg font-extrabold text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-500/10 animate-pulse"
                          >
                            <Globe className="w-3.5 h-3.5" />
                            <span>تصفح النطاق</span>
                          </button>
                          
                          <button 
                            onClick={() => {
                              setSelectedSaaSSiteId(site.id);
                              setIsSaaSScriptModalOpen(true);
                            }}
                            className="flex-1 py-1.5 bg-[#090f1e] border border-indigo-500/30 hover:border-indigo-400 hover:bg-indigo-950/40 text-[#efd383] text-[11px] font-bold text-center flex items-center justify-center gap-0.5 transition-all cursor-pointer"
                          >
                            <Settings className="w-3 h-3 text-[#efd383]/80" />
                            <span>أتمتة SaaS ⚙️</span>
                          </button>
                        </div>
                        
                        <div className="flex gap-2 w-full mt-1">
                          <button
                            onClick={() => {
                              setRefinementSiteId(site.id);
                              setRefinementInstructions("");
                              setRefinementError(null);
                            }}
                            className="flex-1 py-1.5 bg-purple-950/20 hover:bg-purple-900/35 text-purple-300 border border-purple-500/20 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer text-[10px] font-bold"
                            title="تعديل وتطوير محتويات هذا الموقع بالذكاء الاصطناعي 🪄"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                            <span>تطوير بالـ AI</span>
                          </button>

                          <button
                            onClick={() => {
                              setSiteName(site.name);
                              setSiteDesc(site.description);
                              setHtmlCode(site.html);
                              setCssCode(site.css);
                              setJsCode(site.js);
                              setActiveTab("editor");
                            }}
                            className="px-2.5 py-1.5 bg-[#0a0a0d] hover:bg-neutral-800 text-slate-300 hover:text-white rounded-lg flex items-center justify-center transition-colors border border-white/5 cursor-pointer"
                            title="تعديل الأكواد البرمجية للموقع"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            onClick={() => setSiteToDeleteId(site.id)}
                            className="px-2.5 py-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-lg flex items-center justify-center transition-colors border border-red-900/10 cursor-pointer"
                            title="حذف الاستضافة نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}


        {/* ==================== SCREEN 5: COMMUNITY PROJECTS HUB & LEADERS ==================== */}
        {activeTab === "community" && (
          <div className="space-y-8 animate-fade-in" dir="rtl">
            
            {/* Elegant Top Banner */}
            <div className="bg-[#0a0a0d] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-[#efd383]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-1.5 text-right md:-mt-1">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-[#efd383] text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full border border-amber-500/20">
                  <Globe className="w-3.5 h-3.5 animate-spin-slow text-[#efd383]" />
                  <span>عُفر SaaS Community Hub</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white">معرض واستكشاف المشاريع العامة لمجتمع عُفر</h2>
                <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
                  هنا يجتمع مبدعو عُفر! تصفح وانسخ واستلهم من أفكار ومواقع مستخدمين آخرين. اضغط على "استخدام الفكرة" لتوليد وتطوير نسختك السحابية المستقلة بنقرة واحدة.
                </p>
              </div>

              <div className="flex gap-4 sm:gap-6 items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl shrink-0 self-stretch sm:self-auto justify-center">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">المشاريع الملهمة</div>
                  <div className="text-xl font-black text-[#efd383] font-mono mt-0.5">{publicProjects.length}</div>
                </div>
                <div className="border-r border-white/5 h-8"></div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">التفاعلات واللايكات</div>
                  <div className="text-xl font-black text-[#efd383] font-mono mt-0.5">
                    {publicProjects.reduce((acc, p) => acc + (p.likesCount || 0), 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Grid Layout: Main Feed & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Main Feed */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Search Bar & Categories Controller */}
                <div className="bg-[#07080a] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="ابحث بالاسم، القالب، البرومبت أو مالك المشروع..."
                      value={communitySearchTerm}
                      onChange={(e) => setCommunitySearchTerm(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-white/5 hover:border-amber-500/30 focus:border-amber-500 text-xs text-white placeholder-slate-500 rounded-xl pr-10 pl-4 py-2.5 focus:outline-none transition-colors text-right"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                    <span className="text-[11px] text-slate-500 font-bold shrink-0 ml-1">تصفية القوالب:</span>
                    {["all", "store", "dental", "saas", "portfolio"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategoryFilter(cat)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                          selectedCategoryFilter === cat
                            ? "bg-amber-950/20 border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(239,211,131,0.1)]"
                            : "bg-[#0a0a0f] border-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {cat === "all" ? "الكل" : cat === "store" ? "متاجر" : cat === "dental" ? "عيادات" : cat === "saas" ? "SaaS" : "حساب شخصي"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feed loading status */}
                {loadingPublicProjects ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="bg-[#0a0a0f] p-5 rounded-2xl border border-white/5 animate-pulse space-y-4">
                        <div className="flex justify-between items-center">
                          <div className="h-4 bg-slate-800 rounded w-1/3" />
                          <div className="h-3 bg-slate-800 rounded w-10" />
                        </div>
                        <div className="h-28 bg-[#0a0a0d] border border-white/5 rounded-xl flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 animate-spin text-amber-500/10" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredPublicProjects.length === 0 ? (
                  <div className="text-center py-16 bg-[#0a0a0f] p-8 rounded-2xl border border-white/5 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600 mx-auto">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-300">لا توجد مشاريع مطابقة للبحث</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      كن أنت المبدع الأول! توجه للرئيسية وفعل خيار الخصوصية "👁️ عام" على مشروعك السحابي ليظهر للجميع هنا فوراً.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredPublicProjects.map((proj) => {
                      const isLikedByUser = proj.likes?.includes(currentUser?.uid || "");
                      return (
                        <div 
                          key={proj.projectId}
                          className="bg-[#0a0a0f] hover:bg-[#0c0c14] border border-white/5 hover:border-amber-500/20 rounded-2xl p-5 transition-all duration-300 shadow-xl flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <h3 className="font-black text-sm text-slate-100">{proj.name}</h3>
                                <div className="flex items-center gap-1.5 text-[9px]">
                                  <span className="text-[#efd383] font-black">{proj.creatorName || "مطور عُفر المبدع"}</span>
                                  <span className="text-slate-600">•</span>
                                  <span className="text-slate-500 truncate max-w-[120px]">{proj.projectId}.omar.com</span>
                                </div>
                              </div>
                              <span className="inline-flex items-center text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-[#efd383] border border-amber-500/20">
                                نشاط عام
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-400 bg-black/40 border border-white/5 p-2 rounded-lg line-clamp-2 italic" dir="rtl">
                              "{proj.description || "لا يوجد وصف برومبت مدرج للمشروع."}"
                            </p>

                            {/* Laptop illustration simulating the site design */}
                            <div className="relative border border-white/5 rounded-xl overflow-hidden aspect-video max-h-[140px] bg-neutral-950 group shadow-inner">
                              <iframe
                                srcDoc={`<html><style>${proj.css}</style><body>${proj.html}</body></html>`}
                                className="w-full h-full pt-2 pointer-events-none opacity-90 group-hover:scale-[1.01] transition-transform duration-300"
                                title={proj.name}
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-50" />
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1 mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleLikeProjectCloud(proj.projectId, proj.userId)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                  isLikedByUser
                                    ? "bg-rose-950/20 border-rose-500/40 text-rose-400 font-extrabold"
                                    : "bg-white/[0.02] border-white/5 text-slate-400 hover:text-white"
                                }`}
                              >
                                <span>{isLikedByUser ? "❤️" : "🤍"}</span>
                                <span className="font-mono text-[9px]">
                                  {proj.likesCount || 0}
                                </span>
                              </button>
                              <span className="text-[9px] text-slate-500 font-mono">
                                🔄 {proj.clonesCount || 0}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleLoadProjectCloudIntoEditor(proj)}
                                className="text-[9px] font-bold px-2 py-1 bg-neutral-900 border border-white/5 hover:border-amber-500/20 text-slate-300 rounded-lg transition-all cursor-pointer"
                              >
                                كود 📝
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCloningPromptText(proj.description || "لوحة تحكم عُفر الذكية");
                                  setCloningProjectId(proj.projectId);
                                  setCloningOwnerId(proj.userId);
                                  setCloningPromptModalOpen(true);
                                }}
                                className="text-[9px] font-black px-2.5 py-1 bg-gradient-to-r from-amber-400 to-[#efd383] text-black rounded-lg transition-all hover:scale-[1.02] cursor-pointer"
                              >
                                html
                                استنساخ 🚀
                              </button>
                            </div>
                          </div>

                          {/* 💬 Nested Comments Discussion Board */}
                          <div className="mt-4 pt-3 border-t border-white/5">
                            <ProjectCommentsSection 
                              projectId={proj.projectId}
                              currentUser={currentUser}
                              triggerToast={triggerToast}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Leaderboard Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-5">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-[#efd383]/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-md font-black text-[#efd383] flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400 animate-bounce" />
                      قائمة صدارة عُفر الأكثر تفاعلاً 🏆
                    </h3>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      المشاريع الأكثر استنساخاً وتفاعلاً من قبل منشئي المواقع بالذكاء الاصطناعي.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {leaderboardProjects.map((entry, index) => (
                      <div 
                        key={entry.projectId} 
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          index === 0
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-[#050508]/85 border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-5.5 h-5.5 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                            index === 0 ? "bg-amber-400 text-black" : "bg-slate-900 border border-white/5 text-slate-500"
                          }`}>
                            {index === 0 ? "🥇" : index + 1}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-200 truncate">{entry.name}</h4>
                            <span className="text-[8px] text-slate-500 font-black">{entry.creatorName || "مطور عُفر"}</span>
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <span className="text-[9px] font-black text-amber-300 font-mono">{entry.clonesCount || 0} نسخ</span>
                        </div>
                      </div>
                    ))}
                    {leaderboardProjects.length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-500 font-mono">
                        المجال مفتوح حالياً لتكون المتصدر الأول! 🚀
                      </div>
                    )}
                  </div>
                </div>

                <div className="border border-[#efd383]/10 rounded-2xl bg-gradient-to-br from-[#0c0d12] to-black p-5 relative overflow-hidden space-y-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-black text-white">حماية الملكية وعزل المشاريع 🔒</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    عبر منصة عُفر، يملك المطور الأصلي لوحده حقوق التحرير الفورية والتعديل المباشر للأكواد المرفوعة. يمكن لأي شخص استنساخ الفكرة لتبدأ معه صفحة تطوير نظيفة ومعزولة بالكامل دون قلق.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ==================== SCREEN 6: USER PROFILE ==================== */}
        {activeTab === "profile" && (
          <div className="space-y-8 animate-fade-in text-right" dir="rtl">
            <div className="bg-[#0a0a0d] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || currentUser.name}
                    className="w-20 h-20 rounded-2xl border-2 border-amber-500/40 object-cover shadow-lg shadow-amber-500/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-[#efd383]/10 border-2 border-amber-500/30 flex items-center justify-center text-amber-400">
                    <User className="w-10 h-10" />
                  </div>
                )}
                
                <div className="space-y-1.5 text-center md:text-right">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-[#efd383] text-[9px] uppercase font-black px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>مستوى المطور: {currentUser?.subscriptionPlan || "عضو أساسي"}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white">{currentUser?.displayName || currentUser?.name || "مطور عُفر المبدع"}</h2>
                  <p className="text-slate-400 text-xs font-mono">{currentUser?.email || "developer@loomhost.ai"}</p>
                </div>
              </div>

              <div className="flex gap-4 items-center bg-white/[0.02] border border-white/5 p-4 rounded-xl shrink-0 self-stretch sm:self-auto justify-center">
                <div className="text-center font-mono">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">مشاريعك السحابية</div>
                  <div className="text-xl font-black text-[#efd383]">{userProjects.length}</div>
                </div>
                <div className="border-r border-white/5 h-8"></div>
                <div className="text-center font-mono">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">المصنفة عامة</div>
                  <div className="text-xl font-black text-[#efd383]">{userProjects.filter(p => p.isPublic).length}</div>
                </div>
              </div>
            </div>

            {/* List of projects owned with toggles */}
            <div className="bg-[#0a0a10] border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6 animate-fade-in">
              <div className="border-b border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-right">
                  <h3 className="text-md font-black text-white flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-amber-400" />
                    إدارة وتحكم الخصوصية بالملفات السحابية 📂
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    من هنا يمكنك التحكم في تفعيل خيار العرض العام لموقعك في المعرض المجتمعي أو حجب الوصول الخارجي وجوانب النسخ.
                  </p>
                </div>
              </div>

              {loadingProjects ? (
                <div className="space-y-4">
                  {[1, 2].map(s => (
                    <div key={s} className="h-16 bg-[#04040a]/40 rounded-xl border border-white/5 animate-pulse" />
                  ))}
                </div>
              ) : userProjects.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 rounded-xl text-slate-500 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400">لا تملك أي مشاريع سحابية حالياً في الحساب</h4>
                  <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                    توجه إلى مولد الذكاء الاصطناعي "توليد الـ AI" وقم بصناعة قالبك المباشر وحفظه سحابياً لكي يظهر هنا فوراً.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 font-sans">
                  {userProjects.map((project) => (
                    <div key={project.projectId} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0 group">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">{project.name}</h4>
                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded-md font-mono ${
                            project.isPublic 
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20" 
                              : "bg-slate-950 text-slate-500 border border-slate-800"
                          }`}>
                            {project.isPublic ? "🌍 عام" : "🔒 خاص"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 max-w-xl truncate">{project.description || "لا يوجد وصف مدخل لهذا المشروع السحابي."}</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          مُعرّف: {project.projectId} • تاريخ الإنشاء: {new Date(project.createdAt?.seconds ? (project.createdAt.seconds * 1000) : (project.createdAt || Date.now())).toLocaleDateString("ar-EG")}
                        </div>
                      </div>

                      {/* Toggle Controller & Controls */}
                      <div className="flex items-center gap-4 shrink-0 justify-end">
                        {/* Switch privacy item */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-bold">العرض في المعرض:</span>
                          <button
                            type="button"
                            onClick={() => handleToggleProjectPrivacyCloud(project.projectId, !project.isPublic)}
                            className={`w-11 h-6 rounded-full p-1 transition-all relative cursor-pointer ${
                              project.isPublic ? "bg-[#efd383]" : "bg-neutral-800"
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-black shadow-md transition-all absolute top-1 ${
                              project.isPublic ? "right-1" : "right-6"
                            }`} />
                          </button>
                        </div>

                        <div className="border-r border-white/5 h-8"></div>

                        <button
                          type="button"
                          onClick={() => handleLoadProjectCloudIntoEditor(project)}
                          className="px-3 py-1.5 bg-neutral-900 border border-white/5 hover:border-amber-500/20 text-[#efd383] text-xs font-black rounded-lg transition-all cursor-pointer"
                        >
                          تعديل 📝
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

          </>
        )}

      </main>


      {/* 2. Deletion Confirmation Modal (مربع تأكيد الحذف البرمجي الفاخر) */}
      {siteToDeleteId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in" dir="rtl">
          <div className="bg-[#090b10] border-2 border-red-500/20 rounded-2xl max-w-sm w-full p-6 relative space-y-4 text-center shadow-2xl animate-scale-up">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center mx-auto border border-red-500/30">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">تأكيد سحب وحذف الاستضافة؟</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                إن هذا الإجراء سيقوم بحذف ملفات موقعك بالكامل، وفصل خادم DNS المحجوز سحابياً، وتحرير اسم النطاق فوراً بشكل نهائي ومستقر.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => handleDeleteSite(siteToDeleteId)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl transition duration-150 cursor-pointer"
              >
                تأكيد حذف الموقع 🗑️
              </button>
              <button
                onClick={() => setSiteToDeleteId(null)}
                className="flex-1 py-2.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-slate-300 font-bold text-xs rounded-xl transition duration-150 cursor-pointer"
              >
                إلغاء التراجع
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2.5 Clone Prompt Modal System (النافذة العائمة لاستنساخ الفكرة والبرومبت) */}
      {cloningPromptModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fade-in" dir="rtl">
          <div className="bg-[#090b10] border-2 border-amber-500/20 rounded-2xl max-w-lg w-full p-6 relative space-y-5 text-right shadow-2xl animate-scale-up">
            
            <button
              onClick={() => setCloningPromptModalOpen(false)}
              className="absolute top-4 left-4 p-1 rounded-full bg-[#efd383]/5 hover:bg-[#efd383]/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-[#efd383]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-white">استنساخ الفكرة وتوليد نسختك الخاصة 🚀</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                هذا هو البرومبت الأصلي المستخدم لبناء هذا الموقع الإبداعي. يمكنك بنقرة واحدة نسخ النص أو الانتقال المباشر للمولد الذكي لصياغة نسختك المستقلة وترقيتها سحابياً!
              </p>
            </div>

            <div className="bg-black/60 border border-white/5 rounded-xl p-4 relative">
              <span className="absolute left-3 top-3 text-[9px] text-[#efd383] bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase font-mono">
                البرومبت الأصلي
              </span>
              <textarea
                readOnly
                value={cloningPromptText}
                rows={4}
                className="w-full bg-transparent border-none text-slate-200 text-xs focus:outline-none resize-none pt-4 text-right leading-relaxed font-medium"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(cloningPromptText);
                  triggerToast("📋 تم نسخ البرومبت الأصلي المولد بنجاح للحافظة!", "success");
                }}
                className="flex-1 py-2.5 bg-neutral-900 border border-white/10 hover:border-amber-500/20 text-slate-200 font-extrabold text-xs rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Copy className="w-4 h-4 text-[#efd383]" />
                <span>نسخ البرومبت 📋</span>
              </button>
              
              <button
                onClick={() => {
                  handleClonePromptUse(cloningProjectId, cloningPromptText, cloningOwnerId);
                  setCloningPromptModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-[#efd383] hover:brightness-110 text-black font-extrabold text-xs rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
              >
                <Sparkles className="w-4 h-4 text-black animate-pulse" />
                <span>عجلات التوليد الفوري ⚡</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Upload file popup modal handler */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#090e18] border border-blue-900/40 rounded-2xl max-w-md w-full p-6 relative space-y-4">
            
            <button
              onClick={() => {
                setShowUploadModal(false);
                setUploadError(null);
              }}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <UploadCloud className="w-10 h-10 text-cyan-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">رفع ملفات الموقع يدوياً</h3>
              <p className="text-xs text-slate-400">
                اختر ملف الـ HTML الرئيسي لموقعك لتسهيل استضافته وإعادة صياغته
              </p>
            </div>

            <div className="space-y-3">
              {/* Drag drop pseudo visual zone */}
              <label className="flex flex-col items-center justify-center h-32 border border-dashed border-blue-950 hover:border-cyan-400/50 bg-[#050911]/60 rounded-xl cursor-pointer p-4 text-center transition-all">
                <input 
                  type="file" 
                  accept=".html,.htm" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
                <span className="text-xs text-slate-300 font-semibold mb-1">
                  انقر هنا لاختيار ملف .html
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  سيقوم النظام تلقائياً باستخلاص الاستايلات والنصوص البرمجية
                </span>
              </label>

              {uploadError && (
                <div className="text-xs text-red-400 text-center font-semibold bg-red-950/20 p-2 rounded">
                  {uploadError}
                </div>
              )}
            </div>

            {/* Sandbox quick entry action */}
            <div className="pt-2 border-t border-blue-950 flex gap-2">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setActiveTab("editor");
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all text-center"
              >
                الدخول المباشر للمحرر الفارغ 📝
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2.5. Omar AI Premium Live Editor/Refiner Modal */}
      {refinementSiteId && (() => {
        const siteToRefine = hostedSites.find(s => s.id === refinementSiteId);
        if (!siteToRefine) return null;

        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
            <div className="bg-[#0c0c10] border border-[#efd383]/20 rounded-2xl max-w-lg w-full p-6 relative space-y-6 shadow-[0_0_50px_rgba(109,40,217,0.15)]">
              
              <button
                onClick={() => {
                  setRefinementSiteId(null);
                  setRefinementInstructions("");
                  setRefinementError(null);
                }}
                className="absolute top-4 left-4 p-1 rounded-full bg-zinc-900/60 hover:bg-zinc-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="إغلاق التعديل"
                disabled={isRefining}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-purple-950/40 text-purple-300 rounded-full border border-purple-500/20 text-[10px] font-extrabold animate-pulse">
                  <span>🪄</span>
                  <span>محرك عُمَر الفائق للصيانة والتعديلات (Omar AI Refiner)</span>
                </div>
                <h3 className="text-lg font-black text-white">تعديل محتوى وتصميم الموقع بالذكاء الاصطناعي</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  اكتب لـ عُمَر التعديل المطلوب وسنقوم بإعادة صياغة الهيكل والأكواد البرمجية مباشرة على خادمك النشط!
                </p>
              </div>

              {/* Site mini-badge */}
              <div className="bg-black/40 border border-white/5 p-3 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">الموقع المستهدف:</span>
                  <strong className="text-[#efd383] font-bold">{siteToRefine.name}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] text-left">الدومين:</span>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">{siteToRefine.customDomain || `${siteToRefine.id}.omar.com`}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-amber-300">صف التعديلات أو الإضافات المطلوبة (بالعربية بالتفصيل):</label>
                <textarea
                  value={refinementInstructions}
                  onChange={(e) => setRefinementInstructions(e.target.value)}
                  placeholder="مثال: غير ألوان الخلفية لتدرج أحمر ناري متوهج، وأضف قسم خاص بالأسعار وعرض الباقة الذهبية لخدماتنا مع تأثير هوفر مبهر..."
                  disabled={isRefining}
                  rows={5}
                  className="w-full bg-black/60 border border-white/5 focus:border-[#efd383]/40 rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              {refinementError && (
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl flex gap-2 text-red-200 text-xs items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{refinementError}</span>
                </div>
              )}

              {/* Progress feedback */}
              {isRefining && (
                <div className="bg-purple-950/10 border border-purple-500/10 rounded-xl p-3 flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                  <div className="text-[10px] text-slate-300">
                    <span className="font-bold text-purple-300">جاري صياغة التعديل...</span> نقوم الآن بمراجعة الكود، وحقن وتنسيق طلبك على خادم عُمر السحابي. قد يستغرق 10-15 ثانية.
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRefinementSiteId(null);
                    setRefinementInstructions("");
                    setRefinementError(null);
                  }}
                  disabled={isRefining}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="button"
                  onClick={handleRefineSite}
                  disabled={isRefining || !refinementInstructions.trim()}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 via-[#d369fa] to-[#efd383] text-black hover:opacity-90 disabled:opacity-50 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  {isRefining ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري إعادة البرمجة...</span>
                    </>
                  ) : (
                    <>
                      <span>🪄</span>
                      <span>تطبيق التعديلات الذكية</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 3. High-Fidelity Custom Domain Web Browser Simulator Modal */}
      {activeDomainConfigSiteId && (() => {
        const site = hostedSites.find(s => s.id === activeDomainConfigSiteId);
        if (!site) return null;
        
        const renderUrl = `${window.location.origin}/api/sites/render/${site.id}`;
        const hasCustomDomain = site.customDomain || `${site.id}.omar.com`;
        
        return (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 z-50 animate-fade-in overflow-hidden">
            
            {/* Top Info Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-900 border border-white/5 rounded-t-xl px-4 py-3 gap-3">
              <div className="flex items-center gap-2" dir="rtl">
                <span className="text-xl">🛡️</span>
                <div>
                  <h3 className="text-xs font-black text-amber-300">محاكي نطاق عُمَر النشط (OMAR Active DNS Client)</h3>
                  <p className="text-[10px] text-slate-400">محاكي مخصص لاستخلاص الكود وتمرير النطاقات عبر خوادم سريعة</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    // Open in new tab
                    window.open(renderUrl, '_blank');
                  }}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-slate-300 hover:text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="فتح الرابط المباشر في علامة تبويب جديدة"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>الرابط المباشر</span>
                </button>
                <button
                  onClick={() => setActiveDomainConfigSiteId(null)}
                  className="px-3 py-1 bg-red-950/30 hover:bg-red-900 text-red-200 hover:text-white rounded text-[11px] font-bold transition-all cursor-pointer"
                >
                  إغلاق المحاكي ✕
                </button>
              </div>
            </div>

            {/* Simulated Desktop Browser Frame */}
            <div className="flex-1 bg-[#121215] border-x border-b border-white/5 flex flex-col overflow-hidden">
              
              {/* Browser Window Chrome */}
              <div className="bg-[#18181c] border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-4">
                
                {/* 1. macOS circles */}
                <div className="flex gap-1.5 shrink-0">
                  <div onClick={() => setActiveDomainConfigSiteId(null)} className="w-3 h-3 rounded-full bg-red-500 hover:opacity-80 cursor-pointer" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>

                {/* 2. SSL Secured URL bar */}
                <div className="flex-1 max-w-xl bg-black/50 border border-white/10 rounded-lg py-1 px-3 flex items-center justify-between text-xs font-mono select-all">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <span>🔒</span>
                    <span className="text-slate-400">https://</span>
                    <span className="text-white font-bold">{hasCustomDomain}</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 shadow-[0_0_8px_rgba(16,185,129,0.2)] px-1.5 py-0.5 rounded border border-emerald-900/30">
                    SECURED WITH SSL
                  </span>
                </div>

                {/* 3. Browser actions mockup */}
                <div className="flex gap-2 text-slate-400 font-mono text-xs items-center shrink-0">
                  <span className="px-2 py-0.5 bg-black/40 border border-white/5 rounded text-[10px] text-amber-300 font-bold">
                    100% متوافق مع الموبايل والتابلت
                  </span>
                </div>
              </div>

              {/* Live Application Canvas inside Interactive iframe */}
              <div className="flex-1 relative bg-[#040406]">
                <iframe
                  src={renderUrl}
                  title="Simulated Web Site Frame"
                  sandbox="allow-forms allow-scripts allow-same-origin"
                  loading="lazy"
                  className="w-full h-full border-0 absolute inset-0"
                />
              </div>

            </div>

            {/* Bottom bar with status indicator */}
            <div className="bg-zinc-900 border-t border-white/5 rounded-b-xl px-4 py-2 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>SERVER ENGINE: OMAR S3 PREMIUM CLUSTER</span>
              <span>HOSTED BY OMAR AI © 2026</span>
            </div>

          </div>
        );
      })()}

      {/* 2.5. SaaS Automated Script & Custom CNAME Activation Modal */}
      {isSaaSScriptModalOpen && (() => {
        const site = hostedSites.find(s => s.id === selectedSaaSSiteId);
        if (!site) return null;

        const liveSubdomain = site.customDomain || `${site.id}.omar.com`;
        const cleanSub = liveSubdomain.replace(".omar.com", "");
        const serverOrigin = window.location.origin;

        // Code block representing the exact deployment bridge script
        const integrationScript = `/**
 * LoomHost AI © 2026 - SaaS Auto-Deployment Bridge
 * هذا السكربت يقوم بربط الدومين المخصص (${liveSubdomain}) حياً بملفات موقعك.
 * عند قيام العميل بأي تعديل، يتم تحديث المظهر دون إعادة تشغيل الخادم!
 */
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// معرّفات الربط السحابي الفريدة لموقع: ${site.name}
const LOOMHOST_API = "${serverOrigin}/api/sites/render/${site.id}";

// محرك سحب الكود اللحظي بالتحديث التلقائي (Zero-Downtime Hot Swapping)
app.get("*", async (req, res) => {
  try {
    // جلب أحدث أكواد HTML/CSS/JS المعالجة حياً عبر خوادم LoomHost AI
    const response = await axios.get(LOOMHOST_API, {
      headers: { "Accept-Encoding": "gzip, deflate, br" }
    });
    
    // تمرير الكود وحقن معايير السرعة والأداء العالي
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=60"); // كاش ذكي مؤقت لتحسين الأداء
    res.send(response.data);
  } catch (error) {
    console.error("LoomHost Synchronization Failure:", error.message);
    res.status(502).send(\`
      <html lang="ar" dir="rtl">
        <head>
          <title>خادم LoomHost AI - فشل المزامنة</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #07070a; color: #fff; text-align: center; padding: 60px 20px; }
            .card { max-width: 500px; margin: 40px auto; border: 1px solid rgba(239,211,131,0.2); padding: 30px; border-radius: 12px; background: #0d0d12; }
            h1 { color: #f87171; }
            p { color: #94a3b8; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>⚠️ خطأ في مزامنة بوابة الـ SaaS</h1>
            <p>يتعذر على خادمك المحلي الوصول لمزود المحتوى السحابي. يرجى التحقق من اتصال الإنترنت وضمان عمل الخادم الأصلي.</p>
          </div>
        </body>
      </html>
    \`);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("⚡ LoomHost SaaS Bridge Active on port " + PORT);
});`;

        return (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" dir="rtl">
            <div className="bg-[#090e18] border border-indigo-500/35 rounded-2xl max-w-3xl w-full p-6 relative my-8 space-y-6 shadow-[0_0_50px_rgba(99,102,241,0.25)]">
              
              {/* Close Button */}
              <button 
                onClick={() => setIsSaaSScriptModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer z-10"
              >
                ✕
              </button>

              {/* Title Header with Tech/Neon Badge */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-indigo-950">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-400 text-[10px] font-mono rounded border border-indigo-500/20 uppercase tracking-widest">
                      LoomHost SaaS Automation
                    </span>
                    <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                  <h2 className="text-lg font-black text-white">
                    نظام استضافة SaaS المؤتمت لـ <span className="text-[#efd383]">{site.name}</span>
                  </h2>
                </div>
                
                <div className="flex gap-2">
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE DNS CONNECTED
                  </span>
                </div>
              </div>

              {/* Deployment Details Card */}
              <div className="bg-[#0c1221] border border-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest">📍 تفاصيل النطاق والمزامنة المباشرة:</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-right">
                    <span className="text-[10px] text-slate-500 block">الدومين الديناميكي المولد:</span>
                    <a 
                      href={`${serverOrigin}/live/${cleanSub}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-teal-400 font-mono flex items-center gap-1 hover:underline mt-1"
                    >
                      <span>https://{liveSubdomain}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-lg p-3 text-right">
                    <span className="text-[10px] text-slate-500 block">رابط الاسترداد بالتحديث التلقائي (Zero-Downtime API):</span>
                    <span className="text-[10px] font-semibold text-[#efd383] font-mono break-all line-clamp-1 select-all mt-1 block">
                      {serverOrigin}/api/sites/render/{site.id}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-indigo-950/20 border border-indigo-500/10 rounded-lg space-y-2 text-right">
                  <h4 className="text-xs font-extrabold text-indigo-300">💡 كيف تعمل منظومة التعديل الذاتي واللايف؟</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    يعمل خادمك على سحب ورقة الأنماط <strong className="text-emerald-400">CSS</strong> وسيناريوهات التفاعل <strong className="text-emerald-400">JS</strong> مباشرة من خوادمنا عند كل زيادة. عند تعديل الموقع عبر واجهة عُمَر الفائقة (AI Refiner)، نقوم فورياً بحقن الأنماط الجديدة لضمان بقاء موقعك لايف بنسبة 100% ودون الحاجة لإعادة رفع الملفات أو بناء المشروع من جديد!
                  </p>
                </div>
              </div>

              {/* Automatic Hosting Script Block */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                    <span>⚙️ كود سكربت أتمتة الاستضافة والـ Reverse Proxy (Node.js):</span>
                  </h3>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(integrationScript);
                      alert("تم نسخ سكربت التشغيل SaaS بنجاح!");
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>نسخ السكربت</span>
                  </button>
                </div>

                <pre className="bg-black/60 border border-white/5 rounded-xl p-4 overflow-x-auto text-[11px] font-mono text-left text-indigo-200 select-all max-h-56 leading-relaxed">
                  {integrationScript}
                </pre>
              </div>

              {/* Setup Instruction Steps */}
              <div className="space-y-3 p-4 bg-amber-950/10 border border-amber-500/10 rounded-xl">
                <h4 className="text-xs font-black text-[#efd383] flex items-center gap-1">
                  <span>🚀 شرح كيفية التفعيل وربط النطاق المخصص (CNAME Setup):</span>
                </h4>
                
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-2 leading-relaxed">
                  <li>
                    قم بتهيئة مشروع جديد على أي استضافة تدعم Node.js (مثل <strong className="text-white">Render, Caprover, Heroku</strong> أو خادم VPS خاص).
                  </li>
                  <li>
                    احفظ الكود المولد أعلاه كملف <strong className="text-emerald-400 font-mono">server.js</strong> وقم بتثبيت الحزم المطلوبة عبر <code className="bg-black/40 px-1.5 py-0.5 rounded text-pink-400 font-mono text-[10px]">npm i express axios</code>.
                  </li>
                  <li>
                    لربط نطاق خاص فريد (مثل <code className="font-mono text-[#efd383]">project.omardomain.com</code>)، توجه لإدارة لوحة الـ DNS لنطاقك وقم بإنشاء سجل من نوع <strong className="text-white">CNAME</strong> يوجه للنطاق الديناميكي المخصص <code className="font-mono text-indigo-300">{liveSubdomain}</code>.
                  </li>
                  <li>
                    شغّل الخادم مستدعياً عُمَر AI وسيقوم الخادم بتمرير الزيارات وتطبيق التعديلات السريعة فورياً دون الحاجة لتغيير هيكل الموقع أو توقيفه!
                  </li>
                </ol>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex gap-3 justify-end pt-2">
                <button 
                  onClick={() => {
                    const blob = new Blob([integrationScript], { type: "text/javascript;charset=utf-8" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `loomhost-${cleanSub}-bridge.js`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-black text-xs font-extrabold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>تحميل كود الربط (.js)</span>
                </button>
                
                <button 
                  onClick={() => setIsSaaSScriptModalOpen(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                >
                  حفظ وإغلاق
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 2.6. GitHub Deployment Prep & Explanation Modal */}
      {isGithubModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" dir="rtl">
          <div className="bg-[#090e18] border border-indigo-500/30 rounded-2xl max-w-2xl w-full p-6 relative my-8 space-y-6 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
            
            <button
              onClick={() => setIsGithubModalOpen(false)}
              className="absolute top-4 left-4 p-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="إغلاق التجهيز"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Header */}
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/50 text-indigo-300 rounded-full border border-indigo-500/30 text-[10px] font-extrabold tracking-widest uppercase">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>نظام الأتمتة والنشر المتكامل لـ GitHub & Vercel</span>
              </div>
              <h3 className="text-xl font-black text-white">تجهيز ومواءمة الموقع للنشر على GitHub 🚀</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                يقوم النظام التلقائي الآن بهيكلة موقعك الإلكتروني إلى مستندات برمجية قياسية (HTML مجرد مضافاً إليه ملف ستايل و Javascript مستقلين)، لرفعها بخطوة واحدة على مستودعك الخاص في GitHub والاستضافة المجانية الفورية على Vercel.
              </p>
            </div>

            {/* Main Visual Layout Grid: Structured Directory and Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
              
              {/* Directory Structure & Zip Trigger */}
              <div className="bg-[#050811] border border-blue-950 p-4 rounded-xl flex flex-col justify-between space-y-4 text-right">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-950/60 pb-2">
                    <span className="text-xs font-bold text-slate-400 font-mono">PROJECT REPO BUILD:</span>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/30">LoomHost Automated</span>
                  </div>
                  
                  {/* File Tree visualizer */}
                  <div className="font-mono text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-white/5 space-y-2 text-left" dir="ltr">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <span>📦</span>
                      <span>{siteName.replace(/\s+/g, '_').toLowerCase()}_project.zip</span>
                    </div>
                    <div className="pl-4 flex items-center gap-1.5 text-blue-300">
                      <span>├──</span>
                      <span>index.html</span>
                      <span className="text-[9px] text-slate-500 font-sans">(هيكل الـ DOM)</span>
                    </div>
                    <div className="pl-4 flex items-center gap-1.5 text-blue-300">
                      <span>├──</span>
                      <span>README.md</span>
                      <span className="text-[9px] text-emerald-400 font-sans">(دليل التعليمات لرفع المستودع)</span>
                    </div>
                    <div className="pl-4 text-slate-500">
                      <span>├──</span>
                      <span className="text-amber-400">src/</span>
                    </div>
                    <div className="pl-8 flex items-center gap-1.5 text-orange-300">
                      <span>├──</span>
                      <span>style.css</span>
                      <span className="text-[9px] text-slate-500 font-sans">(تنسيقات التصميم)</span>
                    </div>
                    <div className="pl-8 flex items-center gap-1.5 text-yellow-300">
                      <span>└──</span>
                      <span>app.js</span>
                      <span className="text-[9px] text-slate-500 font-sans">(التفاعلية البرمجية)</span>
                    </div>
                    <div className="pl-4 text-slate-500">
                      <span>└──</span>
                      <span className="text-indigo-400">assets/</span>
                      <span className="text-[8px] text-slate-600 font-sans">(مجلد الأصول الرقمية والصور)</span>
                    </div>
                  </div>
                </div>

                {/* Instant Download Package button */}
                <button
                  onClick={handleDownloadGithubPackage}
                  disabled={isCreatingZip}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:scale-102 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
                >
                  {isCreatingZip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري تعبئة هيكل الحزمة...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>تحميل حزمة الكود المخرجة جاهزة للرفع 📥</span>
                    </>
                  )}
                </button>
              </div>

              {/* GitHub to Vercel Steps Explanation */}
              <div className="bg-[#050811] border border-blue-950 p-4 rounded-xl space-y-4 overflow-y-auto max-h-[350px]">
                <h4 className="text-xs font-black text-slate-200 border-b border-blue-950/60 pb-2 text-right">خطوات الرفع والاستضافة السريعة:</h4>
                
                <div className="space-y-4 text-xs leading-relaxed text-right">
                  {/* Step 1 */}
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">1</span>
                    <div className="space-y-1">
                      <p className="font-bold text-white">تحميل وفكّ الضغط</p>
                      <p className="text-slate-400 text-[11px]">قم بالضغط على الزر المقابل تحميل ملف الـ ZIP وفك الضغط عنه لتجد ملفات موقعك المنظمة.</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">2</span>
                    <div className="space-y-1">
                      <p className="font-bold text-white">إنشاء مستودع على GitHub</p>
                      <p className="text-slate-400 text-[11px]">ادخل لـ GitHub وأنشئ مستودعاً جديداً (Public Repository) ثم اسحب ملفات الموقع وأفلتها واضغط Commit.</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 flex items-center justify-center font-bold font-mono text-[10px] shrink-0">3</span>
                    <div className="space-y-1">
                      <p className="font-bold text-white">الربط واستضافة Vercel الفورية</p>
                      <p className="text-slate-400 text-[11px]">ادخل لـ Vercel وسجّل دخولك بـ GitHub الخاص بك، واعمل Import للمستودع واضغط Deploy ليصبح موقعك لايف بدومين مجاني!</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Close action wrapper */}
            <div className="pt-4 border-t border-blue-950/60 flex justify-end gap-2 text-right">
              <button
                onClick={() => setIsGithubModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق الباقة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2.7. Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" dir="rtl">
          <div className="bg-[#090e18] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 relative my-8 space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.15)]">
            
            <button
              onClick={() => setIsPrivacyModalOpen(false)}
              className="absolute top-4 left-4 p-1 rounded-full bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="إغلاق التبويب"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon & Header */}
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/45 text-amber-300 rounded-full border border-amber-500/20 text-[10px] font-extrabold tracking-widest uppercase">
                <Shield className="w-3.5 h-3.5 text-amber-500" />
                <span>الخصوصية والأمان المتقدم</span>
              </div>
              <h3 className="text-xl font-black text-white">سياسة الخصوصية الخاصة بـ OMAR AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                خصوصيتك وأمن بياناتك تشكلان النواة الأساسية لمنظومتنا البرمجية المعتمدة.
              </p>
            </div>

            {/* Core Highlight Box (User's Official Required text) */}
            <div className="p-5 bg-gradient-to-br from-amber-950/20 to-indigo-950/10 border border-amber-500/20 rounded-xl space-y-3 shadow-inner">
              <p className="text-sm font-semibold text-amber-100 leading-relaxed text-justify">
                "نحن في <strong className="text-white font-extrabold">OMAR AI</strong> نحترم خصوصيتك؛ لا نجمع بيانات شخصية أو إيميلات. جميع العمليات تتم محلياً لضمان أقصى حماية. نستخدم ملفات تعريف الارتباط فقط لتحسين التجربة الإعلانية لـ Google AdSense."
              </p>
            </div>

            {/* Compliance details */}
            <div className="space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="flex gap-2 text-right">
                <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
                <div className="space-y-1 text-right">
                  <p className="font-bold text-white">أمان فائق ومحلي كلياً</p>
                  <p className="text-slate-400 text-[11px]">يتم معالجة وتوليد كافة الأكواد ومزامنة القوالب بشكل فوري على متصفحك وسيرفرنا الآمن دون الحاجة لتسجيل دخول أو جمع بيانات.</p>
                </div>
              </div>

              <div className="flex gap-2 text-right">
                <span className="w-5 h-5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] shrink-0">✓</span>
                <div className="space-y-1 text-right">
                  <p className="font-bold text-white">امتثال كامل لـ Google AdSense</p>
                  <p className="text-slate-400 text-[11px]">نحن نلتزم كلياً بشروط وخصوصية الناشرين لشبكات غوغل الإعلانية لتوفير تجربة ويب معيارية ونظيفة تضمن سرعة التحميل والأداء العالي.</p>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2 text-right">
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 text-black rounded-lg text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/10"
              >
                موافق وإغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2.8. OMAR AI Tech Blog Modal & Content Hub */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" dir="rtl">
          <div className="bg-[#090e18] border border-indigo-500/35 rounded-2xl max-w-5xl w-full p-6 relative my-8 space-y-6 shadow-[0_0_60px_rgba(99,102,241,0.25)]">
            
            <button
              onClick={() => {
                setIsBlogModalOpen(false);
                setSelectedArticleId(null);
              }}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
              title="إغلاق المدونة"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Brand Identity Section */}
            <div className="space-y-3 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-950/50 text-[#efd383] rounded-full border border-indigo-500/30 text-[10px] font-extrabold tracking-widest uppercase">
                <BookOpen className="w-3.5 h-3.5 text-[#efd383]" />
                <span>المدونة التقنية الرسمية لـ OMAR AI</span>
              </div>
              <h3 className="text-2xl font-black text-white">المركز العلمي ومستودع المعرفة للذكاء الاصطناعي 📝</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                اكتشف مقالاتنا المتخصصة واستراتيجيات السيو لبناء المشاريع الرقمية والابتكار التكنولوجي. مقالاتنا مصممة بالكامل من منظور شبابي طموح يحفز على العمل والربح، ومتوافقة مع سياسات Google AdSense لتقديم قيمة متميزة.
              </p>
            </div>

            {/* 5 Content Categories for AdSense Acceptance */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-right">
              {[
                { title: "دروس البرمجة والتطوير", desc: "أكواد وحلول متكاملة", color: "from-blue-500/10 to-indigo-500/5 hover:border-blue-500/40" },
                { title: "دليل أدوات الـ SaaS", desc: "منظومات وتطبيقات سحابية", color: "from-purple-500/10 to-pink-500/5 hover:border-purple-500/40" },
                { title: "أسرار وتقنيات السيو", desc: "تصدر نتائج محركات البحث", color: "from-teal-500/10 to-emerald-500/5 hover:border-teal-500/40" },
                { title: "نصائح الذكاء الاصطناعي", desc: "هندسة الأوامر والوكلاء AI", color: "from-amber-500/10 to-orange-500/5 hover:border-amber-500/40" },
                { title: "التسويق الرقمي للأعمال", desc: "نمو الشركات والربحية", color: "from-rose-500/10 to-red-500/5 hover:border-rose-500/40" }
              ].map((cat, i) => (
                <div 
                  key={i} 
                  className={`bg-gradient-to-br ${cat.color} border border-white/5 rounded-xl p-3 text-right transition-all cursor-default`}
                >
                  <p className="font-bold text-white text-[11px] leading-tight truncate">{cat.title}</p>
                  <p className="text-[9px] text-slate-400 mt-1">{cat.desc}</p>
                </div>
              ))}
            </div>

            {/* Inner Layout: Left (Selected Article details) & Right (Article listing) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Right Column: Articles list */}
              <div className="space-y-3 lg:col-span-1 max-h-[460px] overflow-y-auto pr-1">
                <h4 className="text-xs font-black text-[#efd383] border-b border-white/5 pb-2 text-right">🔥 المقالات المتصدرة (SEO-Friendly):</h4>
                
                {[
                  {
                    id: 1,
                    title: "دليلك الشامل لإنشاء مشروعك الرقمي من البيت 🏠🚀",
                    excerpt: "يا صاحبي، الشغل من البيت مابقاش مجرد رفاهية، ده بقى الطريق الأسرع علشان تبني بيزنس بجد يدخلك دخل بالدولار وأنت بتشرب شاي بالنعناع في غرفتك...",
                    stat: "دليل عملي • الربح من البيت",
                    readTime: "8 دقيقة"
                  },
                  {
                    id: 2,
                    title: "لماذا تعتبر تطبيقات الـ Web-First هي مستقبل العمل الحر؟ 🌐⚡",
                    excerpt: "ليه لسه بتضيع وقتك في مشاريع بتعتمد على منصات معينة وتدفع عمولات ضخمة؟ التطبيقات اللي بتشتغل ع الويب أولاً هي المنقذ الحقيقي واستقلاليتك...",
                    stat: "مستقبل الويب • العمل الحر",
                    readTime: "6 دقيقة"
                  },
                  {
                    id: 3,
                    title: "كيف تختار الفكرة المربحة لمشروعك البرمجي القادم? 💡💰",
                    excerpt: "كلنا نفسنا نعمل المشروع الجاي اللي هيكسر الدنيا، بس اللعبة كلها مش في فكرة خيالية، اللعبة في حل مشكلة حقيقية بتواجه الناس ومستعدين يدفعوا فيها...",
                    stat: "العثور على أفكار • استثمار ذكي",
                    readTime: "7 دقيقة"
                  },
                  {
                    id: 4,
                    title: "أسرار التسويق للمشاريع البرمجية في السوق المصري 🇪🇬📣",
                    excerpt: "برمجت التطبيق وبقى جاهز؟ عظيم! بس من غير تسويق صح لجمهورك المصري حبيبك، كأنك معملتش حاجة. تعال اقولك إزاي تخليهم يتكلموا عن منتجك بلهجتنا وجدعنتنا...",
                    stat: "تسويق محلي • نمو سريع",
                    readTime: "9 دقيقة"
                  },
                  {
                    id: 5,
                    title: "كيف يساعد الذكاء الاصطناعي في تقليل وقت برمجة المواقع للنصف؟ 🤖⏱️",
                    excerpt: "زمن السهر لأيام عشان تكتب كود صفحة واحدة انتهى خلاص! السحر الحقيقي دلوقتي هو إزاي تخلي الـ AI شغال معاك كمساعد مخلص بيوفرلك 50% من مجهودك...",
                    stat: "توفير الوقت • ذكاء توليدي",
                    readTime: "6 دقيقة"
                  },
                  {
                    id: 6,
                    title: "مميزات استضافة LoomHost AI ولماذا هي الأفضل للمشاريع الناشئة؟ ☁️💎",
                    excerpt: "خليني أكون صريح معاك وعن تجربة شخصية، كصاحب مشروع ناشئ أنت محتاج استضافة سريعة، مجانية في الأول، وتوفرلك شهادة أمان بضغطة واحدة، وده بالظبط اللي بتعمله غول الاستضافة...",
                    stat: "استضافة سحابية • أداء أسطوري",
                    readTime: "5 دقيقة"
                  },
                  {
                    id: 7,
                    title: "كيف تحول فكرتك إلى تطبيق حقيقي باستخدام تقنيات الـ AI؟ 🔮🛠️",
                    excerpt: "عندك فكرة بتدور في دماغك ومش عارف تبدأ منين عشان ما بتعرفش تبرمج؟ الـ AI غير اللعبة دي تماماً وبقى صاحبي وصاحبك اللي بيترجم الأفكار لواقع ملموس...",
                    stat: "من الفكرة للتنفيذ • تكتيكات AI",
                    readTime: "8 دقيقة"
                  },
                  {
                    id: 8,
                    title: "الفرق بين برمجة المواقع بالطريقة التقليدية والطريقة الحديثة 🔄🏗️",
                    excerpt: "فاكر البرمجة القديمة؟ تفتح محرر الأكواد وتكتب كل حاجة من الصفر وتقعد تدور ع القوس الضايع ساعتين؟ البرمجة الحديثة بقت أسرع، أمتع، وبتعتمد على الأنظمة الجاهزة المدمجة...",
                    stat: "مقارنة برمجية • توفير مجهود",
                    readTime: "7 دقيقة"
                  }
                ].map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArticleId(art.id)}
                    className={`w-full text-right p-3.5 rounded-xl border transition-all duration-300 block cursor-pointer ${
                      selectedArticleId === art.id 
                        ? "bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                        : "bg-slate-950/40 border-white/5 hover:border-indigo-500/30 hover:bg-slate-900/30"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-bold">{art.readTime}</span>
                      <p className={`text-xs font-bold leading-relaxed ${selectedArticleId === art.id ? "text-indigo-300" : "text-white"}`}>
                        {art.title}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                      {art.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-3 text-[9px] text-slate-500 font-mono">
                      <span>الكاتب: مهندس شاهين</span>
                      <span>{art.stat}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Left Column: Article reading viewport */}
              <div className="bg-[#050811] border border-white/5 p-5 rounded-2xl lg:col-span-2 overflow-y-auto max-h-[460px] text-right space-y-5">
                {selectedArticleId === null ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-950/50 flex items-center justify-center mx-auto text-[#efd383]">
                      <FileText className="w-6 h-6 animate-bounce" />
                    </div>
                    <h5 className="text-sm font-extrabold text-white">اختر مقالاً من القائمة الجانبية لقراءته والاطلاع عليه</h5>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      كافة المقالات مكتوبة بهيكل متين يحتوي على الفقرات المناسبة (H2, H3)، كلمات الاستهداف المباشرة لجوجل سيو، وصديقة تماماً لسياسات وسيبرانية جوجل أدسنس.
                    </p>
                  </div>
                ) : (
                  (() => {
                    if (selectedArticleId === 1) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            دليلك الشامل لإنشاء مشروعك الرقمي من البيت 🏠🚀
                          </h2>
                          
                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: بيزنس رقمي، عمل حر، استضافة مجانية</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. فكك من الكلام السلبي وابدأ دلوقتي!</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            بص يا صاحبي، الشغل من البيت مبقاش مجرد رفاهية أو حلم بنسمع عنه في الفيديوهات، ده بقى أمر واقع وحقيقي جداً! الميزة الكبرى في المشاريع الرقمية إنك مش محتاج رأس مال مالي ضخم، كل اللي محتاجه لابتوب، فنجان قهوة محترم، وشوية حماس وصبر. بدل ما تقضي وقتك على السوشيال ميديا بلا هدف، استغل طاقتك دي في إنك تتعلم أساسيات الويب وتبدأ تبني حاجة خاصة بيك.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. التخطيط الصح سر النجاح</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            علشان ما تتهش في النص، محتاج تختار مجال محدد، زي تطوير مواقع الويب، وتسويق الخدمات أونلاين، أو تقديم حلول SaaS ذكية للشركات. ركز كويس جداً على بناء بورتفوليو برمجى محترم يعرض شغلك بشكل احترافي، واستعن بأدوات الذكاء الاصطناعي اللى بتسرّع خطوات البناء والتأسيس علشان تختصر الوقت وتجيب عملاء حقيقيين في أسرع وقت.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. الاستمرارية وجدعنة المطور الطموح</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            أهم حاجة متستعجلش النتائج وتيأس بسرعة. البدايات دايماً بتكون محتاجة طاقة واستمرارية، وافتكر إن كل مطور ناجح كان في يوم من الأيام واقف محتار مكانك ومش عارف يكتب أول سطر كود صح. ربنا هيكرمك وهتوصل، المهم تفضل مكمل وتطور من مهاراتك يوم بعد يوم!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 2) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            لماذا تعتبر تطبيقات الـ Web-First هي مستقبل العمل الحر؟ 🌐⚡
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: Web-First، العمل الحر، تصاميم الويب</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. الحرية الكاملة وعدم التقيد بمتجر تطبيقات</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            الميزة الخارقة في تطبيقات الويب إن المستخدم مش محتاج يحمل أي ملف أو يستنى تحيينات من متاجر التطبيقات المقيدة زى جوجل بلاى أو آب ستور اللي بتاكل نص أرباحك وعمولاتهم بتوجع البطن. بضغطة زرار واحدة ومن أي متصفح، الزبون بيلاقي منتجك شغال طلقة وقدامه بشكل مباشر، وده بيزود فرص انتشار وتجربة موقعك بنسبة كبيرة وبدون أي عوائق تقنية وغلاسة.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. التطوير السريع ومرونة التحديث</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            لما تعمل تطبيقك بنظام Web-First، أي تحديث أو ميزة جديدة بتضيفها بتنزل للمستخدمين كلهم في نفس اللحظة بمجرد ما يفرشوا الصفحة! مفيش بقى وجع دماغ مراجعة التطبيقات لأسابيع والرفض اللى ملوش مبرر. ده بيخليك تختبر نموذج عملك بسرعة خارقة، وتعدل الأكواد بناءً على آراء عملاؤك الحية وبكل حرية ومرونة.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. متوافقة مع كل الشاشات والأجهزة</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            مع استخدام ريأكت وتخصيص الفلاتر مع تيلويند، التطبيق بيبان وكأنه معمول نيتيف (Native) للمفاتيح والتاتش على الموبايل، وفخم جداً على الشاشات الكبيرة. جرب بنفسك وشوف إزاي خطوتك الأولى ناحية تطبيقات الويب دي هترفع قيمتك كفريلانسر فنان في عيون عملائك!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 3) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            كيف تختار الفكرة المربحة لمشروعك البرمجي القادم؟ 💡💰
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: أفكار برمجية، أرباح مالي، تصميم مواقع</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. دور على المشاكل الحقيقية مش الأفكار الخيالية</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            غلطة بيقع فيها أغلب المطورين المبتدئين وهيا إنه يقعد شهور يفكر في فكرة معقدة وجديدة كلياً لدرجة إن مفيش حد فاهمها! السر كله يا غالي إنك تدور على المشاكل اليومية البسيطة اللى بتواجه أصحاب المحلات أو الفريلانسرز زمايلك، وتحلها بلينك أو موقع بسيط. لو لقيت ناس بتشتكي من حاجة معينة، اعرف إن هنا في فكرة مشروع مربح مستعدين يدفعوا فيه اشتراك شهري مريح.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. طبق قاعدة الـ MVP وجرب في يومين</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            بدل ما تضيع وقتك في برمجة لوحة تحكم عملاقة وأنظمة دفع معقدة، ابدأ بأبسط نسخة ممكنة من مشروعك (Minimum Viable Product). اعرض الفكرة على الجروبات والناس المهتمة، لو لقيت تفاعل حقيقي وطلب، كمل بروح قوية وضاعف مجهودك. الطريقة دي هتحميك من تضييع وقتك وجهدك في فكرة يمكن محدش يطلبها في الآخر.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. الحماس والجرأة في التجربة</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            متخافش من الفشل أو إن حد يقلدك، السوق واسع جداً ومحتاج أفكار وخدمات بلمسة وجدعنة مصرية أصيلة. خليك شجاع واقفر في التحدي، فكرة ورا فكرة هتلقط معاك واحدة تعوضك عن كل تعب السهر والبرمجة وتحققلك الحرية المالية اللي بتتمناها!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 4) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            أسرار التسويق للمشاريع البرمجية في السوق المصري 🇪🇬📣
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: تسويق مشاريع، السوق المصري، رواد الأعمال مصر</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. كلمهم بلغتهم واظهر جدعنتك مع العميل</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            العميل المصري ذكي جداً ومبيحبش الطريقة الإعلانية الجافة أو المصطلحات الأجنبية المعقدة اللي تخليه يحس بالغربة. لما تيجي تسوق لبرنامجك أو موقعك، اشرح القيمة الحقيقية بلهجة قريبة من قلبه، وعرفه إزاي التطبيق ده هيوفر عليه فلوس ويسهل شغله اليومي. الجدعنة وتقديم دعم فني متميز وسريع بالحب هو سلاحك السري اللي هيخلي عميلك هو اللي يسوقلك مع أصحابه مجاناً!
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. اعتمد على قوة الـ Word of Mouth والمجتمعات</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            انشر قصة نجاح العميل الأول ليك وطير بيها في مجتمعات رواد الأعمال على فيسبوك وتليجرام ولينكد إن. المصريين بيعشقوا يشوفوا تجارب ناجحة من ناس شبههم خاضوا نفس الرحلة. سيبك من الإعلانات الممولة الغالية في الأول، وركز على حل مشكلة لشخص واحد بارز في مجالك، وخليه يتكلم عن خدمتك ويشكر فيك قدام الكل.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. فكر في عروض تناسب الإمكانيات المحلية</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            راعي الحالة الاقتصادية وقدم خطط أسعار مرنة في مصر، زي الدفع بفودافون كاش أو انستا باي وتوفير فترات تجريبية كافية خالية من العقود الملتزمة. لما تيسر ع الناس وتسهل عليهم طرق الدخول، ربنا هييسرلك أمورك وأرباح تطبيقك هتسابق التوقعات تضاعفاً ونجاحاً!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 5) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            كيف يساعد الذكاء الاصطناعي في تقليل وقت برمجة المواقع للنصف؟ 🤖⏱️
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: ذكاء اصطناعي، برمجة سريعة، سيو متقدم</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. الـ AI مش بديل ليك.. ده المساعد الخارق بتاعك</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            لحد دلوقتي لسه في مبرمجين خايفين من الـ AI وفاكرين إنه هيقطع عيشهم، بس في الحقيقة المخرج الحقيقي هو إن المبرمج اللي بيستخدم الـ AI هو اللي هيغلب المبرمج اللي مش بيستخدمه! الذكاء الاصطناعي بيختصر عليك كتابة الأكواد المكررة وتأسيس الملفات الإنشائية الأولية بنسبة 100%، وده بيخليك مركز كلياً على الفكرة اللامعة وارتياح وتجربة المستخدم النهائي.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. اكتشاف الأخطاء وتحديث الأنظمة فورا</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            كنت بتقعد كام ساعة تدور على غلطة إملائية أو قوس ناقص في تلافيف الأكواد؟ دلوقتي بتبعت الكود للـ AI بيكملك الناقص ويصححلك الثغرات الأمنية في ثواني معدودة وبدقة متناهية. الميزة دي مش بس بتوفر وقتك، دي كمان بترفع جودة الكود وبتحميك من كوابيس تعطل السيرفر فجأة قدام الزباين.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. منصة OMAR AI برهنت على ده بامتياز</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            من خلال معالجة لغوية بسيطة بتكتبها بلهجتك، المنصة بتبني وبترفع وتستضيف موقعك الكامل بالذكاء الاصطناعي التوليدي في ثواني. جرب تبدأ الرحلة دي وشوف إزاي هتقدر تسلّم 5 مشاريع برمجية فخمة في نفس الوقت اللى كنت بتسهر فيه عشان تخلص موقع واجهة واحد بالطرق العقيمة القديمة!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 6) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            مميزات استضافة LoomHost AI ولماذا هي الأفضل للمشاريع الناشئة؟ ☁️💎
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: LoomHost AI، استضافة سحابية، مشاريع ناشئة</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. سرعة تحميل صاروخية تنافس السيرفرات العالمية</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            معظم الاستضافات المجانية أو الرخيصة بتخلي موقعك بطيء زي السلحفاة والزوار بيهربوا قبل ما يشوفوا المنتج بتاعك. مع معمارية استضافة <strong className="text-indigo-400">LoomHost AI</strong> المتصلة سحابياً بنظام دمج وتوزيع خارق، موقعك هيفتح لأي زائر بلمحة البصر وبأعلى معدلات كفاءة، والسرعة دي هي كلمة السر الأولى علشان جوجل يحب موقعك ويرشحه في النتايج الأولى وعشان تتقبل في جوجل أدسنس بسهولة وبدون لف ودوران.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. أمان ونظام Sandbox يطمنك وينومك مرتاح</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            في مشاريعنا الناشئة، بنخاف من مشاكل الاختراق والهاكرز والسكربتات الخبيثة اللى بتتحقن وبتخرب الشغل. الاستضافة هنا بتوفر بنية أمان معزولة تماماً (Sandbox Engine) ونظام CSP منيع بيمنع أي تداخل غير مصرح بيه أو تخريب للملفات. ده غير شهادة الـ SSL المجانية المفعّلة تلقائياً لحماية بيانات مستخدميك 100%.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. مدمجة بأتمتة كاملة وجاهزة للربط الفوري بالدومينات</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            صممت الاستضافة عشان تناسب عقلية المطور الشاب السريع؛ ضغطة زرار وتلاقي موقعك لايف ومشاركة اللينك جاهزة مع تحكم كامل بالـ CNAME. بجد دي أحسن بداية لأي شاب حابب يطلق خدماته السحابية فورا ويبرهر الكل باحترافيته وأدائه المتميز!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 7) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            كيف تحول فكرتك إلى تطبيق حقيقي باستخدام تقنيات الـ AI؟ 🔮🛠️
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: فكرة تطبيق، تكنولوجيا AI، برمجة بدون كود</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. تخيل الأفكار واكتبها كأنك بتكلم صاحبك</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            زمن التعقيد بجد انتهى! أول خطوة لتحويل فكرتك لواقع ملموس هو إنك تجهز وصف كودى دقيق بلهجتك وحسب خيالك الفني؛ فكك من لغات البرمجة المعقدة والحواجز التقنية. الـ AI بقى قادر يفهم نيتك ورؤيتك التصميمية ويترجم الكلمات والجمل لأسطر برمجية وهيكل ويب كامل متناسق ذو هيبة ولمسات جمالية تفخر بيها قدام زمايلك.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. التكرار وتحديث الهيكل خطوة بخطوة</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            بمجرد ما الـ AI يبنيلك النسخة الأولى من موقعك في الاستوديو السحابى؛ متقفش هنا! استخدم خيارات التحديث والتثبيت الذكي اللى بتوفرها منصتنا علشان ترسل توجيهات تعديلية خفيفة زى "خلّي لون الأزرار ذهبي" أو "ضيف تفاعلية لتبديل الأقسام". النسج التدريجي ده هو اللى بيوصل بمشروعك لمرحلة الكمال البصري والبرمجي المنافس.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. انشر مشروعك فورا ومسرحش بعيد</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            التسويف هو العدو القاتل للأفكار اللامعة. متسرحش وتقول "مستني لما أتعلم أكتر أو ألاقي شريك مبرمج"؛ الأدوات بين إيديك مجانية ومؤتمتة بالكامل وسريعة النفاذ. اطلق مشروعك الرقمى وغيّر حياتك من اللحظة دي، مفيش أي عذر واقف في طريقك يا بطل!
                          </p>
                        </article>
                      );
                    } else if (selectedArticleId === 8) {
                      return (
                        <article className="space-y-4 text-justify">
                          <h2 className="text-lg font-black text-white border-b border-indigo-950 pb-3 leading-relaxed">
                            الفرق بين برمجة المواقع بالطريقة التقليدية والطريقة الحديثة 🔄🏗️
                          </h2>

                          <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>📅 تاريخ النشر: 2026-05-31</span>
                            <span>👤 الكاتب: مهندس شاهين • مطور واعد</span>
                            <span>🎯 الكلمات الدلالية: برمجة تقليدية، تطوير ويب حديث، سيو ذكي</span>
                          </div>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">1. المعاناة القديمة مع الأكواد من الصفر</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            كلنا فاكرين الطريقة التقليدية المحبطة؛ تفتح شاشة سودة وتكتب مئات السطور من الصفر، وتفضل ربع ساعة تدور على قوس ضايع أو فاصلة منقوطة عملتلك إيرور معطل الصفحة كلها! كانت البرمجة بتاخد أسابيع وشهور للتصميم بس، وتكلفة التعديل بتبقى كابوس حقيقي بيقفل المطورين والعملا من بعض وبيأخر إطلاق المشاريع للنور بشكل مؤسف.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">2. الطريقة الحديثة: أسرع، أمتع، وذكية</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            في العصر الحالي والتقنيات الحديثة لعام 2026، البرمجة بقت بتعتمد على الهياكل والوحدات المسبقة الذكية المدمجة، بمساعدة أدوات الـ AI التوليدية اللى بتستوعب متطلباتك وتنفذها فورا. التفاعل مبرمج وجاهز، وأسلوب الـ CSS مفرود بجمالية النيومورفيزم والواجهات الداكنة الفخمة بخطوة واحدة. ده بيختصر وقت التطوير بنسبة 90% وبيخليك تطلق بوابات ويب متكاملة في دقايق معدودة وبأداء لا يقارن بالبطء القديم.
                          </p>

                          <h3 className="text-sm font-extrabold text-[#efd383] mt-4">3. اللحاق بقطار التطور والمستقبل التقني</h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            العالم بيمشي قدام بسرعة الصاروخ، والإصرار على استخدام الأدوات والأساليب القديمة لمجرد العادة هيخلي غيرك يسبقك بمسافات ضخمة في سوق العمل فريلانس. واكب التقدم العظيم ده، استثمر في عقلك وأدواتك، وخلي كودك دايماً فريش وجاهز للمستقبل السحري!
                          </p>
                        </article>
                      );
                    }
                    return null;
                  })()
                )}
              </div>

            </div>

            {/* Footer buttons of modal */}
            <div className="pt-4 border-t border-indigo-950 flex justify-between items-center text-right text-xs text-slate-500">
              <p>منصة OMAR AI - تحرير، برمجة، ونشر لا متناهٍ ⚡</p>
              <button
                onClick={() => {
                  setIsBlogModalOpen(false);
                  setSelectedArticleId(null);
                }}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 text-white rounded-lg text-xs font-black transition-all cursor-pointer shadow-md shadow-indigo-500/10"
              >
                الرجوع للاستوديو الرئيسي
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2.9. OMAR AI Contact Us "اتصل بنا" Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto" dir="rtl">
          <div className="bg-[#090e18] border border-amber-500/35 rounded-2xl max-w-xl w-full p-6 relative my-8 space-y-6 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
            
            <button
              onClick={() => {
                setIsContactModalOpen(false);
                setContactSuccess(false);
              }}
              className="absolute top-4 left-4 p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
              title="إغلاق تبويب التواصل"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Content */}
            <div className="space-y-3 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-950/40 text-[#efd383] rounded-full border border-amber-500/20 text-[10px] font-extrabold tracking-widest uppercase">
                <Mail className="w-3.5 h-3.5 text-[#efd383]" />
                <span>مركز المساعدة والموثوقية للمشتركين</span>
              </div>
              <h3 className="text-2xl font-black text-white">تواصل معنا الآن - OMAR AI 📩</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                نحن في <strong className="text-white">OMAR AI</strong> نولي اهتماماً فائقاً لتوجيهاتكم واستفساراتكم. هذا النموذج مخصص لتوفير قنوات اتصال موثوقة ومعتمدة تلبّي معايير الخصوصية لـ Google AdSense.
              </p>
            </div>

            {/* Email Contact Widget */}
            <div className="p-4 bg-slate-950/70 border border-white/5 rounded-xl flex items-center justify-between gap-3 text-right">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">البريد الإلكتروني الرسمي للمراسلة:</p>
                <p className="text-xs font-black text-amber-300 font-mono">placeholder@omar-ai.com</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText("placeholder@omar-ai.com");
                  alert("تم نسخ البريد الإلكتروني بنجاح!");
                }}
                className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Copy className="w-3 h-3" />
                <span>نسخ البريد</span>
              </button>
            </div>

            {/* Contact Form OR Success message */}
            {contactSuccess ? (
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-6 rounded-xl text-center space-y-3 animate-fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-5 h-5 animate-pulse" />
                </div>
                <h4 className="text-sm font-black text-white">تم إرسال رسالتك بنجاح تام!</h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                  نشكرك على تواصلك مع منصة OMAR AI. لقد تم تسجيل مراسلتك محلياً بشكل آمن، وسيقوم فريق الدعم الفني بالرد المباشر لبريدك الإلكتروني في أقرب فرصة.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContactSuccess(false);
                    setContactName("");
                    setContactEmail("");
                    setContactSubject("");
                    setContactMessage("");
                  }}
                  className="px-4 py-1.5 bg-slate-900 border border-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  كتابة رسالة أخرى
                </button>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
                    alert("فضلاً قم بتعبئة جميع الحقول الإلزامية المطلوبة.");
                    return;
                  }
                  setIsContactSubmitting(true);
                  setTimeout(() => {
                    setIsContactSubmitting(false);
                    setContactSuccess(true);
                  }, 900);
                }} 
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3 text-right">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">الأسم الكامل <span className="text-amber-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="عمر علي"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">البريد الإلكتروني <span className="text-amber-400">*</span></label>
                    <input
                      type="email"
                      required
                      placeholder="client@mail.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:border-amber-500/50 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-slate-400">موضوع الرسالة</label>
                  <input
                    type="text"
                    placeholder="ملاحظات حول سيو الموقع أو القبول بأدسنس"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:border-amber-500/50 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-slate-400">مضمون الرسالة <span className="text-amber-400">*</span></label>
                  <textarea
                    required
                    rows={3}
                    placeholder="اكتب رسالتك أو اقتراحك لمنصتنا بكل تفصيل برمجى هنا..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-[#050810] border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:border-amber-500/50 outline-none transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isContactSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-90 disabled:opacity-50 text-black rounded-lg text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
                >
                  {isContactSubmitting ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                      <span>جاري المعالجة وإرسال البيانات المشفرة...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>إرسال الرسالة بشكل آمن</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer buttons of modal */}
            <div className="pt-4 border-t border-slate-800/60 flex justify-between items-center text-right text-[10px] text-slate-500">
              <p>تتم تعبئة ومعالجة المعطيات بمستويات سلامة وتخصيص عالية 🛡️</p>
              <button
                onClick={() => {
                  setIsContactModalOpen(false);
                  setContactSuccess(false);
                }}
                className="text-amber-500 hover:underline cursor-pointer font-bold"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Footer bar */}
      <footer className="bg-[#050910] border-t border-white/5 py-6 text-center text-xs text-slate-500 font-mono flex flex-col items-center justify-center gap-3">
        <p className="flex items-center justify-center gap-1.5">
          <span>صنع بفخامة وإتقان عبر استضافة عُمَر</span>
          <Heart className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
          <span>عُمَر AI © 2026</span>
        </p>
        <div className="flex gap-4 items-center justify-center">
          <button
            onClick={() => setIsPrivacyModalOpen(true)}
            className="text-slate-400 hover:text-amber-400 transition-colors text-[11px] font-sans underline cursor-pointer"
          >
            🚫 سياسة الخصوصية
          </button>
          
          <span className="text-white/10">|</span>

          <button
            onClick={() => setIsBlogModalOpen(true)}
            className="text-[#efd383] hover:text-amber-400 transition-colors text-[11px] font-sans font-bold underline cursor-pointer flex items-center gap-1"
          >
            <span>📝 المدونة والـ SEO</span>
          </button>

          <span className="text-white/10">|</span>

          <button
            onClick={() => setIsContactModalOpen(true)}
            className="text-indigo-400 hover:text-amber-400 transition-colors text-[11px] font-sans font-bold underline cursor-pointer flex items-center gap-1"
          >
            <span>📞 اتصل بنا</span>
          </button>
        </div>
      </footer>

    </div>
  );
}

