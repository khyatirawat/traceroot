"use client";
import { useEffect } from "react";
import { insightsBus, type InsightsBroadcast } from "@/lib/chat-context-bus";

export function InsightsEmitter({ repo, insights }: InsightsBroadcast) {
  useEffect(() => {
    insightsBus.emit({ repo, insights });
  }, [repo.owner, repo.name, JSON.stringify(insights)]);
  return null;
}
