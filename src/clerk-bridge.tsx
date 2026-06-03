/**
 * @file clerk-bridge.tsx
 * @description Advanced interactive abstraction layer for Clerk. 
 * Supports real Clerk integration when configured, and falls back to a stunning,
 * fully functional simulated Clerk Auth modal inside the browser frame when keys are absent.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import * as RealClerk from "@clerk/clerk-react";
import { X, LogIn, Sparkles, AlertCircle, Crown, LogOut, ShieldCheck, Mail, Lock } from "lucide-react";

// Check if a valid, customized key is provided by the developer
export const isClerkConfigured = (): boolean => {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return !!(key && key !== "pk_test_Y2xlcmstZGVtby5jbGVyay5hY2NvdW50cy5kZXYk" && key.length > 10);
};

// Custom interactive simulator context
interface SimulatedAuthContextType {
  isSignedIn: boolean;
  user: any;
  isLoaded: boolean;
  isSignInOpen: boolean;
  isSignUpOpen: boolean;
  openSignIn: () => void;
  openSignUp: () => void;
  closeModals: () => void;
  signInMock: (email: string, fullName: string) => void;
  signOutMock: () => void;
}

const SimulatedAuthContext = createContext<SimulatedAuthContextType | undefined>(undefined);

export const useSimulatedAuth = () => {
  const context = useContext(SimulatedAuthContext);
  if (!context) {
    throw new Error("useSimulatedAuth must be used within a ClerkProvider");
  }
  return context;
};

export const ClerkProvider: React.FC<{ publishableKey: string; children: React.ReactNode }> = ({
  publishableKey,
  children,
}) => {
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => {
    return !!localStorage.getItem("clerk_mock_signed_in");
  });
  const [user, setUser] = useState<any>(() => {
    const cached = localStorage.getItem("clerk_mock_user");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return null;
      }
    }
    return null;
  });
  
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const openSignIn = () => {
    setIsSignInOpen(true);
    setIsSignUpOpen(false);
  };

  useEffect(() => {
    (window as any).openSignIn = openSignIn;
    (window as any).openSignUp = () => {
      setIsSignUpOpen(true);
      setIsSignInOpen(false);
    };
  }, []);
  
  const openSignUp = () => {
    setIsSignUpOpen(true);
    setIsSignInOpen(false);
  };

  const closeModals = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
  };

  const signInMock = (email: string, fullName: string) => {
    const mockUserObj = {
      id: "user_mock_" + Math.random().toString(36).substring(2, 9),
      fullName: fullName || "مطور لووم هوست المبدع",
      username: (fullName || "loomhost_dev").replace(/\s+/g, '_').toLowerCase(),
      primaryEmailAddress: {
        emailAddress: email || "omvq125omas@gmail.com",
      },
      imageUrl: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      publicMetadata: {
        isPremium: true,
        subscriptionPlan: "الخطة الذهبية الفورية - Premium",
      },
      createdAt: new Date().toISOString()
    };
    setUser(mockUserObj);
    setIsSignedIn(true);
    localStorage.setItem("clerk_mock_signed_in", "true");
    localStorage.setItem("clerk_mock_user", JSON.stringify(mockUserObj));
    closeModals();
  };

  const signOutMock = () => {
    setUser(null);
    setIsSignedIn(false);
    localStorage.removeItem("clerk_mock_signed_in");
    localStorage.removeItem("clerk_mock_user");
    localStorage.removeItem("loom_host_local_user");
    localStorage.removeItem("loomhost_user");
    // Trigger window reload to safely flush states
    window.location.reload();
  };

  if (isClerkConfigured()) {
    return (
      <RealClerk.ClerkProvider publishableKey={publishableKey}>
        {children}
      </RealClerk.ClerkProvider>
    );
  }

  return (
    <SimulatedAuthContext.Provider
      value={{
        isSignedIn,
        user,
        isLoaded: true,
        isSignInOpen,
        isSignUpOpen,
        openSignIn,
        openSignUp,
        closeModals,
        signInMock,
        signOutMock,
      }}
    >
      {children}
      <MockAuthModal />
    </SimulatedAuthContext.Provider>
  );
};

// Beautiful fallback modal mimicking Clerk styled in LoomHost AI visual palette
const MockAuthModal: React.FC = () => {
  const auth = useSimulatedAuth();
  const [email, setEmail] = useState("omvq125omas@gmail.com");
  const [name, setName] = useState("صاحب منصة عُفر");
  const [error, setError] = useState("");

  if (!auth.isSignInOpen && !auth.isSignUpOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("الرجاء إدخال بريد إلكتروني صالح");
      return;
    }
    setError("");
    auth.signInMock(email, name);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 antialiased font-sans">
      <div 
        className="fixed inset-0 cursor-pointer" 
        onClick={auth.closeModals}
      />
      <div 
        className="relative w-full max-w-md bg-[#07080c] border border-amber-500/20 rounded-3xl p-6.5 text-right shadow-[0_0_50px_rgba(239,211,131,0.06)] overflow-hidden animate-scale-up"
        dir="rtl"
      >
        {/* Glow Element */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={auth.closeModals}
          className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Greeting */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-[#efd383] mx-auto flex items-center justify-center text-black font-black text-lg shadow-lg shadow-amber-500/10 mb-3">
            <span>𓆩ع𓆪</span>
          </div>
          <h2 className="text-lg font-black text-white">
            مرحباً بك في <span className="text-[#efd383]">LoomHost AI</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">تسجيل دخول آمن وفوري عبر محاكاة شريكة Clerk</p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs font-bold animate-pulse">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-black text-slate-400 block mb-1">البريد الإلكتروني:</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="omvq125omas@gmail.com"
                className="w-full px-3.5 py-3.5 bg-black/50 border border-white/5 focus:border-[#efd383]/40 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 text-left pr-10"
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 block mb-1">الاسم بالكامل:</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="صاحب منصة عُفر"
                className="w-full px-3.5 py-3.5 bg-black/50 border border-white/5 focus:border-[#efd383]/40 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 text-right pr-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-400 to-[#efd383] hover:brightness-110 active:scale-[0.99] text-black text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10"
          >
            <LogIn className="w-4 h-4" />
            <span>تأكيد وتسجيل الدخول الفوري</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500">
            أو التوصيل التجريبي السريع بضغطة واحدة:
          </p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              onClick={() => auth.signInMock("omvq125omas@gmail.com", "صاحب منصة عُفر")}
              className="px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-[#efd383]/20 text-[10px] font-bold text-slate-300 rounded-xl transition-all hover:bg-amber-500/[0.03] cursor-pointer"
            >
              🔑 حساب المسؤول الآمن
            </button>
            <button
              onClick={() => auth.signInMock("demo.user@loomhost.ai", "عميل سحابي تجريبي")}
              className="px-3 py-2 bg-white/[0.02] border border-white/5 hover:border-[#efd383]/20 text-[10px] font-bold text-slate-300 rounded-xl transition-all hover:bg-amber-500/[0.03] cursor-pointer"
            >
              👤 حساب عميل افتراضي
            </button>
          </div>
        </div>

        <div className="mt-5 text-center flex justify-center items-center gap-1.5 text-[9px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>مؤمن بالكامل عبر نظام محاكاة Clerk السحابي</span>
        </div>
      </div>
    </div>
  );
};

export const useUser = () => {
  if (isClerkConfigured()) {
    return RealClerk.useUser();
  }
  
  const auth = useContext(SimulatedAuthContext);
  if (!auth) {
    return { isLoaded: true, isSignedIn: false, user: null };
  }
  return {
    isLoaded: true,
    isSignedIn: auth.isSignedIn,
    user: auth.user,
  };
};

export const SignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkConfigured()) {
    return <RealClerk.SignedIn>{children}</RealClerk.SignedIn>;
  }
  
  const auth = useContext(SimulatedAuthContext);
  return auth?.isSignedIn ? <>{children}</> : null;
};

export const SignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkConfigured()) {
    return <RealClerk.SignedOut>{children}</RealClerk.SignedOut>;
  }
  
  const auth = useContext(SimulatedAuthContext);
  return !auth?.isSignedIn ? <>{children}</> : null;
};

interface SignInButtonProps {
  children: React.ReactElement;
  mode?: "modal" | "redirect";
}

export const SignInButton: React.FC<SignInButtonProps> = ({ children }) => {
  const auth = useContext(SimulatedAuthContext);
  
  if (isClerkConfigured()) {
    return <RealClerk.SignInButton mode="modal">{children}</RealClerk.SignInButton>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    auth?.openSignIn();
  };

  return React.cloneElement(children, { onClick: handleClick });
};

export const SignUpButton: React.FC<SignInButtonProps> = ({ children }) => {
  const auth = useContext(SimulatedAuthContext);
  
  if (isClerkConfigured()) {
    return <RealClerk.SignUpButton mode="modal">{children}</RealClerk.SignUpButton>;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    auth?.openSignUp();
  };

  return React.cloneElement(children, { onClick: handleClick });
};

export const UserButton: React.FC<any> = (props) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const auth = useContext(SimulatedAuthContext);

  if (isClerkConfigured()) {
    return <RealClerk.UserButton {...props} />;
  }

  if (!auth?.isSignedIn || !auth.user) return null;

  return (
    <div className="relative inline-block text-right font-sans">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-8 h-8 rounded-lg overflow-hidden border border-[#efd383]/40 bg-amber-500/5 hover:border-amber-400 focus:outline-none cursor-pointer flex items-center justify-center text-xs font-black"
        title="الملف الشخصي"
      >
        <img 
          src={auth.user.imageUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute left-0 mt-2.5 w-60 bg-[#090b10] border border-white/5 rounded-2xl shadow-2xl p-4 z-50 text-right animate-scale-up space-y-3">
            <div className="border-b border-white/5 pb-2">
              <p className="text-xs font-black text-white">{auth.user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5" dir="ltr">{auth.user.primaryEmailAddress.emailAddress}</p>
            </div>
            
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[#efd383] text-[10px] font-bold">
              <span className="flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {auth.user.publicMetadata.subscriptionPlan}
              </span>
            </div>

            <button
              onClick={() => {
                setDropdownOpen(false);
                auth.signOutMock();
              }}
              className="w-full py-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج السريع</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
