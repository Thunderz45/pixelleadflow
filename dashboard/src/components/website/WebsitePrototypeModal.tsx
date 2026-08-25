"use client";

import React, { useState } from "react";

interface WebsitePrototypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
  businessName: string;
  onSaveToLead?: (prototypeUrl: string) => void;
}

export default function WebsitePrototypeModal({
  isOpen,
  onClose,
  htmlContent,
  businessName,
  onSaveToLead,
}: WebsitePrototypeModalProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen || !htmlContent) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessName.replace(/[^a-z0-9]/gi, "_")}_prototype.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToLeadClick = () => {
    if (onSaveToLead) {
      onSaveToLead(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      setSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] border border-outline-variant shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-xl">auto_awesome</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{businessName}</h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  AI Prototype
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Generated single-page website landing page</p>
            </div>
          </div>

          {/* Controls & Mode Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => setViewMode("desktop")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === "desktop" ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">desktop_windows</span>
                Desktop
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                  viewMode === "mobile" ? "bg-primary text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="material-symbols-outlined text-sm">smartphone</span>
                Mobile
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">{copied ? "done" : "content_copy"}</span>
              {copied ? "Copied!" : "Copy HTML"}
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download .html
            </button>

            {onSaveToLead && (
              <button
                onClick={handleSaveToLeadClick}
                disabled={saved}
                className="px-3 py-1.5 bg-primary hover:bg-primary-container text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-sm">{saved ? "check_circle" : "bookmark"}</span>
                {saved ? "Saved" : "Save to Lead"}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

          </div>
        </div>

        {/* Live Iframe Viewport Container */}
        <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-300 rounded-xl overflow-hidden bg-white shadow-2xl border border-slate-800 ${
              viewMode === "desktop" ? "w-full" : "w-[375px] max-h-[667px] border-8 border-slate-800 rounded-3xl"
            }`}
          >
            <iframe
              srcDoc={htmlContent}
              title={`${businessName} Prototype`}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
