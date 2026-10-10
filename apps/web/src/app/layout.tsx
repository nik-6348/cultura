import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cultura — AI Cultural Intelligence Platform",
  description:
    "Enterprise Cultural Intelligence & Market Entry Decisions powered by Qloo Taste Signals, Deterministic Compatibility Scoring, and TypeSafe Jev System One Decisions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900">
        <ThemeProvider>
          <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
