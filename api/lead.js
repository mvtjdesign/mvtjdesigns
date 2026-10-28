// POST /api/lead - delivers a qualified lead from the website assistant to the sales team's Telegram.
// Body: { lead: {...signed fields, sig}, contact: { name?, reach? }, consent: true, chatId?, dispatch? }  ->  { ok: true }
// Only leads signed by /api/chat are accepted, and only with the visitor's explicit consent.
// The lead is saved (with the optional MVTJ Dispatch opt-in) and the conversation is attached for the team.
// Delivered with TELEGRAM_BOT_TOKEN and TELEGRAM_LEADS_CHAT_ID (see telegram() in _lead.js).
import { verify, DISPATCH, telegram } from "./_lead.js";
import { saveLead, chatTranscript } from "./_db.js";

const ALLOWED_ORIGINS = new Set([
  ...(process.env.ALLOWED_ORIGINS || "https://www.mvtjdesigns.com,https://mvtjdesigns.com").split(","),
  ...["VERCEL_URL", "VERCEL_BRANCH_URL", "VERCEL_PROJECT_PRODUCTION_URL"]
    .map(name => process.env[name]).filter(Boolean).map(host => `https://${host}`),
].map(o => o.trim()).filter(Boolean));
const RATE_LIMIT = 3;            // leads per visitor per window
const RATE_WINDOW_MS = 60 * 60 * 1000;
const DOOR_LABEL = { noticed: "A · needs to be noticed", booked: "B · noticed, not booking", both: "A+B · both", unclear: "unclear" };

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

const clip = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);
// A phone number or an email address, nothing else.
const looksReachable = s => /^\+?[\d\s().-]{7,20}$/.test(s) || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

// The visitor's side of the conversation (already redacted when stored), trimmed to fit one Telegram message.
function excerpt(transcript) {
  const lines = transcript.map(m => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`);
  let text = lines.join("\n");
  if (text.length > 2200) text = "…" + text.slice(-2200);
  return text;
}

export function message(lead, contact, extra = {}) {
  return [
    `New website lead · ${lead.score}/100 · ${lead.band}`,
    "",
    `Door: ${DOOR_LABEL[lead.door] || lead.door}`,
    `Service: ${lead.service}`,
    `Business: ${lead.business || "not given"}`,
    `Need: ${lead.need || "not given"}`,
    `Timing: ${lead.timing || "not given"}`,
    `Language: ${lead.lang}`,
    "",
    lead.summary,
    "",
    `Name: ${contact.name || "not given"}`,
    `Reach: ${contact.reach || "not given (visitor will book or message)"}`,
    `MVTJ Dispatch: ${extra.optIn ? "opted in" : "no"}`,
    ...(extra.leadId ? [`Lead #${extra.leadId} saved`] : []),
    "",
    "Visitor consented to sending this. Scored by the site assistant on the five-factor scorecard; check before outreach.",
    ...(extra.transcript?.length ? ["", "Conversation:", excerpt(extra.transcript)] : []),
  ].join("\n");
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

  const { lead, contact = {}, consent, chatId, dispatch } = req.body || {};
  if (consent !== true) return res.status(400).json({ error: "consent_required" });
  if (!lead || !verify(lead, lead.sig)) return res.status(400).json({ error: "invalid_lead" });
  const name = clip(contact.name, 60);
  const reach = clip(contact.reach, 80);
  if (reach && !looksReachable(reach)) return res.status(400).json({ error: "invalid_contact" });
  // The Dispatch needs an email address; the opt-in is recorded with the exact wording shown.
  const optIn = dispatch === true && isEmail(reach);
  let leadId = null, transcript = [];
  try {
    leadId = await saveLead(lead, { name, reach }, chatId, { optIn, text: DISPATCH[lead.lang] || DISPATCH.en });
    transcript = await chatTranscript(chatId);
  } catch (error) {
    console.error("lead storage error", error?.code || error?.name);
  }

  const delivered = await telegram(message(lead, { name, reach }, { optIn, leadId, transcript }));
  // A lead saved in the database is never lost, even if Telegram is down.
  if (delivered || leadId) return res.status(200).json({ ok: true });
  return res.status(502).json({ error: "upstream" });
}
