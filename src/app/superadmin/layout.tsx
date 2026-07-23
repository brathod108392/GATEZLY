"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ShieldCheck,
  Building2,
  LogOut,
  Loader2,
  Menu,
  X,
  Plus
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

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
          .select("is_active, role")
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
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <ShieldCheck className="h-7 w-7 text-white animate-pulse" />
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span>Verifying Super Admin Access...</span>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 font-sans selection:bg-indigo-600 selection:text-white">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-white shrink-0 sticky top-0 h-screen z-30 shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-extrabold text-lg tracking-tight leading-none">
              GATEZLY
            </div>
            <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
              Super Admin Console
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link
            href="/superadmin"
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              pathname === "/superadmin"
                ? "bg-indigo-500/20 text-indigo-300 border-l-4 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>All Societies</span>
          </Link>
          <Link
            href="/superadmin/create"
            className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
              pathname.startsWith("/superadmin/create")
                ? "bg-indigo-500/20 text-indigo-300 border-l-4 border-indigo-500"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Create Society</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-slate-200 truncate">Super Admin</div>
              <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs lg:hidden">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900">Super Admin</h1>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-8 bg-slate-50">{children}</main>
      </div>
    </div>
  );
}
