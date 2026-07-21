"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function ProtectedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    const verifyAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setAuthenticated(false);
          router.push("/login");
        } else {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth verification error:", error);
        setAuthenticated(false);
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAuth();

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setAuthenticated(false);
          router.push("/login");
        } else {
          setAuthenticated(true);
        }
        setCheckingAuth(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Loading Screen while verifying session
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 p-[1px] shadow-lg shadow-indigo-500/30">
          <div className="h-full w-full bg-[#0d1322] rounded-[15px] flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          <span>Verifying Gatezly Security Credentials...</span>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  if (!authenticated) {
    return null;
  }

  return <>{children}</>;
}
