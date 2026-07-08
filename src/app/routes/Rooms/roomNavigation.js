import { gamePath } from '../routeContract.js';

export function roomDestination(roomId) {
  return gamePath(roomId);
}

export function joinRoomErrorKey(error) {
  switch (error?.status) {
    case 404:
      return 'game.roomNotFound';
    case 409:
      return 'game.roomConflict';
    case 403:
      return 'game.roomForbidden';
    default:
      return 'game.enterRoomError';
  }
}
