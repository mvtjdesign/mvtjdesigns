// Ways to work: turns the price cards into a "Monthly / Per project" switch with expandable rows.
// Progressive enhancement: the cards stay in the HTML (all four languages), and without this script
// the page shows them as before. Rows are built from each card's own kicker, title, intro and price.
(() => {
  const root = document.getElementById("ways-to-work");
  const intro = root && root.querySelector(".ways-to-work-intro");
  if (!root || !intro || root.querySelector(".pm")) return;

  const LABELS = {
    en: { m: "Monthly", p: "Per project", ask: "How would you like to pay?" },
    es: { m: "Mensual", p: "Por proyecto", ask: "¿Cómo prefiere pagar?" },
    ru: { m: "Ежемесячно", p: "За проект", ask: "Как вам удобнее платить?" },
    el: { m: "Μηνιαία", p: "Ανά έργο", ask: "Πώς προτιμάτε να πληρώσετε;" },
  };
  const t = LABELS[(document.documentElement.lang || "en").slice(0, 2)] || LABELS.en;
  // Cards are identified by their heading ids, which are the same in every language.
  const MONTHLY = ["website-subscription-title", "offer-new-2-title", "offer-new-3-title", "website-care-title"];
  const GROUPS = [["offers-ads-title", ["offer-new-0-title", "offer-new-1-title", "offer-new-4-title"]],
                  ["offers-web-title", ["website-audit-title", "landing-page-sprint-title", "business-website-title", "premium-website-title"]],
                  ["other-services-title", ["custom-experience-title"]]];
  const card = id => document.getElementById(id)?.closest("article");
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  let uid = 0;
  function toRow(article, n) {
    const head = article.querySelector("h3, h4");
    const kicker = article.querySelector(".ways-to-work-start");
    const price = article.querySelector(".ways-to-work-price");
    const lead = [...article.children].find(c => c.tagName === "P" && !c.className);
    const body = el("div", "pm-body");
    body.id = `pm-body-${++uid}`;
    const button = el("button", "pm-head");
    button.type = "button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", body.id);
    const main = el("span", "pm-main");
    main.append(el("span", "pm-title", head.textContent.trim()));
    if (kicker) main.append(el("span", "pm-badge", kicker.textContent.trim()));
    if (lead) main.append(el("span", "pm-desc", lead.textContent.trim()));
    button.append(el("span", "pm-n", String(n).padStart(2, "0")), main, el("span", "pm-price", price ? price.textContent.trim() : ""),
                  Object.assign(el("span", "pm-chev"), { ariaHidden: "true" }));
    [kicker, price, lead].forEach(x => x && x.remove());
    head.textContent = "";
    head.classList.add("pm-h");
    head.append(button);
    const inner = el("div", "pm-inner");
    while (head.nextSibling) inner.append(head.nextSibling);
    body.append(inner);
    article.append(body);
    article.classList.add("pm-row");
    article.style.removeProperty("grid-column");
    if (article.id === "subscription") article.classList.add("pm-featured");
    button.addEventListener("click", () => toggle(article));
    return article;
  }

  function toggle(article, open = !article.classList.contains("is-open")) {
    article.classList.toggle("is-open", open);
    article.querySelector(".pm-head").setAttribute("aria-expanded", String(open));
  }

  const pm = el("div", "pm");
  const bar = el("div", "pm-bar");
  const seg = el("div", "pm-seg");
  seg.setAttribute("role", "tablist");
  seg.setAttribute("aria-label", t.ask);
  const lists = {};
  const tabs = {};
  for (const [key, label] of [["monthly", t.m], ["project", t.p]]) {
    const tab = el("button", "pm-tab", label);
    const list = el("div", "pm-list");
    tab.type = "button";
    tab.id = `pm-tab-${key}`;
    list.id = `pm-list-${key}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", list.id);
    list.setAttribute("role", "tabpanel");
    list.setAttribute("aria-labelledby", tab.id);
    tab.addEventListener("click", () => setMode(key));
    seg.append(tab);
    tabs[key] = tab;
    lists[key] = list;
  }
  seg.append(el("span", "pm-ind"));
  seg.addEventListener("keydown", e => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = pm.dataset.mode === "monthly" ? "project" : "monthly";
    setMode(next);
    tabs[next].focus();
  });
  bar.append(el("p", "pm-ask", t.ask), seg);

  MONTHLY.map(card).filter(Boolean).forEach((a, i) => lists.monthly.append(toRow(a, i + 1)));
  let n = 0;
  for (const [groupId, ids] of GROUPS) {
    const rows = ids.map(card).filter(Boolean);
    if (!rows.length) continue;
    lists.project.append(el("p", "pm-group", document.getElementById(groupId)?.textContent.trim()));
    rows.forEach(a => lists.project.append(toRow(a, ++n)));
  }
  pm.append(bar, lists.monthly, lists.project);
  intro.after(pm);
  root.querySelectorAll(".ways-to-work-secondary").forEach(g => { if (!g.querySelector("article")) g.hidden = true; });
  root.classList.add("pm-ready");

  function setMode(mode, animate = true) {
    pm.dataset.mode = mode;
    for (const key of Object.keys(lists)) {
      const on = key === mode;
      tabs[key].setAttribute("aria-selected", String(on));
      tabs[key].tabIndex = on ? 0 : -1;
      lists[key].hidden = !on;
    }
    if (animate) {
      lists[mode].querySelectorAll(".pm-row, .pm-group").forEach((r, i) => {
        r.style.setProperty("--i", i);
        r.classList.remove("pm-in");
        void r.offsetWidth;
        r.classList.add("pm-in");
      });
    }
  }

  // Open a row from a link or the URL: "See prices" under each service opens the matching list and row.
  function reveal(mode, rowId) {
    setMode(mode);
    const row = rowId && card(rowId);
    if (row) toggle(row, true);
  }
  const FROM_SERVICE = { "service-ads": ["project", null], "service-web": ["monthly", "website-subscription-title"],
                         "service-social": ["monthly", "offer-new-3-title"], "service-systems": ["monthly", "offer-new-2-title"] };
  document.querySelectorAll('#services a[href="#ways-to-work"]').forEach(a => {
    const target = FROM_SERVICE[a.closest(".svc-chapter")?.id];
    if (target) a.addEventListener("click", () => reveal(...target));
  });
  const HASH = { "#subscription": ["monthly", "website-subscription-title"], "#care": ["monthly", "website-care-title"] };
  const fromHash = () => {
    if (!HASH[location.hash]) return;
    reveal(...HASH[location.hash]);
    card(HASH[location.hash][1]).scrollIntoView({ block: "start" });
  };
  setMode("monthly", false);
  fromHash();
  window.addEventListener("hashchange", fromHash);
})();
