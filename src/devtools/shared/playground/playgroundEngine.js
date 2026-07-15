import artemisCard1 from '@/games/hell-hand/assets/characters/artemis/cards/1.png';
import artemisCard2 from '@/games/hell-hand/assets/characters/artemis/cards/2.png';
import artemisCard4 from '@/games/hell-hand/assets/characters/artemis/cards/4.png';
import gamblerCard2 from '@/games/hell-hand/assets/characters/gambler/cards/2.png';
import gamblerCard4 from '@/games/hell-hand/assets/characters/gambler/cards/4.png';
import mockCardData from './mockCards.json';
import { OFFICIAL_GAME_VISUAL_CONFIG } from '@/games/core/config/gameVisualConfig.js';

export const PLAYGROUND_STORAGE_KEY = 'ohhell:game-playground:v1';

export const PLAYGROUND_ACTIONS = {
  ADD_CLASSIC_CARD: 'ADD_CLASSIC_CARD',
  REMOVE_CLASSIC_CARD: 'REMOVE_CLASSIC_CARD',
  ADD_POWER_CARD: 'ADD_POWER_CARD',
  REMOVE_POWER_CARD: 'REMOVE_POWER_CARD',
  ADD_PLAYER: 'ADD_PLAYER',
  REMOVE_PLAYER: 'REMOVE_PLAYER',
  CHANGE_BID: 'CHANGE_BID',
  CHANGE_LIFE: 'CHANGE_LIFE',
  CHANGE_MANA: 'CHANGE_MANA',
  PLAY_CLASSIC_CARD: 'PLAY_CLASSIC_CARD',
  PLAY_POWER_CARD: 'PLAY_POWER_CARD',
  SHUFFLE_CLASSIC_DECK: 'SHUFFLE_CLASSIC_DECK',
  SHUFFLE_POWER_DECK: 'SHUFFLE_POWER_DECK',
  DRAW_POWER_CARD: 'DRAW_POWER_CARD',
  DISCARD_POWER_CARD: 'DISCARD_POWER_CARD',
};

const mainPlayerId = 'player-main';
const localPowerCardImages = {
  'all-in': gamblerCard2,
  'blood-transfusion': artemisCard1,
  'cross-your-fingers': gamblerCard4,
  'deep-red': artemisCard2,
  'sign-in-blood': artemisCard4,
};
const mockCards = {
  ...mockCardData,
  powerCards: mockCardData.powerCards.map((card) => ({
    ...card,
    image: localPowerCardImages[card.id] || card.image || '',
  })),
};

export function getClassicCard(cardId) {
  return mockCards.classicCards.find((card) => card.id === cardId) || null;
}

export function getPowerCard(cardId) {
  return mockCards.powerCards.find((card) => card.id === cardId) || null;
}

function cloneCard(card) {
  return card ? { ...card, actions: [...(card.actions || [])] } : null;
}

function createPlayer(id, nickname, color) {
  return {
    id,
    nickname,
    color,
    avatarSrc: null,
    mercenaryId: null,
    ready: true,
    lifes: 5,
    mana: { current: 4, max: 10 },
    bid: 2,
    points: 1,
    classicHand: [],
    powerHand: [],
  };
}

export function createInitialPlaygroundState() {
  const mainPlayer = createPlayer(mainPlayerId, 'You', 'amber');
  mainPlayer.mercenaryId = 'carmen';
  mainPlayer.classicHand = mockCards.classicCards.slice(0, 4).map(cloneCard);
  mainPlayer.powerHand = mockCards.powerCards.slice(0, 2).map(cloneCard);

  const rivalOne = createPlayer('player-rival-1', 'Artemis', 'red');
  rivalOne.mercenaryId = 'artemis';
  rivalOne.classicHand = mockCards.classicCards.slice(2, 5).map(cloneCard);
  rivalOne.powerHand = mockCards.powerCards.slice(2, 3).map(cloneCard);

  const rivalTwo = createPlayer('player-rival-2', 'Gambler', 'violet');
  rivalTwo.mercenaryId = 'gambler';
  rivalTwo.classicHand = mockCards.classicCards.slice(1, 3).map(cloneCard);

  return {
    players: [mainPlayer, rivalOne, rivalTwo],
    currentPlayerId: mainPlayerId,
    upcard: cloneCard(mockCards.classicCards[0]),
    pile: [
      { player_id: 'player-rival-1', card: cloneCard(mockCards.classicCards[2]) },
      { player_id: mainPlayerId, card: cloneCard(mockCards.classicCards[1]) },
    ],
    classicDeck: mockCards.classicCards.slice(3).map(cloneCard),
    powerDeck: mockCards.powerCards.slice(3).map(cloneCard),
    playedPowerCards: [],
    discardedPowerCards: [],
    lastActionId: '',
  };
}

export const defaultVisualConfig = {
  ...OFFICIAL_GAME_VISUAL_CONFIG.desktop,
  showGuides: false,
};

function updatePlayer(state, playerId, updater) {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? updater(player) : player,
    ),
  };
}

function resolveTargetId(state, action) {
  return action.target === 'target' && action.targetId
    ? action.targetId
    : action.playerId || mainPlayerId;
}

function updateNumericPlayerValue(state, action, field, minimum = 0) {
  const playerId = resolveTargetId(state, action);
  return updatePlayer(state, playerId, (player) => ({
    ...player,
    [field]: Math.max(
      minimum,
      (Number(player[field]) || 0) + Number(action.amount || 0),
    ),
  }));
}

function updateMana(state, action) {
  const playerId = resolveTargetId(state, action);
  return updatePlayer(state, playerId, (player) => ({
    ...player,
    mana: {
      ...player.mana,
      current: Math.max(
        0,
        Math.min(player.mana.max, player.mana.current + Number(action.amount || 0)),
      ),
    },
  }));
}

function removeCard(cards, cardId) {
  const index = cards.findIndex((card) => card.id === cardId);
  if (index < 0) {
    return { cards, removed: null };
  }

  const nextCards = [...cards];
  const [removed] = nextCards.splice(index, 1);
  return { cards: nextCards, removed };
}

function shuffle(cards) {
  const nextCards = [...cards];
  for (let index = nextCards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextCards[index], nextCards[swapIndex]] = [nextCards[swapIndex], nextCards[index]];
  }
  return nextCards;
}

function applyCardActions(state, card, action) {
  return (card?.actions || []).reduce(
    (nextState, cardAction) =>
      applyPlaygroundAction(nextState, {
        ...cardAction,
        playerId: action.playerId || mainPlayerId,
        targetId: action.targetId,
      }),
    state,
  );
}

export function applyPlaygroundAction(state, action) {
  if (!action?.type) {
    return state;
  }

  let nextState;

  switch (action.type) {
    case PLAYGROUND_ACTIONS.ADD_CLASSIC_CARD: {
      const card = cloneCard(getClassicCard(action.cardId));
      if (!card) return state;
      const playerId = action.playerId || mainPlayerId;
      return updatePlayer(state, playerId, (player) => ({
        ...player,
        classicHand: [...player.classicHand, card],
      }));
    }
    case PLAYGROUND_ACTIONS.REMOVE_CLASSIC_CARD:
      return updatePlayer(state, action.playerId || mainPlayerId, (player) => ({
        ...player,
        classicHand: removeCard(player.classicHand, action.cardId).cards,
      }));
    case PLAYGROUND_ACTIONS.ADD_POWER_CARD: {
      const card = cloneCard(getPowerCard(action.cardId));
      if (!card) return state;
      const playerId = action.playerId || mainPlayerId;
      return updatePlayer(state, playerId, (player) => ({
        ...player,
        powerHand: [...player.powerHand, card],
      }));
    }
    case PLAYGROUND_ACTIONS.REMOVE_POWER_CARD:
      return updatePlayer(state, action.playerId || mainPlayerId, (player) => ({
        ...player,
        powerHand: removeCard(player.powerHand, action.cardId).cards,
      }));
    case PLAYGROUND_ACTIONS.ADD_PLAYER:
      if (state.players.some((player) => player.id === action.playerId)) return state;
      return {
        ...state,
        players: [
          ...state.players,
          createPlayer(action.playerId, action.nickname || 'Player', action.color || 'blue'),
        ],
      };
    case PLAYGROUND_ACTIONS.REMOVE_PLAYER:
      if (action.playerId === mainPlayerId) return state;
      return {
        ...state,
        players: state.players.filter((player) => player.id !== action.playerId),
        pile: state.pile.filter((turn) => turn.player_id !== action.playerId),
      };
    case PLAYGROUND_ACTIONS.CHANGE_LIFE:
      return updateNumericPlayerValue(state, action, 'lifes');
    case PLAYGROUND_ACTIONS.CHANGE_BID:
      return updateNumericPlayerValue(state, action, 'bid');
    case PLAYGROUND_ACTIONS.CHANGE_MANA:
      return updateMana(state, action);
    case PLAYGROUND_ACTIONS.PLAY_CLASSIC_CARD: {
      const playerId = action.playerId || mainPlayerId;
      const player = state.players.find((candidate) => candidate.id === playerId);
      const result = removeCard(player?.classicHand || [], action.cardId);
      if (!result.removed) return state;
      return {
        ...updatePlayer(state, playerId, (currentPlayer) => ({
          ...currentPlayer,
          classicHand: result.cards,
        })),
        pile: [...state.pile, { player_id: playerId, card: result.removed }],
        lastActionId: action.id || '',
      };
    }
    case PLAYGROUND_ACTIONS.PLAY_POWER_CARD: {
      const playerId = action.playerId || mainPlayerId;
      const player = state.players.find((candidate) => candidate.id === playerId);
      const result = removeCard(player?.powerHand || [], action.cardId);
      if (!result.removed) return state;
      nextState = updatePlayer(state, playerId, (currentPlayer) => ({
        ...currentPlayer,
        powerHand: result.cards,
      }));
      nextState = applyCardActions(nextState, result.removed, action);
      return {
        ...nextState,
        playedPowerCards: [...state.playedPowerCards, result.removed],
        lastActionId: action.id || '',
      };
    }
    case PLAYGROUND_ACTIONS.SHUFFLE_CLASSIC_DECK:
      return { ...state, classicDeck: shuffle(state.classicDeck), lastActionId: action.id || '' };
    case PLAYGROUND_ACTIONS.SHUFFLE_POWER_DECK:
      return { ...state, powerDeck: shuffle(state.powerDeck), lastActionId: action.id || '' };
    case PLAYGROUND_ACTIONS.DRAW_POWER_CARD: {
      if (!state.powerDeck.length) return state;
      const [card, ...remainingDeck] = state.powerDeck;
      return {
        ...updatePlayer(state, action.playerId || mainPlayerId, (player) => ({
          ...player,
          powerHand: [...player.powerHand, card],
        })),
        powerDeck: remainingDeck,
        lastActionId: action.id || '',
      };
    }
    case PLAYGROUND_ACTIONS.DISCARD_POWER_CARD: {
      const playerId = action.playerId || mainPlayerId;
      const player = state.players.find((candidate) => candidate.id === playerId);
      const result = removeCard(player?.powerHand || [], action.cardId);
      if (!result.removed) return state;
      return {
        ...updatePlayer(state, playerId, (currentPlayer) => ({
          ...currentPlayer,
          powerHand: result.cards,
        })),
        discardedPowerCards: [...(state.discardedPowerCards || []), result.removed],
        lastActionId: action.id || '',
      };
    }
    default:
      return state;
  }
}

export function createAction(type, payload = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    ...payload,
  };
}

export function loadPlaygroundSnapshot() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLAYGROUND_STORAGE_KEY) || 'null');
    return parsed && parsed.state
      ? {
          state: parsed.state,
          timeline: Array.isArray(parsed.timeline) ? parsed.timeline : [],
          visualConfig: { ...defaultVisualConfig, ...(parsed.visualConfig || {}) },
        }
      : null;
  } catch {
    return null;
  }
}

export function savePlaygroundSnapshot(snapshot) {
  localStorage.setItem(PLAYGROUND_STORAGE_KEY, JSON.stringify(snapshot));
}

export { mainPlayerId, mockCards };
