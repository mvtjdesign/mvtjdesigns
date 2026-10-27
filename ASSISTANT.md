# MVTJ website assistant + Vercel hosting

The site and its "Ask MVTJ" chat assistant are one Vercel project.

- Static site: every folder as before (`en/`, `el/`, `es/`, `ru/`, `assets/`, ...).
- `api/chat.js` - the assistant's backend, served at `/api/chat` on the site's own address.
  Accepts requests only from mvtjdesigns.com and this project's Vercel addresses, caps
  message length and rate, and never logs what visitors type.
- `api/_knowledge.js` - everything the assistant knows and its rules. Edit facts here.
- `assets/mvtj-assistant.js` / `.css` - the chat widget, loaded on all pages.
- `.vercelignore` - keeps private local files (leads, outreach, client work) and repo
  tooling out of every upload. Keep it when adding new private folders.

Model: Google Gemini `gemini-3.8-flash` on the free tier (override with `GEMINI_MODEL`).
Free tier trade-offs: Google may use chat messages to improve its products (the note under
the chat says so), and daily request limits apply - when they run out, the chat shows a
friendly "book a call / WhatsApp" message. A Claude version of the backend is in git
history (commit e379525) for when there is budget for a paid API.

## Move hosting from GitHub Pages to Vercel

1. **Preview deploy** - log in once (`npx vercel login`), then from this folder run
   `npx vercel` and accept the defaults: no build command, output directory `.`
   (the repo root). This gives a `*.vercel.app` preview address.
2. **Key** - `npx vercel env add GEMINI_API_KEY` and paste your Google AI Studio key
   for Production and Preview. Never put it in the site's code. Redeploy with `npx vercel`.
3. **Test the preview** - open all four languages, the case studies and the chat.
4. **Production** - `npx vercel --prod`.
5. **Domain** - in Vercel: Project -> Settings -> Domains -> add `www.mvtjdesigns.com`
   and `mvtjdesigns.com`. Vercel shows the exact DNS records to set at your domain
   registrar; replace the GitHub Pages records with them. The site stays up on GitHub
   Pages until DNS switches over.
6. **After the switch** - turn off GitHub Pages in the repo settings, then delete `CNAME`
   and `.nojekyll` (GitHub Pages only).
7. **Privacy policy** - add a line that chat messages are sent to Google Gemini to generate
   replies, may be used by Google to improve its products, and are not stored by MVTJ.

## Try it on your computer

```
npm install
set MOCK=1 && node tools/dev-server.mjs
```

Open http://localhost:8787/en/ . `MOCK=1` gives canned replies; without it, set
`GEMINI_API_KEY` first for real answers.
