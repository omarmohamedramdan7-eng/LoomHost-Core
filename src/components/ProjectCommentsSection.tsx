/**
 * @file ProjectCommentsSection.tsx
 * @description Highly interactive nested comments feed for public community projects.
 * Adheres to LoomHost AI's elegant golden/dark styling and supports Firestore persistence with offline fallback.
 */

import React, { useState, useEffect } from "react";
import { MessageSquare, Send, Trash2, Sparkles, User } from "lucide-react";
import { 
  addProjectCommentToFirestore, 
  fetchProjectCommentsFromFirestore, 
  deleteProjectCommentFromFirestore 
} from "../lib/projectDb";
import { ProjectComment, LocalUserProfile } from "../types";
import { useUser, SignedIn, SignedOut, SignInButton } from "../clerk-bridge";

interface ProjectCommentsSectionProps {
  projectId: string;
  currentUser: LocalUserProfile | null;
  triggerToast: (msg: string, type?: "success" | "error" | "info") => void;
}

export const ProjectCommentsSection: React.FC<ProjectCommentsSectionProps> = ({
  projectId,
  currentUser,
  triggerToast
}) => {
  const { isSignedIn } = useUser();
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [inputText, setInputText] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Load comments
  const loadComments = async () => {
    setLoading(true);
    try {
      const fetched = await fetchProjectCommentsFromFirestore(projectId);
      setComments(fetched || []);
    } catch (e) {
      console.error("Error loading project comments:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [projectId, isExpanded]);

  // Add Comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn || !currentUser) {
      triggerToast("🔐 يرجى تسجيل الدخول أولاً لإجراء مناقشات واطروحات مع المطورين.", "info");
      return;
    }

    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (trimmed.length > 1000) {
      triggerToast("⚠️ تجاوزت الحد الأقصى المسموح به للتعليق (1000 حرف).", "error");
      return;
    }

    setIsSubmitting(true);
    const commentId = "cmt_" + Math.random().toString(36).substring(2, 10);
    try {
      const added = await addProjectCommentToFirestore(
        projectId,
        commentId,
        currentUser.uid,
        currentUser.displayName || currentUser.name || "مطور عُفر المبدع",
        currentUser.photoURL || "",
        trimmed
      );

      if (added) {
        setComments((prev) => [...prev, added]);
        setInputText("");
        triggerToast("💬 تم إدراج تعليقك البرمجي الفاخر بنجاح!", "success");
      }
    } catch (err) {
      console.error("Failed adding comment:", err);
      triggerToast("❌ عذراً، فشل نشر التعليق. يرجى مراجعة الصلاحيات.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser) return;
    
    try {
      const success = await deleteProjectCommentFromFirestore(projectId, commentId, currentUser.uid);
      if (success) {
        setComments((prev) => prev.filter((c) => c.commentId !== commentId));
        triggerToast("🗑️ تم حذف التعليق بنجاح.", "success");
      }
    } catch (err) {
      console.error("Failed deleting comment:", err);
      triggerToast("❌ عذراً، فشل حذف التعليق.", "error");
    }
  };

  const getRelativeTimeString = (timeInput: any): string => {
    if (!timeInput) return "الآن";
    
    // If it's a Firestore Timestamp {seconds: ..., nanoseconds: ...}
    let date = new Date();
    if (timeInput && typeof timeInput === "object" && typeof timeInput.seconds === "number") {
      date = new Date(timeInput.seconds * 1000);
    } else {
      date = new Date(timeInput);
    }

    const isInvalid = isNaN(date.getTime());
    if (isInvalid) return "الآن";

    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return "الآن";
    if (seconds < 60) return "قبل ثوانٍ";
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `قبل ${minutes} دقيقة`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `قبل ${hours} ساعة`;
    
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    if (days === 2) return "قبل يومين";
    return `قبل ${days} أيام`;
  };

  if (!isExpanded) {
    return (
      <button
        type="button"
        onClick={() => setIsExpanded(true)}
        className="text-[10px] font-bold px-2.5 py-1 bg-[#efd383]/5 text-amber-300 border border-[#efd383]/10 hover:border-[#efd383]/40 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
      >
        <MessageSquare className="w-3 h-3 text-amber-400" />
        <span>تعليقات ومناقشات</span>
      </button>
    );
  }

  return (
    <div className="w-full mt-4 p-4 rounded-xl bg-black/50 border border-white/5 space-y-4 animate-fade-in text-right" dir="rtl">
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#efd383]">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>المناقشات والآراء البرمجية ({comments.length})</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[10px] text-zinc-400 hover:text-white hover:underline transition-colors"
        >
          إخفاء التعليقات ✕
        </button>
      </div>

      {/* Skeleton screen loader for premium UX */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-2.5 items-start animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-zinc-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-zinc-800 rounded w-1/4" />
                <div className="h-2.5 bg-zinc-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-[10px] text-zinc-500 italic">
          لا توجد تعليقات بعد. كن أول من يطرح فكرة أو سؤالاً برمجيًا حول هذا المشروع!
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
          {comments.map((comment) => {
            const isMyComment = currentUser && comment.userId === currentUser.uid;
            return (
              <div 
                key={comment.commentId} 
                className="flex gap-2.5 items-start p-2.5 hover:bg-white/[0.02] rounded-lg transition-colors border border-transparent hover:border-white/5 relative group"
              >
                {comment.userPhoto ? (
                  <img
                    src={comment.userPhoto}
                    alt={comment.userName}
                    className="w-7 h-7 rounded-lg border border-[#efd383]/20 shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#efd383]/10 border border-[#efd383]/20 shrink-0 flex items-center justify-center text-[#efd383]">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-black text-amber-200 select-none truncate">
                      {comment.userName}
                    </span>
                    <span className="text-[9px] text-[#efd383]/60 font-mono">
                      {getRelativeTimeString(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed break-words font-medium select-text">
                    {comment.text}
                  </p>
                </div>

                {isMyComment && (
                  <button
                    onClick={() => handleDeleteComment(comment.commentId)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition-all cursor-pointer self-start ml-1"
                    title="حذف التعليق"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Adding Comment panel */}
      <SignedIn>
        <form onSubmit={handleSubmitComment} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="اكتب استفسار أو رأي برمجي داعم..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 bg-black/40 border border-white/5 focus:border-amber-500 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none transition-all placeholder-zinc-600 outline-none text-right"
          />
          <button
            type="submit"
            disabled={isSubmitting || !inputText.trim()}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-[#efd383] text-black hover:brightness-110 disabled:opacity-40 disabled:brightness-100 rounded-xl transition duration-150 cursor-pointer text-xs font-black flex items-center gap-1 shrink-0 shadow-lg shadow-amber-500/5"
          >
            {isSubmitting ? (
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3 h-3 transform rotate-180" />
            )}
            <span>نشر</span>
          </button>
        </form>
      </SignedIn>
      
      <SignedOut>
        <div className="mt-2 text-center p-3 border border-dashed border-amber-500/10 rounded-xl bg-amber-500/[0.02]">
          <p className="text-[10px] text-stone-400 mb-2">
            🔑 يجب تسجيل الدخول للانضمام للمجتمع والنقاش مع المطورين
          </p>
          <SignInButton mode="modal">
            <button className="px-3.5 py-1.5 bg-[#efd383]/10 hover:bg-[#efd383]/20 border border-amber-500/20 text-[#efd383] font-extrabold text-[10px] rounded-lg transition duration-150 cursor-pointer flex items-center gap-1.5 mx-auto">
              <Sparkles className="w-3 h-3 animate-pulse text-amber-400" />
              <span>تسجيل دخول فوري عبر Clerk</span>
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </div>
  );
};
