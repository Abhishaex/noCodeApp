"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        return;
      }
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Account created but sign in failed. Please sign in.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >

        <div className="rounded-2xl glass p-8 shadow-2xl relative">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 mb-6 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-1">Create Account</h1>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Start building beautiful frontends in minutes
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Full Name (optional)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full rounded-xl border border-border bg-accent/30 pl-11 pr-4 py-3 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-border bg-accent/30 pl-11 pr-4 py-3 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-border bg-accent/30 pl-11 pr-4 py-3 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-500 ml-1">Minimum 6 characters</p>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xs font-medium text-red-400 ml-1"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{loading ? "Creating account..." : "Sign up"}</span>
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
