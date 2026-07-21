"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  ShieldCheck,
  Users,
  Building2,
  UserCheck,
  MessageSquareWarning,
  Wrench,
  Megaphone,
  BarChart3,
  Settings,
  ArrowRight,
  Sparkles,
  Lock,
  ChevronRight,
  LogIn,
  LayoutDashboard
} from "lucide-react";

export default function LandingPage() {
  const [sessionUser, setSessionUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || "Officer",
        });
      }
    };
    checkUser();
  }, []);

  const features = [
    { title: "Residents Directory", desc: "Manage resident profiles, owner/tenant records, and family contacts.", icon: Users, href: "/dashboard/residents", color: "bg-blue-600" },
    { title: "Flats & Wings", desc: "Track occupied, vacant, and rented apartments across all blocks.", icon: Building2, href: "/dashboard/flats", color: "bg-blue-700" },
    { title: "Visitor Entry & Fast Pass", desc: "Generate instant QR digital visitor passes and scan ANPR vehicles.", icon: UserCheck, href: "/dashboard/visitors", color: "bg-sky-600" },
    { title: "Complaints & Helpdesk", desc: "Streamline resident ticket submissions, staff assignment, and resolution.", icon: MessageSquareWarning, href: "/dashboard/complaints", color: "bg-amber-500" },
    { title: "Maintenance & Dues", desc: "Automate monthly maintenance billing, utility payments, and receipts.", icon: Wrench, href: "/dashboard/maintenance", color: "bg-emerald-600" },
    { title: "Digital Notice Board", desc: "Broadcast society notices, circulars, and emergency alerts instantly.", icon: Megaphone, href: "/dashboard/notices", color: "bg-indigo-600" },
    { title: "Audit Reports", desc: "Generate gate entry logs, financial summaries, and visitor analytics.", icon: BarChart3, href: "/dashboard/reports", color: "bg-blue-800" },
    { title: "Checkpoint Settings", desc: "Configure gate access policies, ANPR integration, and user roles.", icon: Settings, href: "/dashboard/settings", color: "bg-slate-700" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                GATEZLY
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Management Portal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">Features</a>
            <a href="#security" className="hover:text-blue-600 transition">Gate Security</a>
            <a href="#modules" className="hover:text-blue-600 transition">Modules</a>
          </nav>

          <div className="flex items-center space-x-3">
            {sessionUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 text-xs font-bold border border-slate-200 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span>Next-Gen Gate Access & Society Automation</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Smart Gate Access & <br className="hidden sm:block" />
            <span className="gradient-blue-text">Society Management Portal</span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Manage society residents, flat allocations, QR visitor fast passes, complaints, maintenance billing, and gate security checkpoints from a single, unified portal.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-600/25 hover:shadow-blue-600/35 transition cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In to Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200 shadow-sm transition cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4 text-blue-600" />
              <span>Open Dashboard</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Key Metrics Summary */}
      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm text-center">
            <div className="text-3xl font-black text-blue-600">348+</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Active Residents</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm text-center">
            <div className="text-3xl font-black text-blue-600">120</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Flat Units</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm text-center">
            <div className="text-3xl font-black text-blue-600">100%</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Gate Checkpoint Sync</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm text-center">
            <div className="text-3xl font-black text-emerald-600">Live</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Supabase Realtime</div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Comprehensive Management
          </div>
          <h2 className="text-3xl font-black text-slate-900">
            8 Powerful Society Modules
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto">
            Everything your society committee and security team need in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition group flex flex-col justify-between"
              >
                <div>
                  <div className={`h-11 w-11 rounded-xl ${item.color} text-white flex items-center justify-center shadow-md shadow-blue-600/15 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-4 group-hover:text-blue-600 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Explore module</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="max-w-7xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5 text-blue-200" />
              <span>Role-Based Access Control</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Enterprise Security & Role Permissions
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Protected authentication powered by Supabase Auth with dedicated Admin and Committee member roles for secure access control.
            </p>
          </div>
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold text-sm shadow-md transition cursor-pointer text-center shrink-0"
          >
            Access Security Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-800">Gatezly Portal</span>
            <span>&bull; Smart Access & Society Management</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hover:text-blue-600">Sign In</Link>
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
