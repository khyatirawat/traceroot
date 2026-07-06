"use client";
import { ReactNode } from "react";

// Tiny, dependency-free markdown renderer.
// Covers the cases we actually need for an AI engineering assistant:
//  - fenced code blocks ``` with optional language
//  - inline `code`
//  - bullet lists (-, *, +)
//  - numbered lists
//  - **bold**, *italic*, [_link_](url) (link target=_blank)
//  - headings ## ### ####
//  - > blockquote
//  - horizontal rule ---
// Anything we don't recognise is rendered as plain text.
export function ChatMarkdown({ source }: { source: string }) {
  if (!source) return null;
  const blocks = parseBlocks(source);
  return <div className="prose-chat">{blocks.map((b, i) => <Block key={i} block={b} />)}</div>;
}

interface Block {
  kind: "code" | "list" | "olist" | "quote" | "h1" | "h2" | "h3" | "p" | "hr";
  text?: string;
  lang?: string;
  items?: string[];
}

function parseBlocks(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, "").trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip the closing fence
      blocks.push({ kind: "code", text: buf.join("\n"), lang });
      continue;
    }
    if (/^---+$/.test(line)) { blocks.push({ kind: "hr" }); i++; continue; }
    if (/^### /.test(line)) { blocks.push({ kind: "h3", text: line.replace(/^###\s+/, "") }); i++; continue; }
    if (/^## /.test(line))  { blocks.push({ kind: "h2", text: line.replace(/^##\s+/, "") });  i++; continue; }
    if (/^# /.test(line))   { blocks.push({ kind: "h1", text: line.replace(/^#\s+/, "") });   i++; continue; }
    if (/^>\s?/.test(line))  {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      blocks.push({ kind: "quote", text: buf.join("\n") });
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      blocks.push({ kind: "list", items });
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ kind: "olist", items });
      continue;
    }
    if (line.trim() === "") { i++; continue; }

    // Block-level paragraph: gather lines until blank
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(```|---|###|##|#|>\s?|[-*+]\s+|\d+\.\s+)/.test(lines[i])) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "p", text: buf.join("\n") });
  }
  return blocks;
}

function Block({ block }: { block: Block }): ReactNode {
  switch (block.kind) {
    case "code": return <CodeBlock code={block.text ?? ""} lang={block.lang ?? ""} />;
    case "list": return <ul className="my-1 ml-4 list-disc space-y-0.5">{block.items?.map((it, i) => <li key={i}>{renderInline(it)}</li>)}</ul>;
    case "olist":return <ol className="my-1 ml-4 list-decimal space-y-0.5">{block.items?.map((it, i) => <li key={i}>{renderInline(it)}</li>)}</ol>;
    case "quote":return <blockquote className="my-1 rounded-r-md border-l-2 border-violet-500/40 bg-zinc-900/40 px-3 py-1.5 text-[13px] text-zinc-300 italic">{renderInline(block.text ?? "")}</blockquote>;
    case "h1":   return <h1 className="mt-2 text-[15px] font-semibold text-zinc-50">{renderInline(block.text ?? "")}</h1>;
    case "h2":   return <h2 className="mt-2 text-[14px] font-semibold text-zinc-100">{renderInline(block.text ?? "")}</h2>;
    case "h3":   return <h3 className="mt-1 text-[13px] font-semibold text-zinc-200">{renderInline(block.text ?? "")}</h3>;
    case "hr":   return <hr className="my-2 border-zinc-800" />;
    case "p":    return <p className="my-1 text-[13px] leading-relaxed text-zinc-200">{renderInline(block.text ?? "")}</p>;
  }
}

function renderInline(text: string): ReactNode {
  // Replace inline code with <code> spans first so subsequent markdown survives in code.
  const tokens: Array<{ type: "text" | "code"; value: string }> = [];
  let i = 0;
  while (i < text.length) {
    const backtick = text.indexOf("`", i);
    if (backtick === -1) { tokens.push({ type: "text", value: text.slice(i) }); break; }
    if (backtick > i) tokens.push({ type: "text", value: text.slice(i, backtick) });
    const end = text.indexOf("`", backtick + 1);
    if (end === -1) { tokens.push({ type: "text", value: text.slice(backtick) }); break; }
    tokens.push({ type: "code", value: text.slice(backtick + 1, end) });
    i = end + 1;
  }
  return tokens.map((tok, idx) => {
    if (tok.type === "code") {
      return <code key={idx} className="rounded bg-zinc-800/70 px-1.5 py-0.5 font-mono text-[12px] text-violet-200">{tok.value}</code>;
    }
    return renderText(tok.value, idx);
  });
}

function renderText(text: string, keyBase: number): ReactNode {
  const segments: ReactNode[] = [];
  // Process ** **, * *, [link](url) in order.
  let work = text;
  let i = 0;
  let key = keyBase + 1000;
  const pat = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)]+)\))/;
  while (work.length > 0) {
    const m = work.match(pat);
    if (!m) { segments.push(work); break; }
    const idx = m.index ?? 0;
    if (idx > 0) segments.push(work.slice(0, idx));
    if (m[1]) {
      segments.push(<strong key={key++} className="font-semibold text-zinc-50">{m[2]}</strong>);
      work = work.slice(idx + m[1].length);
    } else if (m[3]) {
      segments.push(<em key={key++} className="italic">{m[4]}</em>);
      work = work.slice(idx + m[3].length);
    } else if (m[5]) {
      segments.push(<a key={key++} href={m[7]} target="_blank" rel="noreferrer" className="text-violet-300 underline-offset-2 hover:underline">{m[6]}</a>);
      work = work.slice(idx + m[5].length);
    }
  }
  return segments;
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="my-2 overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950/80">
      <div className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-1.5 text-[11px] text-zinc-500">
        <span className="font-mono">{lang || "code"}</span>
      </div>
      <pre className="overflow-x-auto px-3 py-2 text-[12px] leading-relaxed text-zinc-200 font-mono whitespace-pre">{code}</pre>
    </div>
  );
}
