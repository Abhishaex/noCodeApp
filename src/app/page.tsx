"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
  html?: string | null;
};

type RightPanelTab = "preview" | "code";

type ProjectItem = {
  id: string;
  title: string;
  createdAt: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>("preview");
  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectLoadId, setProjectLoadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const fetchProjects = async () => {
    if (!session?.user) return;
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
    if (session?.user) fetchProjects();
    else setProjects([]);
  }, [session?.user]);

  const startNewProject = () => {
    setSessionId(null);
    setMessages([]);
    setPreviewHtml(null);
    setPreviewVersion((v) => v + 1);
    setProjectsOpen(false);
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
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-lg font-semibold tracking-tight truncate">
            Frontend AI — Describe a site, get the code
          </h1>
          {session?.user && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProjectsOpen((o) => !o)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition"
              >
                Projects
              </button>
              {projectsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    aria-hidden
                    onClick={() => setProjectsOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 w-72 rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl py-2 max-h-[70vh] overflow-hidden flex flex-col">
                    <div className="px-3 pb-2 border-b border-zinc-800">
                      <button
                        type="button"
                        onClick={startNewProject}
                        className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition"
                      >
                        New project
                      </button>
                    </div>
                    <div className="overflow-y-auto flex-1 py-2">
                      {projectsLoading ? (
                        <p className="px-3 py-4 text-sm text-zinc-500">Loading…</p>
                      ) : projects.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-zinc-500">No saved projects yet</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {projects.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                onClick={() => loadProject(p.id)}
                                disabled={projectLoadId !== null}
                                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 truncate disabled:opacity-50"
                              >
                                <span className="block truncate">{p.title || "Untitled"}</span>
                                <span className="text-xs text-zinc-500">{formatDate(p.createdAt)}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-zinc-500 w-full sm:w-auto order-3 sm:order-2">
          Powered by Gemini
          {session?.user
            ? " · Your projects are saved"
            : " · Sign in to save projects"}
        </p>
        <div className="flex items-center gap-2 order-2 sm:order-3">
          {status === "loading" ? (
            <span className="text-sm text-zinc-500">Loading…</span>
          ) : session?.user ? (
            <>
              <span className="text-sm text-zinc-400 truncate max-w-[140px]" title={session.user.email ?? undefined}>
                {session.user.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:text-zinc-100 hover:border-zinc-600 transition"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 transition"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Chat column */}
        <div className="flex w-full md:w-1/2 flex-col border-r border-zinc-800">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-500">
                <p className="mb-2">Try something like:</p>
                <ul className="text-left list-disc list-inside space-y-1 text-sm">
                  <li>Landing page with hero and CTA</li>
                  <li>Pricing table with 3 tiers</li>
                  <li>Portfolio grid with cards</li>
                  <li>Dark dashboard with sidebar</li>
                </ul>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-emerald-600/20 px-4 py-2 text-emerald-100"
                    : "mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-2"
                }
              >
                <p className="whitespace-pre-wrap text-sm">{m.content}</p>
              </div>
            ))}
            {loading && (
              <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-800 px-4 py-2">
                <span className="text-zinc-500 text-sm">Generating...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the frontend you want..."
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
              >
                Generate
              </button>
            </div>
          </form>
        </div>

        {/* Preview + Code column */}
        <div className="hidden md:flex w-1/2 flex-col bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800">
            <div className="flex">
              <button
                type="button"
                onClick={() => setRightPanelTab("preview")}
                className={`px-4 py-2.5 text-sm font-medium transition ${
                  rightPanelTab === "preview"
                    ? "border-b-2 border-emerald-500 text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab("code")}
                className={`px-4 py-2.5 text-sm font-medium transition ${
                  rightPanelTab === "code"
                    ? "border-b-2 border-emerald-500 text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Code
              </button>
            </div>
            {previewHtml && (
              <div className="flex items-center gap-1 pr-2">
                <button
                  type="button"
                  onClick={() => openPreviewInNewTab(false)}
                  className="rounded px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-600 hover:border-zinc-500 transition"
                >
                  Open in new tab
                </button>
                <button
                  type="button"
                  onClick={() => openPreviewInNewTab(true)}
                  className="rounded px-2.5 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 border border-emerald-600/50 hover:border-emerald-500/50 transition"
                >
                  Open fullscreen
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 p-2 overflow-hidden flex flex-col">
            {rightPanelTab === "preview" ? (
              previewHtml ? (
                <iframe
                  key={previewVersion}
                  ref={previewRef}
                  title="Generated frontend preview"
                  srcDoc={previewHtml}
                  className="h-full w-full rounded-lg border border-zinc-700 bg-white flex-1 min-h-0"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-zinc-700 text-zinc-600 text-sm">
                  Your generated page will appear here
                </div>
              )
            ) : (
              <div className="flex flex-col h-full min-h-0 rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden">
                {previewHtml ? (
                  <>
                    <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/80">
                      <span className="text-xs text-zinc-500 font-mono">index.html</span>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded border border-zinc-600 hover:border-emerald-500/50 transition"
                      >
                        {copied ? "Copied!" : "Copy code"}
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-4 text-xs text-zinc-300 font-mono whitespace-pre break-all m-0">
                      <code className="block min-w-max">{previewHtml}</code>
                    </pre>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
                    Generate a frontend to see the code here
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
