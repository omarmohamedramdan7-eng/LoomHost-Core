/**
 * @file CloudProjectsPanel.tsx
 * @description Deluxe multi-tenant dashboard panel illustrating project lists, Growth Dashboard statistics, and Instant Publishing.
 */

import React, { useState } from "react";
import { User } from "firebase/auth";
import { UserProjectData } from "../lib/projectDb";
import { 
  Cloud, 
  FolderGit, 
  Code2, 
  Trash2, 
  Calendar, 
  Search, 
  RefreshCw, 
  ExternalLink,
  Lock,
  Globe,
  Sparkles,
  Eye,
  Activity,
  Award
} from "lucide-react";

interface CloudProjectsPanelProps {
  user: User | null;
  projects: UserProjectData[];
  loading: boolean;
  onLoadProject: (project: UserProjectData) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onPublishProject: (project: UserProjectData) => Promise<void>;
  onRefresh: () => void;
  triggerToast: (msg: string, type: "success" | "error" | "info") => void;
  publishingProjectId: string | null;
}

export const CloudProjectsPanel: React.FC<CloudProjectsPanelProps> = ({
  user,
  projects,
  loading,
  onLoadProject,
  onDeleteProject,
  onPublishProject,
  onRefresh,
  triggerToast,
  publishingProjectId
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Growth Dashboard Metrics Calculation
  const totalProjectsCount = projects.length;
  const totalEditsCount = projects.reduce((total, p) => total + (Number(p.updatesCount) || 1), 0);
  const totalVisitorsCount = projects.reduce((total, p) => total + (Number(p.visitorsCount) || 0), 0);

  const handleConfirmDelete = async (projectId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع سحابياً نهائياً؟")) return;
    setDeleteId(projectId);
    try {
      await onDeleteProject(projectId);
      triggerToast("🗑️ تم حذف المشروع وتعديل موازين المخازن الآمنة بنجاح.", "success");
    } catch (e) {
      triggerToast("❌ عذراً، فشل حذف المشروع سحابياً.", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "غير معروف";
    try {
      if (ts.seconds) {
        return new Date(ts.seconds * 1000).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });
      }
      return new Date(ts).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (err) {
      return String(ts).substring(0, 10);
    }
  };

  return (
    <div 
      id="cloud-projects-control-center" 
      className="bg-[#08080c]/90 border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl"
      dir="rtl"
    >
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-20%] w-[200px] h-[200px] bg-[#efd383]/5 rounded-full blur-[60px] pointer-events-none"></div>

      {/* Header Info */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4.5 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-[#efd383] border border-[#efd383]/20">
            <Cloud className="h-5 w-5 animate-pulse text-[#efd383]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-md font-black text-slate-100 tracking-wide">
              خزنة المشاريع السحابية الـ SaaS الآمنة
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 font-sans">
              لوحة تحكم مشفرة ومحميّة بالكامل لعزل بياناتك ومعاينة النشر الحي الفوري
            </p>
          </div>
        </div>

        {user && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
            title="تحديث البيانات السحابية"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      {!user ? (
        /* If logged out state */
        <div className="py-12 text-center space-y-4 bg-white/[0.02] rounded-xl border border-dashed border-white/5 p-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center text-amber-500/40 border border-[#efd383]/10">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300">نظام حفظ سحابي معزول (Data Fortress)</h4>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              يرجى استخدام زر "تسجيل الدخول عبر جوجل" في أعلى الصفحة لتفعيل المزامنة السحابية. يتم تشفير وعزل المشاريع بنسبة 100% لكل مستخدم.
            </p>
          </div>
        </div>
      ) : (
        /* If logged in State */
        <div className="space-y-6">
          
          {/* GROWTH DASHBOARD LANDING STATISTICS */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div className="flex flex-col items-center justify-center text-center p-2.5 relative">
              <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5 mb-1">
                <FolderGit className="w-3.5 h-3.5 text-amber-400" />
                <span>المشاريع</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white font-mono">{totalProjectsCount}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-2.5 border-r border-white/5">
              <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5 mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>التحديثات والتناغم</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white font-mono">{totalEditsCount}</span>
            </div>

            <div className="flex flex-col items-center justify-center text-center p-2.5 border-r border-white/5">
              <div className="text-[10px] text-slate-400 font-sans flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>الزيارات العامة</span>
              </div>
              <span className="text-lg sm:text-xl font-black text-white font-mono">{totalVisitorsCount}</span>
            </div>
          </div>

          {/* Search bar inside database list */}
          <div className="relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث في مشاريعك السحابية المعزولة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-black/60 border border-white/5 focus:border-[#efd383]/40 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none transition-all duration-200"
            />
          </div>

          {loading && filteredProjects.length === 0 ? (
            <div className="py-14 text-center space-y-2 min-h-[300px] flex flex-col justify-center items-center">
              <RefreshCw className="h-7 w-7 text-[#efd383] animate-spin mx-auto opacity-70" />
              <p className="text-xs text-slate-500">جاري الاتصال بـ Firestore ومزامنة البيانات حياً...</p>
            </div>
          ) : (
            <div className="relative min-h-[140px]">
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1.5px] z-20 flex items-center justify-center rounded-xl transition-all">
                  <div className="bg-[#050508] border border-white/10 p-4 rounded-xl shadow-2xl flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-[#efd383] animate-spin" />
                    <span className="text-xs text-slate-200 font-sans">مزامنة سحابية نشطة...</span>
                  </div>
                </div>
              )}
              
              {filteredProjects.length > 0 ? (
                /* Layout Cards grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                  {filteredProjects.map((proj) => (
                    <div
                      key={proj.projectId}
                      className="group relative bg-[#0a0a0f] hover:bg-[#0c0c14] border border-white/5 hover:border-[#efd383]/20 rounded-xl p-4 transition-all duration-300 hover:-translate-y-0.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        {/* Top title and status badges */}
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-100 group-hover:text-white truncate">
                                {proj.name}
                              </h4>
                              {proj.isPublished ? (
                                <span className="inline-flex items-center text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  🟢 منشور حياً
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[8px] px-1.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400">
                                  ⚪ مسودة سحابية
                                </span>
                              )}
                            </div>
                            <span className="inline-block text-[9px] font-mono text-amber-500 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 mt-1">
                              {proj.projectId}.omar.com
                            </span>
                          </div>
                          
                          {/* Delete project */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmDelete(proj.projectId);
                            }}
                            disabled={deleteId === proj.projectId}
                            className="p-1 px-1.5 rounded-lg border border-transparent hover:border-white/10 bg-transparent hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                            title="حذف من السحابة"
                          >
                            <Trash2 className={`h-3.5 w-3.5 ${deleteId === proj.projectId ? "animate-spin" : ""}`} />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {proj.description || "لا يوجد وصف لهذا التصميم."}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-slate-500 pt-1">
                          <span className="font-mono bg-white/[0.02] px-1.5 py-0.5 rounded">التعديلات: {proj.updatesCount || 1}</span>
                          <span className="font-mono bg-white/[0.02] px-1.5 py-0.5 rounded">الزيارات: {proj.visitorsCount || 0}</span>
                        </div>
                      </div>

                      {/* Actions & date */}
                      <div className="flex flex-col gap-2 border-t border-white/5 pt-3 mt-4">
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1 text-slate-500 font-mono">
                            <Calendar className="h-3 w-3" />
                            <span>{formatTimestamp(proj.createdAt)}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onLoadProject(proj)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold rounded-lg border border-white/5 transition-all flex items-center gap-1 cursor-pointer"
                              title="استرجاع وتعديل الأكواد داخل المحرر"
                            >
                              <Code2 className="h-2.5 w-2.5" />
                              <span>تعديل بالمحرر</span>
                            </button>
                          </div>
                        </div>

                        {/* Instant Deployment Action row */}
                        <div className="grid grid-cols-2 gap-1.5 pt-1.5">
                          <button
                            onClick={() => onPublishProject(proj)}
                            disabled={publishingProjectId === proj.projectId}
                            className="w-full py-1 text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-extrabold rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {publishingProjectId === proj.projectId ? (
                              <RefreshCw className="h-3 w-3 animate-spin text-black" />
                            ) : (
                              <Globe className="h-3 w-3 text-black animate-pulse" />
                            )}
                            <span>{proj.isPublished ? "تحديث النشر الحي" : "نشر فوري حياً"}</span>
                          </button>

                          {proj.isPublished ? (
                            <a
                              href={proj.publishedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-1 text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="h-3 w-3 text-emerald-400" />
                              <span>زيارة الموقع حياً</span>
                            </a>
                          ) : (
                            <div className="w-full py-1 text-[10px] text-slate-500 flex items-center justify-center gap-1 border border-dashed border-white/5 rounded-lg select-none">
                              <Award className="h-3 w-3" />
                              <span>غير مفعل للاستضافة</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-12 text-center text-xs text-slate-500 italic bg-white/[0.01] rounded-xl border border-dashed border-white/5 leading-relaxed font-sans p-6">
                  {searchTerm 
                    ? "لا توجد مشاريع سحابية تطابق كلمة البحث الحالية."
                    : "لا توجد مشاريع سحابية بعد. قم بتوليد تصميم أو كتابته في المحرر، ثم احفظ موقعك سحابياً!"}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
