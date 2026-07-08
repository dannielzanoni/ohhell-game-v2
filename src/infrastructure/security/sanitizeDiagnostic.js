const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /authorization|credential|jwt|password|refresh.?token|access.?token|(^|_)token($|_)|nick.?name|(^|_)nick($|_)|player.?name/i;
const AUTHENTICATED_URL = /\b(?:wss?|https?):\/\/[^\s]+[?&](?:token|access_token|authorization)=[^\s&]+/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const JWT = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function sanitizeString(value) {
  return value
    .replace(AUTHENTICATED_URL, '[AUTHENTICATED_URL_REDACTED]')
    .replace(BEARER, `Bearer ${REDACTED}`)
    .replace(JWT, REDACTED);
}

export function sanitizeDiagnostic(value, seen = new WeakSet()) {
  if (typeof value === 'string') return sanitizeString(value);
  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (value instanceof Error) {
    return { name: value.name, message: sanitizeString(value.message) };
  }

  if (Array.isArray(value)) return value.map((item) => sanitizeDiagnostic(item, seen));

  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key) ? REDACTED : sanitizeDiagnostic(item, seen),
  ]));
}

export { REDACTED };
