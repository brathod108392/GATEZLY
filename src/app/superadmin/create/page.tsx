"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, ArrowLeft, Building2, Save, AlertCircle, MapPin, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CreateSocietyPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [plan, setPlan] = useState("basic");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

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
        setSuccess(true);
        // Automatically redirect back to superadmin dashboard after a brief animation
        setTimeout(() => {
          router.push(`/superadmin`);
        }, 800);
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      setErrorMsg(error.message || "An error occurred while creating the society.");
    } finally {
      if (!success) setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div className="flex items-center space-x-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <Link
          href="/superadmin"
          className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Create New Society</h2>
          <p className="text-sm text-slate-500 mt-1">Provision a brand new tenant instance.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
        <div className="p-6 sm:p-10">
          {errorMsg && (
            <div className="mb-8 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 flex items-start space-x-3 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <span className="font-medium leading-relaxed">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-8">
            <div className="space-y-6">
              {/* Society Name */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[150ms] fill-mode-both">
                <label className="block text-sm font-medium text-slate-700 mb-2">Society Name</label>
                <div className="relative">
                  <Building2 className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="E.g., Sunrise Apartments"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm"
                  />
                </div>
              </div>

              {/* URL Slug */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[200ms] fill-mode-both">
                <label className="block text-sm font-medium text-slate-700 mb-2">URL Slug</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all bg-slate-50/50">
                  <span className="px-4 py-3 bg-slate-100/50 text-slate-500 border-r border-slate-200 text-sm flex items-center font-mono">
                    gatezly.com/s/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, ""))}
                    className="flex-1 px-4 py-3 bg-transparent focus:outline-none text-indigo-600 text-sm font-medium font-mono"
                  />
                </div>
                <p className="text-[13px] text-slate-500 mt-2 font-normal flex items-center gap-1.5">
                  This will be the unique URL for this society&apos;s portal.
                </p>
              </div>

              {/* Address */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[250ms] fill-mode-both">
                <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                <div className="relative">
                  <MapPin className="h-5 w-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <textarea
                    required
                    rows={3}
                    placeholder="Full address of the society"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm resize-none"
                  />
                </div>
              </div>

              {/* Subscription Plan */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[300ms] fill-mode-both">
                <label className="block text-sm font-medium text-slate-700 mb-3">Subscription Plan</label>
                <div className="grid grid-cols-2 gap-4">
                  {['basic', 'premium'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPlan(p)}
                      className={`relative py-4 px-4 rounded-xl border-2 transition-all duration-200 text-sm font-medium flex flex-col items-start gap-1 overflow-hidden ${
                        plan === p 
                          ? 'bg-indigo-50/50 border-indigo-600 text-indigo-700' 
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <span className="capitalize">{p}</span>
                      <span className={`text-xs font-normal ${plan === p ? 'text-indigo-500/80' : 'text-slate-400'}`}>
                        {p === 'basic' ? 'Standard features' : 'All modules included'}
                      </span>
                      {plan === p && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 animate-in fade-in duration-500 delay-[350ms] fill-mode-both">
              <button
                type="submit"
                disabled={loading || !name || !slug || success}
                className={`
                  w-full py-3.5 px-4 rounded-xl text-white font-medium text-sm 
                  flex items-center justify-center space-x-2 transition-all duration-200
                  active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none
                  ${success 
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25' 
                    : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 shadow-lg shadow-slate-900/20'
                  }
                `}
              >
                {success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 animate-in zoom-in" />
                    <span>Society Created Successfully</span>
                  </>
                ) : loading ? (
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
