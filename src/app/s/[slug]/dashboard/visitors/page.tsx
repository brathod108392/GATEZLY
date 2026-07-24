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
  vehicle_type?: string;
  person_count?: number;
  created_at: string;
}

export default function VisitorsPage() {
  const { society } = useSociety();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ visitor_name: "", purpose: "", phone: "", vehicle_type: "None", person_count: "1" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

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

  const handleCreatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");

    const { error } = await supabase.from("visitors").insert([
      { 
        society_id: society.id, 
        visitor_name: formData.visitor_name,
        purpose: formData.purpose,
        phone: formData.phone,
        vehicle_type: formData.vehicle_type,
        person_count: parseInt(formData.person_count, 10) || 1,
        status: "approved"
      }
    ]);

    if (error) {
      setActionError(error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ visitor_name: "", purpose: "", phone: "", vehicle_type: "None", person_count: "1" });
      fetchVisitors();
    }
    setActionLoading(false);
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
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
                      <div className="text-sm text-slate-700 font-medium">{v.purpose || "N/A"}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {v.vehicle_type !== 'None' ? v.vehicle_type : 'No Vehicle'} · {v.person_count || 1} {v.person_count === 1 ? 'Person' : 'People'}
                      </div>
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

      {/* Issue Fast Pass Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-600" /> Issue Fast Pass
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreatePass} className="p-6 space-y-4">
              {actionError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                  {actionError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Visitor Name</label>
                <input 
                  type="text" 
                  value={formData.visitor_name}
                  onChange={e => setFormData({...formData, visitor_name: e.target.value})}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  required
                  placeholder="e.g. 555-0198"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-sm font-semibold text-slate-700">Purpose of Visit</label>
                  <select 
                    value={formData.purpose}
                    onChange={e => setFormData({...formData, purpose: e.target.value})}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  >
                    <option value="" disabled>Select purpose...</option>
                    <option value="Guest">Guest</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Cab">Cab</option>
                    <option value="Domestic Help">Domestic Help</option>
                    <option value="Service/Repair">Service/Repair</option>
                    <option value="Event Attendee">Event Attendee</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 w-1/3">
                  <label className="text-sm font-semibold text-slate-700">Persons</label>
                  <input 
                    type="number"
                    min="1"
                    value={formData.person_count}
                    onChange={e => setFormData({...formData, person_count: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Vehicle</label>
                <div className="flex gap-2">
                  {['None', 'Two Wheeler', 'Car'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFormData({...formData, vehicle_type: v})}
                      className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all border ${
                        formData.vehicle_type === v 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/20 disabled:opacity-70 flex items-center justify-center min-w-[140px]"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Pass"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
