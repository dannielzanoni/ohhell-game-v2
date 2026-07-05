export async function copyText(value, browser = globalThis.navigator) {
  if (!browser?.clipboard?.writeText) {
    const error = new Error('Clipboard is unavailable');
    error.code = 'clipboard_unavailable';
    throw error;
  }
  await browser.clipboard.writeText(String(value));
}
