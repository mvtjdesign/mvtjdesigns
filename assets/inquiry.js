/* MVTJ project inquiry enhancement. Endpoint lives only in the form's action.
   No tracker is installed; hooks contain event names only. See FORM-SETUP.md. */
(() => {
  "use strict";
  const form = document.getElementById("project-inquiry-form");
  if (!form) return;
  const fields = document.getElementById("inquiry-fields");
  const button = document.getElementById("inquiry-submit");
  const status = document.getElementById("inquiry-status");
  const setup = document.getElementById("inquiry-setup");
  const summary = document.getElementById("inquiry-summary");
  const errorList = document.getElementById("inquiry-error-list");
  const controls = [...form.querySelectorAll("input:not([type=hidden]), select, textarea")]
    .filter(control => control.name !== "_gotcha");
  const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const storageKey = "mvtj-inquiry-attribution-v1";
  const clean = value => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 300) : "";
  // Exclude URL queries/fragments/credentials so unrelated personal data is not captured.
  const safePage = value => {
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) ? (url.origin + url.pathname).slice(0, 1000) : "";
    } catch { return ""; }
  };
  function emit(event) {
    // Hook failure must never interrupt delivery. No form values enter this queue.
    try {
      if (!window.dataLayer) window.dataLayer = [];
      if (typeof window.dataLayer.push === "function") window.dataLayer.push({ event });
    } catch { /* Analytics is optional. */ }
  }
  let attribution = {};
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "{}");
    if (saved && typeof saved === "object") {
      for (const key of campaignKeys) attribution[key] = clean(saved[key]);
      if (typeof saved.original_referrer === "string") attribution.original_referrer = safePage(saved.original_referrer);
    }
  } catch { /* Private browsing/storage restrictions do not block the form. */ }
  const params = new URLSearchParams(window.location.search);
  // Latest tagged visit replaces all campaign fields together, avoiding mixed campaigns.
  if (campaignKeys.some(key => params.has(key))) {
    for (const key of campaignKeys) attribution[key] = clean(params.get(key));
  }
  if (!("original_referrer" in attribution)) attribution.original_referrer = safePage(document.referrer);
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(attribution)); } catch { /* Optional persistence. */ }
  for (const key of campaignKeys) form.elements.namedItem(key).value = attribution[key] || "";
  form.elements.namedItem("original_referrer").value = attribution.original_referrer;
  form.elements.namedItem("page_url").value = safePage(window.location.href);

  let endpoint = "";
  try {
    const candidate = new URL(form.getAttribute("action"));
    if (candidate.origin === "https://formspree.io" && /^\/f\/[a-zA-Z0-9]+$/.test(candidate.pathname)
        && !candidate.search && !candidate.hash && !candidate.username && !candidate.password) endpoint = candidate.href;
  } catch { /* Empty action deliberately disables delivery. */ }
  fields.disabled = false; // Allow local review; the unconfigured submit button stays disabled.
  button.disabled = !endpoint;
  setup.hidden = Boolean(endpoint);
  form.noValidate = true; // Native required/type validation remains the no-JS fallback.
  let started = false;
  let submitting = false;
  let delivered = false;
  function start(event) {
    if (!started && controls.includes(event.target)) { started = true; emit("lead_form_start"); }
  }
  form.addEventListener("input", start);
  form.addEventListener("change", start);
  // A single delegated listener covers both booking alternatives in this area.
  document.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (link && link.getAttribute("href") === "https://calendly.com/max-tijerino/30min"
        && link.closest("#contact, #project-inquiry")) emit("calendly_click");
  });

  function errorFor(control) {
    if (control.required && (control.type === "checkbox" ? !control.checked : !control.value.trim())) {
      if (control.type === "checkbox") return "Please agree to the use of your details to respond to this inquiry.";
      if (control.tagName === "SELECT") return "Please choose an option.";
      return "Please complete this required field.";
    }
    if (control.type === "email" && control.validity.typeMismatch) return "Please enter a valid email address.";
    if (control.type === "url" && control.value) {
      try {
        const url = new URL(control.value);
        if (!/^https?:$/.test(url.protocol)) return "Please enter a website address starting with https:// or http://.";
      } catch { return "Please enter a website address starting with https:// or http://."; }
    }
    if (!control.validity.valid) return "Please check this field and its permitted length.";
    return "";
  }
  function showError(control, message) {
    const error = document.getElementById(control.id + "-error");
    if (error) error.textContent = message;
    if (message) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
  }
  form.addEventListener("focusout", event => {
    if (controls.includes(event.target)) showError(event.target, errorFor(event.target));
  });
  form.addEventListener("input", event => {
    if (controls.includes(event.target) && event.target.getAttribute("aria-invalid") === "true") {
      showError(event.target, errorFor(event.target));
    }
  });
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (submitting || delivered) return;
    if (!endpoint) { status.textContent = setup.textContent; return; }
    errorList.replaceChildren();
    for (const control of controls) {
      const message = errorFor(control);
      showError(control, message);
      if (message) {
        const item = document.createElement("li");
        const link = document.createElement("a");
        link.href = "#" + control.id;
        link.textContent = control.labels[0].textContent.trim() + ": " + message;
        link.addEventListener("click", event => { event.preventDefault(); control.focus(); });
        item.append(link); errorList.append(item);
      }
    }
    summary.hidden = errorList.children.length === 0;
    if (!summary.hidden) { summary.focus(); return; }
    if (form.elements.namedItem("_gotcha").value) {
      status.textContent = "The request could not be sent. Please use the call-booking or WhatsApp option.";
      emit("lead_form_error"); return;
    }
    submitting = true;
    button.disabled = true;
    button.textContent = "Sending Your Project Details…";
    form.setAttribute("aria-busy", "true");
    status.textContent = "Sending your project details…";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      form.elements.namedItem("page_url").value = safePage(window.location.href);
      const response = await fetch(endpoint, {
        method: "POST", body: new FormData(form), headers: { Accept: "application/json" },
        signal: controller.signal, credentials: "omit", redirect: "error"
      });
      // Formspree documents a successful HTTP response as acknowledgement.
      // Reject error payloads even when a misconfigured service returns HTTP 200.
      const result = await response.json();
      if (!response.ok || !result || typeof result !== "object" || Array.isArray(result)
          || result.ok === false || (Array.isArray(result.errors) && result.errors.length)) throw new Error("Delivery not confirmed");
      delivered = true;
      emit("lead_form_submit");
      status.textContent = "Your project details have been sent. Opening the thank-you page…";
      window.location.assign("/thank-you/");
    } catch {
      if (!delivered) {
        emit("lead_form_error");
        status.textContent = "We could not confirm delivery. Your details are still here. Please try again, or use Calendly or WhatsApp. If the request timed out, it may still have reached MVTJ Designs.";
      }
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      button.disabled = delivered;
      button.textContent = delivered ? "Project Details Sent" : "Send My Project Details";
      form.removeAttribute("aria-busy");
    }
  });
})();
