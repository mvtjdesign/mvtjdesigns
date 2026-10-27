// POST /api/chat - the mvtjdesigns.com website assistant.
// Body: { messages: [{ role: "user" | "assistant", content: string }, ...] }  ->  { reply: string }
// Needs ANTHROPIC_API_KEY in the Vercel project's environment. Visitor messages are never logged or stored.
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "../lib/knowledge.js";

const client = new Anthropic();

const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || "https://www.mvtjdesigns.com,https://mvtjdesigns.com")
    .split(",").map(o => o.trim()).filter(Boolean),
);
const MAX_MESSAGES = 20;        // conversation turns kept per request
const MAX_CHARS = 1500;         // per message
const RATE_LIMIT = 20;          // requests per visitor per window
const RATE_WINDOW_MS = 10 * 60 * 1000;
const FALLBACK_REPLY = "Sorry, I can't help with that here. For anything about your project, book a free 15-minute call with Max: https://calendly.com/max-tijerino/30min";

// Best-effort, per-instance limiter: enough to stop casual abuse of the API key.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const messages = [];
  for (const m of raw) {
    if (!m || (m.role !== "user" && m.role !== "assistant") || typeof m.content !== "string") return null;
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (!content) return null;
    messages.push({ role: m.role, content });
  }
  // The widget shows a local greeting first; the API conversation must start and end with the visitor.
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages.at(-1).role !== "user") return null;
  return messages;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!ALLOWED_ORIGINS.has(origin)) return res.status(403).json({ error: "forbidden_origin" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return res.status(429).json({ error: "rate_limited" });

  const messages = cleanMessages(req.body?.messages);
  if (!messages) return res.status(400).json({ error: "invalid_messages" });

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 8000,
      output_config: { effort: "low" },          // short sales chat; low effort keeps replies quick
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",                      // a policy decline is retried on a fallback model in the same call
      cache_control: { type: "ephemeral" },      // caches the frozen system prompt + conversation prefix
      system: SYSTEM_PROMPT,
      messages,
    });
    const reply = response.stop_reason === "refusal"
      ? FALLBACK_REPLY
      : response.content.filter(b => b.type === "text").map(b => b.text).join("\n").trim() || FALLBACK_REPLY;
    return res.status(200).json({ reply });
  } catch (error) {
    // Status only - never the visitor's text.
    if (error instanceof Anthropic.RateLimitError) {
      console.error("anthropic rate limited");
      return res.status(503).json({ error: "busy" });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`anthropic api error ${error.status}`);
      return res.status(502).json({ error: "upstream" });
    }
    console.error("assistant error", error?.name);
    return res.status(500).json({ error: "server" });
  }
}
