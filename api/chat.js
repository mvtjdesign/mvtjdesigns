// POST /api/chat - the mvtjdesigns.com website assistant.
// Body: { messages: [{ role: "user" | "assistant", content: string }, ...], lang }  ->  { reply: string, lead?: object }
// The assistant also qualifies the visitor; once a lead is ready it comes back scored and signed,
// so the widget can offer to send it to the sales team through /api/lead.
// Needs GEMINI_API_KEY (Google AI Studio) in the Vercel project's environment.
// Visitor messages are never logged or stored by MVTJ (on Gemini's free tier, Google may use them to improve its products).
import { GoogleGenAI, ApiError, ThinkingLevel } from "@google/genai";
import { SYSTEM_PROMPT } from "./_knowledge.js";
import { RESPONSE_SCHEMA, cleanLead, sign } from "./_lead.js";

const LANGS = ["en", "es", "ru", "el"];

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";   // free-tier model

// The site and this function share one Vercel project, so the widget calls /api/chat on its own address.
// Allow the live domain plus this deployment's own Vercel addresses (previews), which Vercel provides as hostnames.
const ALLOWED_ORIGINS = new Set([
  ...(process.env.ALLOWED_ORIGINS || "https://www.mvtjdesigns.com,https://mvtjdesigns.com").split(","),
  ...["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"]
    .map(name => process.env[name]).filter(Boolean).map(host => `https://${host}`),
].map(o => o.trim()).filter(Boolean));
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
    const response = await ai.models.generateContent({
      model: MODEL,
      // Gemini names the assistant role "model".
      contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 8000,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },   // short sales chat; keeps replies quick
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
      },
    });
    const text = (response.text || "").trim();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* not JSON: show the text as it came */ }
    // Blocked or empty replies (safety filters, no candidates) get the polite handoff instead.
    const reply = String(parsed ? parsed.reply || "" : text).trim() || FALLBACK_REPLY;
    const lead = cleanLead(parsed?.lead);
    if (lead?.ready) {
      lead.lang = LANGS.includes(req.body?.lang) ? req.body.lang : "en";
      const sig = sign(lead);
      if (sig) return res.status(200).json({ reply, lead: { ...lead, sig } });
    }
    return res.status(200).json({ reply });
  } catch (error) {
    // Status only - never the visitor's text.
    if (error instanceof ApiError && error.status === 429) {
      console.error("gemini quota or rate limit reached");
      return res.status(503).json({ error: "busy" });
    }
    if (error instanceof ApiError) {
      console.error(`gemini api error ${error.status}`);
      return res.status(502).json({ error: "upstream" });
    }
    console.error("assistant error", error?.name);
    return res.status(500).json({ error: "server" });
  }
}
