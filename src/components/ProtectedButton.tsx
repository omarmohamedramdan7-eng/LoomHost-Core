import React from "react";
import { useUser } from "../clerk-bridge";

interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  fallbackMessage?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function ProtectedButton({
  children,
  onClick,
  fallbackMessage = "يرجى تسجيل الدخول أولاً لتنفيذ هذا الإجراء.",
  ...props
}: ProtectedButtonProps) {
  const { isSignedIn } = useUser();

  const handleProtectedClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isSignedIn) {
      e.preventDefault();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("open-clerk-signin"));
      }
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button onClick={handleProtectedClick} {...props}>
      {children}
    </button>
  );
}
