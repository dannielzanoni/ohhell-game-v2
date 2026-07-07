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

export function uploadCardDefinitionAsset({
  imageBlob,
  scriptFileName = 'effect.lua',
  scriptText,
  signal,
}) {
  const form = new FormData();

  form.set('image', imageBlob, 'card.png');
  form.set(
    'script',
    new Blob([scriptText || ''], { type: 'text/x-lua' }),
    scriptFileName,
  );

  return withAuthRetry(() =>
    apiRequest('/card-definitions/assets', {
      auth: true,
      body: form,
      method: 'POST',
      signal,
    }),
  );
}

function createCardDefinitionFromAsset({
  assetId,
  cardType,
  description,
  kind = 'community',
  life,
  name,
}) {
  return withAuthRetry(() =>
    apiRequest('/card-definitions/from-asset', {
      auth: true,
      body: {
        asset_id: assetId,
        description,
        kind,
        life: life === '' ? undefined : life,
        name,
        type: cardType || 'instant',
      },
      method: 'POST',
    }),
  );
}

export function createCardDefinition({
  assetId,
  cardType,
  description,
  imageBlob,
  kind = 'community',
  life,
  name,
  scriptFileName = 'effect.lua',
  scriptText,
}) {
  if (assetId) {
    return createCardDefinitionFromAsset({
      assetId,
      cardType,
      description,
      kind,
      life,
      name,
    });
  }

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
  uploadCardDefinitionAsset,
};
