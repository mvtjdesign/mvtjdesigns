// Hidden shortcut for the founder: press and hold the MVTJ logo for 5 seconds to open MVTJ Command.
// Not a security control: Command is private and still requires its own Google sign-in.
(() => {
  const TARGET = "https://mvtj-command.vercel.app/";
  const HOLD_MS = 5000;

  document.querySelectorAll(".brand-lockup").forEach((logo) => {
    let timer = null;
    let opened = false;
    const cancel = () => { clearTimeout(timer); timer = null; };

    // Phones: stop the long-press link preview, which would otherwise cancel the hold.
    logo.style.webkitTouchCallout = "none";
    logo.style.webkitUserSelect = "none";
    logo.style.userSelect = "none";

    logo.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      opened = false;
      cancel();
      timer = setTimeout(() => { opened = true; timer = null; window.location.assign(TARGET); }, HOLD_MS);
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) logo.addEventListener(type, cancel);
    // A hold that opened Command must not also follow the logo's normal link; dragging the logo cancels the hold.
    logo.addEventListener("click", (event) => { if (opened) event.preventDefault(); });
    logo.addEventListener("contextmenu", (event) => { if (timer || opened) event.preventDefault(); });
    logo.addEventListener("dragstart", (event) => { if (timer) event.preventDefault(); });
  });
})();
