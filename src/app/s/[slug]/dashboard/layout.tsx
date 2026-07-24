"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { SocietyProvider } from "@/components/providers/society-provider";
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
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Flats / Bungalows", href: "/dashboard/flats", icon: Building2 },
  { name: "Visitors", href: "/dashboard/visitors", icon: UserCheck },
  { name: "Complaints", href: "/dashboard/complaints", icon: MessageSquareWarning },
  { name: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
  { name: "Notices", href: "/dashboard/notices", icon: Megaphone },
  { name: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function ProtectedDashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [society, setSociety] = useState<{ id: string; name: string; slug: string; modules: Record<string, boolean> } | null>(null);
  const [banner, setBanner] = useState<{ active: boolean; text: string } | null>(null);

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && globalSearchQuery.trim()) {
      router.push(`/s/${params.slug}/dashboard/users?search=${encodeURIComponent(globalSearchQuery.trim())}`);
      setGlobalSearchQuery("");
    }
  };

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
          .select("is_active, society_id, role, full_name")
          .eq("id", session.user.id)
          .single();

        if (profile && profile.is_active === false) {
          await supabase.auth.signOut();
          setAuthenticated(false);
          router.push("/login?error=account_deactivated");
          return;
        }

        if (profile?.role === 'resident' || profile?.role === 'guard') {
          await supabase.auth.signOut();
          setAuthenticated(false);
          router.push("/login?error=unauthorized");
          return;
        }

        let soc = null;

        if (profile?.role === 'superadmin') {
          // Superadmins can view any society portal
          const { data } = await supabase
            .from('societies')
            .select('*')
            .eq('slug', params.slug)
            .single();
            
          if (!data) {
            router.push('/superadmin');
            return;
          }
          soc = data;
        } else if (profile && profile.society_id) {
          const { data } = await supabase
            .from('societies')
            .select('*')
            .eq('id', profile.society_id)
            .single();

          if (!data || data.slug !== params.slug) {
            router.push(data ? `/s/${data.slug}/dashboard` : "/login");
            return;
          }
          
          if (data.is_deleted) {
            await supabase.auth.signOut();
            setAuthenticated(false);
            router.push("/login?error=society_deleted");
            return;
          }

          if (data.is_active === false) {
            await supabase.auth.signOut();
            setAuthenticated(false);
            router.push("/login?error=society_suspended");
            return;
          }

          soc = data;
        } else {
          router.push("/login");
          return;
        }

        // Global maintenance mode check for non-superadmins
        if (profile?.role !== 'superadmin') {
          const { data: platformSettings } = await supabase
            .from('platform_settings')
            .select('maintenance_mode, global_banner_active, global_banner_text')
            .limit(1)
            .single();

          if (platformSettings?.maintenance_mode) {
            await supabase.auth.signOut();
            setAuthenticated(false);
            router.push("/login?error=maintenance_mode");
            return;
          }
          if (platformSettings?.global_banner_active && platformSettings.global_banner_text) {
            setBanner({ active: true, text: platformSettings.global_banner_text });
          }
        } else {
          // Fetch banner for superadmins too since they don't hit the above block
          const { data: platformSettings } = await supabase
            .from('platform_settings')
            .select('global_banner_active, global_banner_text')
            .limit(1)
            .single();
          if (platformSettings?.global_banner_active && platformSettings.global_banner_text) {
            setBanner({ active: true, text: platformSettings.global_banner_text });
          }
        }

        setSociety(soc);
        setAuthenticated(true);
        setUserName(profile?.full_name || session.user.email?.split('@')[0] || "User");
        setUserRole(profile?.role || "resident");
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
        } else {
          verifyAuth();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, params.slug]);

  // Handle Logout
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Loading Screen while verifying session
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 mb-6 relative z-10">
          <ShieldCheck className="h-7 w-7 text-white animate-pulse" />
        </div>
        <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden relative z-10">
          <div className="h-full bg-blue-600 rounded-full animate-pulse w-full" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse relative z-10">
          Loading Gatezly Workspace...
        </p>
      </div>
    );
  }

  if (!authenticated || !society) {
    return null;
  }

  // Filter Nav items based on society modules
  const filteredNavItems = navItems.map(item => ({
    ...item,
    href: `/s/${params.slug}${item.href === '/dashboard' ? '/dashboard' : item.href}`
  })).filter(item => {
    if (item.name === "Overview" || item.name === "Settings" || item.name === "Users") return true;
    const moduleKey = item.name.toLowerCase();
    return society.modules?.[moduleKey] !== false;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-blue-600 selection:text-white">
      {/* GLOBAL BANNER */}
      {banner?.active && banner.text && (
        <div className="bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white shadow-sm flex items-center justify-center space-x-2 shrink-0 z-50">
          <Bell className="h-4 w-4 animate-bounce" />
          <span>{banner.text}</span>
        </div>
      )}

      <div className="flex flex-1 min-h-0 relative">
        {/* SIDEBAR (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-[280px] bg-white border-r border-slate-100 shrink-0 sticky top-0 h-screen z-30">
        {/* Brand Area */}
        <div className="px-6 py-8 flex flex-col items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-slate-900 tracking-tight leading-none" title={society.name}>
              {society.name}
            </h2>
            <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
              Gatezly Portal
            </p>
          </div>
        </div>

        <div className="px-4 mb-2">
          <div className="h-px w-full bg-slate-100" />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === `/s/${params.slug}/dashboard`
                ? pathname === `/s/${params.slug}/dashboard`
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                )}
                <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info Section */}
        <div className="p-4 mt-auto">
          <div className="h-px w-full bg-slate-100 mb-4" />
          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-100/50 hover:bg-slate-100/50 transition-colors">
            <div className="flex items-center space-x-3 truncate">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0 shadow-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="font-semibold text-slate-900 truncate">
                  {userName}
                </div>
                <div className="text-xs text-slate-500 font-medium tracking-wide uppercase truncate mt-0.5">
                  {userRole.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-2 shrink-0"
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
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-[280px] bg-white h-full z-10 shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="px-6 py-8 flex flex-col items-start gap-4">
              <div className="flex items-center justify-between w-full">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-900 tracking-tight leading-none" title={society.name}>
                  {society.name}
                </h2>
                <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                  Gatezly Portal
                </p>
              </div>
            </div>

            <div className="px-4 mb-2">
              <div className="h-px w-full bg-slate-100" />
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === `/s/${params.slug}/dashboard`
                    ? pathname === `/s/${params.slug}/dashboard`
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                    )}
                    <Icon className={`h-5 w-5 transition-colors duration-200 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 mt-auto">
              <div className="h-px w-full bg-slate-100 mb-4" />
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-colors text-sm font-semibold"
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
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
          {/* Mobile Header Layout */}
          <div className="flex items-center lg:hidden w-full justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="font-bold text-slate-900 truncate px-4">
              {society.name}
            </div>
            <button className="p-2 -mr-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>
          </div>

          {/* Desktop Header Layout */}
          <div className="hidden lg:flex items-center justify-between w-full">
            <h1 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
              {filteredNavItems.find(
                (item) =>
                  item.href === `/s/${params.slug}/dashboard`
                    ? pathname === `/s/${params.slug}/dashboard`
                    : pathname.startsWith(item.href)
              )?.name || "Dashboard"}
            </h1>

            <div className="flex items-center space-x-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search everywhere..."
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  onKeyDown={handleGlobalSearch}
                  className="pl-10 pr-4 py-2 text-sm rounded-full bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white w-64 lg:w-80 transition-all duration-200"
                />
              </div>

              <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
                <button className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
                </button>
                
                <span className="text-sm font-medium text-slate-600 truncate max-w-[120px]">
                  {userName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="flex-1 p-6 sm:p-8 bg-slate-50 overflow-x-hidden">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500 slide-in-from-bottom-2">
            <SocietyProvider society={society}>
              {children}
            </SocietyProvider>
          </div>
        </main>
      </div>
    </div>
  </div>
);
}
