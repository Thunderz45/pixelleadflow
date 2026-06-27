"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy
} from "firebase/firestore";
import * as XLSX from "xlsx";

interface ProjectOption {
  id: string;
  name: string;
}

interface ExportLog {
  id: string;
  projectName: string;
  format: string;
  recordsCount: number;
  timestamp: any;
}

export default function ExportsPage() {
  const { user } = useAuth();
  
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv" | "json">("xlsx");
  
  const [logs, setLogs] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Fetch projects
      const projSnap = await getDocs(query(collection(db, "projects"), where("userId", "==", user.uid)));
      const projList: ProjectOption[] = [];
      projSnap.forEach((doc) => {
        projList.push({ id: doc.id, name: doc.data().name });
      });
      setProjects(projList);
      if (projList.length > 0) {
        setSelectedProject(projList[0].id);
      }

      // Fetch export logs
      const logsQuery = query(
        collection(db, "exports"),
        where("userId", "==", user.uid),
        orderBy("timestamp", "desc")
      );
      const logsSnap = await getDocs(logsQuery);
      const logsList: ExportLog[] = [];
      logsSnap.forEach((doc) => {
        const data = doc.data();
        logsList.push({
          id: doc.id,
          projectName: data.projectName || "All Campaigns",
          format: data.format || "CSV",
          recordsCount: data.recordsCount || 0,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      setLogs(logsList);

    } catch (error) {
      console.error("Error loading exports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    setSuccessMsg("");

    try {
      // 1. Fetch businesses
      let bizQuery = query(collection(db, "businesses"), where("userId", "==", user.uid));
      if (selectedProject !== "all" && selectedProject !== "") {
        bizQuery = query(
          collection(db, "businesses"), 
          where("userId", "==", user.uid),
          where("projectId", "==", selectedProject)
        );
      }

      const snap = await getDocs(bizQuery);
      if (snap.empty) {
        alert("No leads found to export for the selected project.");
        setExporting(false);
        return;
      }

      const rows: any[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        rows.push({
          "Name": d.name || "",
          "Phone": d.phone || "",
          "Email": d.email || "",
          "Website": d.website || "",
          "Rating": d.rating || 0,
          "Reviews Count": d.reviewsCount || 0,
          "Address": d.address || "",
          "Scraped On": d.createdAt?.toDate()?.toLocaleDateString() || "",
        });
      });

      const selectedProjObj = projects.find(p => p.id === selectedProject);
      const projectLabel = selectedProject === "all" ? "All Campaigns" : (selectedProjObj?.name || "Uncategorized");
      const filename = `LeadFlow_${projectLabel.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;

      // 2. Convert and save
      if (exportFormat === "xlsx") {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else if (exportFormat === "csv") {
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (exportFormat === "json") {
        const jsonOutput = JSON.stringify(rows, null, 2);
        const blob = new Blob([jsonOutput], { type: "application/json;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // 3. Save export run document in Firestore
      await addDoc(collection(db, "exports"), {
        userId: user.uid,
        projectName: projectLabel,
        format: exportFormat.toUpperCase(),
        recordsCount: rows.length,
        timestamp: serverTimestamp(),
      });

      setSuccessMsg(`Successfully generated ${filename}.${exportFormat}!`);
      await loadData();
    } catch (error) {
      console.error("Export failure:", error);
      alert("An error occurred during file creation.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div>
        <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface">Exports</h2>
        <p className="text-body-lg text-sm text-on-surface-variant mt-2">
          Export lead campaigns to Excel worksheets, standard CSV format, or JSON datasets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Export Form config */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-outline-variant rounded-xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">tune</span>
              Configure File
            </h3>

            <div className="space-y-4">
              {/* Projects List select */}
              <div className="space-y-1 text-xs font-semibold">
                <label className="text-on-surface-variant block mb-1">Select Campaign Project</label>
                <div className="relative">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="all">All Campaigns (All Leads)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form formats */}
              <div className="space-y-2 text-xs font-semibold">
                <label className="text-on-surface-variant block mb-1">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setExportFormat("xlsx")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                      exportFormat === "xlsx" 
                        ? "bg-primary-container/10 text-primary border-primary" 
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined">table_view</span>
                    Excel
                  </button>

                  <button
                    onClick={() => setExportFormat("csv")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                      exportFormat === "csv" 
                        ? "bg-primary-container/10 text-primary border-primary" 
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined">description</span>
                    CSV
                  </button>

                  <button
                    onClick={() => setExportFormat("json")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold gap-1.5 transition-all cursor-pointer ${
                      exportFormat === "json" 
                        ? "bg-primary-container/10 text-primary border-primary" 
                        : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <span className="material-symbols-outlined">code</span>
                    JSON
                  </button>
                </div>
              </div>
            </div>

            {successMsg && (
              <div className="p-3 bg-green-50 text-green-700 border border-green-200 text-xs font-bold rounded-lg flex items-center gap-1.5 animate-fade-in">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{successMsg}</span>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-all text-xs cursor-pointer flex justify-center items-center gap-2"
            >
              {exporting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">file_download</span>
                  Download File
                </>
              )}
            </button>
          </div>
        </div>

        {/* Audit logs list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-outline-variant rounded-xl p-6 min-h-[350px] flex flex-col shadow-sm">
            <h3 className="text-sm font-bold text-on-surface border-b border-outline-variant pb-4 mb-4">Export Audit Log</h3>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 py-10">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-on-surface-variant text-xs">Loading audit logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-on-surface-variant italic">
                No exports have been generated yet.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low/50 border-b border-outline-variant text-on-surface-variant uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3">Campaign Project</th>
                      <th className="px-6 py-3">Format</th>
                      <th className="px-6 py-3">Row Count</th>
                      <th className="px-6 py-3">Generated Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="px-6 py-4 font-bold text-on-surface">{log.projectName}</td>
                        <td className="px-6 py-4">
                          <span className="bg-primary/5 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {log.format}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-on-surface-variant">{log.recordsCount} leads</td>
                        <td className="px-6 py-4 text-on-surface-variant">{log.timestamp.toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
