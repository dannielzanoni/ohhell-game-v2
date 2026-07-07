import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

export function getMercenaries() {
  return withAuthRetry(() => apiRequest('/mercenaries', { auth: true }));
}

export function createMercenary({
  bannerFile,
  deck,
  description,
  id,
  name,
  passiveScript,
  style,
  subtitle,
  temper,
}) {
  const form = new FormData();

  form.set('id', id || '');
  form.set('name', name || 'Untitled mercenary');
  form.set('subtitle', subtitle || '');
  form.set('description', description || '');
  form.set('deck', deck || '');
  form.set('style', style || '');
  form.set('temper', temper || '');

  if (bannerFile) {
    form.set('banner', bannerFile, bannerFile.name || 'banner.png');
  }

  form.set(
    'passive_script',
    new Blob([passiveScript || ''], { type: 'text/x-lua' }),
    'passive.lua',
  );

  return withAuthRetry(() =>
    apiRequest('/mercenaries', {
      auth: true,
      body: form,
      method: 'POST',
    }),
  );
}

export const mercenariesService = {
  createMercenary,
  getMercenaries,
};
