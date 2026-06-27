"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading, loginWithEmail } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState("");

  // If user is already authenticated, redirect to /dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Subtle Mouse parallax for background elements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const moveX = (e.clientX - window.innerWidth / 2) * 0.01;
      const moveY = (e.clientY - window.innerHeight / 2) * 0.01;
      
      const elements = document.querySelectorAll(".blur-glow");
      if (elements.length >= 2) {
        (elements[0] as HTMLElement).style.transform = `translate(${moveX}px, ${moveY}px)`;
        (elements[1] as HTMLElement).style.transform = `translate(${-moveX}px, ${-moveY}px)`;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill out both email and password.");
      return;
    }
    setError("");
    setIsSigningIn(true);
    try {
      await loginWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  if (loading || isSigningIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm tracking-wider font-semibold animate-pulse">
            SECURELY LOADING LEADFLOW...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-margin-mobile md:p-0 relative overflow-hidden bg-background text-on-surface">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden select-none pointer-events-none">
        <div className="absolute inset-0 dot-pattern"></div>
        <div className="absolute blur-glow -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[120px] transition-transform duration-300"></div>
        <div className="absolute blur-glow -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary-container/10 rounded-full blur-[120px] transition-transform duration-300"></div>
      </div>

      {/* Main Content Shell */}
      <main className="relative z-10 w-full max-w-[440px] animate-fade-in">
        <div className="bg-white border border-outline-variant shadow-2xl rounded-2xl p-8 md:p-10 flex flex-col items-center">
          
          {/* Brand Logo */}
          <div className="mb-8 flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-lg shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                rocket_launch
              </span>
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">LeadFlow</h1>
          </div>

          {/* Welcome Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-on-surface mb-2">Welcome back</h2>
            <p className="text-sm text-on-surface-variant">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200 text-center font-medium animate-pulse">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface-variant ml-1" htmlFor="email">Email Address</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </div>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-on-surface-variant" htmlFor="password">Password</label>
                <a className="text-[11px] text-primary hover:underline transition-all" href="#">Forgot password?</a>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors flex items-center">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold shadow-lg shadow-primary/25 hover:bg-primary-container transition-all active:scale-[0.98] mt-2 text-sm cursor-pointer"
              type="submit"
            >
              Sign in to LeadFlow
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-8 text-on-surface-variant text-sm text-center w-full">
            Don't have an account?{" "}
            <a className="text-primary font-semibold hover:underline" href="#">Start free trial</a>
          </p>
        </div>

        {/* Decorative Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 opacity-40 text-[11px] text-on-surface-variant font-semibold">
          <span>© 2026 LeadFlow Inc.</span>
          <span>•</span>
          <span className="cursor-pointer hover:underline">Privacy Policy</span>
        </div>
      </main>
    </div>
  );
}
