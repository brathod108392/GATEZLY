"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Plus, Search, Loader2, AlertTriangle, Pin, Calendar, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useSociety } from "@/components/providers/society-provider";

interface Notice {
  id: string;
  title: string;
  body: string;
  is_emergency: boolean;
  category: string;
  pinned: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function NoticesPage() {
  const { society } = useSociety();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [formData, setFormData] = useState({ title: "", body: "", category: "General", is_emergency: false, pinned: false });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select("*, profiles(full_name)")
      .eq("society_id", society.id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotices(data);
    }
    setLoading(false);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");

    const { error } = await supabase.from("notices").insert([
      { ...formData, society_id: society.id }
    ]);

    if (error) {
      setActionError(error.message);
    } else {
      setIsModalOpen(false);
      setFormData({ title: "", body: "", category: "General", is_emergency: false, pinned: false });
      fetchNotices();
    }
    setActionLoading(false);
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    await supabase.from("notices").update({ pinned: !currentPinned }).eq("id", id);
    fetchNotices();
  };

  const filteredNotices = notices.filter((n) => {
    const match = (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || (n.body || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "all") return match;
    if (filter === "emergency") return match && n.is_emergency;
    return match && n.category.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Megaphone className="h-6 w-6" />
            </div>
            <span>Digital Notice Board</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Broadcast important updates, events, and emergency alerts to all residents.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        {/* Filters and Search */}
        <div className="p-5 border-b border-slate-200/80 bg-slate-50/50 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center p-1 bg-slate-200/50 rounded-xl space-x-1 border border-slate-200/50 overflow-x-auto max-w-full">
            {['all', 'General', 'Maintenance', 'emergency'].map(cat => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)} 
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all capitalize whitespace-nowrap ${filter === cat ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" : "text-slate-600 hover:text-slate-900"}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full xl:w-auto">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search notices..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 w-full xl:w-80 bg-white hover:border-slate-300 transition-colors shadow-sm"
            />
          </div>
        </div>
        
        {/* Notices Grid */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-indigo-500" />
              <p className="text-sm font-medium">Loading broadcasts...</p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 ring-1 ring-slate-200">
                <Megaphone className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700">No notices found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotices.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => setSelectedNotice(n)}
                  className={`rounded-2xl p-6 border ${n.is_emergency ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' : 'bg-white border-slate-200 hover:border-slate-300'} shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col h-full relative group`}
                >
                  {n.pinned && (
                    <div className="absolute top-4 right-4 text-indigo-500">
                      <Pin className="h-5 w-5 fill-indigo-500" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${n.is_emergency ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                      {n.category}
                    </span>
                    {n.is_emergency && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                        <AlertTriangle className="h-3 w-3" /> Emergency
                      </span>
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${n.is_emergency ? 'text-rose-900' : 'text-slate-900'}`}>{n.title}</h3>
                  <p className="text-sm text-slate-600 mb-6 flex-grow leading-relaxed">{n.body}</p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(n.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(n.id, n.pinned);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {n.pinned ? 'Unpin' : 'Pin to Top'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Notice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">New Broadcast</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateNotice} className="p-6 space-y-5">
              {actionError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                  {actionError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Notice Title</label>
                <input 
                  type="text" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                  placeholder="e.g. Water Supply Interruption"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="General">General Announcement</option>
                  <option value="Maintenance">Maintenance & Repairs</option>
                  <option value="Event">Community Event</option>
                  <option value="Security">Security Alert</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Message Body</label>
                <textarea 
                  value={formData.body}
                  onChange={e => setFormData({...formData, body: e.target.value})}
                  required
                  rows={4}
                  placeholder="Type your notice content here..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.pinned}
                    onChange={e => setFormData({...formData, pinned: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm font-medium text-slate-700">Pin to top</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.is_emergency}
                    onChange={e => setFormData({...formData, is_emergency: e.target.checked})}
                    className="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-600"
                  />
                  <span className="text-sm font-medium text-rose-600">Mark as Emergency</span>
                </label>
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
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Broadcast Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Read Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4" onClick={() => setSelectedNotice(null)}>
          <div 
            className={`bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${selectedNotice.is_emergency ? 'border-rose-200' : 'border-slate-200/50'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-start justify-between p-6 border-b ${selectedNotice.is_emergency ? 'bg-rose-50 border-rose-100' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${selectedNotice.is_emergency ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                  {selectedNotice.is_emergency ? <AlertTriangle className="h-6 w-6" /> : <Megaphone className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedNotice.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${selectedNotice.is_emergency ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {selectedNotice.category}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(selectedNotice.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-8">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotice.body}
              </p>
              
              {selectedNotice.profiles?.full_name && (
                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-medium">Sent by:</span> {selectedNotice.profiles.full_name}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedNotice(null)}
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm transition-all ${selectedNotice.is_emergency ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
