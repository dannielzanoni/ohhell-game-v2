const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const enableMyStats = import.meta.env.VITE_ENABLE_MY_STATS === 'true';
const websocketBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';

function trimTrailingSlash(value) {
  return value.replace(/\/$/, '');
}

export const environment = {
  apiUrl: trimTrailingSlash(apiUrl),
  enableMyStats,
  googleClientId,
  websocketUrl: `${trimTrailingSlash(websocketBaseUrl)}/game`,
};
