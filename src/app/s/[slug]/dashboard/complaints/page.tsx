"use client";

import React, { useState, useEffect } from "react";
import { MessageSquareWarning, Search, Loader2, Clock, CheckCircle2, Wrench } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSociety } from "@/components/providers/society-provider";

interface Complaint {
  id: string;
  title: string;
  description?: string;
  status: string;
  category?: string;
  created_at: string;
  resident_name?: string;
  resident_flat?: string;
}

export default function ComplaintsPage() {
  const { society } = useSociety();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("society_id", society.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setComplaints(data);
    } else if (error && error.code !== '42P01') {
      console.error(error);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    await supabase.from("complaints").update({ status: newStatus }).eq("id", id);
    await fetchComplaints();
    setActionLoadingId(null);
  };

  const filteredComplaints = complaints.filter((c) => {
    const titleMatch = (c.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatch = (c.resident_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "all") return titleMatch || nameMatch;
    return (titleMatch || nameMatch) && c.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <MessageSquareWarning className="h-6 w-6" />
            </div>
            <span>Complaints & Helpdesk</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Manage resident support requests, issue ticketing, and resolution tracking across the society.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        {/* Filters and Search */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center p-1 bg-slate-200/50 rounded-xl space-x-1 border border-slate-200/50 overflow-x-auto max-w-full">
            {['all', 'Open', 'In Progress', 'Resolved'].map(status => (
              <button 
                key={status}
                onClick={() => setFilter(status)} 
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap ${filter === status ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:text-slate-900"}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-auto">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search tickets by title or resident..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full xl:w-80 bg-white hover:border-slate-300 transition-colors shadow-sm"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4 font-semibold">Issue Title</th>
                <th className="px-6 py-4 font-semibold">Reported By</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold text-right">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-indigo-500" />
                    <p className="text-sm font-medium">Loading complaints...</p>
                  </td>
                </tr>
              ) : filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-slate-200">
                      <MessageSquareWarning className="h-5 w-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">No complaints found</p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900 text-sm max-w-[250px] truncate">{c.title}</div>
                      {c.description && (
                        <div className="text-xs text-slate-500 mt-1 max-w-[250px] truncate">{c.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 font-medium">{c.resident_name || "Unknown"}</div>
                      {c.resident_flat && (
                        <div className="text-xs text-slate-500 mt-0.5">Flat {c.resident_flat}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        {c.category || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === 'Open' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20">
                          <Clock className="h-3 w-3" /> Open
                        </span>
                      ) : c.status === 'In Progress' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          <Wrench className="h-3 w-3" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          <CheckCircle2 className="h-3 w-3" /> Resolved
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.status === 'Open' && (
                          <button 
                            onClick={() => handleUpdateStatus(c.id, "In Progress")}
                            disabled={actionLoadingId === c.id}
                            className="bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            Mark In Progress
                          </button>
                        )}
                        {(c.status === 'Open' || c.status === 'In Progress') && (
                          <button 
                            onClick={() => handleUpdateStatus(c.id, "Resolved")}
                            disabled={actionLoadingId === c.id}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        )}
                        {c.status === 'Resolved' && (
                          <span className="text-slate-400 text-sm italic pr-2">Closed</span>
                        )}
                      </div>
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
