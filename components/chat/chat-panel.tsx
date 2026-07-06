"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2, Send, Square, RefreshCcw, Sparkles } from "lucide-react";
import { ChatBubble } from "./chat-bubble";
import { ChatChips, DEFAULT_QUICK_PROMPTS, type QuickPrompt } from "./chat-chips";
import { ChatMessage, type ChatMessageView } from "./chat-message";
import { insightsBus } from "@/lib/chat-context-bus";

const SUGGESTED_GREET: ChatMessageView = {
  id: "greet",
  role: "assistant",
  content: `Hi! I'm your **AI engineering copilot** for this repo. I have the heuristic findings in front of me, so I can answer follow-ups, draft fixes, and reason about release readiness.

Pick a chip below or ask me anything in plain English.`,
};

export interface ChatPanelProps {
  repo: { owner: string; name: string };
  user: { name: string; email: string };
  /** Server-rendered insights, used by the system prompt. */
  insights?: Array<{ id: string; title: string; body: string; severity: "info" | "warn" | "alert" | "critical" }>;
}

const LS_KEY = (u: string, o: string, n: string) => `traceroot:chat:${u}:${o}/${n}`;

export function ChatRoot({ repo, user, insights = [] }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [busInsights, _setInsights] = useState<ChatPanelProps["insights"]>(insights);
  const [messages, setMessages] = useState<ChatMessageView[]>([SUGGESTED_GREET]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [providerLabel, setProviderLabel] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const greetingKey = `${user.email}:${repo.owner}/${repo.name}`;

  // Subscribe to repo insights broadcast (the repo page emits them via insightsBus).
  useEffect(() => {
    return insightsBus.subscribe((p) => {
      if (p && p.repo.owner === repo.owner && p.repo.name === repo.name) {
        _setInsights(p.insights);
      }
    });
  }, [repo.owner, repo.name]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_KEY(user.email, repo.owner, repo.name));
      if (!raw) return;
      const parsed = JSON.parse(raw) as ChatMessageView[];
      if (Array.isArray(parsed) && parsed.length > 1) {
        // Keep the greeting, append the persisted ones.
        setMessages([SUGGESTED_GREET, ...parsed.filter(m => m.id !== SUGGESTED_GREET.id)]);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greetingKey]);

  // Persist on every change
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const persisted = messages.filter(m => m.id !== SUGGESTED_GREET.id);
      localStorage.setItem(LS_KEY(user.email, repo.owner, repo.name), JSON.stringify(persisted));
    } catch {}
  }, [messages, user.email, repo.owner, repo.name]);

  // Auto-scroll on new message
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const sendContent = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessageView = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const botId = crypto.randomUUID();
    const botMsg: ChatMessageView = {
      id: botId,
      role: "assistant",
      content: "",
      pending: true,
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput("");
    setSending(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo,
          insights: busInsights,
          messages: messages.concat(userMsg).map(m => ({
            id: m.id, role: m.role, content: m.content, createdAt: m.createdAt ?? Date.now(),
          })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const errText = res.status === 401 ? "Sign-in required to chat." :
                        res.status === 503 ? "AI is not configured on this server. Set GITHUB_TOKEN, OPENAI_API_KEY or ANTHROPIC_API_KEY." :
                        `Request failed (${res.status})`;
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, pending: false, content: `*(error)* ${errText}` } : m));
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;
      while (!done) {
        const { value, done: rd } = await reader.read();
        done = rd;
        if (value) buffer += decoder.decode(value, { stream: !rd });
        // Process all complete data: lines
        let nl: number;
        while ((nl = buffer.indexOf("\n\n")) !== -1) {
          const evt = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 2);
          if (!evt.startsWith("data: ")) continue;
          const payload = evt.slice(6);
          if (payload === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(payload) as { type: string; text?: string; error?: string; provider?: string; modelId?: string };
            if (parsed.type === "delta" && typeof parsed.text === "string") {
              acc = parsed.text;
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: acc, pending: false } : m));
            } else if (parsed.type === "error") {
              acc = `*(error)* ${parsed.error ?? "unknown"}`;
              setMessages(prev => prev.map(m => m.id === botId ? { ...m, content: acc, pending: false } : m));
            } else if (parsed.type === "done") {
              setProviderLabel(`${parsed.provider ?? "model"} · ${parsed.modelId ?? ""}`);
            }
          } catch {
            // tolerate garbled partial
          }
        }
      }
    } catch (e) {
      const msg = (e as Error).name === "AbortError" ? "(stopped)" : `*(error)* ${(e as Error).message}`;
      setMessages(prev => prev.map(m => m.id === botId ? { ...m, pending: false, content: msg } : m));
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sending, repo.owner, repo.name]);

  const onComposerKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendContent(input);
    } else if (e.key === "Escape" && sending) {
      abortRef.current?.abort();
    }
  };

  if (!open) {
    return <ChatBubble onClick={() => setOpen(true)} />;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="chat-bubble-title"
      aria-modal="false"
      className="chat-panel fixed bottom-5 right-5 z-40 flex w-[min(95vw,420px)] flex-col overflow-hidden rounded-2xl border border-zinc-800/70 bg-zinc-950/85 shadow-2xl backdrop-blur-xl sm:w-[420px]"
      style={{
        backgroundImage:
          "radial-gradient(120% 60% at 100% 0%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(120% 80% at 0% 100%, rgba(217,70,239,0.10) 0%, transparent 60%)",
      }}
    >
      <header className="flex items-center justify-between gap-2 border-b border-zinc-800/70 bg-gradient-to-r from-violet-950/40 via-zinc-950/30 to-fuchsia-950/30 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <div className="leading-tight">
            <p id="chat-bubble-title" className="text-[13px] font-semibold text-zinc-50">traceroot copilot</p>
            <p className="text-[10.5px] text-zinc-400">
              {repo.owner}/{repo.name}
              {providerLabel ? <span className="ml-2 text-violet-300">· {providerLabel}</span> : null}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Reset conversation"
            onClick={() => {
              try { localStorage.removeItem(LS_KEY(user.email, repo.owner, repo.name)); } catch {}
              setMessages([SUGGESTED_GREET]);
              setProviderLabel(null);
            }}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 transition"
          >
            <RefreshCcw size={14} />
          </button>
          <button
            type="button"
            title="Clear history"
            onClick={() => setMessages([SUGGESTED_GREET])}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 transition"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            title="Close"
            onClick={() => setOpen(false)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 transition"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      <div
        ref={listRef}
        className="flex-1 space-y-2 overflow-y-auto px-3.5 py-3"
        style={{ maxHeight: "min(70vh, 540px)", minHeight: 280 }}
      >
        {messages.map(m => <ChatMessage key={m.id} message={m} />)}
      </div>

      <ChatChips
        disabled={sending}
        onPick={(p: QuickPrompt) => void sendContent(p.prompt)}
      />

      <div className="border-t border-zinc-800/70 bg-zinc-950/60 p-2.5">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onComposerKeyDown}
            placeholder="Ask about this repo…"
            rows={1}
            disabled={sending && !input}
            className="block w-full resize-none rounded-xl border border-zinc-800/80 bg-zinc-900/70 px-3 py-2 pr-24 text-[13px] text-zinc-100 placeholder-zinc-500 focus:border-violet-500/60 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-70"
            style={{ maxHeight: 120 }}
          />
          <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
            {sending ? (
              <button
                type="button"
                title="Stop generating"
                onClick={() => abortRef.current?.abort()}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-100 hover:bg-zinc-700 transition"
              >
                <Square size={11} /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void sendContent(input)}
                disabled={!input.trim()}
                className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-violet-600 to-fuchsia-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow hover:from-violet-500 hover:to-fuchsia-600 disabled:opacity-50 transition"
                title="Send"
              >
                <Send size={11} /> Send <span className="hidden text-[10px] opacity-60">⏎</span>
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 px-1 text-[10.5px] text-zinc-500">
          <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-[9.5px] text-zinc-300">⏎</kbd> to send · <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-[9.5px] text-zinc-300">⇧⏎</kbd> for newline · <kbd className="rounded bg-zinc-800 px-1 py-0.5 text-[9.5px] text-zinc-300">Esc</kbd> to stop
        </p>
      </div>
    </div>
  );
}
