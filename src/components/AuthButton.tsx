/**
 * @file AuthButton.tsx
 * @description Local User Profile Manager & Subscription Configurator (Fully bypassing Firebase Auth for stable local environments).
 */

import React, { useState } from "react";
import { 
  User as UserIcon, 
  Sparkles, 
  Settings2, 
  Check, 
  Mail, 
  Crown,
  Shuffle,
  CreditCard
} from "lucide-react";
import { LocalUserProfile } from "../types";

interface AuthButtonProps {
  currentUser: LocalUserProfile;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
  initiatePayment: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  currentUser,
  setCurrentUser,
  triggerToast,
  initiatePayment
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(currentUser.displayName || currentUser.name || "Guest");
  const [editEmail, setEditEmail] = useState<string>(currentUser.email || "guest@loomhost.local");

  // Apply and persist profile modifications locally
  const handleSaveProfile = (updatedFields: Partial<LocalUserProfile>) => {
    const updated = {
      ...currentUser,
      ...updatedFields,
      // Keep name & displayName and id & uid synced for ultimate compatibility
      name: updatedFields.displayName || updatedFields.name || currentUser.name || "Guest",
      displayName: updatedFields.displayName || updatedFields.name || currentUser.displayName || "Guest",
      uid: updatedFields.id || updatedFields.uid || currentUser.uid,
      id: updatedFields.id || updatedFields.uid || currentUser.id,
    };
    setCurrentUser(updated);
    localStorage.setItem("loom_host_local_user", JSON.stringify(updated));
    localStorage.setItem("loomhost_user", JSON.stringify(updated));
  };

  const handleTogglePremium = () => {
    if (!currentUser.isPremium) {
      // Trigger pay simulator
      initiatePayment();
      
      // Upgrade sandbox
      const updatedPlan = "Premium Pro Plan";
      handleSaveProfile({
        isPremium: true,
        subscriptionPlan: updatedPlan
      });
      triggerToast("🚀 تم تنشيط النطاق السحابي للمحاكاة (Premium).", "success");
    } else {
      // Downgrade sandbox
      handleSaveProfile({
        isPremium: false,
        subscriptionPlan: "Free Plan"
      });
      triggerToast("⬇️ تم الرجوع للخطة المجانية.", "info");
    }
  };

  const handleRegenerateUid = () => {
    const randomUid = "usr_" + Math.random().toString(36).substring(2, 10);
    handleSaveProfile({ id: randomUid, uid: randomUid });
    triggerToast(`🔑 تم توليد معرف مستخدم فريد ومحمي: ${randomUid}`, "info");
  };

  return (
    <div id="local-profile-manager" className="relative font-sans" dir="rtl">
      {/* Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setEditName(currentUser.displayName || currentUser.name || "Guest");
          setEditEmail(currentUser.email || "guest@loomhost.local");
        }}
        className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800 hover:border-amber-500/30 rounded-xl p-1.5 pl-3 transition-all duration-300 cursor-pointer text-right select-none"
        title="إدارة الحساب المحلي السحابي"
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950">
          {currentUser.isPremium ? (
            <Crown className="w-4 h-4 text-slate-950 fill-slate-950" />
          ) : (
            <UserIcon className="h-4 w-4 text-slate-950" />
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-[11px] font-black text-slate-100 max-w-[124px] truncate leading-tight">
            {currentUser.displayName || currentUser.name || "Guest"}
          </span>
          <span className="text-[9px] text-[#efd383] font-mono leading-none mt-0.5 flex items-center gap-1 font-bold">
            {currentUser.isPremium ? (
              <>
                <Crown className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                <span>{currentUser.subscriptionPlan}</span>
              </>
            ) : (
              <span>عضو عادي (شريكة مجانية)</span>
            )}
          </span>
        </div>

        <Settings2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-white mr-1 transition-colors" />
      </button>

      {/* Profile Collapsible Panel */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute left-0 mt-3.5 w-72 bg-[#090b10] border border-white/5 shadow-2xl rounded-2xl p-4.5 z-50 animate-scale-up space-y-4">
            <div className="border-b border-white/5 pb-2">
              <h4 className="text-xs font-black text-[#efd383] flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-amber-400" />
                إعدادات الحساب السحابي الفوري
              </h4>
              <p className="text-[9px] text-slate-400 mt-1 font-sans">
                هيكل الملف الشخصي المحلي (بيديل آمن وخفيف لـ Google SSO)
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-bold">إسم العميل المنشور:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    handleSaveProfile({ displayName: e.target.value, name: e.target.value });
                  }}
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 focus:border-[#efd383]/40 rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 block font-bold">البريد الإلكتروني الموصول:</label>
                <div className="relative">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => {
                      setEditEmail(e.target.value);
                      handleSaveProfile({ email: e.target.value });
                    }}
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-white/5 focus:border-[#efd383]/40 rounded-lg text-xs text-white focus:outline-none text-left"
                  />
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1 bg-black/40 border border-white/5 p-2 rounded-lg text-right">
                <div className="flex justify-between items-center text-[9px] text-slate-400">
                  <span className="font-bold">مُعرّف العميل (Workspace-UID):</span>
                  <button
                    onClick={handleRegenerateUid}
                    className="p-1 text-slate-400 hover:text-amber-400 rounded hover:bg-white/5"
                    title="توليد معرف مستخدم عشوائي جديد"
                  >
                    <Shuffle className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[10px] text-slate-200 block truncate font-mono select-all bg-black/80 px-1.5 py-0.5 rounded border border-white/5 mt-1 text-center">
                  {currentUser.uid || currentUser.id}
                </span>
              </div>
            </div>

            {/* Premium Gating Configurator (Perfect for payments simulator / expansion) */}
            <div className="bg-amber-950/10 border border-[#efd383]/10 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ترقية الحساب المدفوع
                </span>
                <span className="text-[9px] text-amber-500 bg-amber-500/10 rounded font-bold px-1 py-0.5">
                  Sandbox Pay
                </span>
              </div>
              <p className="text-[9px] text-slate-400 leading-relaxed font-sans">
                تفعيل الـ Premium يتيح الميزات السحابية اللامحدودة، التخصيص، والسرعة الخارقة تلقائياً.
              </p>

              <button
                type="button"
                onClick={handleTogglePremium}
                className={`w-full py-1.5 text-[10px] font-extrabold rounded-lg transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  currentUser.isPremium 
                    ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30" 
                    : "bg-amber-400 hover:bg-amber-500 text-black shadow-lg shadow-amber-500/10"
                }`}
              >
                {currentUser.isPremium ? (
                  <span>تعطيل الـ Premium مؤقتاً</span>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 fill-slate-950" />
                    <span>تفعيل النطاق المدفوع مجاناً 🚀</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="flex justify-between items-center text-[9px] text-slate-500 border-t border-white/5 pt-2">
              <span>أمان عُمر AI • الحفظ سحابي معزول</span>
              <Check className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
