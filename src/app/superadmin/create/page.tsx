"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, ArrowLeft, Building2, Save, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CreateSocietyPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState("basic");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.from("societies").insert({
        name: name.trim(),
        slug: slug.trim(),
        address: address.trim(),
        subscription_plan: plan,
        modules: {
          visitors: true,
          complaints: true,
          notices: true,
          maintenance: true,
          parking: false
        }
      }).select().single();

      if (error) {
        if (error.code === '23505') { // Unique violation
           setErrorMsg("This slug is already taken. Please choose another one.");
        } else {
           throw error;
        }
      } else if (data) {
        // Automatically redirect to the society dashboard
        router.push(`/s/${data.slug}/dashboard`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An error occurred while creating the society.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Link
          href="/superadmin"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 transition shadow-sm"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create New Society</h2>
          <p className="text-sm font-semibold text-slate-500">Provision a brand new tenant instance.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Society Name</label>
              <div className="relative">
                <Building2 className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="E.g., Sunrise Apartments"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition text-sm font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">URL Slug</label>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-indigo-600 transition bg-slate-50">
                <span className="px-4 py-2.5 bg-slate-100 text-slate-500 border-r border-slate-200 text-sm font-semibold flex items-center">
                  gatezly.com/s/
                </span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                  className="flex-1 px-4 py-2.5 bg-transparent focus:outline-none text-slate-900 text-sm font-bold font-mono"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">This will be the unique URL for this society's portal.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Address</label>
              <textarea
                required
                rows={3}
                placeholder="Full address of the society"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Subscription Plan</label>
              <div className="grid grid-cols-2 gap-3">
                {['basic', 'premium'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlan(p)}
                    className={`py-3 px-4 rounded-xl border transition text-sm font-bold capitalize ${
                      plan === p 
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || !name || !slug}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Provisioning Instance...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Create Society Instance</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
