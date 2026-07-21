"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Building2,
  UserCheck,
  MessageSquareWarning,
  Wrench,
  Megaphone,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Settings,
  Activity,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function DashboardOverviewPage() {
  const [profile, setProfile] = useState<{ full_name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile({
          full_name: data?.full_name || session.user.user_metadata?.full_name || "Authorized User",
          email: data?.email || session.user.email || "",
          role: data?.role || session.user.user_metadata?.role || "committee",
        });
      }
    };
    fetchProfile();
  }, []);

  const sections = [
    { title: "Residents", count: "348 Active", desc: "Registered society residents & owner directory", href: "/dashboard/residents", icon: Users, color: "bg-blue-600", lightBg: "bg-blue-50 text-blue-600 border-blue-200" },
    { title: "Flats", count: "120 Units", desc: "Occupied, vacant & rented apartment units", href: "/dashboard/flats", icon: Building2, color: "bg-blue-700", lightBg: "bg-blue-50 text-blue-700 border-blue-200" },
    { title: "Visitors", count: "42 Today", desc: "Real-time gate passes & visitor check-in logs", href: "/dashboard/visitors", icon: UserCheck, color: "bg-sky-600", lightBg: "bg-sky-50 text-sky-600 border-sky-200" },
    { title: "Complaints", count: "3 Pending", desc: "Resident helpdesk tickets & resolution tracking", href: "/dashboard/complaints", icon: MessageSquareWarning, color: "bg-amber-500", lightBg: "bg-amber-50 text-amber-600 border-amber-200" },
    { title: "Maintenance", count: "8 Due", desc: "Monthly maintenance dues & utility billing", href: "/dashboard/maintenance", icon: Wrench, color: "bg-emerald-600", lightBg: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    { title: "Notices", count: "5 Active", desc: "Society announcements & emergency circulars", href: "/dashboard/notices", icon: Megaphone, color: "bg-indigo-600", lightBg: "bg-indigo-50 text-indigo-600 border-indigo-200" },
    { title: "Reports", count: "12 Reports", desc: "Gate traffic analytics & security audit logs", href: "/dashboard/reports", icon: BarChart3, color: "bg-blue-800", lightBg: "bg-blue-50 text-blue-800 border-blue-200" },
    { title: "Settings", count: "Configured", desc: "Checkpoint rules, security policies & preferences", href: "/dashboard/settings", icon: Settings, color: "bg-slate-700", lightBg: "bg-slate-100 text-slate-700 border-slate-200" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Hero Banner (Slick Blue & White Theme) */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/15 relative overflow-hidden">
        {/* Background glow & subtle ambient shapes */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-sky-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
              <Sparkles className="h-3.5 w-3.5 text-blue-200" />
              <span>Smart Society Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Welcome back, <br className="hidden sm:inline" />
              <span className="text-blue-100">{profile?.full_name || "Officer"}</span>
            </h1>
            <p className="text-blue-100/90 text-xs sm:text-sm leading-relaxed pt-1">
              Seamlessly monitor society residents, manage visitor clearances, track maintenance dues, and resolve complaints across all checkpoints.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white text-blue-600 flex items-center justify-center font-extrabold text-sm shadow-sm">
                {profile?.full_name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider">
                  {profile?.role === "admin" ? "System Administrator" : "Committee Member"}
                </div>
                <div className="text-[11px] text-blue-200 truncate max-w-[150px]">
                  {profile?.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Summary */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            System Operational Status: All 8 Society Modules Synchronized
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Supabase Auth & Database Live</span>
        </div>
      </div>

      {/* Section Shortcut Grid (8 Sections) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>Management Sections</span>
          </h2>
          <span className="text-xs text-slate-500">8 Modules Available</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.title}
                href={sec.href}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-xl hover:shadow-blue-600/5 hover:border-blue-400 transition-all duration-200 group flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl ${sec.color} text-white shadow-md shadow-blue-600/15 group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${sec.lightBg}`}>
                      {sec.count}
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-4 group-hover:text-blue-600 transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {sec.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-slate-400 font-normal">Navigate section</span>
                  <span className="text-blue-600 inline-flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
