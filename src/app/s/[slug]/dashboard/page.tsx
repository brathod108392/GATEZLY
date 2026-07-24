"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Building2,
  UserCheck,
  MessageSquareWarning,
  Wrench,
  BarChart3,
  UserPlus,
  QrCode,
  Megaphone,
  IndianRupee,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  User,
  FileText
} from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const MOCK_CHART_DATA = [
  { name: 'Mon', visitors: 28 },
  { name: 'Tue', visitors: 45 },
  { name: 'Wed', visitors: 58 },
  { name: 'Thu', visitors: 48 },
  { name: 'Fri', visitors: 68 },
  { name: 'Sat', visitors: 88 },
  { name: 'Sun', visitors: 55 },
];

const MOCK_SPARKLINE_UP = [
  { value: 10 }, { value: 15 }, { value: 20 }, { value: 25 }, { value: 35 }, { value: 45 }, { value: 50 }
];

const MOCK_SPARKLINE_DOWN = [
  { value: 50 }, { value: 45 }, { value: 48 }, { value: 30 }, { value: 25 }, { value: 20 }, { value: 15 }
];

export default function DashboardOverviewPage({ params }: { params: { slug: string } }) {
  const [profile, setProfile] = useState<{ full_name: string; email: string; role: string } | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [currentDate, setCurrentDate] = useState("");
  
  const [stats, setStats] = useState({
    residents: 0,
    visitors: 0,
    complaints: 8,
    maintenance: 92
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [upcomingVisitors, setUpcomingVisitors] = useState<any[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', dateOptions));

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setProfile({
          full_name: prof?.full_name || session.user.user_metadata?.full_name || "User",
          email: prof?.email || session.user.email || "",
          role: prof?.role || session.user.user_metadata?.role || "resident",
        });

        let socId = prof?.society_id;
        if (prof?.role === 'superadmin') {
           const { data: soc } = await supabase.from('societies').select('id').eq('slug', params.slug).single();
           socId = soc?.id;
        }

        if (socId) {
          const { count: resCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('society_id', socId).in('role', ['resident', 'committee', 'guard']);
          const { count: visCount } = await supabase.from('visitors').select('*', { count: 'exact', head: true }).eq('society_id', socId).eq('status', 'approved');
          
          setStats(s => ({ ...s, residents: resCount || 0, visitors: visCount || 0 }));

          const { data: recentVis } = await supabase.from('visitors').select('*').eq('society_id', socId).order('created_at', { ascending: false }).limit(2);
          const { data: upVis } = await supabase.from('visitors').select('*').eq('society_id', socId).eq('status', 'pending').order('created_at', { ascending: false }).limit(3);
          
          if (upVis) setUpcomingVisitors(upVis);
          
          // Mix recent visitors with some mock activity for demonstration
          const mixedActivity = [
            ...(recentVis || []).map(v => ({
              id: v.id,
              type: 'visitor',
              title: `Visitor entered (${v.visitor_name})`,
              desc: v.vehicle_number ? `Vehicle: ${v.vehicle_number}` : 'Walk-in',
              time: new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              icon: UserCheck,
              color: 'text-blue-600',
              bg: 'bg-blue-50'
            })),
            {
              id: 'c1',
              type: 'complaint',
              title: 'Complaint #124 resolved',
              desc: 'Water leakage in Block B',
              time: '09:45 AM',
              icon: MessageSquareWarning,
              color: 'text-emerald-600',
              bg: 'bg-emerald-50'
            },
            {
              id: 'm1',
              type: 'maintenance',
              title: 'Maintenance payment received',
              desc: 'Flat C-302 | ₹2,500',
              time: 'Yesterday',
              icon: IndianRupee,
              color: 'text-sky-600',
              bg: 'bg-sky-50'
            }
          ];
          setRecentActivity(mixedActivity.slice(0, 4));
        }
      }
    };
    fetchData();
  }, [params.slug]);

  const quickActions = [
    { label: "Add Resident", icon: UserPlus, href: `/s/${params.slug}/dashboard/users`, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Log Visitor", icon: UserCheck, href: `/s/${params.slug}/dashboard/visitors`, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Publish Notice", icon: Megaphone, href: `/s/${params.slug}/dashboard/notices`, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Generate Pass", icon: QrCode, href: `/s/${params.slug}/dashboard/visitors`, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  const quickModules = [
    { label: "Users", desc: "Manage all users", icon: Users, href: `/s/${params.slug}/dashboard/users`, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Flats", desc: "Manage apartments", icon: Building2, href: `/s/${params.slug}/dashboard/flats`, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Visitors", desc: "Gate passes & logs", icon: UserCheck, href: `/s/${params.slug}/dashboard/visitors`, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Complaints", desc: "Track & resolve", icon: MessageSquareWarning, href: `/s/${params.slug}/dashboard/complaints`, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Maintenance", desc: "Dues & collection", icon: Wrench, href: `/s/${params.slug}/dashboard/maintenance`, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Reports", desc: "Analytics & reports", icon: BarChart3, href: `/s/${params.slug}/dashboard/reports`, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="text-2xl">👋</span> {greeting}, {profile?.full_name?.split(' ')[0] || "User"}
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Welcome back! Here&apos;s what&apos;s happening in your society today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-700">{currentDate}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link key={idx} href={action.href} className="flex items-center justify-center sm:justify-start gap-4 p-4 rounded-2xl bg-white border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${action.bg} ${action.color} group-hover:scale-105 transition-transform`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-semibold text-slate-800 hidden sm:block">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Residents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex items-start justify-between z-10">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div className="h-12 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SPARKLINE_UP}>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="z-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.residents}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Total Residents</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center text-xs font-bold text-emerald-600"><ArrowUpRight className="h-3 w-3 mr-0.5"/> 12%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Visitors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex items-start justify-between z-10">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="h-12 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SPARKLINE_UP}>
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#ecfdf5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="z-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.visitors}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Active Visitors</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center text-xs font-bold text-emerald-600"><ArrowUpRight className="h-3 w-3 mr-0.5"/> 5%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Complaints */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex items-start justify-between z-10">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
              <MessageSquareWarning className="h-5 w-5" />
            </div>
            <div className="h-12 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SPARKLINE_DOWN}>
                  <Area type="monotone" dataKey="value" stroke="#f97316" fill="#fff7ed" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="z-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.complaints}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Pending Complaints</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center text-xs font-bold text-rose-600"><ArrowDownRight className="h-3 w-3 mr-0.5"/> 2%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">vs last month</span>
              </div>
            </div>
          </div>
        </div>

        {/* Maintenance Collection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
          <div className="flex items-start justify-between z-10">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div className="h-12 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SPARKLINE_UP}>
                  <Area type="monotone" dataKey="value" stroke="#a855f7" fill="#faf5ff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="z-10">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.maintenance}%</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Maintenance Collection</div>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center text-xs font-bold text-emerald-600"><ArrowUpRight className="h-3 w-3 mr-0.5"/> 4%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">vs last month</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visitor Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900">Visitor Trend <span className="text-slate-400 font-medium text-sm">(This Week)</span></h2>
            <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium">
              <option>This Week</option>
              <option>Last Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorVis)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Recent Activity & Upcoming */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
              <Link href={`/s/${params.slug}/dashboard/reports`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-5">
              {recentActivity.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <div key={idx} className="flex gap-4">
                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${activity.bg} ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-slate-800 truncate">{activity.title}</div>
                      <div className="text-xs text-slate-500 truncate mt-0.5">{activity.desc}</div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{activity.time}</div>
                  </div>
                )
              })}
              {recentActivity.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">No recent activity</div>
              )}
            </div>
          </div>

          {/* Upcoming Visitors */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-slate-900">Upcoming Visitors</h2>
              <Link href={`/s/${params.slug}/dashboard/visitors`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-4">
              {upcomingVisitors.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-800 truncate">{v.visitor_name}</div>
                      <div className="text-xs text-slate-500 truncate">{v.purpose || 'Guest'}</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-md">Pending</div>
                </div>
              ))}
              {upcomingVisitors.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-4">No upcoming visitors</div>
              )}
            </div>
          </div>
          
          {/* Maintenance Due Card */}
          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-amber-900">Maintenance Due</h2>
              <Link href={`/s/${params.slug}/dashboard/maintenance`} className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md hover:bg-amber-200 transition-colors">View All</Link>
            </div>
            <div className="text-3xl font-extrabold text-amber-600 mb-1">₹ 48,750</div>
            <div className="text-xs font-medium text-amber-700/70">From 23 Flats</div>
            <FileText className="absolute -bottom-4 -right-4 h-24 w-24 text-amber-500/10 rotate-12" />
          </div>
        </div>
      </div>

      {/* Quick Modules */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4 ml-1">Quick Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {quickModules.map((mod, idx) => {
            const Icon = mod.icon;
            return (
              <Link key={idx} href={mod.href} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/60 hover:shadow-md hover:border-slate-300 transition-all group">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${mod.bg} ${mod.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="truncate">
                  <div className="text-sm font-bold text-slate-800 truncate">{mod.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{mod.desc}</div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

    </div>
  );
}
