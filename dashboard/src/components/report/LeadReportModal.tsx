"use client";

import React, { useState } from "react";

export interface ReportData {
  businessName: string;
  overallScore: number;
  mapsAuditScore: number;
  websiteAuditScore: number;
  growthPotentialScore: number;
  page1: {
    title: string;
    summary: string;
    sections: { heading: string; content: string }[];
  };
  page2: {
    title: string;
    summary: string;
    sections: { heading: string; content: string }[];
  };
  page3: {
    title: string;
    summary: string;
    sections: { heading: string; content: string }[];
  };
}

interface LeadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportData | null;
  businessName: string;
}

export default function LeadReportModal({
  isOpen,
  onClose,
  report,
  businessName,
}: LeadReportModalProps) {
  const [activeTab, setActiveTab] = useState<"page1" | "page2" | "page3">("page1");
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopyReport = () => {
    const fullText = `=== LEADFLOW 3-PAGE BUSINESS AUDIT REPORT ===
Business Name: ${report.businessName}
Overall Score: ${report.overallScore}/100
Google Maps Score: ${report.mapsAuditScore}/100
Website Score: ${report.websiteAuditScore}/100
Growth Potential: ${report.growthPotentialScore}/100

--- ${report.page1.title} ---
${report.page1.summary}
${report.page1.sections.map((s) => `\n${s.heading}\n${s.content}`).join("\n")}

--- ${report.page2.title} ---
${report.page2.summary}
${report.page2.sections.map((s) => `\n${s.heading}\n${s.content}`).join("\n")}

--- ${report.page3.title} ---
${report.page3.summary}
${report.page3.sections.map((s) => `\n${s.heading}\n${s.content}`).join("\n")}
`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const activePageData = report[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] border border-outline-variant shadow-2xl flex flex-col overflow-hidden relative print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-primary-container/80 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-xl text-primary-container">
              📊
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-primary/20 text-primary-container rounded-full border border-primary/30">
                  LeadFlow AI Audit Report
                </span>
                <span className="text-xs text-slate-400 font-medium">• 3-Page Deep Analysis</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mt-0.5 truncate max-w-md">
                {report.businessName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              {copied ? "Copied!" : "Copy Report"}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              Print / Save PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* Audit Score Summary Bar */}
        <div className="p-4 bg-slate-50 border-b border-outline-variant/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center print:bg-white">
          <div className="bg-white p-3 rounded-2xl border border-outline-variant/60 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Overall Health</span>
            <p className="text-2xl font-extrabold text-primary mt-0.5">{report.overallScore}/100</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-outline-variant/60 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Google Maps Rank</span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-0.5">{report.mapsAuditScore}/100</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-outline-variant/60 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Website Infrastructure</span>
            <p className="text-2xl font-extrabold text-amber-600 mt-0.5">{report.websiteAuditScore}/100</p>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-outline-variant/60 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Growth Opportunity</span>
            <p className="text-2xl font-extrabold text-secondary mt-0.5">{report.growthPotentialScore}%</p>
          </div>
        </div>

        {/* 3-Page Tab Bar Navigation */}
        <div className="px-6 pt-3 bg-white border-b border-outline-variant/60 flex items-center gap-2 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab("page1")}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "page1"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">map</span>
            Page 1: Google Maps & Local SEO
          </button>

          <button
            onClick={() => setActiveTab("page2")}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "page2"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">language</span>
            Page 2: Digital Presence & Competitors
          </button>

          <button
            onClick={() => setActiveTab("page3")}
            className={`pb-3 px-4 text-xs font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "page3"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-base">trending_up</span>
            Page 3: Growth Roadmap & Pitch Script
          </button>
        </div>

        {/* Page Report Body Content */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6 text-on-surface bg-surface-container-low/40">
          
          <div className="bg-white p-6 rounded-2xl border border-outline-variant/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <h4 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">analytics</span>
                {activePageData.title}
              </h4>
              <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">
                Audit Report Page {activeTab === "page1" ? "1 of 3" : activeTab === "page2" ? "2 of 3" : "3 of 3"}
              </span>
            </div>

            <p className="text-xs text-on-surface-variant font-medium leading-relaxed bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
              {activePageData.summary}
            </p>

            <div className="space-y-6 pt-2">
              {activePageData.sections.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h5 className="text-sm font-bold text-primary flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    {sec.heading}
                  </h5>
                  <div className="pl-8 text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-sans bg-slate-50/60 p-3.5 rounded-xl border border-slate-200/60">
                    {sec.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-outline-variant flex justify-between items-center text-xs print:hidden">
          <span className="text-on-surface-variant font-medium">LeadFlow B2B Client Acquisition Engine</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
