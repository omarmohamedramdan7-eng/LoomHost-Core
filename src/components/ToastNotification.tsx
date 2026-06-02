/**
 * @file ToastNotification.tsx
 * @description Sleek, customizable Toast Notification system designed to match LoomHost AI's elegant neon cyber-slate dark mode.
 */

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastNotificationProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onClose }) => {
  return (
    <div id="toast-portal-container" className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none font-sans select-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const Icon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-[#39ff14] shrink-0" />;
      case "error":
        return <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-[#00f0ff] shrink-0" />;
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case "success":
        return "border-emerald-500/30 shadow-[0_0_15px_rgba(57,255,14,0.1)]";
      case "error":
        return "border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]";
      default:
        return "border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]";
    }
  };

  return (
    <div
      id={`toast-${toast.id}`}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-[#0a0f1d]/95 backdrop-blur-md text-slate-100 shadow-2xl transition-all duration-300 animate-fade-in ${getBorderColor()}`}
      dir="rtl"
    >
      <div className="pt-0.5">
        <Icon />
      </div>
      
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {toast.message}
      </div>

      <button
        id={`close-toast-${toast.id}`}
        onClick={() => onClose(toast.id)}
        className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-800/50 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
