import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

export function getCardDefinitions() {
  return withAuthRetry(() => apiRequest('/card-definitions', { auth: true }));
}

export function getPowerDecks() {
  return withAuthRetry(() => apiRequest('/power-decks', { auth: true }));
}

export function createPowerDeck({ cardIds, description, kind = 'community', name }) {
  return withAuthRetry(() =>
    apiRequest('/power-decks', {
      auth: true,
      body: {
        card_ids: cardIds,
        description,
        kind,
        name,
      },
      method: 'POST',
    }),
  );
}

export function createCardDefinition({
  cardType,
  description,
  imageBlob,
  kind = 'community',
  life,
  name,
  scriptFileName = 'effect.lua',
  scriptText,
}) {
  const form = new FormData();

  form.set('name', name || 'Untitled card');
  form.set('description', description || '');
  form.set('kind', kind || 'community');
  form.set('type', cardType || 'instant');

  if (life !== undefined && life !== null && life !== '') {
    form.set('life', String(life));
  }

  form.set('image', imageBlob, `${name || 'card'}.png`);
  form.set(
    'script',
    new Blob([scriptText || ''], { type: 'text/x-lua' }),
    scriptFileName,
  );

  return withAuthRetry(() =>
    apiRequest('/card-definitions', {
      auth: true,
      body: form,
      method: 'POST',
    }),
  );
}

export const cardDefinitionsService = {
  createCardDefinition,
  createPowerDeck,
  getCardDefinitions,
  getPowerDecks,
};
