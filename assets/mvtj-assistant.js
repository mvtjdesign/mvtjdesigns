/* MVTJ website assistant. Talks to the chat backend named in the script tag's data-endpoint.
   The conversation lives only in this tab (sessionStorage); nothing is stored by MVTJ. */
(() => {
  "use strict";
  const script = document.currentScript;
  const endpoint = script && script.dataset.endpoint;
  if (!endpoint) return;

  const CALENDLY = "https://calendly.com/max-tijerino/30min";
  const WHATSAPP = "https://wa.me/35794338222";
  const STRINGS = {
    en: { launch: "Ask MVTJ", title: "MVTJ assistant", sub: "Automated assistant · replies in seconds",
      hello: "Hi, I'm MVTJ's automated assistant. We handle your web, social and ads, and build the systems that turn them into customers. What are you working on?",
      placeholder: "Type your message…", send: "Send", close: "Close chat", call: "Book a free call", wa: "WhatsApp",
      typing: "Typing…", error: "Sorry, I couldn't reply just now. You can book a free call or message us on WhatsApp.",
      note: "Messages are processed by our AI provider to reply and are not saved by MVTJ." },
    es: { launch: "Pregunta a MVTJ", title: "Asistente MVTJ", sub: "Asistente automático · responde en segundos",
      hello: "Hola, soy el asistente automático de MVTJ. Nos encargamos de tu web, redes y anuncios, y creamos los sistemas que los convierten en clientes. ¿En qué estás trabajando?",
      placeholder: "Escribe tu mensaje…", send: "Enviar", close: "Cerrar chat", call: "Reservar llamada gratis", wa: "WhatsApp",
      typing: "Escribiendo…", error: "Lo siento, no pude responder ahora. Puedes reservar una llamada gratuita o escribirnos por WhatsApp.",
      note: "Los mensajes los procesa nuestro proveedor de IA para responder; MVTJ no los guarda." },
    ru: { launch: "Спросить MVTJ", title: "Ассистент MVTJ", sub: "Автоматический ассистент · отвечает за секунды",
      hello: "Здравствуйте, я автоматический ассистент MVTJ. Мы ведём ваш сайт, соцсети и рекламу и строим системы, которые превращают их в клиентов. Над чем вы работаете?",
      placeholder: "Введите сообщение…", send: "Отправить", close: "Закрыть чат", call: "Бесплатный звонок", wa: "WhatsApp",
      typing: "Печатает…", error: "Извините, не получилось ответить. Запишитесь на бесплатный звонок или напишите нам в WhatsApp.",
      note: "Сообщения обрабатывает наш ИИ-провайдер для ответа; MVTJ их не сохраняет." },
    el: { launch: "Ρωτήστε το MVTJ", title: "Βοηθός MVTJ", sub: "Αυτόματος βοηθός · απαντά σε δευτερόλεπτα",
      hello: "Γεια σας, είμαι ο αυτόματος βοηθός της MVTJ. Αναλαμβάνουμε το website, τα social και τις διαφημίσεις σας και φτιάχνουμε τα συστήματα που τα μετατρέπουν σε πελάτες. Σε τι δουλεύετε;",
      placeholder: "Γράψτε το μήνυμά σας…", send: "Αποστολή", close: "Κλείσιμο", call: "Δωρεάν κλήση", wa: "WhatsApp",
      typing: "Γράφει…", error: "Λυπούμαστε, δεν μπόρεσα να απαντήσω. Κλείστε μια δωρεάν κλήση ή στείλτε μας μήνυμα στο WhatsApp.",
      note: "Τα μηνύματα επεξεργάζεται ο πάροχος AI μας για την απάντηση· η MVTJ δεν τα αποθηκεύει." },
  };
  const lang = (window.MVTJI18N && window.MVTJI18N.lang) || document.documentElement.lang.slice(0, 2) || "en";
  const t = STRINGS[lang] || STRINGS.en;
  const storeKey = "mvtj-assistant-v1";

  let history = [];   // [{ role, content }] - what the backend sees (greeting excluded)
  try { history = JSON.parse(sessionStorage.getItem(storeKey) || "[]"); } catch { history = []; }
  if (!Array.isArray(history)) history = [];
  const save = () => { try { sessionStorage.setItem(storeKey, JSON.stringify(history.slice(-20))); } catch { /* optional */ } };

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  // Render text with https links made clickable, without ever using innerHTML.
  function fill(node, text) {
    const parts = text.split(/(https:\/\/[^\s)]+)/g);
    for (const part of parts) {
      if (/^https:\/\//.test(part)) {
        const url = part.replace(/[.,!?;:]+$/, "");
        const a = el("a", "", url);
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        node.append(a, part.slice(url.length));
      } else if (part) node.append(part);
    }
  }

  const root = el("div", "mvtj-assist");
  const launch = el("button", "mvtj-assist__launch");
  launch.type = "button";
  launch.setAttribute("aria-expanded", "false");
  launch.append(el("span", "mvtj-assist__dot"), el("span", "mvtj-assist__launch-label", t.launch));
  launch.setAttribute("aria-label", t.launch);

  const panel = el("section", "mvtj-assist__panel");
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", t.title);
  const head = el("div", "mvtj-assist__head");
  const titles = el("div");
  titles.append(el("p", "mvtj-assist__title", t.title), el("p", "mvtj-assist__sub", t.sub));
  const close = el("button", "mvtj-assist__close", "×");
  close.type = "button"; close.setAttribute("aria-label", t.close);
  head.append(titles, close);

  const log = el("div", "mvtj-assist__log");
  log.setAttribute("aria-live", "polite");
  const cta = el("div", "mvtj-assist__cta");
  const call = el("a", "", t.call); call.href = CALENDLY; call.target = "_blank"; call.rel = "noopener";
  const wa = el("a", "", t.wa); wa.href = WHATSAPP;
  cta.append(call, wa);
  const form = el("form", "mvtj-assist__form");
  const input = el("textarea", "mvtj-assist__input");
  input.rows = 1; input.maxLength = 1500; input.placeholder = t.placeholder; input.setAttribute("aria-label", t.placeholder);
  const send = el("button", "mvtj-assist__send", t.send);
  send.type = "submit";
  form.append(input, send);
  panel.append(head, log, cta, form, el("p", "mvtj-assist__note", t.note));
  root.append(launch, panel);
  document.body.append(root);

  function bubble(role, text, extra = "") {
    const b = el("div", `mvtj-assist__msg mvtj-assist__msg--${role === "user" ? "me" : "bot"} ${extra}`.trim());
    fill(b, text);
    log.append(b);
    log.scrollTop = log.scrollHeight;
    return b;
  }

  bubble("assistant", t.hello);
  for (const m of history) bubble(m.role, m.content);

  function toggle(open) {
    panel.hidden = !open;
    launch.hidden = open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) { input.focus(); log.scrollTop = log.scrollHeight; } else launch.focus();
  }
  launch.addEventListener("click", () => toggle(true));
  close.addEventListener("click", () => toggle(false));
  panel.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  let busy = false;
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    busy = true; send.disabled = true; input.value = "";
    history.push({ role: "user", content: text });
    bubble("user", text);
    const typing = bubble("assistant", t.typing, "mvtj-assist__msg--typing");
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-20) }),
      });
      const data = r.ok ? await r.json() : null;
      typing.remove();
      if (!data || typeof data.reply !== "string") throw new Error("bad reply");
      history.push({ role: "assistant", content: data.reply });
      bubble("assistant", data.reply);
      save();
    } catch {
      typing.remove();
      history.pop();          // let the visitor retry the same message
      bubble("assistant", t.error);
    } finally {
      busy = false; send.disabled = false; input.focus();
    }
  });
})();
