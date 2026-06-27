"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState({ projects: 0, leads: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchUserStats = async () => {
      try {
        setLoading(true);
        const projSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", user.uid)));
        const bizSnap = await getDocs(query(collection(db, "businesses"), where("userId", "==", user.uid)));
        setStats({
          projects: projSnap.size,
          leads: bizSnap.size,
        });
      } catch (error) {
        console.error("Error fetching profile metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserStats();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Panel */}
      <header>
        <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface mb-1">Your Profile</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Manage your account registration detail, license, and campaign metrics.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Card: Avatar card */}
        <div className="md:col-span-1">
          <div className="bg-white border border-outline-variant rounded-xl p-6 text-center space-y-6 shadow-sm">
            <div className="flex justify-center relative w-24 h-24 mx-auto">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary-container"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-3xl">
                  {user.email?.[0].toUpperCase() || "U"}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-on-surface leading-tight">
                {user.displayName || "LeadFlow User"}
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold bg-primary/5 text-primary border border-primary/10 uppercase tracking-wider">
                Active Client
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 border border-outline-variant hover:bg-surface-container rounded-lg font-semibold text-xs text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign Out Account
            </button>
          </div>
        </div>

        {/* Right Card: details & stats */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">folder</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Total Projects</p>
                <p className="text-lg font-bold text-on-surface mt-0.5">{loading ? "..." : stats.projects}</p>
              </div>
            </div>

            <div className="bg-white border border-outline-variant p-4 rounded-xl flex items-center gap-4 shadow-sm">
              <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined">apartment</span>
              </div>
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase font-semibold">Leads Compiled</p>
                <p className="text-lg font-bold text-on-surface mt-0.5">{loading ? "..." : stats.leads}</p>
              </div>
            </div>
          </div>

          {/* Account credentials */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-bold text-outline uppercase tracking-wider">Account Credentials</h4>
            
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/30">
                <span className="material-symbols-outlined text-outline">alternate_email</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Registered Email</span>
                  <span className="text-on-surface">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/30">
                <span className="material-symbols-outlined text-outline">shield</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">User Unique UID</span>
                  <span className="text-on-surface font-mono">{user.uid}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">credit_card</span>
                <div>
                  <span className="text-[10px] text-on-surface-variant block">Active Subscription Plan</span>
                  <span className="text-primary font-bold">Free Tier (Unlimited Scraping)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
