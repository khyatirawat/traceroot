"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ChatMarkdown } from "./chat-markdown";

export interface ChatMessageView {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  pending?: boolean;
  createdAt?: number;
}

export function ChatMessage({ message }: { message: ChatMessageView }) {
  if (message.role === "system") return null;

  const isUser = message.role === "user";
  return (
    <div className={`chat-msg flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[88%] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-600 to-fuchsia-700 px-3.5 py-2 text-[13px] leading-relaxed text-white shadow-sm"
            : "max-w-[92%] rounded-2xl rounded-bl-md border border-zinc-800/70 bg-zinc-900/85 px-3.5 py-2.5 text-[13px] shadow ring-1 ring-violet-500/5"
        }
      >
        <div className="text-zinc-100">{isUser ? message.content : <ChatMarkdown source={message.content} />}</div>
        {message.pending && !isUser && (
          <span className="mt-2 inline-flex gap-1 text-violet-400">
            <Dot delay={0} />
            <Dot delay={140} />
            <Dot delay={280} />
          </span>
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="chat-dot inline-block h-1.5 w-1.5 rounded-full bg-current"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

/** Compact panel-header "copy full reply" affordance used outside (kept for future). */
export function CopyIconButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {}
      }}
      title={copied ? "Copied" : "Copy"}
      className="text-zinc-500 hover:text-zinc-200 transition"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}
