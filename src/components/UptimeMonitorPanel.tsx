/**
 * @file UptimeMonitorPanel.tsx
 * @description Sleek real-time Uptime Monitor Dashboard for hosted sites.
 * Displays overall SaaS stats, and lets users perform live ping tests on each hosted container.
 */

import React, { useState } from "react";
import { Activity, ShieldCheck, Zap, ToggleLeft, ArrowRightLeft, RefreshCw, CheckCircle, Wifi, Compass } from "lucide-react";
import { HostedSite } from "../types";

interface UptimeMonitorPanelProps {
  hostedSites: HostedSite[];
  onRefreshSites: () => Promise<void>;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const UptimeMonitorPanel: React.FC<UptimeMonitorPanelProps> = ({
  hostedSites,
  onRefreshSites,
  triggerToast
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleTestPing = async (siteId: string) => {
    setTestingId(siteId);
    try {
      const response = await fetch("/api/automation/ping-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId })
      });

      if (!response.ok) {
        throw new Error("فشل فحص الاتصال الفوري بالسيرفر.");
      }

      const checkData = await response.json();
      
      // Refresh sites list from backend to pick up updated latency / last check
      await onRefreshSites();

      triggerToast(
        `📡 نتيجة فحص الحاوية: ${checkData.status === "Active" ? "نشط ومتاح ✅" : "خارج الخدمة ❌"} | سرعة الاستجابة: ${checkData.responseTimeMs}ms`,
        checkData.status === "Active" ? "success" : "error"
      );

    } catch (err: any) {
      triggerToast(err?.message || "فشلت عملية اختبار الاتصال الفوري للشبكة.", "error");
    } finally {
      setTestingId(null);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshSites();
      triggerToast("تم تحديث الحالات الحية لجميع الخوادم والمواقع المستضافة!", "success");
    } catch (err) {
      triggerToast("فشل تحديث قائمة المواقع.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compute stats
  const totalSites = hostedSites.length;
  const activeCount = hostedSites.filter(site => site.uptimeStatus !== "Down").length;
  const avgResponseTime = totalSites > 0
    ? Math.round(hostedSites.reduce((acc, curr) => acc + (curr.responseTimeMs || 45), 0) / totalSites)
    : 45;

  return (
    <div id="uptime-monitor-container" className="bg-[#0b1222]/60 rounded-2xl border border-slate-800/80 p-6 backdrop-blur-md">
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00f0ff]/10 rounded-xl text-[#00f0ff]">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">مراقب حالة التشغيل والاتصال (Uptime Monitor)</h3>
            <p className="text-xs text-slate-400 mt-0.5">سكربت سحابي يتأكد من استقرارية وصحة وسرعة استجابة مواقعك كل دقيقة</p>
          </div>
        </div>
        
        <button
          id="btn-refresh-uptime-stats"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold rounded-lg transition-all"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>تحديث الحالة 📡</span>
        </button>
      </div>

      {/* Global SaaS Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" dir="rtl">
        {/* Status */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">الحالة العامة للخوادم</span>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39ff14] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39ff14]"></span>
              </span>
              <span className="text-sm font-bold text-slate-200">مستقرة ونشطة</span>
            </div>
          </div>
          <ShieldCheck className="h-8 w-8 text-[#39ff14]/20" />
        </div>

        {/* Avg Latency */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">متوسط زمن الاستجابة</span>
            <span className="text-base font-extrabold text-slate-100 font-mono tracking-wide">
              {avgResponseTime}ms
            </span>
          </div>
          <Zap className="h-8 w-8 text-[#00f0ff]/20" />
        </div>

        {/* Total stats */}
        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block mb-1">المواقع المرافقة المراقبة</span>
            <span className="text-base font-bold text-slate-200 font-sans">
              {activeCount} من أصل {totalSites}
            </span>
          </div>
          <Wifi className="h-8 w-8 text-indigo-500/20" />
        </div>
      </div>

      {/* Individual Sites list */}
      <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-slate-950/30">
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800 flex justify-between text-[11px] font-bold text-slate-400 select-none text-right" dir="rtl">
          <div className="w-1/3">اسم الموقع / النطاق</div>
          <div className="w-1/4 text-center">حالة الاتصال</div>
          <div className="w-1/4 text-center">زمن الاستجابة</div>
          <div className="w-1/6 text-left">فحص يدوي</div>
        </div>

        {hostedSites.length > 0 ? (
          <div className="divide-y divide-slate-800/60 font-sans text-right" dir="rtl">
            {hostedSites.map((site) => (
              <div
                key={site.id}
                className="px-4 py-3.5 flex items-center justify-between hover:bg-slate-900/20 transition-colors"
              >
                {/* Domain & name */}
                <div className="w-1/3 min-w-0">
                  <h4 className="text-xs font-bold text-slate-100 truncate">{site.name}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                    <Compass className="h-3 w-3 text-[#00f0ff]/70" />
                    <span>https://{site.id}.omar.com</span>
                  </div>
                </div>

                {/* Status dot */}
                <div className="w-1/4 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14] animate-pulse"></span>
                    <span>{site.uptimeStatus || "Active"}</span>
                  </div>
                </div>

                {/* Response rate */}
                <div className="w-1/4 text-center">
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    {site.responseTimeMs || 42} ms
                  </span>
                  <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                    {site.lastChecked ? new Date(site.lastChecked).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "جاري الفحص..."}
                  </span>
                </div>

                {/* Manual ping trigger */}
                <div className="w-1/6 flex justify-start">
                  <button
                    id={`btn-ping-${site.id}`}
                    onClick={() => handleTestPing(site.id)}
                    disabled={testingId === site.id}
                    className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs text-[#00f0ff] hover:text-[#39ff14] transition-all"
                    title="فحص فوري للاتصال"
                  >
                    <RefreshCw className={`h-3 w-3 ${testingId === site.id ? "animate-spin text-amber-500" : ""}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            لا توجد خوادم أو مواقع مستضافة على LoomHost AI لمراقبتها حالياً.
          </div>
        )}
      </div>
    </div>
  );
};
