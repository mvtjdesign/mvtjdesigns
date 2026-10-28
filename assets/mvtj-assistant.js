/* MVTJ website assistant. Talks to the chat backend named in the script tag's data-endpoint.
   The conversation lives in this tab (sessionStorage); MVTJ keeps a redacted copy for 90 days (see api/_db.js). */
(() => {
  "use strict";
  const script = document.currentScript;
  const endpoint = script && script.dataset.endpoint;
  if (!endpoint) return;

  const CALENDLY = "https://calendly.com/max-tijerino/30min";
  const WHATSAPP = "https://wa.me/35794338222";
  const STRINGS = {
    en: { launch: "Ask MVTJ", title: "MVTJ assistant", sub: "Automated assistant · replies in seconds",
 again: "Oh, hello again. Want to pick up where we left off?",
      hello: "Hi, I'm MVTJ's automated assistant. We handle your web, social and ads, and build the systems that turn them into customers. What are you working on?",
      placeholder: "Type your message…", send: "Send", close: "Close chat", call: "Book a free call", wa: "WhatsApp",
      typing: "Typing…", error: "Sorry, I couldn't reply just now. You can book a free call or message us on WhatsApp.",
      note: "Replies come from Google Gemini, which may use messages to improve its products. MVTJ keeps chats for 90 days, with phone numbers and emails removed, to improve this assistant.",
      dispatch: "Yes, send me the MVTJ Dispatch: the latest in AI, film and marketing that actually works. Occasional emails, unsubscribe anytime.", needEmail: "Add an email address to get the MVTJ Dispatch, or untick it.",
      leadTitle: "Send this to MVTJ's team", name: "Your name (optional)", reach: "Phone or email so we can reply (optional)", consent: "I agree to MVTJ receiving this summary and these details to reply to me.", privacy: "Privacy policy", leadSend: "Send to the team", sent: "Sent. Max's team will be in touch. You can also book a call now.", leadFail: "That didn't send. Please book a call or message us on WhatsApp.", badReach: "Please enter a phone number or email address, or leave it empty." },
    es: { launch: "Pregunta a MVTJ", title: "Asistente MVTJ", sub: "Asistente automático · responde en segundos",
 again: "Ah, hola de nuevo. ¿Seguimos donde lo dejamos?",
      hello: "Hola, soy el asistente automático de MVTJ. Nos encargamos de tu web, redes y anuncios, y creamos los sistemas que los convierten en clientes. ¿En qué estás trabajando?",
      placeholder: "Escribe tu mensaje…", send: "Enviar", close: "Cerrar chat", call: "Reservar llamada gratis", wa: "WhatsApp",
      typing: "Escribiendo…", error: "Lo siento, no pude responder ahora. Puedes reservar una llamada gratuita o escribirnos por WhatsApp.",
      note: "Las respuestas las genera Google Gemini, que puede usar los mensajes para mejorar sus productos. MVTJ guarda los chats 90 días, sin teléfonos ni emails, para mejorar este asistente.",
      dispatch: "Sí, envíame el MVTJ Dispatch: lo último en IA, cine y marketing que de verdad funciona. Correos ocasionales; puedes darte de baja cuando quieras.", needEmail: "Añade un email para recibir el MVTJ Dispatch, o desmárcalo.",
      leadTitle: "Enviar esto al equipo de MVTJ", name: "Tu nombre (opcional)", reach: "Teléfono o email para responderte (opcional)", consent: "Acepto que MVTJ reciba este resumen y estos datos para responderme.", privacy: "Política de privacidad", leadSend: "Enviar al equipo", sent: "Enviado. El equipo de Max se pondrá en contacto. También puedes reservar una llamada ahora.", leadFail: "No se pudo enviar. Reserva una llamada o escríbenos por WhatsApp.", badReach: "Escribe un teléfono o un email, o déjalo vacío." },
    ru: { launch: "Спросить MVTJ", title: "Ассистент MVTJ", sub: "Автоматический ассистент · отвечает за секунды",
 again: "О, снова здравствуйте! Продолжим с того места, где остановились?",
      hello: "Здравствуйте, я автоматический ассистент MVTJ. Мы ведём ваш сайт, соцсети и рекламу и строим системы, которые превращают их в клиентов. Над чем вы работаете?",
      placeholder: "Введите сообщение…", send: "Отправить", close: "Закрыть чат", call: "Бесплатный звонок", wa: "WhatsApp",
      typing: "Печатает…", error: "Извините, не получилось ответить. Запишитесь на бесплатный звонок или напишите нам в WhatsApp.",
      note: "Ответы генерирует Google Gemini, который может использовать сообщения для улучшения своих продуктов. MVTJ хранит чаты 90 дней, без телефонов и email, чтобы улучшать этого ассистента.",
      dispatch: "Да, присылайте мне MVTJ Dispatch: новинки ИИ, кино и маркетинга, который действительно работает. Нечастые письма, отписаться можно в любой момент.", needEmail: "Укажите email, чтобы получать MVTJ Dispatch, или снимите отметку.",
      leadTitle: "Отправить это команде MVTJ", name: "Ваше имя (необязательно)", reach: "Телефон или email для ответа (необязательно)", consent: "Я согласен(на), чтобы MVTJ получила эту сводку и данные для ответа мне.", privacy: "Политика конфиденциальности", leadSend: "Отправить команде", sent: "Отправлено. Команда Макса свяжется с вами. Также можно записаться на звонок.", leadFail: "Не удалось отправить. Запишитесь на звонок или напишите нам в WhatsApp.", badReach: "Укажите телефон или email либо оставьте поле пустым." },
    el: { launch: "Ρωτήστε το MVTJ", title: "Βοηθός MVTJ", sub: "Αυτόματος βοηθός · απαντά σε δευτερόλεπτα",
 again: "Α, γεια σας ξανά! Συνεχίζουμε από εκεί που μείναμε;",
      hello: "Γεια σας, είμαι ο αυτόματος βοηθός της MVTJ. Αναλαμβάνουμε το website, τα social και τις διαφημίσεις σας και φτιάχνουμε τα συστήματα που τα μετατρέπουν σε πελάτες. Σε τι δουλεύετε;",
      placeholder: "Γράψτε το μήνυμά σας…", send: "Αποστολή", close: "Κλείσιμο", call: "Δωρεάν κλήση", wa: "WhatsApp",
      typing: "Γράφει…", error: "Λυπούμαστε, δεν μπόρεσα να απαντήσω. Κλείστε μια δωρεάν κλήση ή στείλτε μας μήνυμα στο WhatsApp.",
      note: "Οι απαντήσεις προέρχονται από το Google Gemini, που μπορεί να χρησιμοποιεί τα μηνύματα για τη βελτίωση των προϊόντων του. Η MVTJ κρατά τις συνομιλίες για 90 ημέρες, χωρίς τηλέφωνα και email, για να βελτιώνει αυτόν τον βοηθό.",
      dispatch: "Ναι, στείλτε μου το MVTJ Dispatch: τα τελευταία στην AI, στο σινεμά και στο marketing που πραγματικά αποδίδει. Περιστασιακά email, διαγραφή οποιαδήποτε στιγμή.", needEmail: "Προσθέστε ένα email για να λαμβάνετε το MVTJ Dispatch, ή αφαιρέστε την επιλογή.",
      leadTitle: "Αποστολή στην ομάδα της MVTJ", name: "Το όνομά σας (προαιρετικό)", reach: "Τηλέφωνο ή email για να σας απαντήσουμε (προαιρετικό)", consent: "Συμφωνώ να λάβει η MVTJ αυτή τη σύνοψη και αυτά τα στοιχεία για να μου απαντήσει.", privacy: "Πολιτική απορρήτου", leadSend: "Αποστολή στην ομάδα", sent: "Στάλθηκε. Η ομάδα του Max θα επικοινωνήσει μαζί σας. Μπορείτε επίσης να κλείσετε μια κλήση τώρα.", leadFail: "Δεν στάλθηκε. Κλείστε μια κλήση ή στείλτε μας μήνυμα στο WhatsApp.", badReach: "Γράψτε τηλέφωνο ή email, ή αφήστε το κενό." },
  };
  const lang = (window.MVTJI18N && window.MVTJI18N.lang) || document.documentElement.lang.slice(0, 2) || "en";
  const t = STRINGS[lang] || STRINGS.en;
  const storeKey = "mvtj-assistant-v1";

  let history = [];   // [{ role, content }] - what the backend sees (greeting excluded)
  try { history = JSON.parse(sessionStorage.getItem(storeKey) || "[]"); } catch { history = []; }
  if (!Array.isArray(history)) history = [];
  const save = () => { try { sessionStorage.setItem(storeKey, JSON.stringify(history.slice(-20))); } catch { /* optional */ } };
  // One id per conversation, so the stored transcript and any lead sent from it stay together.
  let chatId = "";
  try { chatId = sessionStorage.getItem(storeKey + "-id") || ""; } catch { /* optional */ }
  if (!chatId && window.crypto && crypto.randomUUID) {
    chatId = crypto.randomUUID();
    try { sessionStorage.setItem(storeKey + "-id", chatId); } catch { /* optional */ }
  }

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

  // Once the assistant has qualified the visitor, offer to send the signed lead to the team.
  // The visitor sees exactly what is sent, may add how to reach them, and must tick consent.
  const leadEndpoint = endpoint.replace(/chat$/, "lead");
  const privacyHref = lang === "en" ? "/privacy/" : `/${lang}/privacy/`;
  let leadCard = null;
  function offerLead(lead) {
    if (leadCard) leadCard.remove();
    const card = leadCard = el("form", "mvtj-assist__lead");
    const lines = [lead.business, lead.need, lead.timing].filter(Boolean).join(" · ");
    const summary = el("p", "mvtj-assist__lead-summary", [lines, lead.summary].filter(Boolean).join("\n\n"));
    const name = el("input"); name.type = "text"; name.maxLength = 60; name.placeholder = t.name; name.setAttribute("aria-label", t.name); name.autocomplete = "name";
    const reach = el("input"); reach.type = "text"; reach.maxLength = 80; reach.placeholder = t.reach; reach.setAttribute("aria-label", t.reach);
    const agree = el("label");
    const box = el("input"); box.type = "checkbox"; box.required = true;
    const policy = el("a", "", t.privacy); policy.href = privacyHref; policy.target = "_blank"; policy.rel = "noopener";
    agree.append(box, el("span", "", t.consent + " "));
    agree.lastChild.append(policy);
    const go = el("button", "", t.leadSend); go.type = "submit";
    const status = el("p", "mvtj-assist__lead-status");
    // Optional and unticked: the MVTJ Dispatch is a separate consent from being contacted about this enquiry.
    const news = el("label");
    const newsBox = el("input"); newsBox.type = "checkbox";
    news.append(newsBox, el("span", "", t.dispatch));
    card.append(el("p", "mvtj-assist__lead-title", t.leadTitle), summary, name, reach, agree, news, go, status);
    card.addEventListener("submit", async e => {
      e.preventDefault();
      const contact = { name: name.value.trim(), reach: reach.value.trim() };
      if (contact.reach && !/^\+?[\d\s().-]{7,20}$/.test(contact.reach) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.reach)) {
        status.textContent = t.badReach; reach.focus(); return;
      }
      if (newsBox.checked && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.reach)) {
        status.textContent = t.needEmail; reach.focus(); return;
      }
      go.disabled = true; status.textContent = "";
      try {
        const r = await fetch(leadEndpoint, { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead, contact, consent: box.checked, chatId, dispatch: newsBox.checked }) });
        if (!r.ok) throw new Error("lead failed");
        card.replaceChildren(el("p", "mvtj-assist__lead-status", t.sent));
      } catch {
        go.disabled = false; status.textContent = t.leadFail;
      }
    });
    log.append(card);
    log.scrollTop = log.scrollHeight;
  }

  bubble("assistant", t.hello);
  for (const m of history) bubble(m.role, m.content);

  let floatingOpen = false;
  function toggle(open) {
    if (panel.classList.contains("is-docked")) return;
    floatingOpen = open;
    panel.hidden = !open;
    launch.hidden = open;
    launch.setAttribute("aria-expanded", String(open));
    if (open) { input.focus(); log.scrollTop = log.scrollHeight; } else launch.focus();
  }
  launch.addEventListener("click", () => toggle(true));
  close.addEventListener("click", () => toggle(false));
  panel.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  // A page can host the same assistant inline: [data-mvtj-assist-dock]. While the dock is on screen the panel
  // (and its conversation) moves into it; scrolling away returns it to the corner.
  const dock = document.querySelector("[data-mvtj-assist-dock]");
  if (dock && "IntersectionObserver" in window) {
    let greeted = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && panel.parentNode !== dock) {
        dock.append(panel);
        dock.classList.add("is-live");
        panel.classList.add("is-docked");
        panel.hidden = false; launch.hidden = true;
        if (history.length && !greeted) { greeted = true; bubble("assistant", t.again); }
        log.scrollTop = log.scrollHeight;
      } else if (!e.isIntersecting && panel.parentNode === dock) {
        root.append(panel);
        dock.classList.remove("is-live");
        panel.classList.remove("is-docked");
        panel.hidden = !floatingOpen; launch.hidden = floatingOpen;
      }
    }, { threshold: 0.35 }).observe(dock);
  }

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
        body: JSON.stringify({ messages: history.slice(-20), lang, chatId }),
      });
      const data = r.ok ? await r.json() : null;
      typing.remove();
      if (!data || typeof data.reply !== "string") throw new Error("bad reply");
      history.push({ role: "assistant", content: data.reply });
      bubble("assistant", data.reply);
      if (data.lead) offerLead(data.lead);
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
