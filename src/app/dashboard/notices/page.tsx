"use client";

import React, { useState, useEffect } from "react";
import { Megaphone, Plus, Loader2, X, AlertTriangle, Calendar, User } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Notice {
  id: string;
  title: string;
  body: string;
  is_emergency: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    role: string;
  } | null;
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    is_emergency: false,
  });

  useEffect(() => {
    fetchCurrentUserRole();
    fetchNotices();
  }, []);

  const fetchCurrentUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data) {
        setCurrentUserRole(data.role);
      }
    }
  };

  const fetchNotices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notices")
      .select(`
        *,
        profiles (
          full_name,
          role
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching notices:", error);
    } else {
      setNotices((data as unknown as Notice[]) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("notices").insert({
        title: formData.title,
        body: formData.body,
        is_emergency: formData.is_emergency,
        author_id: user.id
      });

      if (error) throw error;

      setIsModalOpen(false);
      setFormData({ title: "", body: "", is_emergency: false });
      fetchNotices();
    } catch (err: unknown) {
      console.error("Notice Insert Error:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      setActionError(e.message || (typeof e === 'object' ? JSON.stringify(e) : String(e)));
    } finally {
      setActionLoading(false);
    }
  };

  const canManage = currentUserRole === "admin" || currentUserRole === "committee";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center space-x-2">
            <Megaphone className="h-6 w-6 text-indigo-600" />
            <span>Digital Notice Board</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast society notices, circulars, and emergency alerts instantly to all residents.
          </p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Notice</span>
          </button>
        )}
      </div>

      {/* Notices List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-indigo-500" />
          <p className="text-sm font-medium">Loading notices...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Notices Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            There are currently no active announcements on the board.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notices.map((notice) => (
            <div 
              key={notice.id} 
              className={`bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col ${
                notice.is_emergency ? 'border-red-300 shadow-red-500/10' : 'border-slate-200'
              }`}
            >
              {notice.is_emergency && (
                <div className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex items-center space-x-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Emergency Alert</span>
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                  {notice.title}
                </h3>
                <p className="text-sm text-slate-600 whitespace-pre-wrap flex-1">
                  {notice.body}
                </p>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-3.5 w-3.5" />
                    <span className="font-medium text-slate-700">{notice.profiles?.full_name || 'Admin'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Notice Modal */}
      {isModalOpen && canManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Megaphone className="h-5 w-5 text-indigo-600" />
                <span>Create New Notice</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {actionError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
                  {actionError}
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-slate-700">Notice Title</label>
                <input 
                  type="text" 
                  required 
                  maxLength={100}
                  placeholder="e.g. Scheduled Water Maintenance"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Notice Content</label>
                <textarea 
                  required 
                  rows={5}
                  placeholder="Write the full details of the notice here..."
                  value={formData.body} 
                  onChange={e => setFormData({...formData, body: e.target.value})} 
                  className="w-full mt-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <input 
                  type="checkbox" 
                  id="is_emergency" 
                  checked={formData.is_emergency} 
                  onChange={e => setFormData({...formData, is_emergency: e.target.checked})} 
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-5 w-5 cursor-pointer" 
                />
                <div className="flex flex-col">
                  <label htmlFor="is_emergency" className="text-sm font-bold text-slate-800 cursor-pointer">
                    Mark as Emergency
                  </label>
                  <span className="text-xs text-slate-500">
                    Highlights the notice in red to grab immediate attention.
                  </span>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading} 
                  className="flex-1 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
