"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ShieldCheck,
  LogOut,
  Loader2,
  Menu,
  X,
  Users,
  Settings,
  Activity,
  LayoutDashboard,
  Shield,
  Bell
} from "lucide-react";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [banner, setBanner] = useState<{ active: boolean; text: string } | null>(null);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setAuthenticated(false);
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_active, role, full_name")
          .eq("id", session.user.id)
          .single();

        if (profile?.role !== 'superadmin') {
          await supabase.auth.signOut();
          setAuthenticated(false);
          router.push("/login");
          return;
        }

        setAuthenticated(true);
        setUserEmail(session.user.email || "");
        setUserName(profile?.full_name || session.user.email?.split('@')[0] || "Super Admin");

        // Fetch banner
        try {
          const { data } = await supabase
            .from("platform_settings")
            .select("global_banner_active, global_banner_text")
            .limit(1)
            .single();
          
          if (data && data.global_banner_active) {
            setBanner({ active: true, text: data.global_banner_text || "" });
          }
        } catch (bannerErr) {
          console.error("Banner fetch error", bannerErr);
        }

      } catch (error) {
        console.error("Auth verification error:", error);
        setAuthenticated(false);
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthenticated(false);
          router.push("/login");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 relative z-10">
            <ShieldCheck className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
            <span>Verifying Super Admin Access...</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">Securing your session</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      {/* GLOBAL BANNER */}
      {banner?.active && banner.text && (
        <div className="bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm flex items-center justify-center space-x-2">
          <Bell className="h-4 w-4 animate-bounce" />
          <span>{banner.text}</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
      {/* MOBILE MENU OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-xl tracking-tight leading-none text-slate-900">
                  Gatezly
                </div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1 block">
                  Super Admin
                </span>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          <Link
            href="/superadmin"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
              pathname === "/superadmin"
                ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className={`h-4 w-4 transition-colors ${pathname === "/superadmin" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span>Overview</span>
          </Link>
          <Link
            href="/superadmin/users"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
              pathname === "/superadmin/users"
                ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Users className={`h-4 w-4 transition-colors ${pathname === "/superadmin/users" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span>Global Users</span>
          </Link>
          <Link
            href="/superadmin/admins"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
              pathname === "/superadmin/admins"
                ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Shield className={`h-4 w-4 transition-colors ${pathname === "/superadmin/admins" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span>Admins</span>
          </Link>
          <Link
            href="/superadmin/logs"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
              pathname === "/superadmin/logs"
                ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Activity className={`h-4 w-4 transition-colors ${pathname === "/superadmin/logs" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span>Activity Logs</span>
          </Link>
          <Link
            href="/superadmin/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
              pathname === "/superadmin/settings"
                ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings className={`h-4 w-4 transition-colors ${pathname === "/superadmin/settings" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 m-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="truncate pr-3">
              <div className="text-sm font-bold text-slate-900 truncate">{userName}</div>
              <div className="text-xs text-slate-500 font-medium tracking-wide uppercase truncate mt-0.5">Super Admin</div>
            </div>
            <button 
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />
        
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/50 px-6 py-4 flex items-center justify-between lg:hidden">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100/80 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              <h1 className="text-base font-bold text-slate-900 tracking-tight">Super Admin</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto z-10">{children}</main>
      </div>
      </div>
    </div>
  );
}
