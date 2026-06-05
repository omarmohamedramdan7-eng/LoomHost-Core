"use client";

import React from "react";
import { ClerkProvider, SignedIn, SignedOut, UserButton, SignInButton } from "../src/clerk-bridge";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_Y2xlcmstZGVtby5jbGVyay5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="ar" dir="rtl">
        <head>
          <title>LoomHost AI Dashboard | منصة استضافة المواقع بالذكاء الاصطناعي</title>
          <meta name="description" content="Next-gen instant cloud hosting service with generative AI" />
          
          {/* كود التحقق الميتا الإعلاني المطلوب بدقة متناهية */}
          <meta name="060a20f07e44ee158b5fc2bfa8cc0d072dc3b41f" content="060a20f07e44ee158b5fc2bfa8cc0d072dc3b41f" />
          <meta name="referrer" content="no-referrer-when-downgrade" />

          {/* التوصيل بقواعد أنماط الخطوط الأنيقة لتعزيز الهوية البصرية */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
        </head>
        <body className="antialiased bg-slate-950 text-white min-h-screen flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
          {/* شريط الملاحة السحابي الموحد والمستقر */}
          <header className="border-b border-slate-900/80 bg-slate-950/70 backdrop-blur-md p-4 sticky top-0 z-50 transition-all">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                  LoomHost AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 select-none">
                  نشط ⚡
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* استخدام مكونات Clerk المضمونة والمستقرة معاً */}
                <SignedIn>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline-block font-medium">لوحة التحكم السحابية نشطة</span>
                    <UserButton />
                  </div>
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl transition-all duration-150 shadow-md shadow-cyan-500/15 border border-cyan-500/40 cursor-pointer active:scale-95">
                      تسجيل الدخول / البدء الآن
                    </button>
                  </SignInButton>
                </SignedOut>
              </div>
            </div>
          </header>

          <main className="flex-1">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
