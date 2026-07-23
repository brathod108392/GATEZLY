"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Users,
  Check
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "login" | "signup" | "forgot" | "magic"
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "magic">("login");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "committee">("committee");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If they just clicked a password reset link, don't redirect to dashboard
        const hash = window.location.hash;
        if (!hash.includes("type=recovery")) {
          // Fetch profile to determine redirect
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, society_id")
            .eq("id", session.user.id)
            .single();

          if (profile?.role === 'superadmin') {
            router.push("/superadmin");
          } else if (profile?.society_id) {
            const { data: society } = await supabase
              .from("societies")
              .select("slug")
              .eq("id", profile.society_id)
              .single();
            if (society) {
              router.push(`/s/${society.slug}/dashboard`);
            }
          }
        }
      }

      // Check for expired reset link error in URL hash
      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash;
        if (hash.includes("error_code=otp_expired")) {
          setMessage({
            type: "error",
            text: "Your password reset link has expired or was already used. Please request a new one."
          });
          setMode("forgot");
          // Clean up the hash
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/update-password");
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (data.session && data.user) {
        // Ensure email & updated_at are set in profiles table on login
        const now = new Date().toISOString();
        const userEmail = (data.user.email || email).trim().toLowerCase();
        
        // Fetch profile to determine redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, society_id")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          await supabase.from("profiles").update({ updated_at: now }).eq("id", data.user.id);
          setMessage({ type: "success", text: "Authenticated successfully! Redirecting..." });
          
          setTimeout(async () => {
            if (profile.role === 'superadmin') {
              router.push("/superadmin");
            } else if (profile.society_id) {
              const { data: society } = await supabase
                .from("societies")
                .select("slug")
                .eq("id", profile.society_id)
                .single();
              if (society) {
                router.push(`/s/${society.slug}/dashboard`);
              }
            } else {
              setMessage({ type: "error", text: "Account has no society assigned." });
              setLoading(false);
            }
          }, 800);
        } else {
           setMessage({ type: "error", text: "Profile not found." });
           setLoading(false);
        }
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };


  // Handle Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Password reset instructions have been sent to your email address.",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send reset email.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Magic Link (OTP)
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Magic Link sent! Please check your email to securely sign in.",
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to send Magic Link.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 shadow-xl shadow-blue-600/25 mb-2">
            <ShieldCheck className="h-7 w-7 text-white" />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            GATEZLY PORTAL
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Smart Access & Security Intelligence Command
          </p>
        </div>

        {/* Blue & White Card Panel */}
        <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-xl space-y-6">
          {/* Top Mode Toggle (Login) */}
          {mode === "login" ? (
            <div className="grid grid-cols-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <button
                type="button"
                className="py-2 rounded-lg font-bold transition bg-blue-600 text-white shadow-sm"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className="p-1 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <KeyRound className="h-4 w-4 text-blue-600" />
                <span>{mode === "forgot" ? "Reset Password" : "Sign In with Magic Link"}</span>
              </h2>
            </div>
          )}

          {/* Feedback Alert Banner */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 border ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{message.text}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="officer@gatezly.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setMessage(null);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-4 text-center border-t border-slate-100 mt-4">
                <p className="text-xs text-slate-500 mb-2">Or sign in without a password</p>
                <button
                  type="button"
                  onClick={() => {
                    setMode("magic");
                    setMessage(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span>Send Magic Link</span>
                </button>
              </div>
            </form>
          )}



          {/* FORGOT PASSWORD FORM */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address and we will send you a secure link to reset your password.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="officer@gatezly.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Password Reset Email</span>
                    <Mail className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setMessage(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer font-semibold"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* MAGIC LINK FORM */}
          {mode === "magic" && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your email address to receive a secure, passwordless login link.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="officer@gatezly.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Sending Magic Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <Mail className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer Link back to Home */}
        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-blue-600 font-semibold transition">
            &larr; Return to Gatezly Portal Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
