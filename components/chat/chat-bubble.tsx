"use client";
import { MessageCircle, Sparkles } from "lucide-react";

export function ChatBubble({ onClick, hasUnread }: { onClick: () => void; hasUnread?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open AI assistant"
      className="chat-bubble-breathing group fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_32px_-8px_rgba(139,92,246,0.7)] transition-transform duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-bg"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, rgba(217,180,255,0.95) 0%, rgba(139,92,246,0.95) 60%, rgba(76,29,149,0.95) 100%)",
      }}
    >
      <MessageCircle size={22} strokeWidth={2.2} />
      <span className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-emerald-950 ring-2 ring-bg shadow">
        <Sparkles size={10} strokeWidth={2.5} />
      </span>
      {hasUnread && (
        <span className="absolute right-1 top-1 inline-flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
        </span>
      )}
    </button>
  );
}
