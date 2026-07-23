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
  Layers,
  MapPin,
  MoreVertical,
  Settings2,
  Power,
  PowerOff,
  Trash2,
  CreditCard,
  AlertTriangle,
  X,
  CreditCard as PaymentIcon
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
  is_deleted: boolean;
  payment_status: string;
}

export default function SuperAdminDashboard() {
  const [societies, setSocieties] = useState<Society[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, society: Society | null}>({isOpen: false, society: null});
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  const [billingModal, setBillingModal] = useState<{isOpen: boolean, society: Society | null}>({isOpen: false, society: null});
  const [billingForm, setBillingForm] = useState({ subscription_plan: "", payment_status: "", modules: {} as Record<string, boolean> });
  
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSocieties();
    const handleClick = () => setOpenDropdownId(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
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
    !s.is_deleted && 
    (s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.slug.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleStatus = async (society: Society) => {
    try {
      const res = await fetch(`/api/societies/${society.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !society.is_active })
      });
      if (!res.ok) throw new Error("Failed to update status");
      fetchSocieties();
    } catch (e) {
      console.error(e);
    }
  };

  const softDelete = async () => {
    if (!deleteModal.society) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/societies/${deleteModal.society.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_deleted: true })
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDeleteModal({isOpen: false, society: null});
      setDeleteConfirmText("");
      fetchSocieties();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const updateBilling = async () => {
    if (!billingModal.society) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/societies/${billingModal.society.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription_plan: billingForm.subscription_plan,
          payment_status: billingForm.payment_status,
          modules: billingForm.modules
        })
      });
      if (!res.ok) throw new Error("Failed to update billing");
      setBillingModal({isOpen: false, society: null});
      fetchSocieties();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
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
            <div className="text-2xl font-black text-slate-900">{societies.filter(s=>!s.is_deleted).length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total Societies</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 ring-1 ring-emerald-100">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{societies.filter(s => s.is_active && !s.is_deleted).length}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Active Instances</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s, idx) => (
              <div 
                key={s.id} 
                className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden relative"
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
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                      s.is_active 
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' 
                        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                    }`}>
                      {s.is_active ? 'Active' : 'Disabled'}
                    </span>
                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === s.id ? null : s.id); }}
                        className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openDropdownId === s.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/50 py-1 z-20 overflow-hidden" onClick={e => e.stopPropagation()}>
                          <button onClick={() => { toggleStatus(s); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                            {s.is_active ? <PowerOff className="h-4 w-4 text-rose-500" /> : <Power className="h-4 w-4 text-emerald-500" />}
                            <span>{s.is_active ? "Suspend Society" : "Reactivate Society"}</span>
                          </button>
                          <button onClick={() => { 
                            setBillingForm({
                              subscription_plan: s.subscription_plan || 'free',
                              payment_status: s.payment_status || 'unpaid',
                              modules: s.modules || {}
                            });
                            setBillingModal({isOpen: true, society: s}); 
                            setOpenDropdownId(null); 
                          }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2">
                            <Settings2 className="h-4 w-4 text-indigo-500" />
                            <span>Edit Billing & Modules</span>
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={() => { setDeleteModal({isOpen: true, society: s}); setOpenDropdownId(null); }} className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center space-x-2">
                            <Trash2 className="h-4 w-4" />
                            <span>Soft Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
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
                        <PaymentIcon className="h-3 w-3" />
                        <span>Payment</span>
                      </span>
                      <span className={`text-sm font-semibold capitalize ${s.payment_status === 'paid' ? 'text-emerald-600' : s.payment_status === 'overdue' ? 'text-rose-600' : 'text-amber-600'}`}>
                        {s.payment_status || 'unpaid'}
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

      {/* Delete Modal */}
      {deleteModal.isOpen && deleteModal.society && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-600 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center ring-1 ring-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Delete Society?</h3>
                <p className="text-sm text-slate-500">This action will soft-delete the society.</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Please type <span className="font-bold text-slate-900 select-all">{deleteModal.society.name}</span> to confirm.
            </p>
            
            <input 
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 mb-6"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type society name..."
            />
            
            <div className="flex space-x-3">
              <button 
                onClick={() => { setDeleteModal({isOpen: false, society: null}); setDeleteConfirmText(""); }}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={deleteConfirmText !== deleteModal.society.name || actionLoading}
                onClick={softDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Modal */}
      {billingModal.isOpen && billingModal.society && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 ring-1 ring-indigo-100">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Billing & Modules</h3>
                  <p className="text-xs text-slate-500">{billingModal.society.name}</p>
                </div>
              </div>
              <button onClick={() => setBillingModal({isOpen: false, society: null})} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subscription Plan</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={billingForm.subscription_plan}
                  onChange={e => setBillingForm({...billingForm, subscription_plan: e.target.value})}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Payment Status</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  value={billingForm.payment_status}
                  onChange={e => setBillingForm({...billingForm, payment_status: e.target.value})}
                >
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Active Modules</label>
                <div className="space-y-2">
                  {['visitors', 'complaints', 'amenities', 'payments'].map(mod => (
                    <label key={mod} className="flex items-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                        checked={!!billingForm.modules[mod]}
                        onChange={e => setBillingForm({...billingForm, modules: {...billingForm.modules, [mod]: e.target.checked}})}
                      />
                      <span className="ml-3 text-sm font-medium text-slate-700 capitalize">{mod}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button 
                onClick={() => setBillingModal({isOpen: false, society: null})}
                className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={actionLoading}
                onClick={updateBilling}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center shadow-lg shadow-indigo-600/20"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
