export const GOOGLE_IDENTITY_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export function loadGoogleIdentity(browser = globalThis) {
  const document = browser?.document;
  if (!document) return Promise.reject(new Error('Google Identity Services is unavailable.'));
  if (browser.google?.accounts?.id) return Promise.resolve(browser.google.accounts.id);

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);
    const resolveIdentity = () => {
      const identity = browser.google?.accounts?.id;
      if (identity) resolve(identity);
      else reject(new Error('Google Identity Services did not initialize.'));
    };

    if (existingScript) {
      existingScript.addEventListener('load', resolveIdentity, { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolveIdentity;
    script.onerror = () => reject(new Error('Failed to load Google Identity Services.'));
    document.head.appendChild(script);
  });
}

export function renderGoogleIdentityButton(identity, element, { callback, clientId }) {
  element.replaceChildren();
  identity.initialize({ client_id: clientId, callback });
  identity.renderButton(element, {
    shape: 'pill',
    size: 'large',
    text: 'continue_with',
    theme: 'outline',
    width: 260,
  });
}
