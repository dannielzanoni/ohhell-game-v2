const apiUrl = import.meta.env.VITE_API_BASE_URL;
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const luaStudioUrl = import.meta.env.VITE_MOONCODE_URL;
const websocketBaseUrl = import.meta.env.VITE_WS_BASE_URL;

function trimTrailingSlash(value) {
  return value.replace(/\/$/, '');
}

export const environment = {
  apiUrl: trimTrailingSlash(apiUrl),
  googleClientId,
  luaDefinitionsUrl: `${trimTrailingSlash(apiUrl)}/lua/fodinha.d.lua`,
  luaMercenaryPassiveTemplateUrl: `${trimTrailingSlash(apiUrl)}/lua/templates/mercenary-passive.lua`,
  luaPowerCardTemplateUrl: `${trimTrailingSlash(apiUrl)}/lua/templates/power-card.lua`,
  luaStudioUrl: trimTrailingSlash(luaStudioUrl),
  websocketUrl: `${trimTrailingSlash(websocketBaseUrl)}/game`,
};
