"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react"; // Fallbacks for mobile toggles

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-on-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-sm tracking-wider font-semibold animate-pulse">
            LOADING SECURE WORKSPACE...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "Projects", href: "/dashboard/projects", icon: "folder_open" },
    { name: "Saved Businesses", href: "/dashboard/saved", icon: "business_center" },
    { name: "Search History", href: "/dashboard/history", icon: "history" },
    { name: "Exports", href: "/dashboard/exports", icon: "file_download" },
  ];

  const utilityItems = [
    { name: "Settings", href: "/dashboard/settings", icon: "settings" },
    { name: "Profile", href: "/dashboard/profile", icon: "account_circle" },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const SidebarContent = () => (
    <>
      <div className="px-6 mb-10 flex items-center gap-3">
        <img src="/logo.png" alt="LeadFlow Logo" className="w-10 h-10 rounded-full object-cover shadow shadow-primary/10" />
        <div>
          <h1 className="font-headline-md text-xl font-bold text-primary leading-none">LeadFlow</h1>
          <p className="text-[10px] font-label-md text-on-surface-variant uppercase tracking-wider mt-0.5">Premium SaaS</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary-container/10 font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-body-md text-sm">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-6 pb-2 px-4">
          <p className="text-[11px] font-bold text-outline uppercase tracking-widest">Utility</p>
        </div>

        {utilityItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary-container/10 font-semibold"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              <span 
                className="material-symbols-outlined" 
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="font-body-md text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile section */}
      <div className="px-4 mt-auto pt-4 border-t border-outline-variant">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer justify-between group">
          <div className="flex items-center gap-3 overflow-hidden">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                {(user.displayName || user.email || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate text-on-surface">{user.displayName || "LeadFlow User"}</p>
              <p className="text-[10px] text-on-surface-variant truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-on-surface-variant hover:text-error transition-colors p-1 flex items-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface relative">
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col h-full py-6 bg-surface border-r border-outline-variant h-screen w-64 fixed left-0 top-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative flex flex-col w-64 bg-surface border-r border-outline-variant h-full py-6 animate-fade-in">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-6 p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Header Viewport Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        
        {/* Top Navbar */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant flex justify-between items-center px-6 md:px-8">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-high flex items-center cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative w-full max-w-md hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant rounded-full pl-10 pr-4 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                placeholder="Search resources, projects, or leads..."
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex items-center gap-4 border-r border-outline-variant pr-4 md:pr-6">
              <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center relative p-1.5 rounded-full hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
              </button>
              <button className="text-on-surface-variant hover:text-primary transition-colors flex items-center p-1.5 rounded-full hover:bg-surface-container-high">
                <span className="material-symbols-outlined text-[22px]">help_outline</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-surface-container-high transition-colors">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-xs">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <span className="font-label-md text-xs font-semibold text-on-surface hidden md:block">
                {(user.displayName || "Alex").split(" ")[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Pages Area */}
        <main className="flex-1 mt-16 p-6 md:p-8 animate-fade-in bg-surface-container-low">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
