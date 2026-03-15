"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        return;
      }
      router.push(callbackUrl);
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
          
          <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-500 text-center mb-8">
            Describe, build, and save your projects
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-border bg-accent/30 px-4 py-3 text-sm placeholder:text-zinc-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-accent/30 px-4 py-3 text-sm focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
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
              <span>{loading ? "Signing in..." : "Sign in"}</span>
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-emerald-400 font-semibold hover:text-emerald-300 transition">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
        <p className="text-zinc-500 text-sm font-medium">Preparing login...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
