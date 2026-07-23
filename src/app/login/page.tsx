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
  Sparkles
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "login" | "signup" | "forgot" | "magic"
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "magic">("login");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // If they just clicked a password reset link or invite link, don't redirect to dashboard
        const hash = window.location.hash;
        if (hash.includes("type=recovery") || hash.includes("type=invite")) {
          router.push("/update-password");
        } else {
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

        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash;
          if (hash.includes("error_code=otp_expired")) {
            setMessage({
              type: "error",
              text: "Your password reset link has expired or was already used. Please request a new one."
            });
            setMode("forgot");
            window.history.replaceState(null, "", window.location.pathname);
          }
        }

        // Check for URL query params (error states)
        if (typeof window !== "undefined" && window.location.search) {
          const params = new URLSearchParams(window.location.search);
          const errorParam = params.get("error");
          if (errorParam) {
            let errorText = "An error occurred.";
            if (errorParam === "account_deactivated") errorText = "Your account has been deactivated.";
            else if (errorParam === "society_deleted") errorText = "Your society no longer exists on Gatezly.";
            else if (errorParam === "society_suspended") errorText = "Your society portal has been temporarily suspended.";
            else if (errorParam === "maintenance_mode") errorText = "Gatezly is currently undergoing maintenance. Please try again later.";
            
            setMessage({ type: "error", text: errorText });
            // Clean up the URL
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
    <div className="min-h-screen w-full flex bg-slate-50 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Left Panel - Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-[60%] -right-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-[20%] left-[40%] w-[40%] h-[40%] rounded-full bg-violet-500/10 blur-[80px] animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
          <Link href="/" className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-8 group transition-transform hover:scale-105">
            <ShieldCheck className="h-10 w-10 text-white group-hover:text-blue-300 transition-colors" />
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-white mb-4">
            GATEZLY PORTAL
          </h1>
          <p className="text-lg text-blue-200/80 font-medium leading-relaxed mb-12">
            Smart Access & Security Intelligence Command. <br className="hidden xl:block" /> Experience seamless management and total control.
          </p>
          
          <div className="flex items-center gap-6 text-sm font-semibold text-white/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Secure Access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Real-time Sync</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <span>Advanced Logging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-slate-50">
        
        {/* Subtle mobile background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none lg:hidden" />

        <div className="w-full max-w-md relative z-10">
          
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8 space-y-3">
            <Link href="/" className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-600/25">
              <ShieldCheck className="h-7 w-7 text-white" />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              GATEZLY
            </h1>
          </div>

          <div className="relative group">
            {/* Animated subtle glow around card */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-indigo-500/30 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
            
            {/* Form Card */}
            <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-white shadow-2xl shadow-slate-200/50">
              
              {/* Header / Mode Indicator */}
              <div className="mb-8">
                {mode === "login" ? (
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                    <p className="text-sm text-slate-500 font-medium">Please enter your details to sign in.</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setMessage(null);
                      }}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                      {mode === "forgot" ? (
                        <>
                          <KeyRound className="h-5 w-5 text-blue-600" />
                          <span>Reset Password</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 text-blue-600" />
                          <span>Magic Link</span>
                        </>
                      )}
                    </h2>
                  </div>
                )}
              </div>

              {/* Feedback Alert Banner */}
              {message && (
                <div
                  className={`mb-6 p-4 rounded-2xl text-sm flex items-start space-x-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
                    message.type === "success"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                      : "bg-rose-50 border-rose-100 text-rose-800"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed font-medium">{message.text}</span>
                </div>
              )}

              {/* LOGIN FORM */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in duration-500">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative group/input">
                      <Mail className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                      <input
                        type="email"
                        required
                        placeholder="officer@gatezly.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-slate-700">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setMessage(null);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative group/input">
                      <Lock className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3 text-sm rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white transition-all tracking-wide"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:pointer-events-none mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white text-slate-500 font-medium">Or continue with</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode("magic");
                      setMessage(null);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 text-slate-700 font-bold text-sm shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <span>Email Magic Link</span>
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD FORM */}
              {mode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Enter your registered email address and we will send you a secure link to reset your password.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative group/input">
                      <Mail className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                      <input
                        type="email"
                        required
                        placeholder="officer@gatezly.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MAGIC LINK FORM */}
              {mode === "magic" && (
                <form onSubmit={handleMagicLink} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Enter your email address to receive a secure, passwordless login link directly to your inbox.
                  </p>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Email Address
                    </label>
                    <div className="relative group/input">
                      <Mail className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                      <input
                        type="email"
                        required
                        placeholder="officer@gatezly.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending Magic Link...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Magic Link</span>
                        <Sparkles className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-8 text-center text-sm">
            <Link href="/" className="text-slate-500 hover:text-slate-900 font-semibold transition-colors flex items-center justify-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
