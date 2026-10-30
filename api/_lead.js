// Lead scoring and signing shared by /api/chat and /api/lead.
// The weights and bands are the sales team's five-factor scorecard (mvtj-sales-five-factor-v1),
// adapted for inbound chat: ratings come only from what the visitor said; missing evidence scores 0.
import crypto from "node:crypto";

export const FACTORS = { industry_fit: 30, need: 25, credibility: 15, accessibility: 15, timing: 15 };
export const DOORS = ["noticed", "booked", "both", "unclear"];
export const SERVICES = ["Site Plan", "Grow Plan", "Convert Plan", "Studio Plan", "Prospect List", "Film Add-on", "Cinematic Product Film",
  "Custom Website / Digital Experience", "Website Clarity Audit", "Not sure yet"];

// The JSON shape Gemini must answer in.
export const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    lead: {
      type: "object",
      properties: {
        door: { type: "string", enum: DOORS },
        service: { type: "string", enum: SERVICES },
        business: { type: "string" },
        need: { type: "string" },
        timing: { type: "string" },
        summary: { type: "string" },
        ready: { type: "boolean" },
        ratings: {
          type: "object",
          properties: Object.fromEntries(Object.keys(FACTORS).map(k => [k, { type: "integer", minimum: 0, maximum: 5 }])),
          required: Object.keys(FACTORS),
        },
      },
      required: ["door", "service", "business", "need", "timing", "summary", "ready", "ratings"],
    },
  },
  required: ["reply", "lead"],
};

// The optional marketing opt-in, exactly as the widget shows it (keep in step with assets/mvtj-assistant.js).
// The wording is stored with each opt-in as the consent record.
export const DISPATCH = {
  en: "Yes, send me the MVTJ Dispatch: the latest in AI, film and marketing that actually works. Occasional emails, unsubscribe anytime.",
  es: "Sí, envíame el MVTJ Dispatch: lo último en IA, cine y marketing que de verdad funciona. Correos ocasionales; puedes darte de baja cuando quieras.",
  ru: "Да, присылайте мне MVTJ Dispatch: новинки ИИ, кино и маркетинга, который действительно работает. Нечастые письма, отписаться можно в любой момент.",
  el: "Ναι, στείλτε μου το MVTJ Dispatch: τα τελευταία στην AI, στο σινεμά και στο marketing που πραγματικά αποδίδει. Περιστασιακά email, διαγραφή οποιαδήποτε στιγμή.",
};

// Posts to the sales team's Telegram. Returns true when Telegram accepted it; otherwise logs
// Telegram's own reason (e.g. "chat not found"), which never contains the token or the message.
export async function telegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_LEADS_CHAT_ID;
  if (!token || !chat) { console.error("telegram not configured"); return false; }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat.trim(), text, disable_web_page_preview: true }),
    });
    if (r.ok) return true;
    const reason = await r.json().then(j => String(j.description || "").slice(0, 120)).catch(() => "");
    console.error(`telegram error ${r.status}: ${reason}`);
  } catch (error) {
    console.error("telegram delivery error", error?.name);
  }
  return false;
}

const clip = (v, n) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

export function score(ratings) {
  let total = 0;
  for (const [k, w] of Object.entries(FACTORS)) {
    const r = Math.max(0, Math.min(5, Math.round(Number(ratings?.[k]) || 0)));
    total += (r / 5) * w;
  }
  return Math.round(total);
}

export const band = s => (s >= 80 ? "priority" : s >= 65 ? "further investigation" : "hold");

// Normalise the model's lead; the score is computed here, never taken from the model.
export function cleanLead(raw) {
  if (!raw || typeof raw !== "object") return null;
  const lead = {
    door: DOORS.includes(raw.door) ? raw.door : "unclear",
    service: SERVICES.includes(raw.service) ? raw.service : "Not sure yet",
    business: clip(raw.business, 120),
    need: clip(raw.need, 200),
    timing: clip(raw.timing, 80),
    summary: clip(raw.summary, 400),
    ready: raw.ready === true,
  };
  lead.score = score(raw.ratings);
  lead.band = band(lead.score);
  return lead;
}

// Fields that are signed and later delivered, in a fixed order.
const SIGNED = ["door", "service", "business", "need", "timing", "summary", "score", "band", "lang"];
const canonical = lead => JSON.stringify(SIGNED.map(k => lead[k] ?? ""));

function key() {
  const secret = process.env.LEAD_SIGNING_SECRET || process.env.TELEGRAM_BOT_TOKEN;
  return secret ? crypto.createHash("sha256").update("mvtj-lead:" + secret).digest() : null;
}

// Signs a lead so /api/lead only ever delivers what the assistant actually produced.
export function sign(lead) {
  const k = key();
  if (!k) return null;
  const issued = Date.now();
  const mac = crypto.createHmac("sha256", k).update(issued + "." + canonical(lead)).digest("base64url");
  return `${issued}.${mac}`;
}

export function verify(lead, sig, maxAgeMs = 2 * 60 * 60 * 1000) {
  const k = key();
  if (!k || typeof sig !== "string") return false;
  const [issued, mac] = sig.split(".");
  if (!issued || !mac || Date.now() - Number(issued) > maxAgeMs) return false;
  const expected = crypto.createHmac("sha256", k).update(issued + "." + canonical(lead)).digest("base64url");
  return mac.length === expected.length && crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected));
}
