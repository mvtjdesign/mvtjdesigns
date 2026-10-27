// Swaps a poster button for the live app in an iframe, only when the visitor asks for it.
// The app is laid out at real device size, then scaled to fit the frame.
document.querySelectorAll('.svc-try-start').forEach(button => {
  button.addEventListener('click', () => {
    const device = button.parentElement;
    const frame = document.createElement('iframe');
    frame.src = button.dataset.trySrc;
    frame.title = button.dataset.tryTitle;
    frame.allow = 'fullscreen';
    frame.className = 'svc-try-frame';
    const fit = () => {
      const portrait = device.clientHeight > device.clientWidth;
      const width = portrait ? 540 : 1024;
      const height = portrait ? 720 : 640;
      frame.style.width = width + 'px';
      frame.style.height = height + 'px';
      frame.style.transform = `scale(${device.clientWidth / width})`;
    };
    button.replaceWith(frame);
    fit();
    new ResizeObserver(fit).observe(device);
    frame.focus();
  });
});
