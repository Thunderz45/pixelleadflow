"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"website" | "scraper" | "linkedin">("website");

  const handleDashboardClick = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById("how-it-works");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface relative overflow-x-hidden">
      
      {/* Background Decorative Lighting */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute dot-pattern inset-0 opacity-40"></div>
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-0 -left-[10%] w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="LeadFlow Logo"
              className="w-9 h-9 rounded-xl shadow-md shadow-primary/20 object-cover group-hover:scale-105 transition-transform"
            />
            <span className="font-extrabold text-xl text-primary tracking-tight">LeadFlow</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-on-surface-variant">
            <a href="#features" className="hover:text-primary transition-colors">
              Features
            </a>
            <a href="#website-generator" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
              AI Website Generator
            </a>
            <a href="#linkedin" className="hover:text-primary transition-colors">
              LinkedIn Scraper
            </a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              How It Works
            </a>
          </nav>

          {/* Action CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDashboardClick}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl font-bold text-xs shadow-md shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Go to Dashboard</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section with Right-Side Horizontal Video */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Content & CTAs (7 cols) */}
          <div className="lg:col-span-7 text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold animate-fade-in">
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span>B2B Lead Engine & AI Website Generator</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-[1.15]">
              Discover High-Intent Business Leads & <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-secondary">Auto-Generate Websites</span>
            </h1>

            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl leading-relaxed">
              LeadFlow extracts B2B contact data from Google Maps & LinkedIn. For businesses missing a website, LeadFlow automatically generates custom, high-converting prototype landing pages in seconds.
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleDashboardClick}
                className="px-8 py-4 bg-gradient-to-r from-primary via-primary-container to-secondary text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined text-xl">rocket_launch</span>
                <span>Try LeadFlow Now</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button
                onClick={scrollToHowItWorks}
                className="px-8 py-4 bg-white hover:bg-surface-container-low text-on-surface border border-outline-variant rounded-2xl font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xl text-primary">play_circle</span>
                <span>How It Works</span>
              </button>
            </div>
          </div>

          {/* Right Column: Horizontal Video with Curved Corners (5 cols) */}
          <div className="lg:col-span-5 w-full">
            <div className="relative rounded-3xl overflow-hidden border-2 border-primary/30 shadow-2xl shadow-primary/20 group hover:border-primary/60 transition-all duration-300 transform hover:-translate-y-1 bg-slate-950 aspect-video">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent z-10 pointer-events-none"></div>
              <video
                src="/montage.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-3xl"
              ></video>
              <div className="absolute bottom-4 left-4 z-20 text-left text-white space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/80 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md border border-white/20">
                  Lead Engine & AI Website Showcase
                </span>
                <p className="text-xs font-bold text-white drop-shadow-md">Automated B2B Client Acquisition</p>
              </div>
            </div>
          </div>

        </div>

        {/* Live Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/60 shadow-xs text-center">
            <h3 className="text-2xl font-extrabold text-primary">100%</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Automated Lead Extraction</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/60 shadow-xs text-center">
            <h3 className="text-2xl font-extrabold text-secondary">&lt; 5 sec</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">AI Website Prototype Generation</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/60 shadow-xs text-center">
            <h3 className="text-2xl font-extrabold text-emerald-600">6 Categories</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">LinkedIn Profile Auto-Tagging</p>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/60 shadow-xs text-center">
            <h3 className="text-2xl font-extrabold text-amber-600">1-Click</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Excel & CSV Campaign Exports</p>
          </div>
        </div>

      </section>

      {/* AI Website Generator Spotlight Section */}
      <section id="website-generator" className="relative z-10 py-16 bg-surface-container-low/50 border-y border-outline-variant/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Specialized Feature
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface mt-3">
              Turn "No Website" Leads Into High-Value Clients
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-3 leading-relaxed">
              When Google Maps leads don't have a website listed, LeadFlow provides a <b>"✨ Generate Website"</b> button that creates a complete, responsive landing page prototype using AI based on their Google Maps profile.
            </p>
          </div>

          {/* Interactive Feature Demo Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-outline-variant shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            
            {/* Left Column: Problem & Lead Card */}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md">
                  Step 1: Detected Lead Missing Website
                </span>
                <h3 className="text-xl font-bold text-on-surface">Google Maps Lead Card</h3>
                <p className="text-xs text-on-surface-variant">
                  Extracted contact has high rating & reviews, but lacks an online web presence.
                </p>
              </div>

              {/* Lead Card Preview */}
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-2xl space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Apex Dental Clinic</h4>
                    <p className="text-xs text-on-surface-variant">124 Main Street, Austin TX</p>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                    ★ 4.9 (84 reviews)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-outline-variant/40">
                  <span className="text-on-surface-variant font-medium">Phone: (512) 555-0192</span>
                  <span className="text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded text-[10px]">
                    Website: N/A
                  </span>
                </div>

                {/* Generate Button Highlight */}
                <div className="pt-2">
                  <button
                    onClick={handleDashboardClick}
                    className="w-full py-2.5 bg-gradient-to-r from-primary via-primary-container to-secondary text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    <span>✨ Generate Website Prototype</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                  Generates complete HTML, Tailwind CSS, Google Fonts, and booking CTAs.
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface font-semibold">
                  <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                  Download `.html` files or copy code directly to pitch business owners.
                </div>
              </div>
            </div>

            {/* Right Column: AI Generated Prototype Preview */}
            <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-400 font-mono text-[11px] ml-2">apex_dental_prototype.html</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                  AI Generated Live
                </span>
              </div>

              {/* Landing Page Mockup */}
              <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-blue-400">Apex Dental Clinic</span>
                  <span className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-bold">Call: (512) 555-0192</span>
                </div>

                <div className="py-6 text-center space-y-2">
                  <h4 className="font-extrabold text-base text-white">Your Smile's Best Care in Austin</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Top-rated general & cosmetic dentistry. Rated ★ 4.9 Stars from 84 local patient reviews.
                  </p>
                  <button
                    onClick={handleDashboardClick}
                    className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer hover:bg-blue-500 transition-colors"
                  >
                    Book Appointment Now
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Interactive "How It Works" Section */}
      <section id="how-it-works" className="relative z-10 py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider">
            Step-by-Step Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface mt-3">
            How LeadFlow Powers Your Outreach
          </h2>
          <p className="text-sm sm:text-base text-on-surface-variant mt-3">
            From discovering leads to generating custom website proposals and exporting clean datasets.
          </p>
        </div>

        {/* 4 Step Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm">
              01
            </div>
            <h3 className="font-bold text-base text-on-surface">Search & Scrape Leads</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Extract business contacts from Google Maps or search LinkedIn profiles filtered by role & location.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-extrabold text-sm">
              02
            </div>
            <h3 className="font-bold text-base text-on-surface">Auto-Detect Missing Websites</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              LeadFlow flags high-rating business leads that currently lack an official website online.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-sm">
              03
            </div>
            <h3 className="font-bold text-base text-on-surface">Click "✨ Generate Website"</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Generate responsive HTML website prototypes customized to the business's profile in 5 seconds.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3 relative overflow-hidden group hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold text-sm">
              04
            </div>
            <h3 className="font-bold text-base text-on-surface">Export & Close Deals</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Download campaign datasets into `.xlsx` Excel spreadsheets or `.csv` files for cold outreach.
            </p>
          </div>

        </div>

        {/* Workflow CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={handleDashboardClick}
            className="px-6 py-3 bg-primary text-white font-bold text-xs rounded-xl shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Launch LeadFlow Dashboard</span>
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </button>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="relative z-10 py-16 bg-surface-container-low/40 border-t border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Complete Feature Suite
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface mt-3">
              Everything You Need for B2B Lead Growth
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">map</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">Google Maps B2B Extractor</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Companion Chrome extension scrapes business names, phones, addresses, ratings, and website status into campaign folders.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3" id="linkedin">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">badge</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">LinkedIn Profile Scraper</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Apify-powered profile scraper with smart auto-categorization into Developers, AI Engineers, Sales, Marketing, and Executives.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-outline-variant shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </div>
              <h3 className="font-bold text-base text-on-surface">PixelChat AI Assistant</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Built-in AI chat helper powered by Groq Llama 3.3 to assist you in real-time with search strategies and exports.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Final Bottom CTA Banner */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-slate-900 via-primary-fixed-dim/20 to-slate-950 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Ready to Discover Leads & Generate Websites?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            Access the LeadFlow dashboard today to start scraping Google Maps, LinkedIn profiles, and creating AI website prototypes.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={handleDashboardClick}
              className="px-8 py-4 bg-gradient-to-r from-primary via-primary-container to-secondary text-white font-extrabold text-sm rounded-2xl shadow-2xl hover:scale-105 transition-transform cursor-pointer flex items-center gap-2"
            >
              <span>Try LeadFlow Now</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="LeadFlow Logo" className="w-6 h-6 rounded-lg object-cover" />
            <span className="font-bold text-white">LeadFlow</span>
            <span>© 2026 LeadFlow Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={handleDashboardClick} className="hover:text-white transition-colors cursor-pointer">
              Dashboard
            </button>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
