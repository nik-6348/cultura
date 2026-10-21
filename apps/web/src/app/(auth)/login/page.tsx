"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { CulturaLogo } from "@/components/ui/CulturaLogo";

export default function LoginPage() {
  const router = useRouter();
  const { token, loading, signInWithGoogle, loginAsDemo } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in → go to dashboard
  useEffect(() => {
    if (!loading && token) {
      router.replace("/dashboard");
    }
  }, [token, loading, router]);

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Try demo access.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemo = () => {
    setDemoLoading(true);
    loginAsDemo();
    router.replace("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[100px] pointer-events-none" />

      {/* Back to landing */}
      <div className="absolute top-6 left-6">
        <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
          <CulturaLogo size={22} showText={true} />
        </Link>
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center mx-auto shadow-lg shadow-indigo-900/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-400">Sign in to your Cultura workspace</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || demoLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-800 font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-black/20"
          >
            {googleLoading ? (
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-[11px] text-slate-600 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {/* Demo */}
          <button
            onClick={handleDemo}
            disabled={googleLoading || demoLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed text-indigo-300 font-semibold text-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {demoLoading ? (
              <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Continue with demo credentials
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-rose-400 text-center bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Fine print */}
        <p className="text-center text-[11px] text-slate-600 leading-relaxed">
          By signing in you agree to our{" "}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer">Terms</span>{" "}
          and{" "}
          <span className="text-slate-500 hover:text-slate-400 cursor-pointer">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
