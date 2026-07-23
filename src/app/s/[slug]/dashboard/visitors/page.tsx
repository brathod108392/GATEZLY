"use client";

import React, { useState, useEffect } from "react";
import { UserCheck, QrCode, Search, Check, X, Loader2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSociety } from "@/components/providers/society-provider";

interface Visitor {
  id: string;
  name: string;
  visitor_name?: string;
  purpose: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function VisitorsPage() {
  const { society } = useSociety();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchVisitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVisitors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitors")
      .select("*")
      .eq("society_id", society.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVisitors(data);
    } else if (error && error.code !== '42P01') {
      // Ignore table doesn't exist error for now if it hasn't been created yet
      console.error(error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    await supabase.from("visitors").update({ status: newStatus }).eq("id", id);
    await fetchVisitors();
    setActionLoadingId(null);
  };

  const filteredVisitors = visitors.filter((v) => {
    const nameMatch = (v.visitor_name || v.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = (v.phone || "").includes(searchQuery);
    if (filter === "all") return nameMatch || phoneMatch;
    return (nameMatch || phoneMatch) && v.status === filter;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <UserCheck className="h-6 w-6" />
            </div>
            <span>Visitors & Gate Entry</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Real-time visitor access logs, pre-approvals, and digital QR fast pass generation.
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-sm transition-all active:scale-95 cursor-pointer">
          <QrCode className="h-4 w-4" />
          <span>Issue Fast Pass</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        {/* Filters and Search */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center p-1 bg-slate-200/50 rounded-xl space-x-1 border border-slate-200/50">
            {['all', 'pending', 'approved', 'denied'].map(status => (
              <button 
                key={status}
                onClick={() => setFilter(status)} 
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${filter === status ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:text-slate-900"}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search visitors..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-80 bg-white hover:border-slate-300 transition-colors shadow-sm"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Visitor Name</th>
                <th className="px-6 py-4 font-semibold">Purpose</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Date & Time</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-indigo-500" />
                    <p className="text-sm font-medium">Loading visitor logs...</p>
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-slate-200">
                      <UserCheck className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No visitors found</p>
                  </td>
                </tr>
              ) : (
                filteredVisitors.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-sm">{v.visitor_name || v.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-700">{v.purpose || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {v.phone || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(v.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      {v.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : v.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <Check className="h-3 w-3" /> Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <X className="h-3 w-3" /> Denied
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {v.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(v.id, "approved")}
                            disabled={actionLoadingId === v.id}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(v.id, "denied")}
                            disabled={actionLoadingId === v.id}
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
