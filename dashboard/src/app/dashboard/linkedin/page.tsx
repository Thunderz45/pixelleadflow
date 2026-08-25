"use client";

import React, { useState } from "react";
import { LinkedInProfile } from "@/app/api/linkedin/scrape/route";
import * as XLSX from "xlsx";

export default function LinkedInScraperPage() {
  const [keyword, setKeyword] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [quantity, setQuantity] = useState<number>(10);
  const [profileUrlInput, setProfileUrlInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedLeadIds, setSavedLeadIds] = useState<Record<string, boolean>>({});
  const [searchSuccessAlert, setSearchSuccessAlert] = useState("");

  const categories = [
    { id: "All", label: "All Profiles", icon: "grid_view" },
    { id: "AI & ML", label: "AI & ML Engineers", icon: "auto_awesome" },
    { id: "Developer", label: "Developers & Software", icon: "code" },
    { id: "Designer", label: "Designers & Product", icon: "palette" },
    { id: "Sales", label: "Sales & BD", icon: "trending_up" },
    { id: "Marketing", label: "Marketing & Growth", icon: "campaign" },
    { id: "Executive", label: "Executives & Founders", icon: "military_tech" },
  ];

  // Fetch live profiles from Apify Scraper API
  const fetchProfiles = async (
    searchQuery = keyword,
    loc = locationInput,
    limitVal = quantity,
    category = selectedCategory,
    urls: string[] = []
  ) => {
    setLoading(true);
    setSearchSuccessAlert("");

    try {
      const res = await fetch("/api/linkedin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: searchQuery,
          location: loc,
          quantity: limitVal,
          categoryFilter: category,
          profileUrls: urls.length > 0 ? urls : undefined,
        }),
      });

      const data = await res.json();
      if (data.profiles) {
        setProfiles(data.profiles);
        if (data.profiles.length > 0) {
          setSearchSuccessAlert(`Successfully extracted & categorized ${data.profiles.length} LinkedIn profile(s)!`);
        } else {
          setSearchSuccessAlert("No live profiles matched your criteria. Try adjusting role keyword or location.");
        }
      }
    } catch (err) {
      console.error("Error running Apify LinkedIn scraper:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfiles(keyword, locationInput, quantity, selectedCategory);
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    if (profiles.length > 0) {
      fetchProfiles(keyword, locationInput, quantity, catId);
    }
  };

  const handleRunApifyUrlScrape = async () => {
    if (!profileUrlInput.trim()) return;
    const urls = profileUrlInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    await fetchProfiles(keyword, locationInput, quantity, selectedCategory, urls);
    setProfileUrlInput("");
  };

  const handleSaveLead = (profileId: string) => {
    setSavedLeadIds((prev) => ({ ...prev, [profileId]: true }));
  };

  const handleExportExcel = () => {
    if (profiles.length === 0) return;

    const exportData = profiles.map((p) => ({
      "Full Name": p.fullName,
      Headline: p.headline,
      "Job Title": p.jobTitle,
      Company: p.currentCompany,
      Location: p.location,
      Categories: p.categories.join(", "),
      Email: p.email || "N/A",
      "LinkedIn URL": p.profileUrl,
      Summary: p.summary,
      Skills: p.skills.join(", "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LinkedIn Leads");
    XLSX.writeFile(workbook, `LeadFlow_LinkedIn_Leads_${Date.now()}.xlsx`);
  };

  return (
    <div className="space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-600 text-[11px] font-bold rounded-full uppercase tracking-wider">
              Apify Integration Active
            </span>
            <span className="text-xs text-on-surface-variant font-medium">• Live LinkedIn Scraper</span>
          </div>
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface mt-1">
            LinkedIn Profile Scraper
          </h2>
          <p className="text-body-lg text-on-surface-variant text-sm mt-1">
            Extract, filter by location, auto-categorize (Developers, AI, Sales, Executives), and export B2B leads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={profiles.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-all shadow-sm text-xs cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Export (.xlsx)
          </button>
        </div>
      </div>

      {/* Scraper Control & Filters Box */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-sm space-y-5">
        <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">tune</span>
          Live Extraction Controls & Location Filters
        </h3>

        {searchSuccessAlert && (
          <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <span className="material-symbols-outlined text-base">info</span>
            {searchSuccessAlert}
          </div>
        )}

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Role / Keyword Search */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant">Role / Keyword Search</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  search
                </span>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. AI Engineer, React Developer, Sales VP..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Target Location Filter</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  location_on
                </span>
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g. San Francisco, Austin, London..."
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Quantity Limit Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant">Max Quantity Limit</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
                  format_list_numbered
                </span>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value={5}>5 Leads</option>
                  <option value={10}>10 Leads</option>
                  <option value={25}>25 Leads</option>
                  <option value={50}>50 Leads</option>
                  <option value={100}>100 Leads</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-outline-variant/40">
            {/* Direct Profile URL input */}
            <div className="flex-1 flex gap-2 max-w-xl">
              <input
                type="text"
                value={profileUrlInput}
                onChange={(e) => setProfileUrlInput(e.target.value)}
                placeholder="Or paste direct LinkedIn profile URL (https://linkedin.com/in/...)"
                className="flex-1 bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={handleRunApifyUrlScrape}
                disabled={loading || !profileUrlInput.trim()}
                className="px-3 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-bold text-xs hover:bg-primary/10 hover:text-primary transition-all rounded-xl cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                Scrape URL
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-container transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">cloud_sync</span>
              {loading ? "Extracting Leads..." : "Run Apify Scraper"}
            </button>
          </div>
        </form>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategorySelect(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-on-surface-variant border border-outline-variant/60 hover:border-primary/40 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-base">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Profile Cards Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-outline-variant">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-on-surface animate-pulse">
            CONNECTING TO APIFY & EXTRACTING LINKEDIN PROFILES...
          </p>
          <p className="text-[11px] text-on-surface-variant font-mono">
            Targeting: {keyword || "Software Engineer"} | Location: {locationInput || "Global"} | Limit: {quantity} Leads
          </p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-outline-variant space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-2xl">person_search</span>
          </div>
          <h4 className="font-bold text-base text-on-surface">No Profiles Extracted Yet</h4>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
            Enter a role keyword (e.g. <i>"AI Engineer"</i>, <i>"React Developer"</i>), enter a target location, select maximum quantity limit, and click <b>"Run Apify Scraper"</b> to extract live leads.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((p) => {
            const isSaved = !!savedLeadIds[p.id];
            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-outline-variant/80 p-5 shadow-xs hover:shadow-lg hover:border-primary/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  
                  {/* Top Row: Avatar & Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.avatarUrl}
                        alt={p.fullName}
                        className="w-12 h-12 rounded-full border border-outline-variant object-cover shadow-xs"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">
                          {p.fullName}
                        </h4>
                        <p className="text-xs font-semibold text-primary">{p.currentCompany}</p>
                      </div>
                    </div>

                    <a
                      href={p.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open LinkedIn Profile"
                      className="p-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                    </a>
                  </div>

                  {/* Headline */}
                  <p className="text-xs font-semibold text-on-surface leading-snug line-clamp-2">
                    {p.headline}
                  </p>

                  {/* Auto-Category Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          cat === "AI & ML"
                            ? "bg-purple-100 text-purple-700"
                            : cat === "Developer"
                            ? "bg-blue-100 text-blue-700"
                            : cat === "Designer"
                            ? "bg-pink-100 text-pink-700"
                            : cat === "Sales"
                            ? "bg-emerald-100 text-emerald-700"
                            : cat === "Marketing"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Location & Email */}
                  <div className="space-y-1 text-[11px] text-on-surface-variant">
                    <p className="flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                      {p.location}
                    </p>
                    {p.email && (
                      <p className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <span className="material-symbols-outlined text-sm">mark_email_read</span>
                        {p.email}
                      </p>
                    )}
                  </div>

                  {/* Description / Summary */}
                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-3 bg-surface-container-low/50 p-2.5 rounded-xl border border-outline-variant/40">
                    {p.summary}
                  </p>

                  {/* Skills Pills */}
                  {p.skills.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-1">
                      {p.skills.slice(0, 4).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-surface-container-high text-on-surface-variant text-[10px] font-medium rounded-md"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Footer Save Action */}
                <div className="pt-3 border-t border-outline-variant/40 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-on-surface-variant font-mono uppercase">
                    ID: {p.id.slice(0, 8)}
                  </span>

                  <button
                    onClick={() => handleSaveLead(p.id)}
                    disabled={isSaved}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isSaved
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-primary text-white hover:bg-primary-container shadow-xs"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isSaved ? "check_circle" : "bookmark_add"}
                    </span>
                    {isSaved ? "Saved" : "Save Lead"}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
