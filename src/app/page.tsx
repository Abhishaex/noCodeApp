"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  MessageSquare, 
  Eye, 
  Code, 
  Monitor, 
  Smartphone, 
  Tablet, 
  ExternalLink, 
  Maximize2, 
  Copy, 
  Check, 
  History,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Trash2
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Message = {
  role: "user" | "assistant";
  content: string;
  html?: string | null;
};

type ViewMode = "chat" | "preview" | "code";

type ProjectItem = {
  id: string;
  title: string;
  createdAt: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectLoadId, setProjectLoadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const list = await res.json();
        setProjects(list);
      }
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const startNewProject = () => {
    setSessionId(null);
    setMessages([]);
    setPreviewHtml(null);
    setPreviewVersion((v) => v + 1);
    setProjectsOpen(false);
    setViewMode("chat");
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (sessionId === id) startNewProject();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const loadProject = async (id: string) => {
    setProjectLoadId(id);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setSessionId(data.id);
      setMessages(
        data.messages.map((m: { role: string; content: string; html?: string | null }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          html: m.html ?? undefined,
        }))
      );
      setPreviewHtml(data.previewHtml ?? null);
      setPreviewVersion((v) => v + 1);
      setProjectsOpen(false);
      setViewMode("preview");
    } catch {
      setProjectLoadId(null);
    } finally {
      setProjectLoadId(null);
    }
  };

  const copyCode = () => {
    if (!previewHtml) return;
    navigator.clipboard.writeText(previewHtml).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const openPreviewInNewTab = (fullScreen: boolean) => {
    if (!previewHtml) return;
    const blob = new Blob([previewHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    if (fullScreen && typeof window !== "undefined") {
      const w = window.open(
        url,
        "_blank",
        `width=${window.screen.width},height=${window.screen.height},left=0,top=0,scrollbars=yes`
      );
      if (w) w.focus();
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    setMessage("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionId,
          previousHtml: previewHtml || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error ?? "Something went wrong.",
          },
        ]);
        return;
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);
        if (session?.user) fetchProjects();
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          html: data.html,
        },
      ]);

      if (data.html) {
        setPreviewHtml(data.html);
        setPreviewVersion((v) => v + 1);
        // Switch to preview on larger screens if something was generated
        if (window.innerWidth >= 768) {
          setViewMode("preview");
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="z-30 h-16 border-b border-border glass px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              Front<span className="text-emerald-500">bot</span>
            </h1>
          </Link>

          <div className="relative">
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-accent/50 hover:bg-accent text-sm transition"
            >
              <History className="w-4 h-4" />
              <span>Projects</span>
            </button>
            
            <AnimatePresence>
              {projectsOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setProjectsOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl border border-border bg-card shadow-2xl py-2 max-h-[70vh] flex flex-col"
                  >
                    <div className="px-3 pb-2 border-b border-border">
                      <button
                        onClick={startNewProject}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>New Project</span>
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 py-1 custom-scrollbar">
                      {projectsLoading ? (
                        <div className="px-3 py-8 flex flex-col items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                          <p className="text-xs text-zinc-500 font-medium">Loading projects...</p>
                        </div>
                      ) : projects.length === 0 ? (
                        <p className="px-3 py-8 text-center text-sm text-zinc-500">No projects found</p>
                      ) : (
                        <div className="grid gap-0.5 px-1">
                          {projects.map((p) => (
                            <div
                              key={p.id}
                              className="group flex items-center gap-1 rounded-lg hover:bg-accent transition"
                            >
                              <button
                                type="button"
                                onClick={(e) => deleteProject(e, p.id)}
                                disabled={deletingId === p.id}
                                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition shrink-0 disabled:opacity-50"
                                title="Delete project"
                              >
                                {deletingId === p.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => loadProject(p.id)}
                                className="flex-1 min-w-0 text-left px-3 py-2.5 text-sm"
                              >
                                <div className="font-medium truncate group-hover:text-emerald-400">
                                  {p.title || "Untitled Project"}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-0.5">{formatDate(p.createdAt)}</div>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* View Selection (Mobile Only) */}
        <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 rounded-full glass shadow-2xl border border-white/10">
          <button
            onClick={() => setViewMode("chat")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition",
              viewMode === "chat" ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            )}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setViewMode("preview")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition",
              viewMode === "preview" ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            )}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setViewMode("code")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition",
              viewMode === "code" ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"
            )}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>
        </div>

        {/* Chat Sidebar / Left Column */}
        <section 
          className={cn(
            "transition-all duration-300 relative z-20 h-full",
            isSidebarOpen ? "w-full md:w-[400px] lg:w-[450px]" : "w-0",
            viewMode !== "chat" && "max-md:hidden"
          )}
        >
          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "hidden md:flex absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border border-border glass items-center justify-center text-zinc-400 hover:text-white z-30 transition shadow-lg",
              isSidebarOpen ? "-right-4" : "-right-4"
            )}
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <div className={cn(
            "h-full w-full flex flex-col border-r border-border overflow-hidden",
            isSidebarOpen ? "opacity-100" : "opacity-0"
          )}>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/5 flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Build something amazing</h3>
                <p className="text-zinc-400 text-sm mb-8 max-w-[280px]">
                  Describe the frontend you want and I&apos;ll build it for you in seconds.
                </p>
                <div className="grid gap-2 w-full max-w-[320px]">
                  {[
                    "Landing page for a SaaS startup",
                    "Dark theme crypto dashboard",
                    "Modern portfolio with glassmorphism",
                    "A clean pricing section with 3 tiers"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setMessage(suggestion)}
                      className="text-left px-4 py-3 rounded-xl border border-border bg-accent/20 hover:bg-accent hover:border-emerald-500/50 text-xs font-medium text-zinc-300 transition group"
                    >
                      <span className="group-hover:text-emerald-400 transition-colors">{suggestion}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, i) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={i}
                    className={cn(
                      "flex flex-col",
                      m.role === "user" ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      m.role === "user" 
                        ? "bg-emerald-600 text-white rounded-tr-none shadow-lg shadow-emerald-900/10" 
                        : "bg-accent/80 border border-white/5 backdrop-blur-sm rounded-tl-none text-zinc-200"
                    )}>
                      {m.content}
                    </div>
                  </motion.div>
                ))}
                
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-accent/80 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500" 
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500" 
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500" 
                        />
                      </div>
                      <span className="text-xs text-zinc-500 font-medium tracking-tight">AI is thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border">
            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the frontend..."
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-border bg-accent/30 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="mt-3 text-[10px] text-center text-zinc-500">
              Responsive AI Web Builder — Powered by Gemini
            </p>
          </div>
          </div>
        </section>

        {/* Preview / Right Column */}
        <section 
          className={cn(
            "flex-1 flex flex-col bg-accent/10 backdrop-blur-sm relative transition-all duration-300",
            !isSidebarOpen && "ml-0",
            viewMode === "chat" && "max-md:hidden"
          )}
        >
          <div className="h-14 border-b border-border px-4 flex items-center justify-between">
            <div className="flex divide-x divide-border overflow-hidden rounded-lg border border-border">
              <button
                onClick={() => setViewMode("preview")}
                className={cn(
                  "hidden md:flex items-center gap-2 px-4 py-1.5 text-xs font-semibold transition",
                  viewMode === "preview" ? "bg-accent text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setViewMode("code")}
                className={cn(
                  "hidden md:flex items-center gap-2 px-4 py-1.5 text-xs font-semibold transition",
                  viewMode === "code" ? "bg-accent text-white" : "text-zinc-400 hover:text-white"
                )}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Code</span>
              </button>
            </div>

            {previewHtml && (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1 mr-4 bg-accent/50 p-1 rounded-lg border border-border">
                  <button 
                    onClick={() => setPreviewDevice("desktop")}
                    className={cn(
                      "p-1.5 rounded transition",
                      previewDevice === "desktop" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                    )} 
                    title="Desktop View"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setPreviewDevice("tablet")}
                    className={cn(
                      "p-1.5 rounded transition",
                      previewDevice === "tablet" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                    )} 
                    title="Tablet View"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setPreviewDevice("mobile")}
                    className={cn(
                      "p-1.5 rounded transition",
                      previewDevice === "mobile" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
                    )} 
                    title="Mobile View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <button
                  onClick={() => openPreviewInNewTab(false)}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-accent text-xs font-medium text-zinc-400 hover:text-white transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open URL</span>
                </button>
                
                <button
                  onClick={() => openPreviewInNewTab(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/10 border border-emerald-600/20 text-emerald-500 hover:bg-emerald-600/20 text-xs font-bold transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col items-center">
            <AnimatePresence mode="wait">
              {viewMode === "preview" ? (
                <motion.div 
                  key="preview"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full flex flex-col items-center"
                >
                  {previewHtml ? (
                    <div 
                      className={cn(
                        "h-full rounded-2xl border border-border overflow-hidden shadow-2xl bg-white ring-1 ring-white/10 transition-all duration-500",
                        previewDevice === "desktop" ? "w-full" : 
                        previewDevice === "tablet" ? "w-[768px]" : "w-[375px]"
                      )}
                    >
                      <iframe
                        key={previewVersion}
                        ref={previewRef}
                        title="Generated UI"
                        srcDoc={previewHtml}
                        className="w-full h-full"
                        sandbox="allow-scripts"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-accent/5">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                        <Monitor className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-400">Preview Area</h4>
                      <p className="text-xs text-zinc-500 mt-1 text-center max-w-[200px]">
                        Your generated website will appear here in real-time.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="code"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full flex flex-col rounded-2xl border border-border overflow-hidden bg-[#0d1117] shadow-2xl"
                >
                  <div className="h-10 border-b border-border bg-[#161b22] px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">index.html</span>
                    </div>
                    {previewHtml && (
                      <button
                        onClick={copyCode}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition"
                      >
                        {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar p-6">
                    {previewHtml ? (
                      <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
                        <code>{previewHtml}</code>
                      </pre>
                    ) : (
                      <div className="h-full flex items-center justify-center text-zinc-600 text-xs">
                        No code to display yet
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}
