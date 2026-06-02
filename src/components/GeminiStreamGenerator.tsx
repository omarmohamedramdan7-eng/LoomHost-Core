import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface GeminiStreamGeneratorProps {
  aiPrompt: string;
  selectedStyle: string;
  selectedModel: string;
  isCloneAnalyzed: boolean;
  isGenerating: boolean;
  onStartGeneration: () => void;
  onGenerationSuccess: (data: {
    name: string;
    description: string;
    html: string;
    css: string;
    js: string;
    explanation?: string;
  }) => void;
  onGenerationFailure: (errorMsg: string) => void;
}

export const GeminiStreamGenerator: React.FC<GeminiStreamGeneratorProps> = React.memo(({
  aiPrompt,
  selectedStyle,
  selectedModel,
  isCloneAnalyzed,
  isGenerating,
  onStartGeneration,
  onGenerationSuccess,
  onGenerationFailure,
}) => {
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [streamedText, setStreamedText] = useState<string>("");
  const [retryCount, setRetryCount] = useState<number>(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on component unmount to cancel any ongoing active requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Compute key references for the API
  const NEXT_PUBLIC_GEMINI_API_KEY = typeof process !== "undefined" && process?.env ? process.env.NEXT_PUBLIC_GEMINI_API_KEY : undefined;
  const VITE_GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  const activeKey = NEXT_PUBLIC_GEMINI_API_KEY || VITE_GEMINI_API_KEY;

  const handleGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return;

    setErrorMsg(null);
    setLocalIsGenerating(true);
    setStreamedText("");
    onStartGeneration();

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;

    while (attempts < maxAttempts && !success) {
      attempts++;
      setRetryCount(attempts);
      
      // Setup AbortController for cancelable requests
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const response = await fetch("/api/generate-site-stream", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            ...(activeKey ? { "Authorization": `Bearer ${activeKey}` } : {})
          },
          body: JSON.stringify({
            prompt: aiPrompt,
            selectedStyle,
            selectedModel,
            isCloneAnalyzed
          }),
          signal
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `استجابة الخاطئة من السيرفر (${response.status})`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        
        if (!reader) {
          throw new Error("لا يمكن إنشاء واجهة قراءة البيانات المتدفقة.");
        }

        let fullText = "";
        let finished = false;

        while (!finished) {
          const { value, done } = await reader.read();
          if (done) {
            finished = true;
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamedText(fullText); // Update progressive stream display
        }

        // Parse result JSON
        try {
          const cleanedText = fullText.trim();
          const parsedData = JSON.parse(cleanedText);
          
          if (!parsedData.name || !parsedData.html) {
            throw new Error("الكود المولد غير مكتمل أو مفقود الهياكل الأساسية.");
          }

          onGenerationSuccess(parsedData);
          success = true;
          break; // Break retry loops on success
        } catch (parseErr) {
          console.error("Failed to parse streamed output as JSON:", fullText);
          throw new Error("محاولة التوليد لم ترجع كود JSON منسق بشكل صحيح.");
        }

      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Generation request aborted by user.");
          setLocalIsGenerating(false);
          return;
        }

        console.warn(`LoomHost AI stream attempt ${attempts} failed:`, err.message);
        
        if (attempts >= maxAttempts) {
          const friendlyMessage = "نحن نشهد ضغطاً مؤقتاً، يرجى المحاولة بعد قليل، موقعك محفوظ لدينا";
          setErrorMsg(friendlyMessage);
          onGenerationFailure(friendlyMessage);
          setLocalIsGenerating(false);
          return;
        }

        // Sleep for 1.5 seconds smoothly without altering UI states
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setLocalIsGenerating(false);
  }, [aiPrompt, selectedStyle, selectedModel, isCloneAnalyzed, onStartGeneration, onGenerationSuccess, onGenerationFailure, activeKey]);

  // Cancel currently running request
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLocalIsGenerating(false);
      setErrorMsg("تم إلغاء عملية التوليد بواسطة المستخدم.");
    }
  }, []);

  const buttonLabel = useMemo(() => {
    if (localIsGenerating || isGenerating) {
      return `جاري المعالجة... (محاولة ${retryCount} / 3)`;
    }
    return "توليد وتصدير الكود البرمجي 🪄";
  }, [localIsGenerating, isGenerating, retryCount]);

  const isDisabled = useMemo(() => {
    return localIsGenerating || isGenerating || !aiPrompt.trim();
  }, [localIsGenerating, isGenerating, aiPrompt]);

  return (
    <div className="w-full space-y-4 animate-fade-in text-right" dir="rtl">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleGenerate}
          id="btn-gemini-stream-generate"
          className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-[#efd383] hover:from-amber-300 hover:to-amber-500 disabled:from-neutral-900 disabled:to-neutral-900 disabled:text-neutral-600 text-black font-extrabold text-sm transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          {localIsGenerating || isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-black" />
              <span>{buttonLabel}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-black" />
              <span>{buttonLabel}</span>
            </>
          )}
        </button>

        {(localIsGenerating || isGenerating) && (
          <button
            type="button"
            onClick={handleCancel}
            id="btn-cancel-generation"
            className="px-4 rounded-xl bg-red-950/40 text-red-400 border border-red-900/30 hover:bg-red-900/40 text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-center"
            title="إلغاء الطلب"
          >
            إلغاء
          </button>
        )}
      </div>

      {/* Progressive Text Stream mini debugger */}
      {localIsGenerating && streamedText && (
        <div className="p-3.5 bg-[#050810]/95 border border-amber-500/15 rounded-xl space-y-2 text-right animate-fade-in font-mono text-[10px] text-amber-300/80 max-h-[140px] overflow-y-auto leading-relaxed">
          <div className="flex items-center gap-1.5 text-slate-400 border-b border-white/5 pb-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-[9px] font-bold">بث مباشر من محرك الاستدعاء الذكي:</span>
          </div>
          <p className="whitespace-pre-wrap select-none opacity-90">
            {streamedText.length > 220 ? `... ${streamedText.substring(streamedText.length - 220)}` : streamedText}
          </p>
        </div>
      )}

      {errorMsg && (
        <div id="alert-stream-error" className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl flex gap-3 text-red-200 text-sm items-start animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold">حالة التوليد الحالية</h4>
            <p className="text-xs text-slate-300">{errorMsg}</p>
          </div>
        </div>
      )}
    </div>
  );
});

GeminiStreamGenerator.displayName = "GeminiStreamGenerator";
