export async function copyText(value, browser = globalThis) {
  const text = String(value);
  const navigator = browser?.navigator || browser;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Continue with the selection-based browser fallback.
  }

  const document = browser?.document;
  if (document?.body && document.execCommand) {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (copied) return;
  }

  const error = new Error('Clipboard is unavailable');
  error.code = 'clipboard_unavailable';
  throw error;
}
