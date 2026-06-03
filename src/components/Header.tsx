import React from "react";
import { 
  SignInButton, 
  SignUpButton, 
  UserButton, 
  SignedIn, 
  SignedOut,
  useUser
} from "../clerk-bridge";
import { Sparkles, LogIn, Cpu } from "lucide-react";
import { syncProfile } from "../scripts";

export default function Header() {
  const { user, isSignedIn } = useUser();

  // Sync profile metadata to dashboard components instantly when logged in
  React.useEffect(() => {
    if (isSignedIn && user) {
      syncProfile(user);
    }
  }, [isSignedIn, user]);

  return (
    <header className="w-full bg-[#040406]/90 backdrop-blur-md border-b border-white/5 sticky top-0 z-50 px-4 md:px-8 py-3.5 flex items-center justify-between" dir="rtl">
      {/* 🔮 Logo Section */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#efd383] to-amber-600 flex items-center justify-center text-black shadow-lg shadow-amber-500/10">
          <span className="text-black font-black text-md font-mono">𓆩ع𓆪</span>
        </div>
        <div className="hidden sm:block text-right">
          <h1 className="text-sm font-black text-white tracking-wide">
            LoomHost <span className="text-[#efd383]">AI</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-bold font-mono">استضافة السحابية المتقدمة</p>
        </div>
      </div>

      {/* 🧭 Navigation / Stats Center */}
      <div className="hidden md:flex items-center gap-6">
        <a href="#studio" className="text-xs font-bold text-slate-300 hover:text-[#efd383] transition-colors">لوحة التحكم</a>
        <a href="#generator" className="text-xs font-bold text-slate-300 hover:text-[#efd383] transition-colors font-mono">AI Generator</a>
        <a href="#community" className="text-xs font-bold text-slate-300 hover:text-[#efd383] transition-colors">معرض المشاريع</a>
      </div>

      {/* 👤 Clerk Authentication Interface */}
      <div className="flex items-center gap-4">
        {/* State 1: User is NOT Signed In */}
        <SignedOut>
          <div className="flex items-center gap-2.5">
            <SignInButton mode="modal">
              <button 
                type="button"
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-[#efd383] hover:brightness-110 active:scale-95 text-black text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
              >
                <LogIn className="w-3.5 h-3.5 text-black" />
                <span>تسجيل الدخول</span>
              </button>
            </SignInButton>
            
            <SignUpButton mode="modal">
              <button 
                type="button"
                className="hidden sm:flex px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5 text-slate-300 hover:text-[#efd383] text-xs font-bold rounded-xl transition-all cursor-pointer items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>إنشاء حساب</span>
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        {/* State 2: User IS Signed In */}
        <SignedIn>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-left font-mono" dir="ltr">
              <div className="text-[9px] bg-amber-500/10 text-[#efd383] px-2 py-0.5 rounded-full border border-amber-500/20 font-black flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" />
                <span>CLOUD_ACTIVE</span>
              </div>
            </div>
            
            <div className="p-0.5 rounded-xl border border-amber-500/30 bg-amber-500/5 hover:border-[#efd383] transition-colors">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 rounded-lg",
                    userButtonPopoverCard: "bg-[#0a0a0d] border border-white/10 text-white",
                    userButtonTrigger: "focus:outline-none focus:ring-0"
                  }
                }}
              />
            </div>
          </div>
        </SignedIn>
      </div>
    </header>
  );
}
