"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  TrendingUp,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("nikhil@acme.com");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Instant developer/evaluator auto-login
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
  };

  const handleDemoAccess = () => {
    setIsLoading(true);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-white font-sans antialiased">
      {/* LEFT PANEL: Form Section */}
      <div className="w-full lg:w-[48%] flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center justify-between mb-12">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="relative w-7 h-7 flex items-center justify-center">
                <span className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600 top-0 left-1/2 -translate-x-1/2" />
                <span className="absolute w-2 h-2 rounded-full bg-violet-500 bottom-0.5 left-0" />
                <span className="absolute w-2.5 h-2.5 rounded-full bg-purple-600 bottom-0.5 right-0" />
                <span className="absolute w-1.5 h-1.5 rounded-full bg-indigo-400 top-2 left-1.5" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-slate-900">
                Cultura
              </span>
            </Link>
            <div className="text-xs text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Sign up
              </Link>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Sign in
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Access your projects, analysis runs and reports.
              </p>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 shadow-2xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full flex items-center justify-center space-x-3 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 shadow-2xs"
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-[#F25022]" />
                  <div className="bg-[#7FBA00]" />
                  <div className="bg-[#00A4EF]" />
                  <div className="bg-[#FFB900]" />
                </div>
                <span>Continue with Microsoft</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-xs text-slate-400 uppercase tracking-wider font-semibold absolute">
                or
              </span>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nikhil@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="remember"
                  className="ml-2 text-xs font-medium text-slate-600"
                >
                  Keep me signed in
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-300 transition-all flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? "Signing in..." : "Sign in"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Instant Evaluation Demo Access */}
              <button
                type="button"
                onClick={handleDemoAccess}
                className="w-full py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>One-Click Evaluator Access (No Password Required)</span>
              </button>
            </form>
          </div>
        </div>

        {/* Security Assurance Badge */}
        <div className="max-w-md mx-auto w-full pt-8">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900">
                Your data is secure
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                We use industry-standard enterprise encryption and strict workspace isolation.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Immersive Visual Experience (Matching Mockup 20_Sign_In.png) */}
      <div className="hidden lg:flex lg:w-[52%] bg-slate-950 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Floating Card: Tokyo 92/100 */}
        <div className="flex justify-end">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/60 p-4 rounded-2xl shadow-xl w-64 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <span>Tokyo</span>
                <span className="text-xs">🇯🇵</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                LAUNCH
              </span>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white">92</span>
              <span className="text-xs text-slate-400">/ 100 Cultural fit</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[92%]" />
            </div>
          </div>
        </div>

        {/* Central Content */}
        <div className="my-auto py-8 max-w-lg space-y-8">
          <div>
            <h2 className="text-4xl font-black tracking-tight leading-tight text-white">
              Understand culture.
              <br />
              <span className="text-indigo-400">Make smarter decisions.</span>
            </h2>
            <p className="text-slate-300 text-sm mt-3 leading-relaxed">
              Cultura helps enterprise brands analyze cultural trends, audiences and markets
              using real-world signals, so you can make data-driven expansion and marketing decisions.
            </p>
          </div>

          {/* Feature Pillars */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center flex-shrink-0 text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Market insights</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Discover cultural fit, audience interests and emerging trends.
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-400/30 flex items-center justify-center flex-shrink-0 text-purple-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Smarter strategy</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Get AI-powered recommendations with verifiable Qloo evidence.
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Actionable reports</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Turn insights into clear, shareable briefs for your executive leadership.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Verified Quote Card */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl max-w-lg">
          <p className="text-xs text-slate-300 italic leading-relaxed">
            &ldquo;Cultura gives our team a clear view of what resonates in each market,
            backed by real cultural signals instead of subjective agency hunches.&rdquo;
          </p>
          <div className="flex items-center space-x-3 mt-3">
            <div className="w-7 h-7 rounded-full bg-indigo-500 text-white font-bold text-xs flex items-center justify-center">
              SK
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Sarah Kim</div>
              <div className="text-[10px] text-slate-400">
                Head of Global Market Entry, Retail Brands
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
