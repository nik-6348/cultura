"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { auth, signInWithGoogle as fbSignInWithGoogle, signOut as fbSignOut } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

const DEMO_TOKEN = "Bearer dev_token:uid_demo_strategist:strategist@cultura.ai:Demo Strategist";
const TOKEN_KEY = "cultura_token";

interface SimpleUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: SimpleUser | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore from localStorage immediately — no Firebase wait needed for demo/stored tokens
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      setToken(stored);
      if (stored === DEMO_TOKEN) {
        setUser({ uid: "uid_demo_strategist", email: "strategist@cultura.ai", displayName: "Demo Strategist" });
      }
      setLoading(false); // don't block on Firebase if we already have a token
    }

    // Safety: if Firebase never fires (missing env vars etc), unblock after 3s
    const timeout = setTimeout(() => setLoading(false), 3000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      if (firebaseUser) {
        const devToken = `Bearer dev_token:${firebaseUser.uid}:${firebaseUser.email ?? ""}:${firebaseUser.displayName ?? "User"}`;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setToken(devToken);
        localStorage.setItem(TOKEN_KEY, devToken);
        setLoading(false);
      } else {
        // No Firebase user — keep demo token if present, otherwise clear
        const storedNow = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
        if (!storedNow || storedNow !== DEMO_TOKEN) {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      }
    });

    return () => { clearTimeout(timeout); unsubscribe(); };
  }, []);

  const signInWithGoogle = async () => {
    const firebaseUser = await fbSignInWithGoogle();
    const devToken = `Bearer dev_token:${firebaseUser.uid}:${firebaseUser.email ?? ""}:${firebaseUser.displayName ?? "User"}`;
    setUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
    });
    setToken(devToken);
    localStorage.setItem(TOKEN_KEY, devToken);
  };

  const loginAsDemo = () => {
    const u = { uid: "uid_demo_strategist", email: "strategist@cultura.ai", displayName: "Demo Strategist" };
    setUser(u);
    setToken(DEMO_TOKEN);
    localStorage.setItem(TOKEN_KEY, DEMO_TOKEN);
  };

  const logout = async () => {
    try { await fbSignOut(); } catch { /* already signed out */ }
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signInWithGoogle, loginAsDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
