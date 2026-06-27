"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import Link from "next/link";

interface RunLog {
  id: string;
  keyword: string;
  location: string;
  resultsCount: number;
  timestamp: any;
}

interface SavedLead {
  id: string;
  name: string;
  address: string;
  rating: number;
  website: string;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalHistory, setTotalHistory] = useState(0);
  const [totalExports, setTotalExports] = useState(0);

  const [recentRuns, setRecentRuns] = useState<RunLog[]>([]);
  const [recentLeads, setRecentLeads] = useState<SavedLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch total businesses count
        const bizQuery = query(collection(db, "businesses"), where("userId", "==", user.uid));
        const bizSnap = await getDocs(bizQuery);
        setTotalLeads(bizSnap.size);

        // 2. Fetch projects count
        const projQuery = query(collection(db, "projects"), where("userId", "==", user.uid));
        const projSnap = await getDocs(projQuery);
        setTotalProjects(projSnap.size);

        // 3. Fetch history count
        const histQuery = query(collection(db, "history"), where("userId", "==", user.uid));
        const histSnap = await getDocs(histQuery);
        setTotalHistory(histSnap.size);

        // 4. Fetch exports count
        const expQuery = query(collection(db, "exports"), where("userId", "==", user.uid));
        const expSnap = await getDocs(expQuery);
        setTotalExports(expSnap.size);

        // 5. Fetch recent 4 history logs
        const recentHistQuery = query(
          collection(db, "history"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc"),
          limit(4)
        );
        const recentHistSnap = await getDocs(recentHistQuery);
        const historyList: RunLog[] = [];
        recentHistSnap.forEach((doc) => {
          const data = doc.data();
          historyList.push({
            id: doc.id,
            keyword: data.keyword || "N/A",
            location: data.location || "",
            resultsCount: data.resultsCount || 0,
            timestamp: data.timestamp?.toDate() || new Date(),
          });
        });
        setRecentRuns(historyList);

        // 6. Fetch recent 4 leads
        const recentBizQuery = query(
          collection(db, "businesses"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(4)
        );
        const recentBizSnap = await getDocs(recentBizQuery);
        const leadsList: SavedLead[] = [];
        recentBizSnap.forEach((doc) => {
          const data = doc.data();
          leadsList.push({
            id: doc.id,
            name: data.name || "Unknown Business",
            address: data.address || "N/A",
            rating: data.rating || 0,
            website: data.website || "",
          });
        });
        setRecentLeads(leadsList);

      } catch (error) {
        console.error("Error loading dashboard overview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [user]);

  const handleStartScrapeAlert = () => {
    alert("Companion Chrome Extension Active. To start collecting leads, open Google Maps, launch the extension bar, select parameters, and run search.");
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface">
            Good Day, {user?.displayName?.split(" ")[0] || "User"}
          </h2>
          <p className="text-body-lg text-on-surface-variant text-sm mt-1">Here's what's happening with your leads today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/exports"
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant bg-surface rounded-lg font-semibold hover:bg-surface-container-high transition-all text-xs text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            View Exports
          </Link>
          <button
            onClick={handleStartScrapeAlert}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-90 transition-all shadow-sm text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Search
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Projects */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">folder</span>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Active</span>
          </div>
          <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Projects</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{loading ? "..." : totalProjects}</h3>
        </div>

        {/* Total Businesses */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">apartment</span>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Updated</span>
          </div>
          <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Businesses</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface mt-1">
            {loading ? "..." : totalLeads.toLocaleString()}
          </h3>
        </div>

        {/* Today's Searches */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-tertiary/10 text-tertiary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">manage_search</span>
            </div>
            <div className="sparkline-container relative">
              <svg className="w-16 h-8 text-primary overflow-visible animate-pulse" viewBox="0 0 100 40">
                <path d="M0 35 Q 20 5, 40 25 T 80 15 T 100 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
              </svg>
            </div>
          </div>
          <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Scrape Runs</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{loading ? "..." : totalHistory}</h3>
        </div>

        {/* Total Exports */}
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-lg transition-shadow duration-300">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-on-surface-variant/10 text-on-surface-variant rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined">download_done</span>
            </div>
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-full">Stable</span>
          </div>
          <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Total Exports</p>
          <h3 className="font-headline-lg text-2xl font-bold text-on-surface mt-1">{loading ? "..." : totalExports}</h3>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Searches & Chart */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Table */}
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
              <h4 className="font-semibold text-sm text-on-surface">Recent Searches</h4>
              <Link href="/dashboard/history" className="text-xs font-semibold text-primary hover:underline">
                View History
              </Link>
            </div>
            <div className="overflow-x-auto">
              {recentRuns.length === 0 ? (
                <div className="p-8 text-center text-xs text-on-surface-variant italic">
                  No automated search logs found. Start scanning Google Maps to see runs here.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/30 border-b border-outline-variant text-on-surface-variant uppercase tracking-wider font-medium">
                      <th className="px-6 py-3">Keyword</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3 text-right">Results Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {recentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-on-surface">{run.keyword}</td>
                        <td className="px-6 py-4 text-on-surface-variant">{run.location || "Global"}</td>
                        <td className="px-6 py-4 font-bold text-primary text-right">{run.resultsCount} leads</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Activity Graph */}
          <div className="bg-surface rounded-xl border border-outline-variant p-6 h-64 flex flex-col shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="font-semibold text-sm text-on-surface">Lead Generation Activity</h4>
                <p className="text-xs text-on-surface-variant">Trends for your database accumulation</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant">Database Growth</span>
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgba(0, 74, 198, 0.15)"></stop>
                    <stop offset="100%" stopColor="rgba(0, 74, 198, 0)"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,180 L50,160 L100,170 L150,130 L200,140 L250,110 L300,120 L350,80 L400,90 L450,50 L500,70 L550,40 L600,60 L650,30 L700,50 L750,20 L800,40 L850,10 L900,30 L950,5 L1000,15" fill="none" stroke="#004ac6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                <path d="M0,180 L50,160 L100,170 L150,130 L200,140 L250,110 L300,120 L350,80 L400,90 L450,50 L500,70 L550,40 L600,60 L650,30 L700,50 L750,20 L800,40 L850,10 L900,30 L950,5 L1000,15 V200 H0 Z" fill="url(#chartGradient)"></path>
              </svg>
              <div className="absolute inset-0 flex justify-between items-end opacity-10 pointer-events-none">
                <div className="h-full w-px bg-outline"></div>
                <div className="h-full w-px bg-outline"></div>
                <div className="h-full w-px bg-outline"></div>
                <div className="h-full w-px bg-outline"></div>
                <div className="h-full w-px bg-outline"></div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Latest Saved Businesses & Activity Feed */}
        <div className="space-y-8">
          
          {/* Latest Saved Businesses */}
          <div className="bg-surface rounded-xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="p-5 border-b border-outline-variant bg-surface-container-low/50">
              <h4 className="font-semibold text-sm text-on-surface">Saved Businesses</h4>
            </div>
            <div className="p-4 space-y-3">
              {recentLeads.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant italic">
                  No saved leads in directory yet.
                </div>
              ) : (
                recentLeads.map((lead) => (
                  <div 
                    key={lead.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low border border-transparent hover:border-outline-variant transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{lead.name}</p>
                      <p className="text-[10px] text-on-surface-variant truncate">{lead.address}</p>
                    </div>
                    <Link href="/dashboard/saved" className="opacity-0 group-hover:opacity-100 transition-opacity text-primary flex items-center">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </Link>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 bg-surface-container-low/30 border-t border-outline-variant">
              <Link 
                href="/dashboard/saved" 
                className="w-full py-1.5 font-semibold text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">list</span>
                View All Businesses
              </Link>
            </div>
          </div>

          {/* Scrape Guide Box */}
          <div className="bg-primary text-white p-6 rounded-2xl relative overflow-hidden shadow-md">
            <div className="relative z-10 flex flex-col">
              <span className="bg-white/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider w-fit">
                LeadFlow Sync
              </span>
              <h4 className="text-lg font-bold mt-3">Browser Controlled Scrapes</h4>
              <p className="text-xs text-blue-100 mt-2 mb-6 leading-relaxed">
                Open a companion Google Maps window, click the LeadFlow extension badge, choose your variables, and trigger automation instantly.
              </p>
              <button 
                onClick={handleStartScrapeAlert}
                className="bg-white text-primary font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-blue-50 transition-colors shadow-lg cursor-pointer w-fit"
              >
                Launch Extension
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
