"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  ExternalLink,
  Loader2,
  Plus,
  Search
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Societies Overview
          </h2>
          <p className="text-sm font-semibold text-slate-500">
            Manage and monitor all multi-tenant instances.
          </p>
        </div>
        <Link
          href="/superadmin/create"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Society</span>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-3xl font-black text-slate-900">{societies.length}</div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Societies</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Active Instances</h3>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-64 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm font-semibold">
            No societies found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Society Name</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{s.name}</div>
                          <div className="text-[10px] font-semibold text-slate-500">{s.address || "No address"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{s.slug}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                        {s.subscription_plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${
                        s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {s.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`/s/${s.slug}/dashboard`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-lg transition cursor-pointer"
                      >
                        <span>Open Portal</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
