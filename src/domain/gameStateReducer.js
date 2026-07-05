import { reducePlayerPresence } from './playerPresence.js';

export const initialGameState = Object.freeze({
  error: null,
  hand: [],
  phase: 'waiting',
  pile: [],
  players: {},
  possibleBids: [],
  turnPlayerId: null,
  upcard: null,
});

function updatePlayer(players, playerId, updates) {
  if (!playerId) return players;
  return {
    ...players,
    [playerId]: { ...players[playerId], id: playerId, ...updates },
  };
}

function snapshotState(state, snapshot) {
  if (snapshot?.type === 'Waiting') {
    const players = Object.fromEntries(Object.entries(snapshot.status || snapshot.data || {}).map(([id, status]) => [
      id,
      { id, player: status.player, ready: Boolean(status.ready) },
    ]));
    return { ...initialGameState, players };
  }
  const game = snapshot?.data?.game || snapshot?.game || {};
  const stage = game.stage?.type;
  return {
    ...state,
    phase: stage === 'Bidding' ? 'bidding' : 'dealing',
    turnPlayerId: game.current_player || null,
    upcard: game.upcard || null,
  };
}

export function reduceGameMessage(state = initialGameState, message) {
  const data = message?.data;
  switch (message?.type) {
    case 'Snapshot':
      return snapshotState(state, data);
    case 'PlayerJoined': {
      const id = data?.id || data?.player_id;
      return { ...state, players: reducePlayerPresence(state.players, {
        type: 'PlayerJoined',
        player: { ...data, id, ready: false },
      }) };
    }
    case 'PlayerLeft':
      return { ...state, players: reducePlayerPresence(state.players, {
        type: 'PlayerLeft', playerId: data?.player_id,
      }) };
    case 'PlayerStatusChange':
      return { ...state, players: updatePlayer(state.players, data?.player_id, { ready: Boolean(data?.ready) }) };
    case 'PlayerBidded':
      return { ...state, phase: 'bidding', players: updatePlayer(state.players, data?.player_id, { bid: data?.bid }) };
    case 'RoundEnded':
      return {
        ...state,
        phase: 'dealing',
        players: Object.entries(data || {}).reduce((players, [id, points]) => updatePlayer(players, id, { points }), state.players),
      };
    case 'PlayerBiddingTurn':
      return { ...state, phase: 'bidding', possibleBids: data?.possible_bids || [], turnPlayerId: data?.player_id || null };
    case 'PlayerDeck':
      return { ...state, hand: Array.isArray(data) ? data : [] };
    case 'PlayerTurn':
      return { ...state, phase: 'dealing', possibleBids: [], turnPlayerId: data?.player_id || null };
    case 'TurnPlayed':
      return { ...state, pile: data?.pile || [] };
    case 'SetStart':
      return { ...state, error: null, phase: 'bidding', pile: [], upcard: data?.upcard || null };
    case 'SetEnded':
      return { ...state, phase: 'dealing', players: Object.entries(data?.lifes || {}).reduce((players, [id, lifes]) => updatePlayer(players, id, { lifes }), state.players) };
    case 'GameEnded':
      return { ...state, phase: 'ended', players: Object.entries(data?.lifes || {}).reduce((players, [id, lifes]) => updatePlayer(players, id, { lifes }), state.players) };
    case 'Error':
      return { ...state, error: data?.msg || 'game_error' };
    default:
      return state;
  }
}

export function createGameStateController({ onUnknown = () => {} } = {}) {
  let state = initialGameState;
  const subscribers = new Set();
  return {
    consume(message) {
      const next = reduceGameMessage(state, message);
      if (next === state) {
        onUnknown({ code: 'unknown_server_message', type: message?.type || 'missing' });
        return state;
      }
      state = next;
      subscribers.forEach((subscriber) => subscriber(state));
      return state;
    },
    getState: () => state,
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
  };
}
