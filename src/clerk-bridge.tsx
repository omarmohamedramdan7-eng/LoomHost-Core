/**
 * @file clerk-bridge.tsx
 * @description Advanced interactive abstraction layer converting Clerk references to actual Firebase Auth and Firestore.
 * Supports real Firebase Authentication (Google, Email/Password) and maintains full compatibility with existing components.
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebaseConfig";
import { X, LogIn, Sparkles, AlertCircle, Crown, LogOut, ShieldCheck, Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";

// Setup custom types to perfectly mimic Clerk outputs for seamless integration in App.tsx and components
export interface ClerkUserType {
  id: string;
  fullName: string;
  username: string;
  primaryEmailAddress: {
    emailAddress: string;
  };
  imageUrl: string;
  publicMetadata: {
    isPremium: boolean;
    subscriptionPlan: string;
  };
  createdAt: string;
}

interface FirebaseBridgeContextType {
  isSignedIn: boolean;
  user: ClerkUserType | null;
  isLoaded: boolean;
  isSignInOpen: boolean;
  isSignUpOpen: boolean;
  openSignIn: () => void;
  openSignUp: () => void;
  closeModals: () => void;
  triggerSignOut: () => Promise<void>;
}

const FirebaseBridgeContext = createContext<FirebaseBridgeContextType | undefined>(undefined);

export const useFirebaseBridge = () => {
  const context = useContext(FirebaseBridgeContext);
  if (!context) {
    throw new Error("useFirebaseBridge must be used within a ClerkProvider");
  }
  return context;
};

// Simulated dummy function to preserve compatibility if checked anywhere
export const isClerkConfigured = (): boolean => {
  return true; // Force real Firebase mode inside our unified bridge
};

export const ClerkProvider: React.FC<{ publishableKey?: string; children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<ClerkUserType | null>(null);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const openSignIn = () => {
    setIsSignInOpen(true);
    setIsSignUpOpen(false);
  };

  const openSignUp = () => {
    setIsSignUpOpen(true);
    setIsSignInOpen(false);
  };

  const closeModals = () => {
    setIsSignInOpen(false);
    setIsSignUpOpen(false);
  };

  // Convert Firebase User object to expected Clerk-like user object
  const mapFirebaseUser = (fbUser: FirebaseUser): ClerkUserType => {
    // Generate username from email or display name
    const emailPrefix = fbUser.email ? fbUser.email.split("@")[0] : "user";
    const cleanUsername = (fbUser.displayName || emailPrefix).replace(/\s+/g, '_').toLowerCase();
    
    // Check if user is the manager or owner based on credentials (e.g. user details matching omvq125omas@gmail.com)
    const isOwnerUser = fbUser.email === "omvq125omas@gmail.com";

    return {
      id: fbUser.uid,
      fullName: fbUser.displayName || fbUser.email?.split("@")[0] || "مستخدم لووم هوست",
      username: cleanUsername,
      primaryEmailAddress: {
        emailAddress: fbUser.email || "guest@loomhost.ai",
      },
      imageUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${fbUser.uid}`,
      publicMetadata: {
        isPremium: true,
        subscriptionPlan: isOwnerUser ? "الخطة الشاملة للمسؤول الفواتيري - Enterprise ⚡" : "الباقة الاحترافية السحابية - Premium ✨",
      },
      createdAt: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toISOString() : new Date().toISOString()
    };
  };

  useEffect(() => {
    // Listen for Auth changes - fully production-ready Firebase Authentication
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setCurrentUser(mapFirebaseUser(fbUser));
        localStorage.setItem("clerk_mock_signed_in", "true");
      } else {
        setCurrentUser(null);
        localStorage.removeItem("clerk_mock_signed_in");
      }
      setAuthLoaded(true);
    });

    // Setup global listeners to support actions triggering Auth dialogs dynamically
    const handleOpenSignIn = () => openSignIn();
    const handleOpenSignUp = () => openSignUp();
    
    (window as any).openSignIn = handleOpenSignIn;
    (window as any).openSignUp = handleOpenSignUp;
    
    window.addEventListener("open-clerk-signin", handleOpenSignIn);

    return () => {
      unsubscribe();
      delete (window as any).openSignIn;
      delete (window as any).openSignUp;
      window.removeEventListener("open-clerk-signin", handleOpenSignIn);
    };
  }, []);

  const triggerSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem("clerk_mock_signed_in");
      closeModals();
      window.location.reload();
    } catch (e) {
      console.error("Firebase SignOut Error:", e);
    }
  };

  return (
    <FirebaseBridgeContext.Provider
      value={{
        isSignedIn: !!currentUser,
        user: currentUser,
        isLoaded: authLoaded,
        isSignInOpen,
        isSignUpOpen,
        openSignIn,
        openSignUp,
        closeModals,
        triggerSignOut,
      }}
    >
      {children}
      <FirebaseAuthModal />
    </FirebaseBridgeContext.Provider>
  );
};

// Beautiful fully functional Firebase Authentication design (Email/Password & Google popup)
// Beautiful fully functional Firebase Authentication design (Email/Password & Google popup with iframe helpers)
const FirebaseAuthModal: React.FC = () => {
  const bridge = useFirebaseBridge();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);
    }
  }, []);

  useEffect(() => {
    if (bridge.isSignInOpen) {
      setIsLoginView(true);
      setError("");
    } else if (bridge.isSignUpOpen) {
      setIsLoginView(false);
      setError("");
    }
  }, [bridge.isSignInOpen, bridge.isSignUpOpen]);

  if (!bridge.isSignInOpen && !bridge.isSignUpOpen) return null;

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      bridge.closeModals();
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      // Give extremely helpful hints for iframe sandbox limits
      if (err.code === "auth/popup-closed-by-user") {
        setError("⚠️ تم إغلاق نافذة الدخول قبل إتمام التسجيل.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("⚠️ تسجيل الدخول بجوجل غير مفعّل حالياً في مستندات مشروع Firebase. يرجى تفعيله من الكونسول أو الاستعانة بإنشاء حساب بالبريد الإلكتروني مباشرة!");
      } else {
        setError(
          `💡 نصيحة الأمن: تعذر فتح نافذة Google المنبثقة بسبب قيود متصفحك أو وجودك داخل إطار المعاينة الصغير لـ AI Studio (طرف ثالث). يرجى فتح الموقع في نافذة خارجية جديدة، أو الأفضل: سجل حساباً بريدياً عادياً أو استخدم زر الدخول السريع بالأسفل!`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !email.includes("@")) {
      setError("الرجاء إدخال بريد إلكتروني صالح.");
      return;
    }
    if (!password || password.length < 6) {
      setError("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
      return;
    }

    setLoading(true);
    try {
      if (isLoginView) {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign Up
        if (!fullName.trim()) {
          setError("الرجاء إدخال الاسم كاملاً لإتمام إنشاء الحساب.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Set display name in Auth profile
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: fullName,
          });
        }
      }
      bridge.closeModals();
    } catch (err: any) {
      console.error("Email authentication failure:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("بيانات الدخول غير صحيحة، يرجى التحقق وإعادة المحاولة أو إنشاء حساب جديد.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("هذا البريد الإلكتروني مسجل بالفعل باسم حساب آخر. جرب تسجيل الدخول.");
      } else if (err.code === "auth/operation-not-allowed") {
        setError("⚠️ خيار البريد وكلمة المرور غير مفعّل بـ Firebase حالياً. يرجى استخدام زر الدخول السريع الفوري بالأسفل لتجربة لوحة التحكم بكامل ميزاتها!");
      } else {
        setError(err.message || "حدثت مشكلة أثناء المصادقة السحابية.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="firebase-auth-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 antialiased font-sans">
      <div 
        className="fixed inset-0 cursor-pointer" 
        onClick={bridge.closeModals}
      />
      <div 
        className="relative w-full max-w-md bg-[#07080c] border border-cyan-500/20 rounded-3xl p-6.5 text-right shadow-[0_0_50px_rgba(6,182,212,0.08)] overflow-hidden animate-scale-up"
        dir="rtl"
      >
        {/* Glow Element */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={bridge.closeModals}
          className="absolute left-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-500 mx-auto flex items-center justify-center text-black font-black text-lg shadow-lg shadow-cyan-500/20 mb-3 animate-bounce">
            <span>𓆩ع𓆪</span>
          </div>
          <h2 className="text-lg font-black text-white">
            {isLoginView ? "مرحباً بك في " : "إنشاء حساب جديد في "}<span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">LoomHost AI</span>
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            {isLoginView ? "قم بتسجيل الدخول إلى حسابك السحابي لإدارة واستضافة مواقعك المتقدمة" : "ابدأ تجربتك السحابية واستضف موقعك بالذكاء الاصطناعي مجاناً"}
          </p>
        </div>

        {/* Sandbox Iframe Guidance Notice */}
        {isIframe && (
          <div className="mb-4 bg-cyan-950/40 border border-cyan-700/30 rounded-xl p-3 text-[10px] text-cyan-300 leading-relaxed font-semibold">
            🚀 <strong>تنبيه المعاينة:</strong> للتسجيل بجوجل الحقيقي، يفضل الدخول من نافذة خارجية مستقلة (عن طريق زر التكبير بأعلى متصفح AI Studio). أو يمكنك التسجيل السريع ببريدك الإلكتروني، أو تخطي الأمر عبر خيار VIP السريع أدناه!
          </div>
        )}

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex flex-col gap-1 text-rose-300 text-[11px] font-bold leading-relaxed">
            <span className="flex items-center gap-1.5 leading-none">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>خطأ في التوثيق:</span>
            </span>
            <p className="mt-1 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
          {!isLoginView && (
            <div>
              <label className="text-[11px] font-black text-slate-400 block mb-1">الاسم بالكامل:</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم واللقب..."
                  className="w-full px-3.5 py-3.2 bg-black/50 border border-white/5 focus:border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 text-right pr-10"
                />
                <LogIn className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] font-black text-slate-400 block mb-1">البريد الإلكتروني:</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full px-3.5 py-3.2 bg-black/50 border border-white/5 focus:border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 text-left pr-10"
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-400 block mb-1">كلمة المرور:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3.5 py-3.2 bg-black/50 border border-white/5 focus:border-cyan-500/40 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-0 text-left pr-10 pl-10"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.2 mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 active:scale-[0.99] ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isLoginView ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            <span>
              {loading ? "جاري المعالجة السحابية..." : isLoginView ? "تسجيل الدخول للوحة التحكم السحابية" : "إنشاء وتفعيل الحساب الجديد"}
            </span>
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-2.5">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {/* Google Vector Icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            <span>متابعة تسجيل الدخول السريع عبر Google</span>
          </button>

          <div className="text-center mt-1">
            <button
              onClick={() => setIsLoginView(!isLoginView)}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              {isLoginView ? "ليس لديك حساب؟ سجل حساباً مجانياً الآن" : "لديك حساب بالفعل؟ سجل دخولك"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center flex justify-center items-center gap-1.5 text-[9px] text-slate-500 select-none">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>مؤمن بنظام تشفير وربط Firebase السحابي</span>
        </div>
      </div>
    </div>
  );
};

export const useUser = () => {
  const bridge = useContext(FirebaseBridgeContext);
  if (!bridge) {
    return { isLoaded: false, isSignedIn: false, user: null };
  }
  return {
    isLoaded: bridge.isLoaded,
    isSignedIn: bridge.isSignedIn,
    user: bridge.user,
  };
};

export const SignedIn: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bridge = useContext(FirebaseBridgeContext);
  return bridge?.isSignedIn ? <>{children}</> : null;
};

export const SignedOut: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const bridge = useContext(FirebaseBridgeContext);
  return !bridge?.isSignedIn && bridge?.isLoaded ? <>{children}</> : null;
};

interface SignInButtonProps {
  children: React.ReactElement;
  mode?: "modal" | "redirect";
}

export const SignInButton: React.FC<SignInButtonProps> = ({ children }) => {
  const bridge = useContext(FirebaseBridgeContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    bridge?.openSignIn();
  };

  return React.cloneElement(children, { onClick: handleClick });
};

export const SignUpButton: React.FC<SignInButtonProps> = ({ children }) => {
  const bridge = useContext(FirebaseBridgeContext);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    bridge?.openSignUp();
  };

  return React.cloneElement(children, { onClick: handleClick });
};

export const UserButton: React.FC<any> = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const bridge = useContext(FirebaseBridgeContext);

  if (!bridge?.isSignedIn || !bridge.user) return null;

  return (
    <div className="relative inline-block text-right font-sans z-[100]">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-400 focus:outline-none cursor-pointer flex items-center justify-center text-xs font-black transition-all"
        title="الملف الشخصي"
      >
        <img 
          src={bridge.user.imageUrl} 
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute left-0 mt-2.5 w-60 bg-[#090b10] border border-white/5 rounded-2xl shadow-2xl p-4 z-50 text-right animate-scale-up space-y-3">
            <div className="border-b border-white/5 pb-2">
              <p className="text-xs font-black text-white">{bridge.user.fullName}</p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5" dir="ltr">
                {bridge.user.primaryEmailAddress.emailAddress}
              </p>
            </div>
            
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-cyan-400 text-[10px] font-bold">
              <span className="flex items-center gap-1 select-none">
                <Crown className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                {bridge.user.publicMetadata.subscriptionPlan}
              </span>
            </div>

            <button
              onClick={async () => {
                setDropdownOpen(false);
                await bridge.triggerSignOut();
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
