/**
 * @file AuthButton.tsx
 * @description Highly polished, luxury dark-mode Google Auth Button for Omar AI / LoomHost AI using Firebase.
 */

import React, { useState, useEffect } from "react";
import { signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { auth, googleProvider } from "../firebaseConfig";
import { LogIn, LogOut, User as UserIcon, Sparkles } from "lucide-react";

interface AuthButtonProps {
  onAuthSuccess: (user: User) => void;
  onLogout: () => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  onAuthSuccess,
  onLogout,
  triggerToast
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const authSuccessRef = React.useRef(onAuthSuccess);
  const logoutRef = React.useRef(onLogout);
  const isInitial = React.useRef(true);

  useEffect(() => {
    authSuccessRef.current = onAuthSuccess;
    logoutRef.current = onLogout;
  });

  useEffect(() => {
    // Listen to Firebase auth state shifts
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        authSuccessRef.current(currentUser);
      } else if (!isInitial.current) {
        logoutRef.current();
      }
      isInitial.current = false;
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    // Check if the user has changed the placeholder config keys yet
    const apiKey = auth?.app?.options?.apiKey;
    const isConfigured = apiKey && apiKey !== "YOUR_API_KEY_HERE" && !apiKey.includes("Placeholder") && apiKey.length > 5;
    
    if (!isConfigured) {
      triggerToast(
        "⚠️ يرجى أولاً إدخال مفاتيح Firebase الخاصة بك في ملف src/firebaseConfig.ts ليتم الاتصال بخادم جوجل بنجاح.",
        "info"
      );
      return;
    }

    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      triggerToast("👋 توثيق آمن: جاري مزامنة حسابك سحابياً...", "success");
    } catch (err: any) {
      console.error("Firebase auth error:", err);
      // Friendly toast message explaining how to enable the sign-in provider or check rules
      triggerToast(
        `❌ فشل تسجيل الدخول: يرجى التحقق من مفاتيح Firebase وتفعيل Google Sign-In بمشروعك (تفصيل: ${err.message})`,
        "error"
      );
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      triggerToast("🔒 تم تسجيل الخروج وحماية جلستك بنجاح.", "success");
    } catch (err: any) {
      triggerToast("عذراً، حدث خطأ أثناء محاولة تسجيل الخروج.", "error");
    }
  };

  if (loading) {
    return (
      <button
        id="auth-loading-state"
        disabled
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-400 bg-slate-900 border border-slate-800 rounded-xl"
        dir="rtl"
      >
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
        <span>جاري التحقق من الهوية...</span>
      </button>
    );
  }

  return (
    <div id="auth-button-module" className="flex items-center gap-3 font-sans" dir="rtl">
      {user ? (
        <div id="auth-signed-in" className="flex items-center gap-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-1.5 pl-4 hover:border-slate-700/80 transition-all">
          {/* User Profile Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-8 w-8 rounded-xl object-cover border border-slate-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-[#00f0ff] to-[#39ff14] flex items-center justify-center text-slate-950">
              <UserIcon className="h-4 w-4" />
            </div>
          )}

          {/* User description & log out action */}
          <div className="flex flex-col text-right">
            <span className="text-[11px] font-black text-slate-100 max-w-[124px] truncate leading-tight">
              {user.displayName || "عضو عمر AI"}
            </span>
            <span className="text-[9px] text-[#00f0ff] font-mono leading-none mt-0.5">
              مستضيف معتمد
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800/80"></div>

          {/* Sign Out Trigger */}
          <button
            id="btn-trigger-logout"
            onClick={handleSignOut}
            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            title="تسجيل الخروج"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          id="btn-google-login"
          onClick={handleSignIn}
          className="group relative flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl bg-[#070b14] border border-slate-800 hover:border-[#00f0ff]/30 text-xs font-semibold text-slate-200 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,240,255,0.1)] active:scale-95"
        >
          {/* Google Color G Symbol Vector Built Inline */}
          <svg className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.08H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.92l2.85-2.22-.03-.6z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.08l3.66 2.84c.87-2.6 3.3-4.54 6.16-4.54z"
              fill="#EA4335"
            />
          </svg>

          <span className="group-hover:text-white transition-colors">الدخول بجوجل</span>
          
          <Sparkles className="h-3.5 w-3.5 text-[#00f0ff]/50 group-hover:text-[#00f0ff] animate-pulse" />
        </button>
      )}
    </div>
  );
};
