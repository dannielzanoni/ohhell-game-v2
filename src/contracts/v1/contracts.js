import httpEndpoints from '../../../contracts/v1/http-endpoints.json';
import realtimeClient from '../../../contracts/v1/realtime-client.json';
import realtimeServer from '../../../contracts/v1/realtime-server.json';

export const contractVersion = 1;
export const httpContract = Object.freeze(httpEndpoints);
export const realtimeClientContract = Object.freeze(realtimeClient);
export const realtimeServerContract = Object.freeze(realtimeServer);

export const serverMessageTypes = Object.freeze([
  'Snapshot', 'PlayerJoined', 'PlayerLeft', 'PlayerStatusChange',
  'PlayerBidded', 'RoundEnded', 'PlayerBiddingTurn', 'PlayerDeck',
  'PlayerTurn', 'TurnPlayed', 'SetStart', 'SetEnded', 'GameEnded', 'Error',
]);

export const clientCommandTypes = Object.freeze([
  'PlayTurn', 'PutBid', 'PlayerStatusChange',
]);

export function parseRealtimeMessage(value, allowedTypes = serverMessageTypes) {
  const message = typeof value === 'string' ? JSON.parse(value) : value;
  if (!message || typeof message !== 'object') {
    throw new TypeError('Realtime message must be an object');
  }
  if (!allowedTypes.includes(message.type)) {
    throw new TypeError(`Unknown realtime message type: ${message.type}`);
  }
  if (!Object.hasOwn(message, 'data')) {
    throw new TypeError(`Realtime message ${message.type} must include data`);
  }
  return message;
}

export function serializeRealtimeCommand(command) {
  return JSON.stringify(parseRealtimeMessage(command, clientCommandTypes));
}
