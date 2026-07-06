import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { runChat } from "@/lib/ai/chat-stream";
import type { ChatMessage } from "@/lib/ai/chat";
import { MAX_CHAT_CONTENT_CHARS } from "@/lib/ai/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat
 *
 * Body:
 *  {
 *    repo: { owner: string, name: string },
 *    messages: Array<{ id: string, role: "user"|"assistant", content: string, createdAt: number }>,
 *    insights?: Array<{ id: string, title: string, body: string, severity: string }>
 *  }
 *
 * Streams Server-Sent Events:
 *  data: {"type":"delta","text":"..."}\n\n     // incremental
 *  data: {"type":"done","modelId":"...","provider":"...","latencyMs":123}\n\n
 *  data: {"type":"error","error":"..."}\n\n
 */
export async function POST(req: NextRequest) {
  const me = await currentUser();
  if (!me) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  let body: { repo: { owner: string; name: string }; messages: ChatMessage[]; insights?: Array<{ id: string; title: string; body: string; severity: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!body || typeof body !== "object" || !body.repo?.owner || !body.repo?.name || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (body.messages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // Clamp message size on the server side too (defense-in-depth against malicious clients).
  const safeMessages = body.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: typeof m.content === "string" ? m.content.slice(0, MAX_CHAT_CONTENT_CHARS) : "",
    createdAt: typeof m.createdAt === "number" ? m.createdAt : Date.now(),
  })) as ChatMessage[];

  const ctx = {
    repo: body.repo,
    user: { name: me.name, email: me.email },
    insights: (body.insights ?? []).slice(0, 24).map((i) => ({
      id: i.id, title: i.title, body: i.body ?? "",
      severity: (["info", "warn", "alert", "critical"].includes(i.severity) ? i.severity : "info") as "info" | "warn" | "alert" | "critical",
    })),
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const write = (chunk: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        await runChat({
          messages: safeMessages,
          ctx,
          onDelta: (text) => write({ type: "delta", text }),
        });
        write({ type: "done", modelId: "(server-stripped)", provider: "(server-stripped)", latencyMs: 0 });
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", error: (e as Error).message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
