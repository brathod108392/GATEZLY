"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Building2, Loader2, ArrowRight, ShieldCheck, MapPin } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    address: ""
  });

  useEffect(() => {
    // Check if they already have a society, if so, bounce them to dashboard
    const checkSociety = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("society_id")
          .eq("id", session.user.id)
          .single();
          
        if (profile?.society_id) {
          router.push("/dashboard");
        } else {
          setChecking(false);
        }
      } else {
        router.push("/login");
      }
    };
    
    checkSociety();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Create the Society
      const { data: newSociety, error: societyError } = await supabase
        .from("societies")
        .insert({
          name: formData.name,
          address: formData.address
        })
        .select()
        .single();

      if (societyError) throw societyError;

      // 2. Update the user's profile to belong to this society and make them an admin
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ 
          society_id: newSociety.id,
          role: "admin"
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Refresh page/session and go to dashboard
      window.location.href = "/dashboard";
      
    } catch (err: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      setError(e.message || "An error occurred creating your society.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Setup Your Workspace
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Welcome to Gatezly! Create your society profile to get started with your new digital management portal.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-start space-x-2">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                Society / Apartment Name
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. Prestige Shantiniketan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-11 block w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-slate-700">
                Full Address
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute top-3.5 left-3.5 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400" />
                </div>
                <textarea
                  id="address"
                  required
                  rows={3}
                  placeholder="Enter the complete registered address..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="pl-11 block w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition resize-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-600/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span>Launch Portal</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
