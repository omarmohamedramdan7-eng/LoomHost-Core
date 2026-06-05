/**
 * @file ImageToCodePanel.tsx
 * @description Advanced Smart Clone Engine UI. Supports drag & drop design files or direct landing URL styling prompts.
 */

import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  Image as ImageIcon, 
  Sparkles, 
  RefreshCw, 
  Globe, 
  Link as LinkIcon,
  HelpCircle,
  HelpCircle as QuestionIcon
} from "lucide-react";
import { useUser } from "../clerk-bridge";

interface ImageToCodePanelProps {
  onCodeGenerated: (data: {
    html: string;
    css: string;
    js: string;
    name: string;
    description: string;
    explanation: string;
  }) => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
}

type CloneMode = "image" | "url";

export const ImageToCodePanel: React.FC<ImageToCodePanelProps> = ({ onCodeGenerated, triggerToast }) => {
  const { isSignedIn } = useUser();
  const [cloneMode, setCloneMode] = useState<CloneMode>("url");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // URL Clone input
  const [targetUrl, setTargetUrl] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadingMessages = [
    "جاري قراءة معالم التصميم البصري واستشعار هيكلة الأقسام...",
    "جاري استقراء لوحة الألوان وتوزيع التدرجات الجمالية...",
    "جاري إنتاج كود لغة HTML الهيكلي النظيف وتخطيط الـ CSS Grid...",
    "جاري صياغة قواعد وتأثيرات الهوفر وتدرجات النيون المترفة...",
    "جاري بناء حركات الانتقال وتأسيس محركات الـ Javascript المعقدة...",
    "جاري مراجعة تناسق التصاميم وضغط الكود النهائي لمحرر الأكواد..."
  ];

  React.useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setFile(file);
      } else {
        triggerToast("خطأ: يرجى رفع ملف صورة صالح (PNG, JPEG, WebP).", "error");
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const setFile = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    triggerToast("تم تحميل لقطة الشاشة بنجاح! جاهزة للاستنساخ.", "info");
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  // Convert uploaded image to base64 string
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCancelFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleStartClone = async () => {
    if (!isSignedIn) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("open-clerk-signin"));
      }
      triggerToast("🔐 يرجى تسجيل الدخول أولاً لتشغيل محرك الاستنساخ الذكي.", "info");
      return;
    }

    let payloadInput = "";
    let isImagePayload = false;

    if (cloneMode === "image") {
      if (!selectedFile) {
        triggerToast("الرجاء رفع أو اسقاط صورة لقطة الشاشة المطلوبة أولاً.", "error");
        return;
      }
      setIsLoading(true);
      try {
        payloadInput = await fileToBase64(selectedFile);
        isImagePayload = true;
      } catch (err) {
        triggerToast("فشل تفكيك محتوى الصورة.", "error");
        setIsLoading(false);
        return;
      }
    } else {
      if (!targetUrl.trim()) {
        triggerToast("يُرجى كتابة رابط الموقع الإلكتروني أو وصف المظهر المطلوب استنساخه.", "error");
        return;
      }
      setIsLoading(true);
      payloadInput = targetUrl.trim();
      isImagePayload = false;
    }

    try {
      const res = await fetch("/api/clone-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlOrImage: payloadInput,
          isImage: isImagePayload
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "خط إنتاج الاستنساخ غير قادر على المعالجة حالياً.");
      }

      const cloneRes = await res.json();
      
      // Inject codes into sandbox
      onCodeGenerated(cloneRes);

      triggerToast(`🪄 نجح استنساخ التصميم بنجاح! تم استخراج كود "${cloneRes.name}"، تهانينا!`, "success");
      
      // Clear inputs
      setSelectedFile(null);
      setPreviewUrl(null);
      setTargetUrl("");

    } catch (err: any) {
      console.error(err);
      triggerToast(err?.message || "فشل محرك الاستنساخ الذكي في إنهاء الدورة.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="smart-clone-engine-deck" 
      className="bg-[#08080c]/90 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl"
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-white/5 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm sm:text-md font-black text-slate-100 tracking-wide">
              محرك الاستنساخ الذكي البرميلي (Smart Clone Engine)
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
              استنسخ وطوّر أي واجهة أو قالب فخم عبر الرابط أو لقطة الشاشة بـ نقرة واحدة
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-white/5 text-[10px]">
          <button
            onClick={() => { setCloneMode("url"); handleCancelFile(); }}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              cloneMode === "url" 
                ? "bg-[#efd383] text-black shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            استنساخ برابط أو فكرة
          </button>
          <button
            onClick={() => setCloneMode("image")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
              cloneMode === "image" 
                ? "bg-[#efd383] text-black shadow-md" 
                : "text-slate-400 hover:text-white"
            }`}
          >
            استنساخ بلقطة شاشة
          </button>
        </div>
      </div>

      {!isLoading ? (
        <div className="space-y-4">
          
          {cloneMode === "url" ? (
            /* Mode 1: URL input */
            <div className="space-y-3">
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="ضع رابط الموقع، مثلاً: youtube.com أو صِف الواجهة المطلوبة بشدة..."
                    className="w-full pl-4 pr-10 py-3 bg-black/60 border border-white/5 focus:border-[#efd383]/40 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all"
                  />
                </div>
                
                <button
                  onClick={handleStartClone}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs hover:brightness-110 shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-black animate-pulse" />
                  <span>ابدأ الاستنساخ 🪄</span>
                </button>
              </div>
              <p className="text-[9px] text-slate-500 sm:text-[10px] leading-relaxed">
                * يقوم المحرك بتحليل الأقسام الأساسية وبناء مستند HTML5 تفاعلي بالكامل، مدعوماً بنصوص وبلاغة ذات قيمة تسويقية للعميل.
              </p>
            </div>
          ) : (
            /* Mode 2: Screnshot drop zone or file selector */
            <div className="space-y-4">
              {!previewUrl ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerPicker}
                  className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all ${
                    dragActive
                      ? "border-[#efd383] bg-amber-500/5"
                      : "border-white/5 hover:border-white/10 bg-black/40 hover:bg-black/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInput}
                  />
                  <UploadCloud className="h-10 w-10 text-[#efd383]/80 mb-3" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-200">اسقط نموذج لقطة الشاشة هنا أو انقر لتصفح جهازك</p>
                  <p className="text-[10px] text-slate-500 mt-1">يدعم الاستيراد المباشر لـ PNG, JPEG, WebP حواجز تصاميم Figma سكتشات اليد أو المواقع العالمية</p>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-4 items-center bg-black/60 p-4 rounded-xl border border-white/5">
                  <div className="relative w-full md:w-36 h-28 shrink-0 rounded-lg overflow-hidden border border-white/5 bg-slate-900 flex items-center justify-center">
                    <img src={previewUrl} alt="Preview Target" className="object-contain w-full h-full" referrerPolicy="no-referrer" />
                  </div>

                  <div className="flex-1 text-right w-full">
                    <div className="flex items-center gap-1 text-[10px] text-[#efd383] font-mono mb-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>حالة الملف: مؤكد ومحفوظ مؤقتاً</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 truncate">{selectedFile?.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">حجم الملف: {((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                    
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleStartClone}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-black" />
                        <span>تحليل وبناء الواجهة حياً ⚡</span>
                      </button>
                      <button
                        onClick={handleCancelFile}
                        className="px-4 py-2.5 text-xs rounded-lg border border-white/5 text-slate-400 hover:bg-slate-900 transition-all cursor-pointer"
                      >
                        إلغاء لقطة الشاشة
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        /* Circular progress showing step by step load */
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-black/40 rounded-xl border border-white/5 text-center animate-pulse">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full border-4 border-amber-500/10 border-t-[#efd383] border-r-[#efd383]/60 animate-spin"></div>
            <Sparkles className="h-6 w-6 text-[#efd383] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>

          <h4 className="text-xs sm:text-sm font-bold text-[#efd383]">جاري تخليق واستنساخ التصميم بالذكاء الاصطناعي...</h4>
          
          <div className="w-full max-w-xs bg-slate-900 h-1.5 rounded-full mt-4 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-amber-500 to-[#efd383] h-full rounded-full transition-all duration-1000"
              style={{ width: `${((loadingStep + 1) / loadingMessages.length) * 100}%` }}
            ></div>
          </div>

          <p className="text-[10px] sm:text-xs text-slate-300 font-medium mt-3" dir="rtl">
            {loadingMessages[loadingStep]}
          </p>
          <p className="text-[9px] text-slate-500 mt-1">يستغرق هذا عادة من 10 إلى 20 ثانية لضمان جودة الأكواد والتفاعلية المدهشة</p>
        </div>
      )}
    </div>
  );
};
