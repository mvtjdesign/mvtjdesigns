/* Native image links remain usable when JavaScript is unavailable. */
(() => {
  if (!('HTMLDialogElement' in window)) return;
  const t = key => window.MVTJI18N?.messages?.[key] || key;
  const dialog = document.createElement('dialog');
  dialog.className = 'project-dialog';
  dialog.setAttribute('aria-label', t('Project screenshot'));
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = t('Close ×');
  const image = document.createElement('img');
  dialog.append(close);
  document.body.append(dialog);
  document.querySelectorAll('[data-preview]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    dialog.append(image);
    dialog.showModal();
  }));
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
