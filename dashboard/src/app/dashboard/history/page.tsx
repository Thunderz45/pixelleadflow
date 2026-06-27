"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy 
} from "firebase/firestore";

interface ScrapeRun {
  id: string;
  keyword: string;
  location: string;
  maxResults: number;
  resultsCount: number;
  status: string;
  timestamp: any;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<ScrapeRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      setLoading(true);
      // Fetch history (without orderBy to bypass composite index requirement)
      const q = query(
        collection(db, "history"), 
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: ScrapeRun[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          keyword: data.keyword || "N/A",
          location: data.location || "N/A",
          maxResults: data.maxResults || 0,
          resultsCount: data.resultsCount || 0,
          status: data.status || "ready",
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      // Sort in-memory by timestamp descending
      list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRuns(list);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleDeleteRun = async (id: string) => {
    if (!confirm("Are you sure you want to delete this scrape run history log? leads will not be affected.")) return;
    try {
      await deleteDoc(doc(db, "history", id));
      setRuns(runs.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting history log:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface">Search History</h2>
          <p className="text-on-surface-variant text-sm mt-1">Review and manage your previous lead extraction runs.</p>
        </div>
      </div>

      {/* History Timeline */}
      {loading ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-xs">Loading run histories...</p>
        </div>
      ) : runs.length === 0 ? (
        <div className="glass-panel p-12 rounded-xl text-center max-w-xl mx-auto bg-surface">
          <span className="material-symbols-outlined text-4xl text-outline mb-4">history</span>
          <h3 className="text-base font-bold text-on-surface">No search logs found</h3>
          <p className="text-xs text-on-surface-variant mt-2 max-w-xs mx-auto leading-relaxed">
            Run a search in the LeadFlow extension first. Logs will display parameters, status, and lead output.
          </p>
        </div>
      ) : (
        <div className="relative pl-12 space-y-8">
          <div className="timeline-line"></div>

          {runs.map((run) => {
            const isCompleted = run.status.toLowerCase() === "completed";
            const isProcessing = ["searching", "collecting", "saving"].includes(run.status.toLowerCase());
            
            return (
              <div key={run.id} className="relative group">
                {/* Dot indicator */}
                <div 
                  className={`timeline-dot transition-transform duration-250 ${
                    isCompleted 
                      ? "bg-primary shadow-[0_0_0_4px_rgba(0,74,198,0.1)]" 
                      : isProcessing
                        ? "bg-secondary animate-pulse shadow-[0_0_0_4px_rgba(70,72,212,0.2)]"
                        : "bg-outline shadow-[0_0_0_4px_rgba(115,118,134,0.1)]"
                  }`}
                />
                
                {/* Timeline Card */}
                <div className="bg-surface border border-outline-variant rounded-xl p-6 transition-all duration-300 group-hover:border-primary group-hover:shadow-lg group-hover:-translate-y-1">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    
                    {/* Left Info block */}
                    <div className="flex-1 flex gap-6 items-start">
                      <div className="w-14 h-14 bg-primary-container/20 rounded-xl flex items-center justify-center flex-shrink-0 text-primary">
                        <span className="material-symbols-outlined text-3xl">manage_search</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-base text-on-surface">{run.keyword}</h3>
                          <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                            isCompleted 
                              ? "bg-green-50 text-green-700" 
                              : isProcessing 
                                ? "bg-blue-50 text-blue-700 animate-pulse" 
                                : "bg-red-50 text-red-700"
                          }`}>
                            {run.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-on-surface-variant text-xs font-medium">
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">location_on</span>
                            {run.location}
                          </div>
                          <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                            {run.timestamp.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Results / Actions block */}
                    <div className="flex items-center gap-12 lg:gap-20">
                      <div className="text-center">
                        <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Results</p>
                        <p className="text-2xl font-extrabold text-primary">{run.resultsCount}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteRun(run.id)}
                          className="p-2.5 border border-outline-variant rounded-lg text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete log"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Secondary stats bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-primary mb-4">data_exploration</span>
            <h4 className="font-semibold text-sm text-on-surface">Extraction Success Rate</h4>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-primary">98.5%</p>
            <p className="text-xs text-on-surface-variant font-medium mt-1">Excellent DOM crawl health</p>
          </div>
        </div>

        <div className="bg-secondary/5 rounded-2xl p-6 border border-secondary/10 flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-secondary mb-4">group_add</span>
            <h4 className="font-semibold text-sm text-on-surface">Aggregate Leads Compiled</h4>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-secondary">
              {runs.reduce((acc, r) => acc + r.resultsCount, 0).toLocaleString()}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-1">Across all automation loops</p>
          </div>
        </div>

        <div className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-tertiary mb-4">bolt</span>
            <h4 className="font-semibold text-sm text-on-surface">Daily Scrape Runs Velocity</h4>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-tertiary">
              <div className="h-2 flex-1 bg-surface-container-high rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-[40%]"></div>
              </div>
              <span>40%</span>
            </div>
            <p className="text-xs text-on-surface-variant">Limit: 10 campaigns / day</p>
          </div>
        </div>
      </div>

    </div>
  );
}
