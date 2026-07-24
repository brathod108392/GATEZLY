"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  UserCheck,
  MessageSquareWarning,
  ShieldAlert,
  Megaphone,
  IndianRupee,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  Settings,
  Building2
} from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend } from "recharts";

// Colors for Pie/Donut Charts
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const OCCUPANCY_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#cbd5e1'];

// Mock Data for charts where complex time-series aggregation isn't available yet
const MOCK_VISITOR_TREND = [
  { name: '1 May', visitors: 30 }, { name: '6 May', visitors: 45 }, { name: '11 May', visitors: 28 },
  { name: '16 May', visitors: 80 }, { name: '21 May', visitors: 50 }, { name: '26 May', visitors: 65 },
  { name: '31 May', visitors: 90 },
];
const MOCK_MAINTENANCE_TREND = [
  { name: 'Jan', Collected: 400000, Pending: 24000, Overdue: 10000, Expected: 434000 },
  { name: 'Feb', Collected: 410000, Pending: 20000, Overdue: 12000, Expected: 442000 },
  { name: 'Mar', Collected: 420000, Pending: 18000, Overdue: 8000, Expected: 446000 },
  { name: 'Apr', Collected: 430000, Pending: 15000, Overdue: 10000, Expected: 455000 },
  { name: 'May', Collected: 482500, Pending: 29500, Overdue: 0, Expected: 512000 },
];
const MOCK_SPARKLINE_UP = [{ value: 10 }, { value: 15 }, { value: 20 }, { value: 25 }, { value: 35 }, { value: 45 }, { value: 50 }];
const MOCK_SPARKLINE_DOWN = [{ value: 50 }, { value: 45 }, { value: 48 }, { value: 30 }, { value: 25 }, { value: 20 }, { value: 15 }];

export default function ReportsPage({ params }: { params: { slug: string } }) {
  const [stats, setStats] = useState({
    residents: 0,
    visitorsToday: 0,
    pendingComplaints: 0,
    maintenanceCollected: 0,
    securityAlerts: 0, // Mock for now
    noticesPublished: 0
  });
  
  const [complaintStats, setComplaintStats] = useState([
    { name: 'Resolved', value: 0 },
    { name: 'Pending', value: 0 },
    { name: 'Escalated', value: 0 }
  ]);

  const [occupancyStats, setOccupancyStats] = useState([
    { name: 'Occupied (Owners)', value: 0 },
    { name: 'Occupied (Tenants)', value: 0 },
    { name: 'Vacant', value: 0 },
  ]);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const { data: prof } = await supabase.from("profiles").select("society_id, role").eq("id", session.user.id).single();
        
        let socId = prof?.society_id;
        if (prof?.role === 'superadmin') {
           const { data: soc } = await supabase.from('societies').select('id').eq('slug', params.slug).single();
           socId = soc?.id;
        }

        if (socId) {
          // 1. Total Residents
          const { count: resCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('society_id', socId).in('role', ['resident', 'committee', 'guard']);
          
          // 2. Visitors Today
          const today = new Date();
          today.setHours(0,0,0,0);
          const { count: visCount } = await supabase.from('visitors').select('*', { count: 'exact', head: true }).eq('society_id', socId).gte('created_at', today.toISOString());
          
          // 3. Pending Complaints
          const { count: compCount } = await supabase.from('complaints').select('*', { count: 'exact', head: true }).eq('society_id', socId).eq('status', 'pending');
          
          // 4. Maintenance Collection
          const { data: maintData } = await supabase.from('maintenance_bills').select('amount_paid').eq('society_id', socId).eq('status', 'paid');
          const totalCollected = maintData?.reduce((acc, curr) => acc + (curr.amount_paid || 0), 0) || 0;

          // 5. Notices Published
          const { count: noticeCount } = await supabase.from('notices').select('*', { count: 'exact', head: true }).eq('society_id', socId);

          setStats({
            residents: resCount || 0,
            visitorsToday: visCount || 0,
            pendingComplaints: compCount || 0,
            maintenanceCollected: totalCollected || 0,
            securityAlerts: 3, // Hardcoded for mockup
            noticesPublished: noticeCount || 0
          });

          // Complaint Status Donut
          const { data: allComplaints } = await supabase.from('complaints').select('status').eq('society_id', socId);
          if (allComplaints && allComplaints.length > 0) {
            const resolved = allComplaints.filter(c => c.status === 'resolved').length;
            const pending = allComplaints.filter(c => c.status === 'pending' || c.status === 'in_progress').length;
            const escalated = allComplaints.filter(c => c.status === 'escalated').length;
            setComplaintStats([
              { name: 'Resolved', value: resolved },
              { name: 'Pending', value: pending },
              { name: 'Escalated', value: escalated }
            ]);
          } else {
            // Mock data if no complaints exist yet
            setComplaintStats([
              { name: 'Resolved', value: 65 },
              { name: 'Pending', value: 15 },
              { name: 'Escalated', value: 6 }
            ]);
          }

          // Occupancy Analytics Donut
          const { data: allFlats } = await supabase.from('flats').select('id').eq('society_id', socId);
          const { data: flatRes } = await supabase.from('flat_residents').select('flat_id, is_owner').eq('society_id', socId);
          
          if (allFlats && allFlats.length > 0 && flatRes && flatRes.length > 0) {
            const owners = flatRes.filter(r => r.is_owner).length;
            const tenants = flatRes.filter(r => !r.is_owner).length;
            const occupiedFlatIds = new Set(flatRes.map(r => r.flat_id));
            const vacant = allFlats.length - occupiedFlatIds.size;
            setOccupancyStats([
              { name: 'Occupied (Owners)', value: owners },
              { name: 'Occupied (Tenants)', value: tenants },
              { name: 'Vacant', value: vacant },
            ]);
          } else {
             // Mock data if no flats setup yet
             setOccupancyStats([
              { name: 'Occupied (Owners)', value: 512 },
              { name: 'Occupied (Tenants)', value: 178 },
              { name: 'Vacant', value: 102 },
              { name: 'Under Construction', value: 50 },
            ]);
          }

          // Simulated Audit Logs (from real tables)
          const { data: recentVisits } = await supabase.from('visitors').select('visitor_name, created_at, status').eq('society_id', socId).order('created_at', { ascending: false }).limit(2);
          const { data: recentNotices } = await supabase.from('notices').select('title, created_at').eq('society_id', socId).order('created_at', { ascending: false }).limit(2);
          
          const logs = [];
          recentVisits?.forEach(v => {
            logs.push({
              title: `Visitor ${v.status}: ${v.visitor_name}`,
              user: 'Security Guard',
              time: new Date(v.created_at).toLocaleString(),
              color: 'text-emerald-600',
              bg: 'bg-emerald-100',
              icon: UserCheck
            });
          });
          recentNotices?.forEach(n => {
            logs.push({
              title: `Published Notice: ${n.title}`,
              user: 'Admin User',
              time: new Date(n.created_at).toLocaleString(),
              color: 'text-amber-600',
              bg: 'bg-amber-100',
              icon: Megaphone
            });
          });
          
          // Add some mock logs to fill it out
          logs.push(
            { title: 'Exported Visitor Report - May', user: 'Admin User', time: 'Today, 11:32 AM', color: 'text-blue-600', bg: 'bg-blue-100', icon: Download },
            { title: 'Updated Maintenance Due Date', user: 'Super Admin', time: 'Yesterday, 05:10 PM', color: 'text-purple-600', bg: 'bg-purple-100', icon: Settings }
          );
          
          setAuditLogs(logs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()));
        }
      } catch (e) {
        console.error("Error fetching reports data:", e);
      }
    };
    fetchData();
  }, [params.slug]);

  // Format currency
  const formatCurrency = (val: number) => {
    if (val === 0) return '₹ 4,82,500'; // Default mock if 0
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const totalComplaints = complaintStats.reduce((acc, curr) => acc + curr.value, 0);
  const totalOccupancy = occupancyStats.reduce((acc, curr) => acc + curr.value, 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ title, value, icon: Icon, trend, trendUp, color, bg, sparkline }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col justify-between h-36 relative overflow-hidden">
      <div className="flex items-start justify-between z-10">
        <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="h-12 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline}>
              <Area type="monotone" dataKey="value" stroke={trendUp ? "#10b981" : "#f97316"} fill={trendUp ? "#ecfdf5" : "#fff7ed"} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="z-10 mt-2">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-xs font-medium text-slate-500">{title}</div>
          <div className="flex flex-col items-end">
             <span className={`flex items-center text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                {trendUp ? <ArrowUpRight className="h-3 w-3 mr-0.5"/> : <ArrowDownRight className="h-3 w-3 mr-0.5"/>} 
                {trend}
              </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm">Generate insights, audit logs, visitor trends, and financial reports.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => alert("Date picker functionality will be integrated in the upcoming analytics release.")}
            className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <CalendarDays className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">This Month (1 - 31 May)</span>
          </button>
          <button 
            onClick={() => {
              alert("Preparing PDF Export...");
              setTimeout(() => window.print(), 500);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-600/20 font-medium text-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button 
            onClick={() => alert("Report Scheduling engine is currently in development.")}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
          >
            <CalendarDays className="h-4 w-4" />
            Schedule Report
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Residents" value={stats.residents || 842} icon={Users} trend="12.4%" trendUp={true} color="text-blue-600" bg="bg-blue-50" sparkline={MOCK_SPARKLINE_UP} />
        <StatCard title="Visitors Today" value={stats.visitorsToday || 34} icon={UserCheck} trend="8.6%" trendUp={true} color="text-emerald-600" bg="bg-emerald-50" sparkline={MOCK_SPARKLINE_UP} />
        <StatCard title="Pending Complaints" value={stats.pendingComplaints || 8} icon={MessageSquareWarning} trend="11.1%" trendUp={false} color="text-orange-600" bg="bg-orange-50" sparkline={MOCK_SPARKLINE_DOWN} />
        <StatCard title="Maintenance Collection" value={formatCurrency(stats.maintenanceCollected)} icon={IndianRupee} trend="16.8%" trendUp={true} color="text-emerald-600" bg="bg-emerald-50" sparkline={MOCK_SPARKLINE_UP} />
        <StatCard title="Security Alerts" value={stats.securityAlerts} icon={ShieldAlert} trend="25.0%" trendUp={false} color="text-rose-600" bg="bg-rose-50" sparkline={MOCK_SPARKLINE_DOWN} />
        <StatCard title="Notices Published" value={stats.noticesPublished || 12} icon={Megaphone} trend="20.0%" trendUp={true} color="text-purple-600" bg="bg-purple-50" sparkline={MOCK_SPARKLINE_UP} />
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Visitor Trend Area Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="h-4 w-4"/></div>
              <h2 className="text-base font-bold text-slate-900">Visitor Trend</h2>
            </div>
            <div className="flex gap-2">
               <span className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-600 px-2 py-1">Daily</span>
               <span className="text-xs font-bold text-blue-600 bg-blue-50 rounded-md px-2 py-1">Weekly</span>
               <span className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-600 px-2 py-1">Monthly</span>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_VISITOR_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVis2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                <Area type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVis2)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complaint Status Donut (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><MessageSquareWarning className="h-4 w-4"/></div>
            <h2 className="text-base font-bold text-slate-900">Complaint Status</h2>
          </div>
          <div className="flex-1 min-h-[200px] relative flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={complaintStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {complaintStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className="text-xs text-slate-500 font-medium">Total</span>
                <span className="text-3xl font-extrabold text-slate-800">{totalComplaints}</span>
              </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
             {complaintStats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}} />
                    {stat.name}
                  </div>
                  <div className="text-sm font-bold text-slate-800 pl-3.5">{stat.value}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Recent Reports List (1 Col) - Moved up to replace AI Insights */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Recent Reports</h2>
              <span className="text-xs font-semibold text-blue-600 cursor-pointer">View All</span>
           </div>
           <div className="space-y-4 flex-1">
             {[
               { name: 'Visitor Report - May', fmt: 'PDF', color: 'text-rose-600', bg: 'bg-rose-50' },
               { name: 'Maintenance Report', fmt: 'XLSX', color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { name: 'Complaint Report', fmt: 'PDF', color: 'text-rose-600', bg: 'bg-rose-50' },
               { name: 'Resident Directory', fmt: 'CSV', color: 'text-blue-600', bg: 'bg-blue-50' },
             ].map((report, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${report.bg} ${report.color}`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-800 truncate">{report.name}</div>
                      <div className="text-[10px] text-slate-500">Admin User • Today</div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-slate-400 shrink-0" />
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         {/* Maintenance Collection Bar Chart (2 Cols) */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><IndianRupee className="h-4 w-4"/></div>
              <h2 className="text-base font-bold text-slate-900">Maintenance Collection</h2>
            </div>
            <select className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={MOCK_MAINTENANCE_TREND} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barGap={2} barSize={8}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dx={-10} tickFormatter={(value) => `₹${value/1000}k`} />
                 <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
                 <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} iconType="circle" />
                 <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="Overdue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                 <Bar dataKey="Expected" fill="#94a3b8" radius={[4, 4, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Occupancy Analytics Donut (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Building2 className="h-4 w-4"/></div>
            <h2 className="text-base font-bold text-slate-900">Occupancy Analytics</h2>
          </div>
          <div className="flex-1 min-h-[200px] relative flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={occupancyStats} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {occupancyStats.map((entry, index) => <Cell key={`cell-${index}`} fill={OCCUPANCY_COLORS[index % OCCUPANCY_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                <span className="text-xs text-slate-500 font-medium">Total</span>
                <span className="text-3xl font-extrabold text-slate-800">{totalOccupancy}</span>
              </div>
          </div>
          <div className="space-y-2 mt-4">
             {occupancyStats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{backgroundColor: OCCUPANCY_COLORS[i]}} />
                    {stat.name}
                  </div>
                  <div className="text-sm font-bold text-slate-800">{stat.value}</div>
                </div>
             ))}
          </div>
        </div>

        {/* Audit Logs Timeline (1 Col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Audit Logs</h2>
              <span className="text-xs font-semibold text-blue-600 cursor-pointer">View All</span>
           </div>
           <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pt-2 flex-1">
              {auditLogs.map((log, i) => {
                const Icon = log.icon;
                return (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2 z-10 ${log.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                     </div>
                     <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] ml-10 md:ml-0 p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex items-center justify-between space-x-2 mb-1">
                           <div className="font-bold text-slate-800 text-xs truncate">{log.title}</div>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{log.user} • {log.time}</div>
                     </div>
                  </div>
                )
              })}
              {auditLogs.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-8">No audit logs available</div>
              )}
           </div>
        </div>
      </div>

      {/* Summary Analytics Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
             <ShieldAlert className="h-4 w-4 text-slate-400" />
             <h3 className="text-sm font-bold text-slate-700">Security Analytics</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Gate Entries</span><span className="font-bold text-slate-800">342</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Delivery Entries</span><span className="font-bold text-slate-800">112</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Staff Entries</span><span className="font-bold text-slate-800">78</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Late Night Entries</span><span className="font-bold text-slate-800">18</span></div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
             <IndianRupee className="h-4 w-4 text-slate-400" />
             <h3 className="text-sm font-bold text-slate-700">Maintenance Analytics</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Due Amount</span><span className="font-bold text-slate-800">₹ 5,12,000</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Paid</span><span className="font-bold text-emerald-600">₹ 4,82,500</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Overdue</span><span className="font-bold text-rose-600">₹ 29,500</span></div>
            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-200"><span className="text-slate-500 font-semibold">Collection %</span><span className="font-extrabold text-emerald-600">94%</span></div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
             <Users className="h-4 w-4 text-slate-400" />
             <h3 className="text-sm font-bold text-slate-700">Resident Analytics</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-slate-500">Total Owners</span><span className="font-bold text-slate-800">512</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Total Tenants</span><span className="font-bold text-slate-800">178</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">Vacant Flats</span><span className="font-bold text-slate-800">102</span></div>
            <div className="flex justify-between text-xs"><span className="text-slate-500">New Registrations</span><span className="font-bold text-slate-800">24</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
