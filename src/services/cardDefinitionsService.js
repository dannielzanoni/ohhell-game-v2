import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

export function getCardDefinitions() {
  return withAuthRetry(() => apiRequest('/card-definitions', { auth: true }));
}

export function getPowerDecks() {
  return withAuthRetry(() => apiRequest('/power-decks', { auth: true }));
}

export function createPowerDeck({
  cardIds,
  description,
  genericCardIds,
  kind = 'community',
  mercenaryCardIds,
  name,
  status,
}) {
  return withAuthRetry(() =>
    apiRequest('/power-decks', {
      auth: true,
      body: {
        card_ids: cardIds,
        description,
        generic_card_ids: genericCardIds,
        kind,
        mercenary_card_ids: mercenaryCardIds,
        name,
        status,
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
  manaCost,
  name,
}) {
  return withAuthRetry(() =>
    apiRequest('/card-definitions/from-asset', {
      auth: true,
      body: {
        asset_id: assetId,
        description,
        kind,
        mana_cost: manaCost === '' ? undefined : manaCost,
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
  manaCost,
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
      manaCost,
      name,
    });
  }

  const form = new FormData();

  form.set('name', name || 'Untitled card');
  form.set('description', description || '');
  form.set('kind', kind || 'community');
  form.set('type', cardType || 'instant');

  if (manaCost !== undefined && manaCost !== null && manaCost !== '') {
    form.set('mana_cost', String(manaCost));
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

export function updateCardDefinition({
  cardId,
  cardType,
  description,
  imageBlob,
  kind = 'community',
  manaCost,
  name,
  scriptFileName = 'effect.lua',
  scriptText,
}) {
  const form = new FormData();

  form.set('name', name || 'Untitled card');
  form.set('description', description || '');
  form.set('kind', kind || 'community');
  form.set('type', cardType || 'instant');

  if (manaCost !== undefined && manaCost !== null && manaCost !== '') {
    form.set('mana_cost', String(manaCost));
  }

  if (imageBlob) {
    form.set('image', imageBlob, `${name || 'card'}.png`);
  }

  if (scriptText !== undefined && scriptText !== null) {
    form.set(
      'script',
      new Blob([scriptText || ''], { type: 'text/x-lua' }),
      scriptFileName,
    );
  }

  return withAuthRetry(() =>
    apiRequest(`/card-definitions/${encodeURIComponent(cardId)}`, {
      auth: true,
      body: form,
      method: 'PUT',
    }),
  );
}

export const cardDefinitionsService = {
  createCardDefinition,
  createPowerDeck,
  getCardDefinitions,
  getPowerDecks,
  updateCardDefinition,
  uploadCardDefinitionAsset,
};
