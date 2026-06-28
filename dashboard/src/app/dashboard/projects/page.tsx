"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  orderBy
} from "firebase/firestore";

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: any;
  leadsCount: number;
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const q = query(
        collection(db, "projects"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const list: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          name: data.name || "",
          description: data.description || "",
          createdAt: data.createdAt?.toDate() || new Date(),
          leadsCount: data.leadsCount || 0,
        });
      });
      setProjects(list);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !user) return;

    try {
      setSaving(true);
      await addDoc(collection(db, "projects"), {
        name: projectName.trim(),
        description: projectDescription.trim(),
        userId: user.uid,
        createdAt: serverTimestamp(),
        leadsCount: 0,
      });
      setProjectName("");
      setProjectDescription("");
      setModalOpen(false);
      await fetchProjects();
    } catch (error) {
      console.error("Error creating project:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign project? leads will be preserved.")) return;
    try {
      await deleteDoc(doc(db, "projects", id));
      setProjects(projects.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface">Projects</h2>
          <p className="text-body-lg text-sm text-on-surface-variant mt-2">
            Manage and monitor your lead generation campaigns.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg font-semibold hover:opacity-95 transition-all text-xs cursor-pointer shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Project
          </button>
        </div>
      </div>

      {/* Grid of Projects */}
      {loading ? (
        <div className="min-h-[250px] flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant text-xs">Loading campaign folders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="project-card bg-surface border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between h-64 hover:border-primary/40 group relative"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <span className="material-symbols-outlined">folder</span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-green-50 text-green-700 rounded-full">
                    ACTIVE
                  </span>
                </div>
                <h3 className="font-semibold text-base text-on-surface group-hover:text-primary transition-colors truncate">
                  {project.name}
                </h3>
                <div className="flex items-center gap-2 mt-2 text-on-surface-variant text-xs font-medium">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  <span>{project.leadsCount} Businesses</span>
                </div>
                <p className="text-xs text-on-surface-variant line-clamp-2 mt-3 leading-relaxed">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/30 text-xs font-semibold">
                  <span className="text-on-surface-variant">Created {project.createdAt.toLocaleDateString()}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-error hover:text-red-700 text-xs cursor-pointer"
                    >
                      Delete
                    </button>
                    <span className="text-outline-variant">|</span>
                    <Link href={`/dashboard/saved?project=${project.id}`} className="text-primary hover:underline">
                      Leads
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Create project empty card */}
          <div
            onClick={() => setModalOpen(true)}
            className="bg-surface-container-low border-2 border-dashed border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center h-64 hover:border-primary hover:bg-surface transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-on-surface-variant group-hover:text-primary group-hover:scale-110 transition-transform mb-4">
              <span className="material-symbols-outlined text-[32px]">add</span>
            </div>
            <p className="font-semibold text-sm text-on-surface-variant group-hover:text-primary">
              Start New Project
            </p>
            <p className="text-xs text-on-surface-variant opacity-60 text-center px-4 mt-1">
              Configure a new automated outreach campaign.
            </p>
          </div>
        </div>
      )}

      {/* Creation Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          
          <div className="bg-white rounded-2xl shadow-2xl border border-outline-variant p-6 w-full max-w-md relative z-10 animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant">
              <h3 className="text-base font-bold text-on-surface">Create New Project</h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boston Web Agencies"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-on-surface-variant">Description</label>
                <textarea
                  placeholder="Describe targets or campaign goals..."
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold shadow-md shadow-primary/20 hover:opacity-95 transition-all text-xs cursor-pointer flex justify-center items-center"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Create Project Campaign"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
