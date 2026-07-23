"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Activity,
  Calendar,
  Layers,
  MapPin
} from "lucide-react";

interface Society {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  is_active: boolean;
  address: string;
  modules: Record<string, boolean>;
  subscription_plan: string;
}

export default function SuperAdminDashboard() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const { data, error } = await supabase
        .from("societies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSocieties(data || []);
    } catch (error) {
      console.error("Error fetching societies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = societies.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Societies Overview
          </h2>
          <p className="text-sm font-medium text-slate-500 max-w-xl">
            Manage and monitor all multi-tenant instances across the platform.
          </p>
        </div>
        <Link
          href="/superadmin/create"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-slate-900/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Society</span>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 ring-1 ring-indigo-100">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{societies.length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Societies</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 ring-1 ring-emerald-100">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{societies.filter(s => s.is_active).length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active Instances</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="flex items-center">
          <div className="relative w-full max-w-md">
            <Search className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search societies by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-white border border-slate-200/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Loading / Empty / Grid States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
            <p className="text-sm font-medium text-slate-500">Loading societies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No societies found</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {search ? "Try adjusting your search terms." : "Get started by creating your first society instance."}
            </p>
            {!search && (
              <Link
                href="/superadmin/create"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-sm font-bold rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Society</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s, idx) => (
              <div 
                key={s.id} 
                className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 ring-1 ring-indigo-100/50">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition-colors line-clamp-1">{s.name}</h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{s.slug}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                    s.is_active 
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
                      : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                  }`}>
                    {s.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                
                {/* Card Body */}
                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start space-x-2.5 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-600 line-clamp-2 leading-snug">
                      {s.address || <span className="italic text-slate-400">No address provided</span>}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex flex-col space-y-1">
                      <span className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Layers className="h-3 w-3" />
                        <span>Plan</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-800 capitalize">
                        {s.subscription_plan}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <Calendar className="h-3 w-3" />
                        <span>Created</span>
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                  <a
                    href={`/s/${s.slug}/dashboard`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-slate-900 text-slate-700 hover:text-white text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-900 transition-all shadow-sm"
                  >
                    <span>Open Portal</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
