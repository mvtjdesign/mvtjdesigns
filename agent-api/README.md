# MVTJ website assistant

The chat bubble on mvtjdesigns.com ("Ask MVTJ"). It answers visitors in English, Spanish,
Russian or Greek, explains what MVTJ does, and hands qualified visitors to the free
15-minute Calendly call or WhatsApp. It tells visitors it is an automated assistant.

- `assets/mvtj-assistant.js` / `.css` - the widget, loaded on every page (GitHub Pages).
- `agent-api/api/chat.js` - the backend (Vercel). Holds the API key, accepts requests only
  from mvtjdesigns.com, caps message length and rate, and never logs what visitors type.
- `agent-api/lib/knowledge.js` - everything the assistant knows and its rules. Edit facts here.

Model: Google Gemini `gemini-3.8-flash` on the free tier (override with `GEMINI_MODEL`).
Free tier trade-offs: Google may use chat messages to improve its products (the note under
the chat says so), and daily request limits apply - when they run out, the chat shows a
friendly "book a call / WhatsApp" message. A Claude version of this backend is in git
history (commit e379525) for when there is budget for a paid API.

## Go live (one time)

1. **API key** - use your Google AI Studio key (aistudio.google.com -> Get API key).
   Never paste it into the site's code; it only goes into Vercel.
2. **Vercel** - New Project -> import the `mvtjdesign/mvtjdesigns` repo -> set
   **Root Directory** to `agent-api` -> name the project `mvtj-site-assistant` -> add the
   environment variable `GEMINI_API_KEY` -> Deploy. (Vercel's Hobby plan is free.)
3. **Check the URL** - the pages call `https://mvtj-site-assistant.vercel.app/api/chat`.
   If Vercel gives the project a different address, replace that URL in every page's
   `data-endpoint="..."` (one search-and-replace).
4. **Publish the site** - merge the `feat/site-assistant` branch to `main`.
5. **Privacy policy** - add a line that chat messages are sent to Google Gemini to generate
   replies, may be used by Google to improve its products, and are not stored by MVTJ.

## Try it on your computer

```
cd agent-api
npm install
cd ..
set MOCK=1 && node agent-api/dev-server.mjs
```

Open http://localhost:8787/en/ . `MOCK=1` gives canned replies; without it, set
`GEMINI_API_KEY` first for real answers.
