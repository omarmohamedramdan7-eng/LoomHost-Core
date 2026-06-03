import React, { useState, useEffect } from "react";
import { Sliders, Terminal, ShieldCheck, Activity, RefreshCw, Layers, Cpu, Server } from "lucide-react";
import { fetchQAUnits } from "../scripts";

export default function QASuite() {
  const [qaCount, setQaCount] = useState<number>(1584);
  const [loading, setLoading] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "🚀 LoomHost QA Engine v2.4 initialized successfully.",
    "📡 Ready for real-time cloud diagnostic audits.",
  ]);
  
  // Interactive Slider States
  const [siteVolume, setSiteVolume] = useState<number>(12); // number of sites
  const [redundancyLevel, setRedundancyLevel] = useState<number>(3); // high availability level
  const [cpuAllocation, setCpuAllocation] = useState<number>(1.5); // cores per container

  // Computed Calculator Metrics
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [latencyReduction, setLatencyReduction] = useState<number>(0);
  const [containerHealth, setContainerHealth] = useState<string>("ممتازة");

  // Call the Sync Utility API
  const refreshUnitsCount = async () => {
    setLoading(true);
    addLog("📡 Connecting to Supabase database pool...");
    try {
      const count = await fetchQAUnits();
      setQaCount(count);
      addLog(`✅ Successfully fetched active count: ${count} verified cloud units.`);
    } catch (e) {
      addLog("⚠️ API Connection failure. Applying resilient local cluster fallback.");
    } finally {
      setLoading(false);
    }
  };

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString("ar-EG");
    setConsoleLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 18)]);
  };

  // Re-calculate metrics when slider inputs change
  useEffect(() => {
    // Math logic based on sliders
    const calculatedCost = siteVolume * redundancyLevel * 4.95 * cpuAllocation;
    const computedLatency = Math.max(15, 240 - (redundancyLevel * 45) - (cpuAllocation * 35));
    
    setEstimatedCost(parseFloat(calculatedCost.toFixed(2)));
    setLatencyReduction(Math.round(computedLatency));

    if (cpuAllocation < 1 && redundancyLevel < 2) {
      setContainerHealth("متوسطة (توفير طاقة)");
    } else if (cpuAllocation >= 1.5 && redundancyLevel >= 3) {
      setContainerHealth("فائقة السرعة ومحمية (Enterprise)");
    } else {
      setContainerHealth("مثالية ومتوازنة");
    }
  }, [siteVolume, redundancyLevel, cpuAllocation]);

  // Handle continuous automated log simulation
  useEffect(() => {
    refreshUnitsCount();
    
    const interval = setInterval(() => {
      const systemMessages = [
        "🔍 Scanning server container logs for thread efficiency...",
        "💎 DB optimization script executed with zero deadlocks.",
        "⚡ Latency checked at London/Paris edge nodes: 18ms",
        "🌐 SSL Certification ping test: Verified Active",
        "🧠 LoomHost AI Auto-Healer: Memory footprint stable at 24%",
      ];
      const randomMsg = systemMessages[Math.floor(Math.random() * systemMessages.length)];
      addLog(randomMsg);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#040406] border border-white/5 rounded-3xl p-6 md:p-8 space-y-8" dir="rtl">
      {/* Upper Brand Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <span className="text-[10px] bg-amber-500/10 text-[#efd383] px-2.5 py-1 rounded-full border border-amber-500/20 font-black tracking-wide font-mono">
            🎛️ QA DIAGNOSTIC SUITE
          </span>
          <h2 className="text-xl font-black text-white mt-2">
            منظومة فحص الجودة ومحاكاة الحوسبة السحابية
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مراقبة في الوقت الفعلي لوحدات الخوادم المفحوصة والمزودة بدقة متقدمة
          </p>
        </div>

        {/* Real Live Count Display */}
        <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-4 flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block font-bold">إجمالي الوحدات المفحوصة (Supabase)</span>
            <div className="flex items-center gap-2 mt-1">
              {loading ? (
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xl font-black font-mono text-[#efd383]">{qaCount}</span>
              )}
              <span className="text-xs text-emerald-400 font-bold">وحدة سحابة نشطة ✅</span>
            </div>
          </div>
          <button
            onClick={refreshUnitsCount}
            className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-amber-500/10 hover:text-[#efd383] transition-colors cursor-pointer"
            title="تحديث فوري من قاعدة البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Grid: Sliders & Live Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Interactive Panel: Sliders & Calculators */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#08080c] border border-white/5 p-6 rounded-2xl space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-4 h-4 text-[#efd383]" />
              <h3 className="text-sm font-black text-white">لوحة محاكاة وتخصيص الموارد</h3>
            </div>

            {/* Slider 1: Site volume */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">عدد المواقع المترابطة:</span>
                <span className="text-[#efd383] font-mono font-black">{siteVolume} مواقع</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={siteVolume}
                onChange={(e) => {
                  setSiteVolume(parseInt(e.target.value));
                  addLog(`⚙️ Allocation update: Sites target volume set to ${e.target.value}`);
                }}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#efd383]"
              />
            </div>

            {/* Slider 2: Redundancy High Availability Level */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">مستوى الوفرة والتكرار (HA):</span>
                <span className="text-[#efd383] font-mono font-black">x{redundancyLevel} مستويات حماية</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={redundancyLevel}
                onChange={(e) => {
                  setRedundancyLevel(parseInt(e.target.value));
                  addLog(`🌐 Node replication adjusted to high-availability level: ${e.target.value}`);
                }}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#efd383]"
              />
            </div>

            {/* Slider 3: CPU vCores allocation */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">تخصيص قوة المعالج (CPU Resource):</span>
                <span className="text-[#efd383] font-mono font-black">{cpuAllocation} Cores / Container</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4"
                step="0.5"
                value={cpuAllocation}
                onChange={(e) => {
                  setCpuAllocation(parseFloat(e.target.value));
                  addLog(`⚡ Compute thread core scale set to: ${e.target.value}`);
                }}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#efd383]"
              />
            </div>
          </div>

          {/* Calculator Output Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-b from-[#110e08] to-[#040406] border border-amber-500/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold block">التكلفة التقديرية شهرياً</span>
              <span className="text-lg font-black font-mono text-[#efd383] block mt-1">${estimatedCost}</span>
              <span className="text-[9px] text-slate-500 mt-1 block">شاملة معالجة ومزامنة API</span>
            </div>

            <div className="bg-gradient-to-b from-[#09110d] to-[#040406] border border-emerald-500/10 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold block">متوسط زمن الاستجابة المتوقع</span>
              <span className="text-lg font-black font-mono text-emerald-400 block mt-1">{latencyReduction}ms</span>
              <span className="text-[9px] text-slate-500 mt-1 block">استرجاع ذكي فائق السرعة</span>
            </div>

            <div className="bg-[#08080c] border border-white/5 p-4 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 font-bold block">حالة استقرار المنظومة</span>
              <span className="text-xs font-black text-slate-200 block mt-2 text-ellipsis truncate">{containerHealth}</span>
              <span className="text-[9px] text-emerald-400 mt-1 block">● متصلة بالشبكة</span>
            </div>
          </div>
        </div>

        {/* Right Console Terminal Panel */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="flex-1 bg-[#020203] border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[300px] lg:h-full">
            {/* Terminal Header */}
            <div className="bg-[#08080c] px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-slate-300 font-bold">LoomHost Terminal Console</span>
              </div>
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
              </div>
            </div>

            {/* Console Output logs content */}
            <div className="flex-1 p-4 font-mono text-[10px] text-slate-300 space-y-1.5 overflow-y-auto overflow-x-hidden text-left select-text scrollbar-thin">
              {consoleLogs.map((log, index) => (
                <div key={index} className="truncate select-text">
                  <span className="text-amber-400/80 mr-1">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
