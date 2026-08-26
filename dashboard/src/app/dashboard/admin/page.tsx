"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp
} from "firebase/firestore";
import { useAuth } from "@/context/auth-context";

interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role?: string;
  tier?: string;
  websiteQuota?: number;
  leadsQuota?: number;
  subscriptionStatus?: string;
  createdAt?: any;
  lastLogin?: any;
}

export default function AdminDashboardPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTierFilter, setSelectedTierFilter] = useState("all");

  // Admin authorization check
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser || currentUser.email !== "admin@gmail.com") {
        router.push("/dashboard");
      }
    }
  }, [currentUser, authLoading, router]);
  
  // Notification Modal State
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifTarget, setNotifTarget] = useState<"all" | "pro" | "free" | "email">("all");
  const [targetEmail, setTargetEmail] = useState("");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [sendingNotif, setSendingNotif] = useState(false);
  const [alertSuccess, setAlertSuccess] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "users"));
      const userList: UserRecord[] = [];
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        userList.push({
          id: docSnap.id,
          email: data.email || "N/A",
          displayName: data.displayName || "LeadFlow User",
          photoURL: data.photoURL || "",
          role: data.role || "user",
          tier: data.tier || "free",
          websiteQuota: typeof data.websiteQuota === "number" ? data.websiteQuota : (data.tier === "pro" ? 5 : 0),
          leadsQuota: typeof data.leadsQuota === "number" ? data.leadsQuota : (data.tier === "pro" ? 100 : 10),
          subscriptionStatus: data.subscriptionStatus || "inactive",
          createdAt: data.createdAt?.toDate() || new Date(),
          lastLogin: data.lastLogin?.toDate() || new Date(),
        });
      });

      // Sort by last login / creation descending
      userList.sort((a, b) => b.lastLogin.getTime() - a.lastLogin.getTime());
      setUsers(userList);
    } catch (err) {
      console.error("Error loading users for admin panel:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleGrantSubscription = async (targetUser: UserRecord) => {
    try {
      // Create subscription invitation notification for user
      await addDoc(collection(db, "notifications"), {
        type: "subscription_invite",
        status: "pending",
        target: "email",
        targetEmail: targetUser.email,
        title: "🎁 Pro Subscription Gift Granted!",
        message: "Admin has gifted you a 1 Month Pro Subscription (100 Leads Scraping & 5 AI Website Generations / Mo). Please accept to activate your Pro tier!",
        sender: currentUser?.email || "LeadFlow Admin",
        createdAt: serverTimestamp(),
      });

      setAlertSuccess(`Sent Pro Subscription invitation to ${targetUser.email}! User can Accept or Reject on their notification bell.`);
      loadUsers();
    } catch (err) {
      console.error("Error sending subscription invitation:", err);
    }
  };

  const handleCancelSubscription = async (targetUser: UserRecord) => {
    try {
      const userRef = doc(db, "users", targetUser.id);
      await updateDoc(userRef, {
        tier: "free",
        websiteQuota: 0,
        leadsQuota: 10,
        subscriptionStatus: "cancelled",
        updatedAt: serverTimestamp(),
      });

      setAlertSuccess(`Cancelled Pro Subscription for ${targetUser.email}. Reverted to Free tier.`);
      loadUsers();
    } catch (err) {
      console.error("Error cancelling subscription:", err);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    setSendingNotif(true);
    try {
      await addDoc(collection(db, "notifications"), {
        target: notifTarget,
        targetEmail: notifTarget === "email" ? targetEmail.trim() : null,
        title: notifTitle.trim(),
        message: notifMessage.trim(),
        createdAt: serverTimestamp(),
        sender: currentUser?.email || "LeadFlow Admin",
      });

      setAlertSuccess(`Broadcast notification "${notifTitle}" successfully sent!`);
      setIsNotifModalOpen(false);
      setNotifTitle("");
      setNotifMessage("");
      setTargetEmail("");
    } catch (err) {
      console.error("Error sending notification:", err);
    } finally {
      setSendingNotif(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTier =
      selectedTierFilter === "all" ||
      (selectedTierFilter === "pro" && u.tier === "pro") ||
      (selectedTierFilter === "free" && u.tier !== "pro");

    return matchesSearch && matchesTier;
  });

  const proSubscribersCount = users.filter((u) => u.tier === "pro").length;
  const freeUsersCount = users.length - proSubscribersCount;

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-rose-500/10 text-rose-600 text-[11px] font-bold rounded-full uppercase tracking-wider">
              System Admin Workspace
            </span>
            <span className="text-xs text-on-surface-variant font-medium">• LeadFlow Agent Panel</span>
          </div>
          <h2 className="font-headline-lg text-3xl font-extrabold text-on-surface mt-1">
            Admin Management Dashboard
          </h2>
          <p className="text-body-lg text-on-surface-variant text-sm mt-1">
            Manage registered users, inspect login details, grant/cancel Pro subscriptions, and broadcast notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNotifModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-md hover:bg-primary-container transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">campaign</span>
            Send Broadcast Notification
          </button>
        </div>
      </div>

      {alertSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            <span>{alertSuccess}</span>
          </div>
          <button onClick={() => setAlertSuccess("")} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-outline-variant/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <span className="material-symbols-outlined text-primary text-xl">group</span>
          </div>
          <p className="text-3xl font-extrabold text-on-surface">{users.length}</p>
          <p className="text-[11px] text-on-surface-variant font-medium">Registered account accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-bold uppercase tracking-wider">Pro Subscribers</span>
            <span className="material-symbols-outlined text-amber-500 text-xl">verified</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">{proSubscribersCount}</p>
          <p className="text-[11px] text-on-surface-variant font-medium">Active ₹999/mo subscriptions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-bold uppercase tracking-wider">Free Tier Users</span>
            <span className="material-symbols-outlined text-slate-500 text-xl">person_outline</span>
          </div>
          <p className="text-3xl font-extrabold text-on-surface">{freeUsersCount}</p>
          <p className="text-[11px] text-on-surface-variant font-medium">Standard trial accounts</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-outline-variant/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-xs font-bold uppercase tracking-wider">Est. Monthly Revenue</span>
            <span className="material-symbols-outlined text-emerald-600 text-xl">payments</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">₹{proSubscribersCount * 999}</p>
          <p className="text-[11px] text-on-surface-variant font-medium">Recurring Pro monthly ARR</p>
        </div>
      </div>

      {/* User Controls & Table Container */}
      <div className="bg-white rounded-2xl border border-outline-variant shadow-xs overflow-hidden space-y-4 p-6">
        
        {/* Table Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, or UID..."
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant whitespace-nowrap">Filter Tier:</span>
            <select
              value={selectedTierFilter}
              onChange={(e) => setSelectedTierFilter(e.target.value)}
              className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Users ({users.length})</option>
              <option value="pro">PRO Subscribers ({proSubscribersCount})</option>
              <option value="free">Free Users ({freeUsersCount})</option>
            </select>
          </div>
        </div>

        {/* Users List Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-on-surface-variant animate-pulse">
                LOADING USER DATABASE...
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant text-xs font-semibold">
              No users matched your search filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant uppercase text-[10px] font-extrabold tracking-wider border-y border-outline-variant">
                <tr>
                  <th className="p-3.5">User Info</th>
                  <th className="p-3.5">Login / Created</th>
                  <th className="p-3.5">Subscription Tier</th>
                  <th className="p-3.5">Active Quotas</th>
                  <th className="p-3.5 text-center">Subscription Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {filteredUsers.map((u) => {
                  const isPro = u.tier === "pro";
                  return (
                    <tr key={u.id} className="hover:bg-surface-container-low/60 transition-colors">
                      
                      {/* User Info */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-9 h-9 rounded-full border border-outline-variant object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                              {u.displayName[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-on-surface text-xs">{u.displayName}</p>
                              {isPro && (
                                <span className="material-symbols-outlined text-amber-500 text-sm" title="Pro Subscriber">
                                  verified
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-on-surface-variant font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Login / Created */}
                      <td className="p-3.5 text-on-surface-variant text-[11px] space-y-0.5">
                        <p className="font-medium text-on-surface">
                          Last Login: {u.lastLogin.toLocaleDateString()} {u.lastLogin.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <p className="text-[10px] text-outline">
                          Registered: {u.createdAt.toLocaleDateString()}
                        </p>
                      </td>

                      {/* Subscription Tier */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                            isPro
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isPro ? "auto_awesome" : "person"}
                          </span>
                          {isPro ? "PRO Subscriber" : "Free Tier"}
                        </span>
                      </td>

                      {/* Active Quotas */}
                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-primary">Leads Scraping:</span>
                          <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.2 rounded font-bold">
                            {u.leadsQuota}/mo
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="font-bold text-secondary">AI Websites:</span>
                          <span className="font-mono bg-secondary/10 text-secondary px-1.5 py-0.2 rounded font-bold">
                            {u.websiteQuota}/mo
                          </span>
                        </div>
                      </td>

                      {/* Subscription Controls */}
                      <td className="p-3.5 text-center">
                        {isPro ? (
                          <button
                            onClick={() => handleCancelSubscription(u)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel Subscription
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGrantSubscription(u)}
                            className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer"
                          >
                            Grant PRO (100 Leads & 5 Websites)
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Broadcast Notification Modal */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md border border-outline-variant shadow-2xl overflow-hidden relative">
            
            <div className="p-5 bg-gradient-to-r from-primary via-primary-container to-secondary text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">campaign</span>
                <h3 className="font-bold text-base">Send Notification</h3>
              </div>
              <button
                onClick={() => setIsNotifModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="p-6 space-y-4">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Target Recipients</label>
                <select
                  value={notifTarget}
                  onChange={(e: any) => setNotifTarget(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Users ({users.length})</option>
                  <option value="pro">Pro Subscribers Only ({proSubscribersCount})</option>
                  <option value="free">Free Users Only ({freeUsersCount})</option>
                  <option value="email">Specific User Email</option>
                </select>
              </div>

              {notifTarget === "email" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface-variant">Target User Email</label>
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="user@company.com"
                    required
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Notification Title</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="e.g. New LeadFlow Pro Features Available!"
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface-variant">Notification Message</label>
                <textarea
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Write message broadcast..."
                  rows={3}
                  required
                  className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="px-4 py-2 border border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer disabled:opacity-50"
                >
                  {sendingNotif ? "Sending..." : "Send Broadcast"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
