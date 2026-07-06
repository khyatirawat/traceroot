"use client";
// A tiny pub-sub so that any page with repo insights can broadcast them to the
// layout-level ChatMount (which doesn't have direct access). Single document scope.

import type { ChatRequestContext } from "./ai/chat";

export interface InsightsBroadcast {
  repo: { owner: string; name: string };
  insights: ChatRequestContext["insights"];
}

const CHANNEL = "traceroot:insights-broadcast";

function emit(payload: InsightsBroadcast): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CHANNEL, { detail: payload }));
}
function subscribe(handler: (p: InsightsBroadcast) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const cb = (e: Event) => handler((e as CustomEvent<InsightsBroadcast>).detail);
  window.addEventListener(CHANNEL, cb);
  return () => window.removeEventListener(CHANNEL, cb);
}

export const insightsBus = { emit, subscribe };
