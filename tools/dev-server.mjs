// Local preview: serves the site and the assistant together on http://localhost:8787
//   node tools/dev-server.mjs            (needs GEMINI_API_KEY for real replies)
//   MOCK=1 node tools/dev-server.mjs     (canned replies, no API calls)
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 8787;
const ORIGIN = `http://localhost:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.ALLOWED_ORIGINS = ORIGIN;
const { default: handler } = process.env.MOCK ? { default: null } : await import("../api/chat.js");

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".json": "application/json" };

// Minimal Vercel-style req/res helpers for the handler.
function vercelRes(res) {
  res.status = code => { res.statusCode = code; return res; };
  res.json = obj => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); return res; };
  return res;
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, ORIGIN);
  if (url.pathname === "/api/chat") {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
    if (process.env.MOCK) {
      const last = req.body?.messages?.at(-1)?.content || "";
      return vercelRes(res).json({ reply: `(mock) You said: "${last}". Book a free call: https://calendly.com/max-tijerino/30min` });
    }
    return handler(req, vercelRes(res));
  }
  let file = path.join(ROOT, decodeURIComponent(url.pathname));
  if (!file.startsWith(ROOT)) { res.statusCode = 403; return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
  const type = TYPES[path.extname(file)] || "application/octet-stream";
  res.setHeader("Content-Type", type);
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`MVTJ site + assistant on ${ORIGIN}/en/${process.env.MOCK ? " (mock replies)" : ""}`));
