/* MVTJ Command · Project intake: the website assistant.
   A short guided brief (Scenes 01-05) with the AI conversation available throughout.
   Talks to the chat backend named in the script tag's data-endpoint; leads go to /api/lead.
   The conversation lives in this tab (sessionStorage); MVTJ keeps a redacted copy for 90 days (see api/_db.js). */
(() => {
  "use strict";
  const script = document.currentScript;
  const endpoint = script && script.dataset.endpoint;
  if (!endpoint) return;

  const CALENDLY = "https://calendly.com/max-tijerino/30min";
  const WHATSAPP = "https://wa.me/35794338222";
  const STRINGS = {
    en: { title: "MVTJ assistant",
      again: "Oh, hello again. Want to pick up where we left off?",
      hello: "Hi, I'm MVTJ's automated assistant. We handle your web, social and ads, and build the systems that turn them into customers. What are you working on?",
      send: "Send", close: "Close", call: "Book a free call", wa: "WhatsApp",
      typing: "Thinking…", error: "Sorry, I couldn't reply just now. You can book a free call or message us on WhatsApp.",
      offline: "You seem to be offline. Your message is still here; send it again when you're back online.",
      note: "Replies come from Google Gemini, which may use messages to improve its products. MVTJ keeps chats for 90 days, with phone numbers and emails removed, to improve this assistant.",
      dispatch: "Yes, send me the MVTJ Dispatch: the latest in AI, film and marketing that actually works. Occasional emails, unsubscribe anytime.", needEmail: "Add an email address to get the MVTJ Dispatch, or untick it.",
      leadTitle: "Send this to MVTJ's team", name: "Your name (optional)", reach: "Phone or email so we can reply (optional)", consent: "I agree to MVTJ receiving this summary and these details to reply to me.", privacy: "Privacy policy", leadSend: "Send to the team", sent: "Sent. Max's team will be in touch. You can also book a call now.", leadFail: "That didn't send. Please book a call or message us on WhatsApp.", badReach: "Please enter a phone number or email address, or leave it empty." },
    es: { title: "Asistente MVTJ",
      again: "Ah, hola de nuevo. ¿Seguimos donde lo dejamos?",
      hello: "Hola, soy el asistente automático de MVTJ. Nos encargamos de tu web, redes y anuncios, y creamos los sistemas que los convierten en clientes. ¿En qué estás trabajando?",
      send: "Enviar", close: "Cerrar", call: "Reservar llamada gratis", wa: "WhatsApp",
      typing: "Pensando…", error: "Lo siento, no pude responder ahora. Puedes reservar una llamada gratuita o escribirnos por WhatsApp.",
      offline: "Parece que no tienes conexión. Tu mensaje sigue aquí; envíalo de nuevo cuando vuelvas a estar en línea.",
      note: "Las respuestas las genera Google Gemini, que puede usar los mensajes para mejorar sus productos. MVTJ guarda los chats 90 días, sin teléfonos ni emails, para mejorar este asistente.",
      dispatch: "Sí, envíame el MVTJ Dispatch: lo último en IA, cine y marketing que de verdad funciona. Correos ocasionales; puedes darte de baja cuando quieras.", needEmail: "Añade un email para recibir el MVTJ Dispatch, o desmárcalo.",
      leadTitle: "Enviar esto al equipo de MVTJ", name: "Tu nombre (opcional)", reach: "Teléfono o email para responderte (opcional)", consent: "Acepto que MVTJ reciba este resumen y estos datos para responderme.", privacy: "Política de privacidad", leadSend: "Enviar al equipo", sent: "Enviado. El equipo de Max se pondrá en contacto. También puedes reservar una llamada ahora.", leadFail: "No se pudo enviar. Reserva una llamada o escríbenos por WhatsApp.", badReach: "Escribe un teléfono o un email, o déjalo vacío." },
    ru: { title: "Ассистент MVTJ",
      again: "О, снова здравствуйте! Продолжим с того места, где остановились?",
      hello: "Здравствуйте, я автоматический ассистент MVTJ. Мы ведём ваш сайт, соцсети и рекламу и строим системы, которые превращают их в клиентов. Над чем вы работаете?",
      send: "Отправить", close: "Закрыть", call: "Бесплатный звонок", wa: "WhatsApp",
      typing: "Думаю…", error: "Извините, не получилось ответить. Запишитесь на бесплатный звонок или напишите нам в WhatsApp.",
      offline: "Похоже, нет подключения к интернету. Сообщение сохранено; отправьте его снова, когда связь появится.",
      note: "Ответы генерирует Google Gemini, который может использовать сообщения для улучшения своих продуктов. MVTJ хранит чаты 90 дней, без телефонов и email, чтобы улучшать этого ассистента.",
      dispatch: "Да, присылайте мне MVTJ Dispatch: новинки ИИ, кино и маркетинга, который действительно работает. Нечастые письма, отписаться можно в любой момент.", needEmail: "Укажите email, чтобы получать MVTJ Dispatch, или снимите отметку.",
      leadTitle: "Отправить это команде MVTJ", name: "Ваше имя (необязательно)", reach: "Телефон или email для ответа (необязательно)", consent: "Я согласен(на), чтобы MVTJ получила эту сводку и данные для ответа мне.", privacy: "Политика конфиденциальности", leadSend: "Отправить команде", sent: "Отправлено. Команда Макса свяжется с вами. Также можно записаться на звонок.", leadFail: "Не удалось отправить. Запишитесь на звонок или напишите нам в WhatsApp.", badReach: "Укажите телефон или email либо оставьте поле пустым." },
    el: { title: "Βοηθός MVTJ",
      again: "Α, γεια σας ξανά! Συνεχίζουμε από εκεί που μείναμε;",
      hello: "Γεια σας, είμαι ο αυτόματος βοηθός της MVTJ. Αναλαμβάνουμε το website, τα social και τις διαφημίσεις σας και φτιάχνουμε τα συστήματα που τα μετατρέπουν σε πελάτες. Σε τι δουλεύετε;",
      send: "Αποστολή", close: "Κλείσιμο", call: "Δωρεάν κλήση", wa: "WhatsApp",
      typing: "Σκέφτομαι…", error: "Λυπούμαστε, δεν μπόρεσα να απαντήσω. Κλείστε μια δωρεάν κλήση ή στείλτε μας μήνυμα στο WhatsApp.",
      offline: "Φαίνεται ότι δεν έχετε σύνδεση. Το μήνυμά σας είναι ακόμη εδώ· στείλτε το ξανά όταν συνδεθείτε.",
      note: "Οι απαντήσεις προέρχονται από το Google Gemini, που μπορεί να χρησιμοποιεί τα μηνύματα για τη βελτίωση των προϊόντων του. Η MVTJ κρατά τις συνομιλίες για 90 ημέρες, χωρίς τηλέφωνα και email, για να βελτιώνει αυτόν τον βοηθό.",
      dispatch: "Ναι, στείλτε μου το MVTJ Dispatch: τα τελευταία στην AI, στο σινεμά και στο marketing που πραγματικά αποδίδει. Περιστασιακά email, διαγραφή οποιαδήποτε στιγμή.", needEmail: "Προσθέστε ένα email για να λαμβάνετε το MVTJ Dispatch, ή αφαιρέστε την επιλογή.",
      leadTitle: "Αποστολή στην ομάδα της MVTJ", name: "Το όνομά σας (προαιρετικό)", reach: "Τηλέφωνο ή email για να σας απαντήσουμε (προαιρετικό)", consent: "Συμφωνώ να λάβει η MVTJ αυτή τη σύνοψη και αυτά τα στοιχεία για να μου απαντήσει.", privacy: "Πολιτική απορρήτου", leadSend: "Αποστολή στην ομάδα", sent: "Στάλθηκε. Η ομάδα του Max θα επικοινωνήσει μαζί σας. Μπορείτε επίσης να κλείσετε μια κλήση τώρα.", leadFail: "Δεν στάλθηκε. Κλείστε μια κλήση ή στείλτε μας μήνυμα στο WhatsApp.", badReach: "Γράψτε τηλέφωνο ή email, ή αφήστε το κενό." },
  };

  // The guided brief. Scene 03's options depend on the starting point chosen in Scene 01.
  const INTAKE = {
    en: { launch: "Start a project", product: "Project intake", descriptor: "Cinematic Ads · Websites · Growth Systems", ai: "AI assistant · not a person",
      lead: "Every project starts with a brief.", leadSub: "Tell us what you're building, and we'll help shape the next step.", scene: "Scene",
      titles: ["Your starting point", "Your business", "The project", "Timeline", "Next step"],
      questions: ["What do you need most right now?", "What kind of business do you run?", "What are you considering?", "When would you like to begin?", "Here's your brief."],
      doors: [["We need more people to notice us.", "Cinematic ads, content and visibility."], ["People notice us, but not enough of them book.", "Websites, clearer messaging and conversion systems."], ["We need both.", "Creative direction and connected digital experiences."]],
      biz: ["Hotel / Hospitality", "Restaurant / Café", "Product / E-commerce", "Property / Real Estate", "Professional Services", "Other"],
      proj: { ad: "Cinematic Advertisement", web: "Website / Landing Page", social: "Social Content", system: "Digital Growth System", full: "Full Campaign", unsure: "Not Sure Yet" },
      time: ["As soon as possible", "Within 1–3 months", "Just exploring"],
      labels: ["Starting point", "Business", "Project", "Timeline"],
      callBig: "Book a free call", waBig: "Continue on WhatsApp", enquiry: "Send an enquiry",
      back: "Back", restart: "Start over", skip: "Skip, just chat", human: "Talk to a person", editBrief: "Edit brief", brief: "Brief",
      placeholder: "Ask anything, or describe your project…", placeholderShort: "Ask anything…",
      waText: "Hi MVTJ, here's my brief:", enquiryMsg: "Here's my project brief: {brief}. I'd like to send an enquiry to the team.", soFar: "My brief so far: {brief}.",
      humanReply: "Happy to connect you with a person. Book a free call or message us on WhatsApp, and Max or the team will reply." },
    es: { launch: "Empezar un proyecto", product: "Inicio de proyecto", descriptor: "Anuncios cinematográficos · Webs · Sistemas de crecimiento", ai: "Asistente de IA · no es una persona",
      lead: "Todo proyecto empieza con un brief.", leadSub: "Cuéntanos qué estás construyendo y te ayudamos a definir el siguiente paso.", scene: "Escena",
      titles: ["Tu punto de partida", "Tu negocio", "El proyecto", "Plazos", "Siguiente paso"],
      questions: ["¿Qué necesitas más ahora mismo?", "¿Qué tipo de negocio tienes?", "¿Qué estás considerando?", "¿Cuándo te gustaría empezar?", "Este es tu brief."],
      doors: [["Necesitamos que más gente nos vea.", "Anuncios cinematográficos, contenido y visibilidad."], ["Nos ven, pero pocos reservan.", "Webs, mensajes más claros y sistemas de conversión."], ["Necesitamos ambas cosas.", "Dirección creativa y experiencias digitales conectadas."]],
      biz: ["Hotel / Hostelería", "Restaurante / Café", "Producto / E-commerce", "Inmobiliaria", "Servicios profesionales", "Otro"],
      proj: { ad: "Anuncio cinematográfico", web: "Web / Landing page", social: "Contenido para redes", system: "Sistema de crecimiento digital", full: "Campaña completa", unsure: "Aún no lo sé" },
      time: ["Lo antes posible", "En 1–3 meses", "Solo estoy explorando"],
      labels: ["Punto de partida", "Negocio", "Proyecto", "Plazos"],
      callBig: "Reservar llamada gratis", waBig: "Seguir por WhatsApp", enquiry: "Enviar consulta",
      back: "Atrás", restart: "Empezar de nuevo", skip: "Saltar, solo chatear", human: "Hablar con una persona", editBrief: "Editar brief", brief: "Brief",
      placeholder: "Pregunta lo que quieras o describe tu proyecto…", placeholderShort: "Pregunta lo que quieras…",
      waText: "Hola MVTJ, este es mi brief:", enquiryMsg: "Este es el brief de mi proyecto: {brief}. Me gustaría enviar una consulta al equipo.", soFar: "Mi brief hasta ahora: {brief}.",
      humanReply: "Con gusto te ponemos en contacto con una persona. Reserva una llamada gratuita o escríbenos por WhatsApp y Max o el equipo te responderán." },
    ru: { launch: "Начать проект", product: "Бриф проекта", descriptor: "Кинематографичная реклама · Сайты · Системы роста", ai: "ИИ-ассистент · не человек",
      lead: "Каждый проект начинается с брифа.", leadSub: "Расскажите, что вы создаёте, и мы поможем определить следующий шаг.", scene: "Сцена",
      titles: ["Отправная точка", "Ваш бизнес", "Проект", "Сроки", "Следующий шаг"],
      questions: ["Что вам сейчас нужнее всего?", "Какой у вас бизнес?", "Что вы рассматриваете?", "Когда вы хотели бы начать?", "Ваш бриф."],
      doors: [["Нам нужно, чтобы нас замечало больше людей.", "Кинематографичная реклама, контент и узнаваемость."], ["Нас замечают, но бронируют слишком мало.", "Сайты, понятные сообщения и системы конверсии."], ["Нам нужно и то и другое.", "Креативное направление и связанные цифровые решения."]],
      biz: ["Отель / Гостеприимство", "Ресторан / Кафе", "Товар / E-commerce", "Недвижимость", "Профессиональные услуги", "Другое"],
      proj: { ad: "Кинематографичная реклама", web: "Сайт / Лендинг", social: "Контент для соцсетей", system: "Цифровая система роста", full: "Полная кампания", unsure: "Пока не знаю" },
      time: ["Как можно скорее", "В течение 1–3 месяцев", "Пока изучаю варианты"],
      labels: ["Отправная точка", "Бизнес", "Проект", "Сроки"],
      callBig: "Бесплатный звонок", waBig: "Продолжить в WhatsApp", enquiry: "Отправить заявку",
      back: "Назад", restart: "Начать заново", skip: "Пропустить, просто чат", human: "Поговорить с человеком", editBrief: "Изменить бриф", brief: "Бриф",
      placeholder: "Спросите что угодно или опишите проект…", placeholderShort: "Спросите что угодно…",
      waText: "Здравствуйте, MVTJ! Мой бриф:", enquiryMsg: "Бриф моего проекта: {brief}. Хочу отправить заявку команде.", soFar: "Мой бриф на данный момент: {brief}.",
      humanReply: "С радостью свяжем вас с человеком. Запишитесь на бесплатный звонок или напишите в WhatsApp, и Макс или команда вам ответят." },
    el: { launch: "Ξεκινήστε ένα έργο", product: "Ενημέρωση έργου", descriptor: "Κινηματογραφικές διαφημίσεις · Ιστοσελίδες · Συστήματα ανάπτυξης", ai: "Βοηθός AI · όχι άνθρωπος",
      lead: "Κάθε έργο ξεκινά με ένα brief.", leadSub: "Πείτε μας τι χτίζετε και θα σας βοηθήσουμε να διαμορφώσετε το επόμενο βήμα.", scene: "Σκηνή",
      titles: ["Το σημείο εκκίνησής σας", "Η επιχείρησή σας", "Το έργο", "Χρονοδιάγραμμα", "Επόμενο βήμα"],
      questions: ["Τι χρειάζεστε περισσότερο αυτή τη στιγμή;", "Τι είδους επιχείρηση έχετε;", "Τι σκέφτεστε;", "Πότε θα θέλατε να ξεκινήσετε;", "Αυτό είναι το brief σας."],
      doors: [["Χρειαζόμαστε περισσότερους να μας προσέξουν.", "Κινηματογραφικές διαφημίσεις, περιεχόμενο και προβολή."], ["Μας προσέχουν, αλλά λίγοι κάνουν κράτηση.", "Ιστοσελίδες, πιο ξεκάθαρο μήνυμα και συστήματα μετατροπής."], ["Χρειαζόμαστε και τα δύο.", "Δημιουργική κατεύθυνση και συνδεδεμένες ψηφιακές εμπειρίες."]],
      biz: ["Ξενοδοχείο / Φιλοξενία", "Εστιατόριο / Καφέ", "Προϊόν / E-commerce", "Ακίνητα", "Επαγγελματικές υπηρεσίες", "Άλλο"],
      proj: { ad: "Κινηματογραφική διαφήμιση", web: "Ιστοσελίδα / Landing page", social: "Περιεχόμενο για social", system: "Ψηφιακό σύστημα ανάπτυξης", full: "Ολοκληρωμένη καμπάνια", unsure: "Δεν ξέρω ακόμη" },
      time: ["Το συντομότερο δυνατό", "Μέσα σε 1–3 μήνες", "Απλώς εξερευνώ"],
      labels: ["Σημείο εκκίνησης", "Επιχείρηση", "Έργο", "Χρονοδιάγραμμα"],
      callBig: "Δωρεάν κλήση", waBig: "Συνέχεια στο WhatsApp", enquiry: "Αποστολή αιτήματος",
      back: "Πίσω", restart: "Από την αρχή", skip: "Παράλειψη, μόνο συνομιλία", human: "Μιλήστε με άνθρωπο", editBrief: "Αλλαγή brief", brief: "Brief",
      placeholder: "Ρωτήστε οτιδήποτε ή περιγράψτε το έργο σας…", placeholderShort: "Ρωτήστε οτιδήποτε…",
      waText: "Γεια σας MVTJ, αυτό είναι το brief μου:", enquiryMsg: "Αυτό είναι το brief του έργου μου: {brief}. Θα ήθελα να στείλω αίτημα στην ομάδα.", soFar: "Το brief μου μέχρι τώρα: {brief}.",
      humanReply: "Ευχαρίστως να σας φέρουμε σε επαφή με άνθρωπο. Κλείστε μια δωρεάν κλήση ή στείλτε μας μήνυμα στο WhatsApp και ο Max ή η ομάδα θα σας απαντήσουν." },
  };
  const PROJECTS_BY_DOOR = [["ad", "social", "full", "unsure"], ["web", "system", "full", "unsure"], ["ad", "web", "social", "system", "full", "unsure"]];
  const SCENES = 5;

  const lang = (window.MVTJI18N && window.MVTJI18N.lang) || document.documentElement.lang.slice(0, 2) || "en";
  const t = { ...(STRINGS[lang] || STRINGS.en), ...(INTAKE[lang] || INTAKE.en) };
  const storeKey = "mvtj-assistant-v1";

  const load = (key, fallback) => { try { return JSON.parse(sessionStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; } };
  const store = (key, value) => { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ } };

  let history = load(storeKey, []);   // [{ role, content }] - what the backend sees (greeting excluded)
  if (!Array.isArray(history)) history = [];
  const save = () => store(storeKey, history.slice(-20));
  // The brief: indexes into the option lists; scene is 1-5.
  let brief = load(storeKey + "-brief", {});
  if (!brief || typeof brief !== "object") brief = {};
  const saveBrief = () => store(storeKey + "-brief", brief);
  // One id per conversation, so the stored transcript and any lead sent from it stay together.
  let chatId = "";
  try { chatId = sessionStorage.getItem(storeKey + "-id") || ""; } catch { /* optional */ }
  function newChatId() {
    chatId = window.crypto && crypto.randomUUID ? crypto.randomUUID() : "";
    try { sessionStorage.setItem(storeKey + "-id", chatId); } catch { /* optional */ }
  }
  if (!chatId) newChatId();

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const button = (cls, text, onClick) => { const b = el("button", cls, text); b.type = "button"; b.addEventListener("click", onClick); return b; };
  const pad = n => String(n).padStart(2, "0");

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

  // ---------- shell ----------
  const root = el("div", "mvtj-assist");
  const launch = el("button", "mvtj-assist__launch");
  launch.type = "button";
  launch.setAttribute("aria-expanded", "false");
  launch.append(el("span", "mvtj-assist__mark"), el("span", "mvtj-assist__launch-label", t.launch));

  const panel = el("section", "mvtj-assist__panel");
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", `MVTJ Command · ${t.product}`);
  const head = el("header", "mvtj-assist__head");
  const titles = el("div", "mvtj-assist__titles");
  titles.append(el("p", "mvtj-assist__kicker", "MVTJ Command"), el("p", "mvtj-assist__title", t.product),
    el("p", "mvtj-assist__descriptor", t.descriptor));
  const close = button("mvtj-assist__close", "×", () => toggle(false));
  close.setAttribute("aria-label", t.close);
  head.append(titles, close);
  const ai = el("p", "mvtj-assist__ai", t.ai);

  const stage = el("div", "mvtj-assist__stage");
  const log = el("div", "mvtj-assist__log");
  log.setAttribute("aria-live", "polite");
  log.setAttribute("aria-label", t.title);
  const briefBar = el("div", "mvtj-assist__briefbar");
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
  panel.append(head, ai, stage, log, briefBar, form, el("p", "mvtj-assist__note", t.note));   // cta sits in the brief bar
  root.append(launch, panel);
  document.body.append(root);

  // ---------- conversation ----------
  function bubble(role, text, extra = "") {
    const b = el("div", `mvtj-assist__msg mvtj-assist__msg--${role === "user" ? "me" : "bot"} ${extra}`.trim());
    const body = el("div", "mvtj-assist__text");
    fill(body, text);
    b.append(body);
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
    status.setAttribute("role", "status");
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
        card.replaceChildren(el("p", "mvtj-assist__lead-status", t.sent));   // only once the server confirms
      } catch {
        go.disabled = false; status.textContent = navigator.onLine === false ? t.offline : t.leadFail;
      }
    });
    log.append(card);
    log.scrollTop = log.scrollHeight;
  }

  // ---------- the brief ----------
  const projectsFor = door => PROJECTS_BY_DOOR[door ?? 2];
  function briefParts() {
    const parts = [];
    if (brief.door != null) parts.push([t.labels[0], t.doors[brief.door][0]]);
    if (brief.biz != null) parts.push([t.labels[1], t.biz[brief.biz]]);
    if (brief.proj) parts.push([t.labels[2], t.proj[brief.proj]]);
    if (brief.time != null) parts.push([t.labels[3], t.time[brief.time]]);
    return parts;
  }
  const briefText = () => briefParts().map(([k, v]) => `${k}: ${v}`).join("; ");

  function setScene(n, focus = true) {
    brief.scene = Math.max(1, Math.min(SCENES, n));
    saveBrief();
    renderScene(focus);
  }

  function option(letter, label, sub, selected, onPick) {
    const b = button("mvtj-assist__option", "", onPick);
    b.setAttribute("aria-pressed", String(selected));
    if (letter) b.append(el("span", "mvtj-assist__option-key", letter));
    const text = el("span", "mvtj-assist__option-text");
    text.append(el("span", "mvtj-assist__option-label", label));
    if (sub) text.append(el("span", "mvtj-assist__option-sub", sub));
    b.append(text);
    return b;
  }

  function renderScene(focus) {
    const n = brief.scene || 1;
    const scene = el("div", "mvtj-assist__scene");
    if (n === 1) {
      const intro = el("div", "mvtj-assist__intro");
      intro.append(el("p", "mvtj-assist__lead-line", t.lead), el("p", "mvtj-assist__lead-sub", t.leadSub));
      scene.append(intro);
    }
    const heading = el("h2", "mvtj-assist__scene-title", `${t.scene} ${pad(n)} / ${pad(SCENES)} — ${t.titles[n - 1]}`);
    heading.tabIndex = -1;
    scene.append(heading, el("p", "mvtj-assist__question", t.questions[n - 1]));
    const options = el("div", "mvtj-assist__options");
    const pick = (field, value) => () => {
      brief[field] = value;
      if (field === "door" && brief.proj && !projectsFor(value).includes(brief.proj)) delete brief.proj;
      setScene(n + 1);
    };
    if (n === 1) t.doors.forEach(([label, sub], i) => options.append(option("ABC"[i], label, sub, brief.door === i, pick("door", i))));
    if (n === 2) t.biz.forEach((label, i) => options.append(option("", label, "", brief.biz === i, pick("biz", i))));
    if (n === 3) projectsFor(brief.door).forEach(key => options.append(option("", t.proj[key], "", brief.proj === key, pick("proj", key))));
    if (n === 4) t.time.forEach((label, i) => options.append(option("", label, "", brief.time === i, pick("time", i))));
    if (n < 5) scene.append(options);
    if (n === 5) {
      const list = el("dl", "mvtj-assist__summary");
      for (const [k, v] of briefParts()) list.append(el("dt", "", k), el("dd", "", v));
      const actions = el("div", "mvtj-assist__actions");
      const book = el("a", "mvtj-assist__action mvtj-assist__action--primary", t.callBig);
      book.href = CALENDLY; book.target = "_blank"; book.rel = "noopener";
      const whats = el("a", "mvtj-assist__action", t.waBig);
      whats.href = `${WHATSAPP}?text=${encodeURIComponent(`${t.waText} ${briefText()}`)}`;
      whats.target = "_blank"; whats.rel = "noopener";
      const enquire = button("mvtj-assist__action", t.enquiry, () => submit(t.enquiryMsg.replace("{brief}", briefText()), true));
      actions.append(book, whats, enquire);
      scene.append(list, actions);
    }
    const nav = el("div", "mvtj-assist__nav");
    if (n > 1) nav.append(button("mvtj-assist__link", `← ${t.back}`, () => setScene(n - 1)));
    nav.append(button("mvtj-assist__link", t.skip, () => setMode("chat", true)));
    if (n > 1) nav.append(button("mvtj-assist__link", t.restart, startOver));
    nav.append(button("mvtj-assist__link", t.human, askForHuman));
    scene.append(nav);
    stage.replaceChildren(scene);
    stage.scrollTop = 0;
    if (focus && !panel.hidden) heading.focus({ preventScroll: true });
  }

  function renderBriefBar() {
    briefBar.replaceChildren();
    const text = briefParts().map(([, v]) => v).join(" · ");
    if (text) briefBar.append(el("span", "mvtj-assist__briefbar-text", `${t.brief}: ${text}`));
    briefBar.append(button("mvtj-assist__link", t.editBrief, () => setMode("brief")),
      button("mvtj-assist__link", t.restart, startOver), cta);
  }

  let mode = "brief";
  let greeted = false;
  function setMode(next, focusInput = false) {
    mode = next;
    panel.dataset.mode = next;
    if (next === "chat") {
      if (!greeted && !log.childElementCount) { bubble("assistant", t.hello); greeted = true; }
      renderBriefBar();
      if (focusInput && !panel.hidden) input.focus();
    } else {
      if (!brief.scene) brief.scene = 1;
      renderScene(!panel.hidden);
    }
  }

  function askForHuman() {
    setMode("chat");
    bubble("assistant", t.humanReply);
    call.focus();
  }

  function startOver() {
    history = []; save();
    brief = { scene: 1 }; saveBrief();
    briefSent = false;
    newChatId();
    leadCard = null;
    log.replaceChildren();
    greeted = false;
    setMode("brief");
  }

  // ---------- sending ----------
  let busy = false;
  let briefSent = load(storeKey + "-briefsent", false);
  async function submit(text, isBrief = false) {
    text = text.trim();
    if (!text || busy) return;
    if (mode !== "chat") setMode("chat");
    // The first typed line carries the brief so far, so the assistant knows the context.
    const parts = briefParts();
    const content = !isBrief && !briefSent && parts.length ? `${t.soFar.replace("{brief}", briefText())}\n\n${text}` : text;
    if (parts.length) { briefSent = true; store(storeKey + "-briefsent", true); }
    busy = true; send.disabled = true;
    history.push({ role: "user", content });
    bubble("user", content);
    renderBriefBar();
    const typing = bubble("assistant", t.typing, "mvtj-assist__msg--typing");
    typing.setAttribute("aria-hidden", "true");
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
      input.value = "";
    } catch {
      typing.remove();
      history.pop();          // let the visitor retry the same message
      log.lastElementChild?.remove();
      if (!isBrief) input.value = text;
      bubble("assistant", navigator.onLine === false ? t.offline : t.error);
    } finally {
      busy = false; send.disabled = false;
      if (!panel.hidden) input.focus();
    }
  }
  form.addEventListener("submit", e => { e.preventDefault(); submit(input.value); });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });

  // ---------- open / close, phones ----------
  const phone = window.matchMedia("(max-width: 600px)");
  // On phones the panel is a full-height sheet sized to the visible viewport, so the keyboard never covers the input.
  // The long placeholder wraps in a phone-width field; phones get the short one.
  const fitPlaceholder = () => { input.placeholder = phone.matches ? t.placeholderShort : t.placeholder; };
  fitPlaceholder();
  phone.addEventListener("change", fitPlaceholder);
  function fitViewport() {
    const vv = window.visualViewport;
    if (!vv) return;
    panel.style.setProperty("--mvtj-vh", `${vv.height}px`);
    panel.style.setProperty("--mvtj-vt", `${vv.offsetTop}px`);
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitViewport);
    window.visualViewport.addEventListener("scroll", fitViewport);
  }

  let floatingOpen = false;
  function toggle(open) {
    if (panel.classList.contains("is-docked")) return;
    floatingOpen = open;
    panel.hidden = !open;
    launch.hidden = open;
    launch.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("mvtj-assist-open", open && phone.matches);
    if (open) {
      fitViewport();
      if (mode === "brief") stage.querySelector(".mvtj-assist__scene-title")?.focus({ preventScroll: true });
      else { input.focus(); log.scrollTop = log.scrollHeight; }
    } else launch.focus();
  }
  launch.addEventListener("click", () => toggle(true));
  panel.addEventListener("keydown", e => { if (e.key === "Escape") toggle(false); });

  // ---------- start ----------
  for (const m of history) bubble(m.role, m.content);
  if (history.length) { greeted = true; setMode("chat"); } else setMode("brief");

  // A page can host the same assistant inline: [data-mvtj-assist-dock]. While the dock is on screen the panel
  // (and its conversation) moves into it; scrolling away returns it to the corner.
  const dock = document.querySelector("[data-mvtj-assist-dock]");
  if (dock && "IntersectionObserver" in window) {
    let welcomedBack = false;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && panel.parentNode !== dock) {
        dock.append(panel);
        dock.classList.add("is-live");
        panel.classList.add("is-docked");
        panel.hidden = false; launch.hidden = true;
        document.documentElement.classList.remove("mvtj-assist-open");
        if (history.length && !welcomedBack) { welcomedBack = true; bubble("assistant", t.again); }
        log.scrollTop = log.scrollHeight;
      } else if (!e.isIntersecting && panel.parentNode === dock) {
        root.append(panel);
        dock.classList.remove("is-live");
        panel.classList.remove("is-docked");
        panel.hidden = !floatingOpen; launch.hidden = floatingOpen;
      }
    }, { threshold: 0.35 }).observe(dock);
  }
})();
