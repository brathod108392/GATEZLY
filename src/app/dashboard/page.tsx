"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ShieldCheck,
  Users,
  Building2,
  QrCode,
  Bell,
  Search,
  Clock,
  UserPlus,
  Car,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Lock,
  Activity,
  LogOut,
  ShieldAlert,
  UserCheck
} from "lucide-react";

interface VisitorLog {
  id: string;
  name: string;
  role: string;
  company: string;
  gate: string;
  time: string;
  status: "Inside" | "Approved" | "Departed" | "Flagged";
  avatar: string;
}

const initialLogs: VisitorLog[] = [
  {
    id: "VP-8492",
    name: "Alex Rivera",
    role: "Senior Consultant",
    company: "Apex Tech Corp",
    gate: "Gate 01 (North)",
    time: "10:42 AM",
    status: "Inside",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "VP-8491",
    name: "Elena Rostova",
    role: "Logistics Lead",
    company: "Global Express",
    gate: "Gate 03 (Freight)",
    time: "10:35 AM",
    status: "Approved",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "VP-8488",
    name: "Marcus Vance",
    role: "Audit Specialist",
    company: "FinServ Global",
    gate: "Gate 02 (South)",
    time: "09:50 AM",
    status: "Inside",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "VP-8485",
    name: "Sofia Chen",
    role: "Vendor Specialist",
    company: "Nexus Supply",
    gate: "Gate 01 (North)",
    time: "09:15 AM",
    status: "Departed",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "VP-8480",
    name: "Dmitri Volkov",
    role: "Maintenance Technician",
    company: "HVAC Solutions",
    gate: "Gate 04 (Service)",
    time: "08:45 AM",
    status: "Flagged",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
  }
];

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [showPassModal, setShowPassModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState("");
  const [passGenerated, setPassGenerated] = useState(false);

  // Fetch logged-in user profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userEmail = session.user.email || "";
        const userMetaName = session.user.user_metadata?.full_name || "Authorized Officer";
        const userMetaRole = session.user.user_metadata?.role || "committee";

        // Query profiles table
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setProfile({
            id: profileData.id,
            email: profileData.email || userEmail,
            full_name: profileData.full_name || userMetaName,
            role: profileData.role || userMetaRole,
            updated_at: profileData.updated_at || new Date().toISOString(),
          });
        } else {
          setProfile({
            id: session.user.id,
            email: userEmail,
            full_name: userMetaName,
            role: userMetaRole,
            updated_at: new Date().toISOString(),
          });
        }
      }
    };

    fetchProfile();
  }, []);

  // Handle Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const filteredLogs = initialLogs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "All" || log.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient background glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-[#0d1322] rounded-[11px] flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  GATEZLY
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
                  SECURE DASHBOARD
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Protected Security & Access Command
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Live System Status Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Gate Security Online</span>
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-[#090d16]" />
            </button>

            {/* Authenticated Profile Badge & Logout */}
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>{profile?.full_name || "Officer"}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold border ${
                      profile?.role === "admin"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                    }`}
                  >
                    {profile?.role || "committee"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">{profile?.email || "Authenticated"}</div>
              </div>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition cursor-pointer flex items-center space-x-1.5 text-xs font-semibold"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* User Profile Banner */}
        <div className="rounded-2xl glass-panel-glow p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xl text-indigo-300">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold text-white">
                  Welcome back, {profile?.full_name || "Officer"}
                </h1>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    profile?.role === "admin"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  }`}
                >
                  {profile?.role === "admin" ? "System Admin" : "Committee Member"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center space-x-3">
                <span>Email: <strong className="text-slate-200">{profile?.email}</strong></span>
                <span>&bull;</span>
                <span>Last Profile Update: <strong className="text-slate-300">{profile?.updated_at ? new Date(profile.updated_at).toLocaleTimeString() : "Just now"}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPassModal(true)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium text-xs shadow-lg shadow-indigo-500/25 hover:opacity-95 transition cursor-pointer"
            >
              <QrCode className="h-4 w-4" />
              <span>Issue Visitor Pass</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-panel rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Visitors On-Site</span>
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">142</span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3 mr-1" /> +12%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Active checked-in badges today</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gate Clearance</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">856</span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-3 w-3 mr-1" /> +8%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Scanned entry & exit passes</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pre-Approvals</span>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">28</span>
              <span className="text-xs text-slate-400">Scheduled Today</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">18 expected next 2 hours</p>
          </div>

          <div className="glass-panel rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Gate Checkpoints</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">6 / 6</span>
              <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                100% Operational
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">ANPR cameras synced</p>
          </div>
        </div>

        {/* Live Visitor Feed & Gate Activity Table */}
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <span>Real-Time Visitor Access Logs</span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredLogs.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Live stream of scanned entry passes, visitor check-ins, and security clearances.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, company, pass ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>

              <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-xs">
                {["All", "Inside", "Approved", "Flagged"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      filterStatus === status
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Visitor Details</th>
                  <th className="pb-3 px-3">Pass ID</th>
                  <th className="pb-3 px-3">Gate Point</th>
                  <th className="pb-3 px-3">Scan Time</th>
                  <th className="pb-3 px-3">Access Status</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition text-xs">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={log.avatar}
                          alt={log.name}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-slate-100">{log.name}</div>
                          <div className="text-[11px] text-slate-400">
                            {log.role} &bull; <span className="text-indigo-400">{log.company}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium text-slate-300">{log.id}</td>
                    <td className="py-3.5 px-3 text-slate-300">{log.gate}</td>
                    <td className="py-3.5 px-3 text-slate-400">{log.time}</td>
                    <td className="py-3.5 px-3">
                      {log.status === "Inside" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                          On-Site
                        </span>
                      )}
                      {log.status === "Approved" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Approved
                        </span>
                      )}
                      {log.status === "Departed" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                          Departed
                        </span>
                      )}
                      {log.status === "Flagged" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Flagged
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Pass Generator Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel-glow max-w-md w-full rounded-2xl p-6 relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <QrCode className="h-5 w-5 text-indigo-400" />
                <h3 className="font-bold text-lg text-white">Generate Fast Pass</h3>
              </div>
              <button
                onClick={() => {
                  setShowPassModal(false);
                  setPassGenerated(false);
                }}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                &times;
              </button>
            </div>

            {!passGenerated ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Visitor Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={newVisitorName}
                    onChange={(e) => setNewVisitorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Gate Entrance
                  </label>
                  <select className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500">
                    <option>Gate 01 (North Main)</option>
                    <option>Gate 02 (South Executive)</option>
                    <option>Gate 03 (Logistics)</option>
                  </select>
                </div>
                <button
                  onClick={() => setPassGenerated(true)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  Generate Digital Pass QR
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-2">
                <div className="inline-flex p-4 rounded-2xl bg-white text-slate-900 shadow-xl shadow-indigo-500/20">
                  <QrCode className="h-32 w-32" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {newVisitorName || "Sarah Connor"}
                  </div>
                  <div className="text-xs text-indigo-400 font-mono mt-0.5">PASS ID: GP-99214</div>
                  <div className="text-[11px] text-slate-400 mt-1">Valid for Gate 01 - Expires in 12 Hours</div>
                </div>
                <button
                  onClick={() => {
                    setShowPassModal(false);
                    setPassGenerated(false);
                  }}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
