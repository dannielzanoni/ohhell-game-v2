import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

export function getMercenaries() {
  return withAuthRetry(() => apiRequest('/mercenaries', { auth: true }));
}

export function createMercenary(fields) {
  return withAuthRetry(() =>
    apiRequest('/mercenaries', {
      auth: true,
      body: createMercenaryForm(fields),
      method: 'POST',
    }),
  );
}

export function updateMercenary(id, fields) {
  return withAuthRetry(() =>
    apiRequest(`/mercenaries/${encodeURIComponent(id)}`, {
      auth: true,
      body: createMercenaryForm(fields),
      method: 'PUT',
    }),
  );
}

function createMercenaryForm({
  bannerFile,
  iconFile,
  description,
  name,
  passiveScript,
  style,
  subtitle,
  temper,
}) {
  const form = new FormData();

  form.set('name', name || 'Untitled mercenary');
  form.set('subtitle', subtitle || '');
  form.set('description', description || '');
  form.set('style', style || '');
  form.set('temper', temper || '');

  if (bannerFile) {
    form.set('banner', bannerFile, bannerFile.name || 'banner.png');
  }

  if (iconFile) {
    form.set('icon', iconFile, iconFile.name || 'icon.png');
  }

  form.set(
    'passive_script',
    new Blob([passiveScript || ''], { type: 'text/x-lua' }),
    'passive.lua',
  );

  return form;
}

export const mercenariesService = {
  createMercenary,
  getMercenaries,
  updateMercenary,
};
