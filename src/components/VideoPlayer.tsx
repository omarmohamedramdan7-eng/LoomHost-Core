import React, { useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  User as FirebaseUser 
} from "firebase/auth";
import { Play, Lock, ShieldAlert, Sparkles, LogIn, MonitorPlay, Film, ArrowLeft } from "lucide-react";

interface VideoPlayerProps {
  videoUrl?: string; // YouTube embed link or custom direct mp4
  title?: string;
  description?: string;
  posterUrl?: string;
}

// 🏢 AdBanner component containing the requested hilltop-ads-container ID
export function AdBanner() {
  return (
    <div className="w-full mt-4 p-3 bg-slate-950/40 border border-dashed border-white/5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[90px] group transition-all hover:border-cyan-500/10" id="ad-banner-placement">
      <span className="text-[9px] font-black tracking-widest text-slate-600 uppercase mb-1 block select-none">
        إعلان ممول بقوة الذكاء الاصطناعي • ADVERTISEMENT
      </span>
      {/* Target Container for custom HilltopAds script integration */}
      <div 
        id="hilltop-ads-container" 
        className="w-full flex items-center justify-center text-[11px] text-slate-500 font-medium"
      >
        <span className="animate-pulse">جاري تحميل المساحة الإعلانية الآمنة...</span>
      </div>
    </div>
  );
}

export default function VideoPlayer({
  videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ", // Default premium YouTube embed
  title = "فيديو تعريفي لرحلة الاستضافة السحابية بـ LoomHost AI",
  description = "تعرف على كيفية نشر موقعك الإلكتروني ومزامنته السحابية خلال 30 ثانية باستخدام الذكاء الاصطناعي التوليدي من لووم هوست.",
  posterUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"
}: VideoPlayerProps) {
  
  // Real active user state from Firebase Authentication directly
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoaded, setAuthLoaded] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [authError, setAuthError] = useState<string>("");
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    // 100% direct dependency on Firebase Auth to ensure correct access gating
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoaded(true);
    });

    // Elegant presentation timing for Skeleton screens
    const skeletonTimer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 550);

    return () => {
      unsubscribe();
      clearTimeout(skeletonTimer);
    };
  }, []);

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Fast, interactive responsive popup authentication
      await signInWithPopup(auth, provider);
      // Synchronize with local state to ensure existing interface components sync-active
      localStorage.setItem("clerk_mock_signed_in", "true");
    } catch (err: any) {
      console.error("Google Auth Failure in VideoPlayer Component:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setAuthError("تم إغلاق نافذة الاتصال الآمنة قبل إتمام التسجيل.");
      } else {
        setAuthError("فشل تسجيل الدخول الفوري بـ Google. يرجى مراجعة إعدادات Firebase.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // 🦴 Fully Polished Skeleton Loading Screen
  if (!authLoaded || !isPageLoaded) {
    return (
      <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-900 bg-slate-950/40 p-1 animate-pulse" id="video-skeleton-gating">
        <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
            <MonitorPlay className="w-5 h-5 text-slate-700 animate-bounce" />
          </div>
          <div className="absolute bottom-4 right-4 h-3.5 w-1/3 bg-slate-850 rounded" />
          <div className="absolute bottom-11 right-4 h-4.5 w-1/2 bg-slate-800 rounded" />
        </div>
        <div className="p-5 space-y-3 text-right">
          <div className="h-4 bg-slate-900 rounded w-3/4 mr-auto" />
          <div className="h-3 bg-slate-900 rounded w-5/6 mr-auto" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-900/80 bg-slate-950/60 p-1 shadow-2xl transition-all duration-300 hover:border-cyan-500/15"
      id="loomhost-secure-videoplayer"
    >
      {/* Display active container element with video embed or gating wall */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center group">
        
        {currentUser ? (
          /* 🟢 Render Content IF User is Authorized via Firebase */
          <>
            {isPlaying ? (
              <iframe
                src={`${videoUrl}?autoplay=1&rel=0`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full object-cover"
                id="active-video-iframe"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <img
                  src={posterUrl}
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-[1.02] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-neutral-950/65 group-hover:bg-neutral-950/50 transition-colors duration-300" />
                
                {/* Play Controller overlay */}
                <div className="relative z-10 flex flex-col items-center gap-4 text-center px-4">
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
                    id="trigger-start-play"
                  >
                    <Play className="w-7 h-7 fill-white translate-x-[2px]" />
                  </button>
                  <div className="space-y-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                      مفتوح بمصادقة جوجل السحابية 🔒
                    </span>
                    <p className="text-xs text-slate-300 font-bold mt-1.5 drop-shadow-md">
                      انقر لتشغيل الفيديو التعريفي الشامل الآن
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* 🔴 Render CONTENT GATING WALL IF User is Not Authorized */
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center overflow-hidden">
            <img
              src={posterUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-[#07080c]/92" />
            
            <div className="relative z-10 max-w-sm mx-auto space-y-4.5 animate-scale-up px-4" id="content-gating-lock">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 mx-auto flex items-center justify-center shadow-inner shadow-cyan-500/5">
                <Lock className="w-6 h-6 animate-pulse" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-white">
                  يجب تسجيل الدخول لمشاهدة الفيديو 🔒
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                  لحماية سعة النطاق التراسلي للبنية السحابية في LoomHost AI، يرجى الاستعانة بحساب جوجل الخاص بك لتأكيد الدخول ومشاهدة الشرح التفاعلي فوراً.
                </p>
              </div>

              {authError && (
                <div className="text-[10px] text-rose-300 font-bold bg-rose-500/10 border border-rose-500/20 py-1.5 px-3 rounded-lg animate-bounce">
                  {authError}
                </div>
              )}

              <div className="flex flex-col gap-2 justify-center pt-1.5">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full py-3 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-xl text-xs font-black text-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  id="google-direct-gate-btn"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>
                    {authLoading ? "جاري الاتصال الآمن مع جوجل..." : "سجل الآن بحساب جوجل مباشرة"}
                  </span>
                </button>
              </div>

              <div className="flex justify-center items-center gap-1 text-[9px] text-slate-500 select-none pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#efd383]" />
                <span>حماية مشفرة 100% عبر Firebase Authentication</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Description & AdBanner Panel inside the component footer */}
      <div className="p-4 sm:p-5 border-t border-slate-900 text-right">
        <div className="space-y-1.5 mb-4">
          <h4 className="text-sm font-black text-white flex items-center gap-2 justify-start">
            <Film className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{title}</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Integrated AdBanner slot as requested */}
        <AdBanner />
      </div>
    </div>
  );
}
