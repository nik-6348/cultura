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
    // Check localStorage first (synchronous) so we don't flash the login screen
    const stored = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (stored) {
      setToken(stored);
      if (stored === DEMO_TOKEN) {
        setUser({ uid: "uid_demo_strategist", email: "strategist@cultura.ai", displayName: "Demo Strategist" });
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Build a dev-compatible token from the Firebase user (backend is in dev mode)
        const devToken = `Bearer dev_token:${firebaseUser.uid}:${firebaseUser.email ?? ""}:${firebaseUser.displayName ?? "User"}`;
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
        });
        setToken(devToken);
        localStorage.setItem(TOKEN_KEY, devToken);
      } else {
        // Only clear if there's no stored demo token
        const storedNow = localStorage.getItem(TOKEN_KEY);
        if (!storedNow || storedNow !== DEMO_TOKEN) {
          setUser(null);
          setToken(storedNow);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
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
