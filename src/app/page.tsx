"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  LayoutDashboard,
  CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  const [sessionUser, setSessionUser] = useState<{ email: string; name: string } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser({
          email: session.user.email || "",
          name: session.user.user_metadata?.full_name || "Officer",
        });
      }

      // Check for expired reset link error or invite/recovery in URL hash
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes("type=recovery") || hash.includes("type=invite")) {
          router.push("/update-password");
        } else if (hash.includes("error_code=otp_expired")) {
          router.push("/login#error_code=otp_expired");
        }
      }
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/update-password");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const features = [
    { title: "User Management", desc: "Manage resident profiles, owner/tenant records, and family contacts.", icon: Users, href: "/dashboard/users", color: "bg-blue-600" },
    { title: "Flats & Wings", desc: "Track occupied, vacant, and rented apartments across all blocks.", icon: Building2, href: "/dashboard/flats", color: "bg-indigo-600" },
    { title: "Visitor Entry", desc: "Generate instant QR digital visitor passes and scan ANPR vehicles.", icon: UserCheck, href: "/dashboard/visitors", color: "bg-sky-500" },
    { title: "Complaints & Helpdesk", desc: "Streamline resident ticket submissions, staff assignment, and resolution.", icon: MessageSquareWarning, href: "/dashboard/complaints", color: "bg-amber-500" },
    { title: "Maintenance & Dues", desc: "Automate monthly maintenance billing, utility payments, and receipts.", icon: Wrench, href: "/dashboard/maintenance", color: "bg-emerald-500" },
    { title: "Digital Notice Board", desc: "Broadcast society notices, circulars, and emergency alerts instantly.", icon: Megaphone, href: "/dashboard/notices", color: "bg-purple-600" },
    { title: "Audit Reports", desc: "Generate gate entry logs, financial summaries, and visitor analytics.", icon: BarChart3, href: "/dashboard/reports", color: "bg-rose-500" },
    { title: "Checkpoint Settings", desc: "Configure gate access policies, ANPR integration, and user roles.", icon: Settings, href: "/dashboard/settings", color: "bg-slate-700" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-blue-600/20 selection:text-blue-900 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-all duration-300">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-tight text-slate-900 leading-none">
                Gatezly
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#modules" className="hover:text-slate-900 transition-colors">Modules</a>
          </nav>

          <div className="flex items-center space-x-3">
            {sessionUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium shadow-md transition-all hover:-translate-y-0.5"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium shadow-md shadow-slate-900/10 transition-all hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30 blur-[100px] bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply animate-pulse" style={{ animationDuration: '8s' }}></div>
        
        <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white border border-slate-200/60 text-slate-700 text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
            <span>Next-Gen Gate Access & Society Automation</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Manage your society with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              intelligent automation
            </span>
          </h1>

          <p className="text-slate-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            A unified platform for resident management, fast-pass visitor access, maintenance billing, and robust gate security.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all hover:-translate-y-1"
            >
              <span>Start for free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#modules"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-base border border-slate-200 shadow-sm transition-all hover:-translate-y-1"
            >
              <span>Explore Features</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center">
            <Users className="h-6 w-6 text-blue-500 mb-3" />
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">348+</div>
            <div className="text-sm font-medium text-slate-500 mt-1">Active Residents</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center">
            <Building2 className="h-6 w-6 text-indigo-500 mb-3" />
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">120</div>
            <div className="text-sm font-medium text-slate-500 mt-1">Flat Units</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center">
            <ShieldCheck className="h-6 w-6 text-emerald-500 mb-3" />
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">100%</div>
            <div className="text-sm font-medium text-slate-500 mt-1">Secure Checkpoint</div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 flex flex-col items-center justify-center text-center">
            <Sparkles className="h-6 w-6 text-amber-500 mb-3" />
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight">99.9%</div>
            <div className="text-sm font-medium text-slate-500 mt-1">Uptime</div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="max-w-7xl mx-auto px-6 py-24 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide">
            Modules
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            Everything you need.
          </h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Powerful tools designed specifically for modern housing societies and security teams.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group relative bg-white p-8 rounded-3xl border border-slate-200 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 flex flex-col"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`h-12 w-12 rounded-2xl ${item.color} text-white flex items-center justify-center shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform duration-300 mb-6`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-grow">
                  {item.desc}
                </p>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                  <span>Explore module</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
                {/* Hover Gradient Border effect */}
                <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-br from-blue-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" style={{ maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)'}}></div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="max-w-7xl mx-auto px-6 py-24">
        <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-10 sm:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="space-y-6 max-w-2xl relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium">
              <Lock className="h-4 w-4 text-blue-400" />
              <span>Enterprise-Grade Security</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Built on a foundation of trust.
            </h2>
            <div className="space-y-4 pt-2">
              {["Supabase Auth integration", "Role-Based Access Control", "Encrypted data at rest"].map((text) => (
                <div key={text} className="flex items-center space-x-3 text-slate-300">
                  <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0" />
                  <span className="text-base">{text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 shrink-0 w-full lg:w-auto">
            <Link
              href="/login"
              className="flex items-center justify-center w-full lg:w-auto space-x-2 px-8 py-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-50 font-semibold text-base shadow-xl transition-all hover:-translate-y-1"
            >
              <span>Access Security Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/60 bg-white pt-16 pb-8 px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-slate-900" />
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Gatezly</span>
            </div>
            <p className="text-sm text-slate-500">
              Smart Access & Society Management.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-sm font-medium text-slate-500">
            <Link href="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Dashboard</Link>
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-100 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} Gatezly Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
