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
  ArrowRight,
  Settings,
  Activity,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import Link from "next/link";

export default function DashboardOverviewPage({ params }: { params: { slug: string } }) {
  const [profile, setProfile] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

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
          role: data?.role || session.user.user_metadata?.role || "resident",
        });
      }
    };
    fetchProfile();
  }, []);

  const sections = [
    { title: "Users", desc: "Registered society residents, committee, and guards", href: `/s/${params?.slug}/dashboard/users`, icon: Users, color: "text-blue-600", bg: "bg-blue-50", gradient: "from-blue-500 to-cyan-400" },
    { title: "Flats", desc: "Occupied, vacant & rented apartment units", href: `/s/${params?.slug}/dashboard/flats`, icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50", gradient: "from-indigo-500 to-purple-400" },
    { title: "Visitors", desc: "Real-time gate passes & visitor check-in logs", href: `/s/${params?.slug}/dashboard/visitors`, icon: UserCheck, color: "text-sky-600", bg: "bg-sky-50", gradient: "from-sky-400 to-blue-500" },
    { title: "Complaints", desc: "Resident helpdesk tickets & resolution tracking", href: `/s/${params?.slug}/dashboard/complaints`, icon: MessageSquareWarning, color: "text-amber-600", bg: "bg-amber-50", gradient: "from-amber-400 to-orange-500" },
    { title: "Maintenance", desc: "Monthly maintenance dues & utility billing", href: `/s/${params?.slug}/dashboard/maintenance`, icon: Wrench, color: "text-emerald-600", bg: "bg-emerald-50", gradient: "from-emerald-400 to-teal-500" },
    { title: "Notices", desc: "Society announcements & emergency circulars", href: `/s/${params?.slug}/dashboard/notices`, icon: Megaphone, color: "text-violet-600", bg: "bg-violet-50", gradient: "from-violet-500 to-fuchsia-500" },
    { title: "Reports", desc: "Gate traffic analytics & security audit logs", href: `/s/${params?.slug}/dashboard/reports`, icon: BarChart3, color: "text-rose-600", bg: "bg-rose-50", gradient: "from-rose-400 to-red-500" },
    { title: "Settings", desc: "Checkpoint rules, security policies & preferences", href: `/s/${params?.slug}/dashboard/settings`, icon: Settings, color: "text-slate-600", bg: "bg-slate-50", gradient: "from-slate-400 to-gray-500" },
  ];

  const quickStats = [
    { label: "Total Residents", value: "842", trend: "+12%", trendUp: true, icon: Users },
    { label: "Active Visitors", value: "34", trend: "+5%", trendUp: true, icon: UserCheck },
    { label: "Pending Complaints", value: "8", trend: "-2%", trendUp: false, icon: MessageSquareWarning },
    { label: "Maintenance Coll.", value: "92%", trend: "+4%", trendUp: true, icon: Activity },
  ];

  const formatRole = (role?: string) => {
    switch (role) {
      case "superadmin": return "Super Admin";
      case "admin": return "System Administrator";
      case "committee": return "Committee Member";
      default: return "Resident";
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
      `}} />

      {/* Welcome Section */}
      <div 
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/60 p-8 shadow-sm animate-fade-in-up"
        style={{ animationDelay: '0ms' }}
      >
        {/* Subtle background blurs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none" />
        
        {/* Decorative mesh/wave overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart Society Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
              {greeting}, <span className="text-blue-600">{profile?.full_name || "User"}</span>
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              Manage residents, monitor visitors, track maintenance dues, and resolve complaints securely from your command center.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-xl border border-white/60 p-3.5 pr-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
              {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Role
              </div>
              <div className="inline-flex items-center">
                <span className="px-2.5 py-1 bg-slate-100/80 rounded-md text-xs font-semibold text-slate-700 border border-slate-200/60 shadow-sm">
                  {formatRole(profile?.role)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => {
          const StatIcon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:-translate-y-0.5 transition-transform duration-300 animate-fade-in-up flex flex-col space-y-4"
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  <StatIcon className="h-5 w-5 text-slate-600" />
                </div>
                <div className={`flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  <span>{stat.trend}</span>
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-slate-900">{stat.value}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Section Shortcut Grid (8 Sections) */}
      <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-slate-400" />
            <span>Modules</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.title}
                href={sec.href}
                className="group relative bg-white rounded-2xl border border-slate-200/60 p-6 hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-300 transition-all duration-300 flex flex-col justify-between overflow-hidden animate-fade-in-up hover:-translate-y-1"
                style={{ animationDelay: `${500 + (idx * 50)}ms` }}
              >
                {/* Top Gradient Accent Line */}
                <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${sec.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div>
                  <div className={`inline-flex p-3 rounded-xl ${sec.bg} ${sec.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 mt-5 group-hover:text-blue-600 transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    {sec.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-medium">
                  <span className="text-slate-400 group-hover:text-slate-600 transition-colors">Manage</span>
                  <div className="flex items-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <span className="mr-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">Open</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
