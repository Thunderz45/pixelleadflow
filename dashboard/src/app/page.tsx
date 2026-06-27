"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

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

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSubmitMock = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Please sign in using 'Sign in with Google' to synchronize extension session cookies securely.");
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

          {/* Google Auth Button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-outline-variant rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-all duration-200 group active:scale-[0.98] mb-6 cursor-pointer"
          >
            <svg height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"></path>
            </svg>
            <span className="font-semibold text-sm">Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="w-full flex items-center gap-3 mb-6">
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">or</span>
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmitMock} className="w-full space-y-6">
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
