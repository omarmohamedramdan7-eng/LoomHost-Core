/**
 * @file SeoOptimizerPanel.tsx
 * @description Smart AI SEO Optimizer Panel.
 * Scans, generates titles, handles Copy and Automatic injection, and tracks SEO suggestions.
 */

import React, { useState } from "react";
import { Sparkles, Check, Copy, Layers, ListChecks, HelpCircle, MonitorCheck, RefreshCw } from "lucide-react";

interface SeoOptimizerPanelProps {
  htmlCode: string;
  cssCode: string;
  jsCode: string;
  siteName: string;
  onApplySeo: (newHtml: string, newTitle: string) => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
}

interface SeoResult {
  title: string;
  metaTags: string;
  altTextSuggestions: Array<{
    selector: string;
    existingAlt: string;
    suggestedAlt: string;
  }>;
  seoAdvice: string[];
}

export const SeoOptimizerPanel: React.FC<SeoOptimizerPanelProps> = ({
  htmlCode,
  cssCode,
  jsCode,
  siteName,
  onApplySeo,
  triggerToast
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [seoResult, setSeoResult] = useState<SeoResult | null>(null);
  const [copiedMeta, setCopiedMeta] = useState<boolean>(false);

  const handleRunSeoAudit = async () => {
    // Lazy Authentication Check
    const localUserStr = localStorage.getItem("loom_host_local_user") || "{}";
    let isGuest = true;
    try {
      const parsed = JSON.parse(localUserStr);
      isGuest = !parsed.id || parsed.id.startsWith("usr_");
    } catch (e) {}

    const hasRealUser = !!localStorage.getItem("clerk_mock_signed_in") || !isGuest;
    if (!hasRealUser) {
      if ((window as any).openSignIn) {
        (window as any).openSignIn();
      } else {
        alert("يرجى تسجيل الدخول أولاً لتشغيل فحص السيو.");
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/automation/seo-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: htmlCode,
          css: cssCode,
          js: jsCode,
          siteName: siteName
        })
      });

      if (!response.ok) {
        throw new Error("حدث خطأ أثناء إجراء الفحص والتحسين التلقائي.");
      }

      const result: SeoResult = await response.json();
      setSeoResult(result);
      triggerToast("✨ تم الانتهاء من فحص السيو وتوليد الكلمات المفتاحية الذكية!", "success");

    } catch (err: any) {
      console.error(err);
      triggerToast(err?.message || "فشل توليد السيو من الذكاء الاصطناعي.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMeta = () => {
    if (!seoResult) return;
    navigator.clipboard.writeText(seoResult.metaTags);
    setCopiedMeta(true);
    triggerToast("تم نسخ وسوم السيو (Meta Tags) إلى الحافظة!", "success");
    setTimeout(() => setCopiedMeta(false), 2500);
  };

  const handleApplyNow = () => {
    if (!seoResult) return;

    let updatedHtml = htmlCode;

    // Smart Meta Injection logic
    // We search if there's a head tag or comment to inject.
    // Otherwise, we prepend or append or structure nicely.
    const hasHeadBegin = /<head[^>]*>/i.test(updatedHtml);
    const hasHeadEnd = /<\/head>/i.test(updatedHtml);

    const formattedMeta = `\n  <!-- 🌐 AI Optimizer SEO Meta Tags Added by LoomHost -->\n  ${seoResult.metaTags}\n  `;

    if (hasHeadBegin && hasHeadEnd) {
      // Inject inside the existing <head> elements
      updatedHtml = updatedHtml.replace(/(<head[^>]*>)/i, `$1${formattedMeta}`);
    } else {
      // If no <head> tags found, we wrap or prepend inside the main HTML
      // Let's check if there is a main wrapper div
      updatedHtml = `<!-- 🌐 AI SEO Optimized Head Structure -->\n<head>\n  <title>${seoResult.title}</title>${formattedMeta}</head>\n\n` + updatedHtml;
    }

    // Call the parent injection triggers
    onApplySeo(updatedHtml, seoResult.title);
    triggerToast("⚡ تم تطبيق وسوم السيو وعنوان الميتا المقترح تلقائياً في مصادر مشروعك!", "success");
  };

  return (
    <div id="seo-optimizer-container" className="bg-[#0b1222]/60 rounded-2xl border border-slate-800/80 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#39ff14]/10 rounded-xl text-[#39ff14]">
            <Layers className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">تهيئة سيو ومحركات البحث (AI SEO Optimizer)</h3>
            <p className="text-xs text-slate-400 mt-0.5">حلل برمجيات موقعك وولد Meta Title و Meta Description والألت وصقهم فوراً بضغطة زر</p>
          </div>
        </div>
        <span className="text-[10px] bg-[#39ff14]/10 text-[#39ff14] font-semibold border border-[#39ff14]/20 px-2.5 py-1 rounded-full font-mono uppercase">
          SEO Bot
        </span>
      </div>

      {!seoResult ? (
        <div className="text-center py-6">
          <p className="text-xs text-slate-400 mb-4 font-medium">الذكاء الاصطناعي يقوم بفحص وسوم الهيكل البرمجي والروابط، استخراج الصور المفتقرة لخاصية الـ Alt، وصياغة الكلمات الدلالية تلقائياً لتهيئة النشر بجوجل.</p>
          <button
            id="btn-run-seo-audit"
            onClick={handleRunSeoAudit}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 mx-auto px-6 py-2.5 rounded-xl bg-slate-900 border border-[#39ff14]/40 text-[#39ff14] text-xs font-bold hover:bg-[#39ff14]/10 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>جاري استقراء الكود وتحضير البيانات...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>فحص كود الموقع وتوليد السيو الفوري ✨</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in text-right" dir="rtl">
          {/* Header Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono">اسم الموقع الحركي:</span>
              <h4 className="text-xs font-bold text-slate-300">{siteName}</h4>
            </div>
            <div className="flex gap-2">
              <button
                id="btn-apply-seo-auto"
                onClick={handleApplyNow}
                className="px-4 py-2 text-xs font-bold bg-[#39ff14] text-slate-950 rounded-lg hover:shadow-[0_0_15px_rgba(57,255,14,0.3)] transition-all flex items-center gap-1.5"
              >
                <MonitorCheck className="h-3.5 w-3.5" />
                <span>حقن تلقائي في الكود ⚡</span>
              </button>
              <button
                id="btn-re-audit-seo"
                onClick={handleRunSeoAudit}
                disabled={isLoading}
                className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-all"
                title="إعادة الفحص"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Title & Meta Tags */}
            <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#39ff14] font-bold block mb-1">العنوان المقترح الفاخر (SEO Title):</span>
                <p className="text-sm font-bold text-slate-100 bg-[#070b13] p-2.5 rounded-lg border border-slate-800 font-sans tracking-wide">
                  {seoResult.title}
                </p>

                <span className="text-[10px] text-[#00f0ff] font-bold block mt-3 mb-1">وسوم الميتا المهيأة (SEO Head Meta):</span>
                <textarea
                  id="seo-meta-preview"
                  readOnly
                  value={seoResult.metaTags}
                  className="w-full h-32 p-2.5 bg-[#070b13] text-[#39ff14] text-[11px] font-mono rounded-lg border border-slate-800/90 resize-none outline-none leading-relaxed"
                />
              </div>

              <button
                id="btn-copy-meta-tags"
                onClick={handleCopyMeta}
                className="mt-3 w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedMeta ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#39ff14]" />
                    <span className="text-[#39ff14]">تم نسخ الأكواد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>نسخ وسوم الـ Meta Tags</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Img Alt suggestions & Advice */}
            <div className="space-y-4">
              {/* Image Alt Texts */}
              <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/60">
                <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 mb-2">
                  <ListChecks className="h-3.5 w-3.5" />
                  <span>اقتراحات خواص Alt للصور (إمكانية الوصول جوجل):</span>
                </span>
                
                {seoResult.altTextSuggestions && seoResult.altTextSuggestions.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-1 select-text">
                    {seoResult.altTextSuggestions.map((item, idx) => (
                      <div key={idx} className="bg-[#070b13]/80 p-2 rounded border border-slate-900 flex justify-between items-center text-xs">
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 truncate max-w-[120px]">{item.selector}</span>
                        <span className="text-[#39ff14] text-right font-medium">{item.suggestedAlt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic py-2">جميع الصور في مشروعك حالياً تمتلك خواص alt ممتازة متوافقة مع قواعد السيو! ✨</p>
                )}
              </div>

              {/* SEO Technical Advice */}
              <div className="bg-slate-950/20 p-4 rounded-xl border border-slate-800/60 text-right">
                <span className="text-[10px] text-slate-400 font-bold block mb-2">توصيات إضافية تسرع أرشفة الصفحة:</span>
                <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed list-disc pr-4 select-text">
                  {seoResult.seoAdvice.slice(0, 3).map((advice, idx) => (
                    <li key={idx}>{advice}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
