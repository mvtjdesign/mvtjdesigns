// Ways to work: turns the price cards into a "Monthly / Per project" switch of visual cards.
// Progressive enhancement: the cards stay in the HTML (all four languages), and without this script
// the page shows them as before.
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
  // Cards are grouped by data-pay and linked to by heading id; both are the same in every language.
  const card = id => document.getElementById(id)?.closest("article");
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  // One-off projects: a visual card with an image of real work (or a gold icon), the price up top and the
  // included items folded into "What's included". Images are keyed by heading id, the same in every language.
  const OFFER_MEDIA = {
    "offer-new-1-title": "/assets/work/mvtj-showreel-poster.jpg",
    "offer-new-0-title": "/assets/services/svc-mum-oil-480.jpg",
    "social-pack-title": "/assets/services/svc-nanourik-feed-480.jpg",
    "landing-page-sprint-title": "/assets/services/svc-social-site-640.webp",
    "business-website-title": "/assets/services/svc-web-ce-640.webp",
    "offer-new-2-title": "/assets/work/mvtj-assistant-live.png",
    "custom-experience-title": "/assets/services/svc-web-pendeli-640.webp",
    "addon-prospects-title": { icon: "prospects" },
    "website-audit-title": { icon: "seo" },
  };
  function toOffer(article) {
    article.classList.add("pm-offer");
    article.style.removeProperty("grid-column");
    const media = OFFER_MEDIA[article.getAttribute("aria-labelledby")];
    const fig = el("figure", "pm-offer-media");
    if (typeof media === "string") {
      const img = el("img");
      Object.assign(img, { src: media, alt: "", loading: "lazy", decoding: "async" });
      fig.append(img);
    } else {
      fig.classList.add("is-icon");
      fig.dataset.icon = media ? media.icon : "web";
    }
    article.prepend(fig);
    const scope = article.querySelector(".ways-to-work-scope");
    if (scope) {
      const more = el("details", "pm-offer-more");
      more.append(el("summary", "", scope.textContent.trim()));
      while (scope.nextSibling && !(scope.nextSibling.classList && scope.nextSibling.classList.contains("btn"))) more.append(scope.nextSibling);
      scope.replaceWith(more);
    }
    return article;
  }

  function toggle(article, open = !article.classList.contains("is-open")) {
    if (!article.querySelector(".pm-head")) return; // monthly plan cards are always open
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

  // Each list takes its group's cards in page order, then the group's terms note. Monthly plans stay as
  // full side-by-side cards, so price and contents read at a glance; one-off projects become visual cards.
  for (const key of Object.keys(lists)) {
    const group = root.querySelector(`[data-pay="${key}"]`);
    if (!group) continue;
    const articles = [...group.querySelectorAll("article")];
    if (key === "monthly") {
      const plans = el("div", "pm-plans");
      articles.forEach(a => {
        a.classList.add("pm-plan");
        a.style.removeProperty("grid-column");
        // "€500/month": keep the amount big and set the "/month" part smaller, in every language.
        const price = a.querySelector(".ways-to-work-price");
        const cut = price ? price.textContent.indexOf("/") : -1;
        if (cut > 0) {
          const text = price.textContent;
          price.textContent = text.slice(0, cut);
          price.append(el("small", "", text.slice(cut)));
        }
        plans.append(a);
      });
      lists[key].append(plans);
    } else {
      const offers = el("div", "pm-offers");
      articles.forEach(a => offers.append(toOffer(a)));
      lists[key].append(offers);
    }
    group.querySelectorAll(".ways-to-work-note").forEach(note => lists[key].append(note));
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
      lists[mode].querySelectorAll(".pm-row, .pm-group, .pm-plan, .pm-offer").forEach((r, i) => {
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
  const FROM_SERVICE = { "service-ads": ["project", "offer-new-1-title"], "service-web": ["monthly", "plan-all-title"],
                         "service-social": ["project", "social-pack-title"], "service-systems": ["monthly", "plan-all-title"] };
  document.querySelectorAll('#services a[href="#ways-to-work"]').forEach(a => {
    const target = FROM_SERVICE[a.closest(".svc-chapter")?.id];
    if (target) a.addEventListener("click", () => reveal(...target));
  });
  const HASH = { "#subscription": ["monthly", "plan-all-title"], "#care": ["monthly", "plan-all-title"],
                 "#starter": ["monthly", "plan-starter-title"] };
  const fromHash = () => {
    if (!HASH[location.hash]) return;
    reveal(...HASH[location.hash]);
    card(HASH[location.hash][1]).scrollIntoView({ block: "start" });
  };
  setMode("monthly", false);
  fromHash();
  window.addEventListener("hashchange", fromHash);
})();
