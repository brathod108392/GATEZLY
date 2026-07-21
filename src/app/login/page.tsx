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

  // Mode: "login" | "signup" | "forgot"
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

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
        // Redirect to dashboard if logged in
        router.push("/");
      }
    };
    checkSession();
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
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: userEmail,
            full_name: data.user.user_metadata?.full_name || fullName || "User",
            role: data.user.user_metadata?.role || "committee",
            updated_at: now,
          },
          { onConflict: "id" }
        );

        setMessage({ type: "success", text: "Authenticated successfully! Redirecting to Dashboard..." });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up & Profile Creation
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();
      const now = new Date().toISOString();

      // 1. Register Auth user with role in metadata
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            role: role,
          },
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setLoading(false);
        return;
      }

      // 2. Insert/Upsert into 'profiles' table with guaranteed email and updated_at
      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert(
            {
              id: data.user.id,
              email: cleanEmail,
              full_name: cleanName,
              role: role,
              created_at: now,
              updated_at: now,
            },
            { onConflict: "id" }
          );

        if (profileError) {
          console.error("Profiles table upsert error:", profileError.message);
        }
      }

      if (data.user && !data.session) {
        setMessage({
          type: "success",
          text: `Account created for ${cleanName} (${role.toUpperCase()})! Check your email to confirm your registration.`,
        });
      } else if (data.session) {
        setMessage({
          type: "success",
          text: `Account & ${role.toUpperCase()} profile created! Redirecting to Dashboard...`,
        });
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create account.";
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
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

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* Ambient glowing background effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-xl shadow-indigo-500/25 mb-2">
            <div className="h-full w-full bg-[#0d1322] rounded-[15px] flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-indigo-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            GATEZLY PORTAL
          </h1>
          <p className="text-xs text-slate-400">
            Smart Access & Security Intelligence Command
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel-glow rounded-2xl p-7 relative shadow-2xl space-y-6">
          {/* Top Mode Toggle (Login vs Sign Up) */}
          {mode !== "forgot" ? (
            <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                  mode === "login"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                }}
                className={`py-2 rounded-lg font-semibold transition cursor-pointer ${
                  mode === "signup"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <KeyRound className="h-4 w-4 text-indigo-400" />
                <span>Reset Password</span>
              </h2>
            </div>
          )}

          {/* Feedback Alert Banner */}
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 border ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{message.text}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setMessage(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer"
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
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-95 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
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
            </form>
          )}

          {/* SIGN UP FORM WITH ROLE SELECTION */}
          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Officer Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* ROLE SELECTION CARDS */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-medium text-slate-300">
                  Select System Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Committee Role Card */}
                  <div
                    onClick={() => setRole("committee")}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 relative ${
                      role === "committee"
                        ? "bg-indigo-600/15 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {role === "committee" && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Users className={`h-4 w-4 ${role === "committee" ? "text-indigo-400" : "text-slate-500"}`} />
                      <span className="font-bold text-xs">Committee</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Issue passes, verify guests, view entry logs.
                    </p>
                  </div>

                  {/* Admin Role Card */}
                  <div
                    onClick={() => setRole("admin")}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 relative ${
                      role === "admin"
                        ? "bg-purple-600/15 border-purple-500 text-white shadow-md shadow-purple-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    {role === "admin" && (
                      <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-purple-500 flex items-center justify-center text-white">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className={`h-4 w-4 ${role === "admin" ? "text-purple-400" : "text-slate-500"}`} />
                      <span className="font-bold text-xs">Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Full checkpoint rules, alerts, and user profiles.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Create {role === "admin" ? "Admin" : "Committee"} Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your registered email address and we will send you a secure link to reset your password.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-50"
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
                  className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Link back to Home */}
        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition">
            &larr; Return to Gatezly Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
