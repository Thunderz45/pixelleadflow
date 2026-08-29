"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { user, loading, loginWithEmail, registerWithEmail } = useAuth();
  const router = useRouter();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // If user is already authenticated, redirect to /dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (mode === "register" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        setSuccess("Signed in successfully! Redirecting to dashboard...");
      } else {
        await registerWithEmail(email, password, name);
        setSuccess("Account created successfully! Redirecting to dashboard...");
      }
      if (typeof window !== "undefined") {
        sessionStorage.setItem("welcome_offer_active", "true");
      }
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Don't have an account? Click 'Create Account'.");
      } else if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please sign in.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isSubmitting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm tracking-wider font-semibold animate-pulse">
            AUTHENTICATING WITH LEADFLOW...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background text-on-surface">
      
      {/* Background Lighting */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <div className="absolute inset-0 dot-pattern opacity-30"></div>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-[440px] animate-fade-in">
        <div className="bg-white border border-outline-variant shadow-2xl rounded-3xl p-8 md:p-10 flex flex-col items-center">
          
          {/* Brand Logo & Title */}
          <Link href="/" className="mb-6 flex flex-col items-center gap-2 group">
            <img src="/logo.png" alt="LeadFlow Logo" className="w-12 h-12 rounded-2xl shadow-lg shadow-primary/20 object-cover group-hover:scale-105 transition-transform" />
            <h1 className="text-2xl font-extrabold text-primary tracking-tight">LeadFlow</h1>
          </Link>

          {/* Mode Switcher Tabs */}
          <div className="w-full grid grid-cols-2 gap-1 p-1 bg-surface-container-low border border-outline-variant rounded-xl mb-6">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "login" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "register" ? "bg-white text-primary shadow-xs" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-on-surface">
              {mode === "login" ? "Welcome Back to LeadFlow" : "Create Your LeadFlow Account"}
            </h2>
            <p className="text-xs text-on-surface-variant leading-relaxed max-w-xs mx-auto mt-1">
              {mode === "login"
                ? "Sign in to access your business leads, AI website generator, and campaigns."
                : "Join LeadFlow today to start discovering leads and auto-generating websites."}
            </p>
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 text-center font-semibold animate-pulse">
              {error}
            </div>
          )}

          {success && (
            <div className="w-full mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 text-center font-semibold">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="name">Full Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                    person
                  </span>
                  <input
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    id="name"
                    placeholder="John Doe"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  alternate_email
                </span>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                {mode === "login" && (
                  <a className="text-[11px] text-primary font-semibold hover:underline" href="#">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  lock
                </span>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-outline-variant rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant transition-colors flex items-center cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold shadow-lg shadow-primary/25 hover:opacity-95 transition-all cursor-pointer text-xs mt-2"
              type="submit"
            >
              {mode === "login" ? "Sign In to LeadFlow" : "Create Free Account"}
            </button>
          </form>

          {/* Toggle Footer Link */}
          <div className="mt-6 text-on-surface-variant text-xs text-center w-full">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="text-primary font-bold hover:underline cursor-pointer ml-1"
                >
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-primary font-bold hover:underline cursor-pointer ml-1"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-outline-variant/40 w-full text-center">
            <Link href="/" className="text-[11px] text-on-surface-variant hover:text-primary font-semibold transition-colors">
              ← Back to Home Page
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
