import React from "react";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "LoomHost AI Dashboard",
  description: "Next-gen instant cloud hosting service",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="ar" dir="rtl">
        <head>
          <meta name="referrer" content="no-referrer-when-downgrade" />
        </head>
        <body className="antialiased bg-slate-950 text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
