const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const websocketBaseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:3000';

function trimTrailingSlash(value) {
  return value.replace(/\/$/, '');
}

export const environment = {
  apiUrl: trimTrailingSlash(apiUrl),
  websocketUrl: `${trimTrailingSlash(websocketBaseUrl)}/game`,
};
