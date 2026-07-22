"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LayoutDashboard,
  LogOut,
  Bell,
  Search,
  Loader2,
  Menu,
  X
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Residents", href: "/dashboard/residents", icon: Users },
  { name: "Flats", href: "/dashboard/flats", icon: Building2 },
  { name: "Visitors", href: "/dashboard/visitors", icon: UserCheck },
  { name: "Complaints", href: "/dashboard/complaints", icon: MessageSquareWarning },
  { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { name: "Notices", href: "/dashboard/notices", icon: Megaphone },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && globalSearchQuery.trim()) {
      router.push(`/dashboard/residents?search=${encodeURIComponent(globalSearchQuery.trim())}`);
    }
  };

  useEffect(() => {
    // 1. Initial Session Check
    const verifyAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setAuthenticated(false);
          router.push("/login");
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_active")
            .eq("id", session.user.id)
            .single();

          if (profile && profile.is_active === false) {
            await supabase.auth.signOut();
            setAuthenticated(false);
            router.push("/login?error=account_deactivated");
            return;
          }

          setAuthenticated(true);
          setUserEmail(session.user.email || "");
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

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!session) {
          setAuthenticated(false);
          router.push("/login");
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_active")
            .eq("id", session.user.id)
            .single();

          if (profile && profile.is_active === false) {
            await supabase.auth.signOut();
            setAuthenticated(false);
            router.push("/login?error=account_deactivated");
            return;
          }

          setAuthenticated(true);
          setUserEmail(session.user.email || "");
        }
        setCheckingAuth(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Handle Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Loading Screen while verifying session
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <ShieldCheck className="h-7 w-7 text-white animate-pulse" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span>Verifying Gatezly Security Credentials...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen z-30 shadow-sm">
        {/* Brand Logo */}
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 flex items-center justify-center shadow-md shadow-blue-600/25">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
              GATEZLY
            </div>
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">
              Management Portal
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100/80 hover:text-blue-600"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-slate-800 truncate">Officer Account</div>
              <div className="text-[10px] text-slate-500 truncate">{userEmail}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition cursor-pointer shadow-xs"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR MODAL */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-white h-full z-10 shadow-xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <span className="font-extrabold text-base text-slate-900">GATEZLY</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-600"
                        : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-semibold"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER BAR */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 capitalize">
              {navItems.find(
                (item) =>
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)
              )?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search residents, flats, passes..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onKeyDown={handleGlobalSearch}
                className="pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white w-60 transition"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            {/* Quick Logout Button */}
            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-6 sm:p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
