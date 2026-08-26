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
  updateDoc,
  setDoc,
  getDoc,
  doc, 
  orderBy
} from "firebase/firestore";
import WebsitePrototypeModal from "@/components/website/WebsitePrototypeModal";
import PricingModal from "@/components/subscription/PricingModal";

interface Lead {
  id: string;
  name: string;
  phone: string;
  website: string;
  email: string;
  address: string;
  rating: number;
  reviewsCount: number;
  projectId: string;
  projectName?: string;
  createdAt: any;
  mapsUrl?: string;
}

interface ProjectFilter {
  id: string;
  name: string;
}

export default function SavedBusinessesPage() {
  const { user } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<ProjectFilter[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Search
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(12);

  // Subscription & Quota state
  const [userTier, setUserTier] = useState<string>("free");
  const [websiteQuota, setWebsiteQuota] = useState<number>(0);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // AI Website Generator state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<{
    isOpen: boolean;
    html: string;
    businessName: string;
    leadId: string;
  } | null>(null);

  const handleGenerateWebsite = async (lead: Lead) => {
    // Check if user has quota
    if (websiteQuota <= 0) {
      setIsPricingModalOpen(true);
      return;
    }

    setGeneratingId(lead.id);
    try {
      const res = await fetch("/api/website/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          category: lead.projectName || "Local Business",
          address: lead.address,
          phone: lead.phone,
          rating: lead.rating,
          reviewsCount: lead.reviewsCount,
        }),
      });

      const data = await res.json();
      if (data.html) {
        setActiveModal({
          isOpen: true,
          html: data.html,
          businessName: lead.name,
          leadId: lead.id,
        });

        // Decrement quota in Firestore and state
        if (user) {
          const newQ = Math.max(0, websiteQuota - 1);
          setWebsiteQuota(newQ);
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { websiteQuota: newQ }).catch(() => {});
        }
      } else {
        alert(data.error || "Failed to generate website prototype.");
      }
    } catch (err) {
      console.error("Error generating website prototype:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleSubscriptionSuccess = async (newQuota: number) => {
    setUserTier("pro");
    setWebsiteQuota(newQuota);
    if (user) {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        tier: "pro",
        websiteQuota: newQuota,
        subscriptionStatus: "active",
        updatedAt: new Date(),
      }, { merge: true }).catch(() => {});
    }
  };

  const handleSavePrototypeToLead = async () => {
    if (!activeModal?.leadId) return;
    try {
      const docRef = doc(db, "businesses", activeModal.leadId);
      await updateDoc(docRef, {
        website: "AI Prototype Created",
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === activeModal.leadId ? { ...l, website: "AI Prototype Created" } : l
        )
      );
    } catch (err) {
      console.error("Error updating lead website prototype:", err);
    }
  };

  const loadFilterData = async () => {
    if (!user) return;
    try {
      setLoading(true);

      // Load user profile & subscription tier
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          const t = uData.tier || "free";
          setUserTier(t);
          setWebsiteQuota(typeof uData.websiteQuota === "number" ? uData.websiteQuota : (t === "pro" ? 5 : 0));
        }
      } catch (uErr) {
        console.error("User profile load error:", uErr);
      }
      // Load projects for project drop-down
      const projSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", user.uid)));
      const projList: ProjectFilter[] = [];
      projSnap.forEach((doc) => {
        projList.push({ id: doc.id, name: doc.data().name });
      });
      setProjects(projList);

      // Load leads (without orderBy to bypass composite index requirement)
      const q = query(
        collection(db, "businesses"), 
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const list: Lead[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const matchingProj = projList.find(p => p.id === data.projectId);
        list.push({
          id: doc.id,
          name: data.name || "",
          phone: data.phone || "N/A",
          website: data.website || "",
          email: data.email || "N/A",
          address: data.address || "N/A",
          rating: data.rating || 0,
          reviewsCount: data.reviewsCount || 0,
          projectId: matchingProj ? (data.projectId || "") : "",
          projectName: matchingProj ? matchingProj.name : "Uncategorized",
          createdAt: data.createdAt?.toDate() || new Date(),
          mapsUrl: data.mapsUrl || "",
        });
      });
      // Sort in-memory by createdAt descending
      list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setLeads(list);
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterData();
  }, [user]);

  // Read URL search parameter for direct redirect campaign filtering
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const proj = params.get("project");
      if (proj) {
        setSelectedProject(proj);
      }
    }
  }, []);

  const handleDeleteLead = async (id: string) => {
    if (!confirm("Remove this lead from your campaign list?")) return;
    try {
      await deleteDoc(doc(db, "businesses", id));
      setLeads(leads.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;
    const headers = ["Name", "Phone", "Email", "Website", "Rating", "Reviews", "Address", "Campaign"];
    const rows = filteredLeads.map(l => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email}"`,
      `"${l.website}"`,
      l.rating,
      l.reviewsCount,
      `"${l.address.replace(/"/g, '""')}"`,
      `"${l.projectName}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `LeadFlow_Saved_Leads_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesProject = selectedProject === "all" || lead.projectId === selectedProject;
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      lead.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProject && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-primary font-bold uppercase tracking-widest text-[11px] mb-1">
            <span className="material-symbols-outlined text-sm">bookmark</span>
            Inventory
          </div>
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface">Saved Businesses</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage and organize your leads from the global business directory.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className="bg-white border border-outline-variant text-on-surface font-semibold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-surface-container transition-colors text-xs cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Bento Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-primary bg-surface shadow-sm">
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1 font-bold">Total Leads</p>
          <h3 className="text-xl font-bold text-on-surface">{filteredLeads.length}</h3>
          <div className="flex items-center gap-0.5 text-primary text-[11px] mt-1 font-semibold">
            <span className="material-symbols-outlined text-sm">trending_up</span>
            <span>Live Sync Active</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-secondary bg-surface shadow-sm">
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1 font-bold">Top Campaign</p>
          <h3 className="text-xl font-bold text-on-surface">
            {projects.length > 0 ? projects[0].name : "None"}
          </h3>
          <p className="text-[11px] text-on-surface-variant mt-1 font-semibold">Active target list</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-tertiary bg-surface shadow-sm">
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1 font-bold">Average Rating</p>
          <div className="flex items-center gap-1">
            <h3 className="text-xl font-bold text-on-surface">
              {(filteredLeads.reduce((acc, l) => acc + l.rating, 0) / (filteredLeads.length || 1)).toFixed(1)}
            </h3>
            <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              star
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1 font-semibold">Quality leads review</p>
        </div>

        <div className="glass-panel p-5 rounded-xl border-l-4 border-l-green-600 bg-green-50/10 shadow-sm">
          <p className="text-[10px] text-outline uppercase tracking-wider mb-1 font-bold">Campaign Status</p>
          <h3 className="text-xl font-bold text-green-700">Healthy</h3>
          <p className="text-[11px] text-on-surface-variant mt-1 font-semibold">No failed scrape tasks</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-surface">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <div className="flex items-center gap-2 text-on-surface-variant text-xs">
            <span className="text-label-md">
              Showing <span className="font-bold text-on-surface">{Math.min(rowsPerPage, filteredLeads.length)}</span> of {filteredLeads.length} results
            </span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                className="pl-9 pr-4 py-1.5 border border-outline-variant rounded-lg text-xs w-full sm:w-64 focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Filter by name..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Campaign Selector */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="py-1.5 px-3 border border-outline-variant rounded-lg text-xs outline-none bg-white cursor-pointer"
            >
              <option value="all">All Projects</option>
              <option value="">Uncategorized</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Contents */}
        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-xs text-on-surface-variant italic">
              No businesses found under search criteria.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase tracking-wider font-semibold">
                <tr className="border-b border-outline-variant">
                  <th className="p-4">Business Name</th>
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Website</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant bg-white">
                {filteredLeads.slice(0, rowsPerPage).map((lead) => (
                  <tr key={lead.id} className="hover:bg-surface-container-low transition-colors group">
                    
                    {/* Name & Address */}
                    <td className="p-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                          {lead.name[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-on-surface truncate">{lead.name}</p>
                            <a
                              href={lead.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + " " + lead.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-secondary flex items-center shrink-0"
                              title="Open in Google Maps"
                            >
                              <span className="material-symbols-outlined text-[15px]">location_on</span>
                            </a>
                          </div>
                          <p className="text-[10px] text-on-surface-variant truncate">{lead.address}</p>
                        </div>
                      </div>
                    </td>

                    {/* Campaign Folder */}
                    <td className="p-4">
                      <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                        {lead.projectName}
                      </span>
                    </td>

                    {/* Phone */}
                    <td className="p-4 text-on-surface-variant font-medium">
                      {lead.phone}
                    </td>

                    {/* Website Column */}
                    <td className="p-4">
                      {lead.website && lead.website !== "N/A" && lead.website !== "" ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={lead.website.startsWith("data:") ? "#" : lead.website}
                            target={lead.website.startsWith("data:") ? "_self" : "_blank"}
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-0.5 font-semibold text-xs truncate max-w-[100px]"
                          >
                            {lead.website.startsWith("data:") ? "AI Prototype" : "Website"}
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                          <button
                            onClick={() => handleGenerateWebsite(lead)}
                            disabled={generatingId === lead.id}
                            title="Generate AI Prototype Landing Page"
                            className="p-1 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-[10px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                          >
                            <span className="material-symbols-outlined text-[12px]">auto_awesome</span>
                          </button>
                        </div>
                      ) : websiteQuota <= 0 ? (
                        <button
                          onClick={() => setIsPricingModalOpen(true)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          Unlock 5 Websites (Pro)
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGenerateWebsite(lead)}
                          disabled={generatingId === lead.id}
                          className="px-2.5 py-1 bg-gradient-to-r from-primary via-primary-container to-secondary text-white rounded-lg text-[11px] font-bold shadow-xs hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {generatingId === lead.id ? "sync" : "auto_awesome"}
                          </span>
                          {generatingId === lead.id ? "Generating..." : `Generate Website (${websiteQuota}/5)`}
                        </button>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <span 
                          className="material-symbols-outlined text-tertiary text-[18px]" 
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="font-bold text-on-surface">{lead.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-on-surface-variant">({lead.reviewsCount})</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteLead(lead.id)}
                        className="p-1 hover:bg-surface-container-high rounded text-error cursor-pointer"
                        title="Delete Lead"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer selector pagination */}
        <div className="p-4 border-t border-outline-variant bg-surface-container-low flex justify-between items-center text-xs text-on-surface-variant font-semibold">
          <span>Database Sync Stable</span>
          <div className="flex items-center gap-2">
            <span>Rows display:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(parseInt(e.target.value) || 12)}
              className="bg-transparent border-none font-bold focus:ring-0 cursor-pointer text-on-surface"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

      </div>

      {/* AI Website Prototype Preview Modal */}
      {activeModal && (
        <WebsitePrototypeModal
          isOpen={activeModal.isOpen}
          onClose={() => setActiveModal(null)}
          htmlContent={activeModal.html}
          businessName={activeModal.businessName}
          onSaveToLead={handleSavePrototypeToLead}
        />
      )}

      {/* Razorpay Subscription Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        userId={user?.uid}
        userEmail={user?.email || ""}
        onSuccess={handleSubscriptionSuccess}
      />

    </div>
  );
}
