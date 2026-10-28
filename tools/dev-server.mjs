// Local preview: serves the site and the assistant together on http://localhost:8787
//   node tools/dev-server.mjs            (needs GEMINI_API_KEY for real replies)
//   MOCK=1 node tools/dev-server.mjs     (canned replies, no API calls; the third message returns a qualified lead)
// Leads are never sent to Telegram from here: /api/lead checks the signature and prints the message instead.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 8787;
const ORIGIN = `http://localhost:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.ALLOWED_ORIGINS = ORIGIN;
process.env.LEAD_SIGNING_SECRET ||= "local-dev-only";
const { default: handler } = process.env.MOCK ? { default: null } : await import("../api/chat.js");
const { cleanLead, sign, verify } = await import("../api/_lead.js");
const { message } = await import("../api/lead.js");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".json": "application/json" };

// Minimal Vercel-style req/res helpers for the handler.
function vercelRes(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  return res;
}

async function readBody(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
}

function mockChat(body) {
  const asked = (body?.messages || []).filter(m => m.role === "user").length;
  const last = body?.messages?.at(-1)?.content || "";
  if (asked < 3) return { reply: `(mock) You said: "${last}". What's your timeline?` };
  const lead = cleanLead({
    door: "booked", service: "Conversion System", business: "Boutique hotel, Limassol", need: "More direct bookings from website visitors",
    timing: "Within a month", summary: "A 12-room boutique hotel gets website traffic but few direct bookings and wants enquiries answered faster.",
    ready: true, ratings: { industry_fit: 5, need: 4, credibility: 4, accessibility: 4, timing: 4 },
  });
  lead.lang = body?.lang || "en";
  return { reply: "(mock) Thanks, that's clear. You can send this summary to MVTJ's team below, or book the free call.", lead: { ...lead, sig: sign(lead) } };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, ORIGIN);
  if (url.pathname === "/api/chat") {
    await readBody(req);
    if (process.env.MOCK) return vercelRes(res).json(mockChat(req.body));
    return handler(req, vercelRes(res));
  }
  if (url.pathname === "/api/lead") {
    await readBody(req);
    const { lead, contact = {}, consent } = req.body || {};
    if (consent !== true) return vercelRes(res).status(400).json({ error: "consent_required" });
    if (!lead || !verify(lead, lead.sig)) return vercelRes(res).status(400).json({ error: "invalid_lead" });
    console.log("\n--- lead that would go to Telegram ---\n" + message(lead, contact) + "\n---");
    return vercelRes(res).json({ ok: true });
  }
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  res.setHeader("Content-Type", type);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`MVTJ site + assistant on ${ORIGIN}/en/${process.env.MOCK ? " (mock replies)" : ""}`));
