"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";

interface ScraperSettings {
  defaultMaxResults: number;
  autoScrollDelay: number;
  retryAttempts: number;
  skipDuplicates: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"automation" | "specs">("automation");
  
  const [settings, setSettings] = useState<ScraperSettings>({
    defaultMaxResults: 50,
    autoScrollDelay: 1000,
    retryAttempts: 3,
    skipDuplicates: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [authToken, setAuthToken] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const token = await user.getIdToken();
        setAuthToken(token);

        const res = await fetch("/api/settings", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setSettings(data as ScraperSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setSaving(true);
      setSuccess(false);
      const token = await user.getIdToken();
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error("Failed to save settings on server");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Could not update configurations.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant text-xs font-semibold">Loading system settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Panel */}
      <header className="mb-8">
        <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface mb-2">Settings</h2>
        <p className="text-body-md text-sm text-on-surface-variant">
          Manage your account preferences, automation limits, and system specifications.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="relative flex items-center gap-8 border-b border-outline-variant mb-8 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveTab("automation")}
          className={`pb-4 font-semibold text-xs tracking-wide cursor-pointer transition-all ${
            activeTab === "automation" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          Automation Engine
        </button>
        <button 
          onClick={() => setActiveTab("specs")}
          className={`pb-4 font-semibold text-xs tracking-wide cursor-pointer transition-all ${
            activeTab === "specs" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          System Specifications
        </button>
      </div>

      {/* Tab Contents */}
      <div id="content-container">
        {activeTab === "automation" && (
          <form onSubmit={handleSaveSettings} className="space-y-8">
            <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-6 shadow-sm">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">cpu</span>
                Automation Engine Options
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-medium">
                
                {/* Max Results */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">Default Max Results Limit</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={settings.defaultMaxResults}
                    onChange={(e) => setSettings({ ...settings, defaultMaxResults: parseInt(e.target.value) || 50 })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Cap maps results automatically inside popup queries.
                  </p>
                </div>

                {/* Scroll Delay */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">Scroll Delay Frequency (ms)</label>
                  <input
                    type="number"
                    min={200}
                    max={5000}
                    value={settings.autoScrollDelay}
                    onChange={(e) => setSettings({ ...settings, autoScrollDelay: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Spacing interval during automatic left pane scrolling operations.
                  </p>
                </div>

                {/* Network Retries */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">DOM Click Retries</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={settings.retryAttempts}
                    onChange={(e) => setSettings({ ...settings, retryAttempts: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Maximum card click retries before skipping row elements.
                  </p>
                </div>

                {/* Duplicate logic */}
                <div className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-on-surface">Skip Duplicate Listings</h4>
                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Deduplicate leads by matching names within Firestore directories.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.skipDuplicates}
                    onChange={(e) => setSettings({ ...settings, skipDuplicates: e.target.checked })}
                    className="h-5 w-5 accent-primary cursor-pointer border-outline-variant rounded"
                  />
                </div>

              </div>

              {success && (
                <div className="p-3.5 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <span className="material-symbols-outlined">check_circle</span>
                  Configurations updated successfully!
                </div>
              )}

              <div className="flex justify-end pt-6 border-t border-outline-variant">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-2.5 bg-primary text-white font-semibold text-xs rounded-lg hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Save Configuration Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === "specs" && (
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">database</span>
              Environment Specifications
            </h3>

            <div className="space-y-4 text-xs font-medium">
              <div className="pb-3 border-b border-outline-variant flex justify-between">
                <span className="text-on-surface-variant">Firebase Project ID</span>
                <span className="font-bold text-on-surface">pixel-leadflow</span>
              </div>
              <div className="pb-3 border-b border-outline-variant flex justify-between">
                <span className="text-on-surface-variant">Storage Bucket URI</span>
                <span className="font-mono text-on-surface">pixel-leadflow.firebasestorage.app</span>
              </div>
              <div className="pb-3 border-b border-outline-variant flex justify-between">
                <span className="text-on-surface-variant">Dashboard Server</span>
                <span className="font-bold text-primary">Next.js Client v16</span>
              </div>
              <div className="pb-3 border-b border-outline-variant flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">Scraper Authorization Token</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(authToken);
                      alert("Auth Token copied to clipboard!");
                    }}
                    type="button"
                    className="text-xs text-primary font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Copy Token
                  </button>
                </div>
                <input
                  type="text"
                  readOnly
                  value={authToken ? `${authToken.substring(0, 45)}... (Click Copy to grab full token)` : "Loading token..."}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-[11px] font-mono text-on-surface-variant focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg flex gap-3 text-[11px] leading-relaxed text-primary font-semibold">
              <span className="material-symbols-outlined">info</span>
              <div>
                <strong className="block mb-0.5">Authorization Sync</strong>
                Ensure the Chrome Extension has matching host permissions to extract session cookies.
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
