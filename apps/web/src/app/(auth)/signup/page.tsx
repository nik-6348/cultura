"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("Nikhil Rajput");
  const [email, setEmail] = useState("nikhil@acme.com");
  const [company, setCompany] = useState("Acme Brands");
  const [password, setPassword] = useState("••••••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 400);
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="max-w-md mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Create an account
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Start making evidence-backed cultural market entry decisions.
              </p>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Nikhil Rajput"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  placeholder="Acme Brands"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Work email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nikhil@acme.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create a password"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm shadow-indigo-300 transition-all flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? "Creating account..." : "Get started"}</span>
                <ArrowRight className="w-4 h-4" />
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
                Enterprise Workspace Isolation
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Every project runs within a strictly isolated, private workspace with dedicated enterprise security controls.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Experience */}
      <div className="hidden lg:flex lg:w-[52%] bg-slate-950 text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="my-auto py-8 max-w-lg space-y-6">
          <h2 className="text-4xl font-black tracking-tight leading-tight text-white">
            Transform cultural data into
            <br />
            <span className="text-indigo-400">global market advantage.</span>
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            Gain immediate access to Qloo&apos;s cultural taste signals, our deterministic 5D compatibility scorer,
            and autonomous LangGraph agent workflows.
          </p>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              What you get
            </div>
            <ul className="text-xs text-slate-300 space-y-2">
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Multi-Dimensional Cultural & Taste Compatibility Models</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Strategic Expansion Readiness Verification</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Institutional Memory & Historical Market Benchmarks</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-slate-500">
          © 2026 Cultura AI Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
