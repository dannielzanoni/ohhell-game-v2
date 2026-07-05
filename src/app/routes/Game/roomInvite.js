import { gamePath } from '../routeContract.js';

export function getRoomInviteLink(lobbyId, browser = globalThis) {
  return new URL(gamePath(lobbyId), browser.location.origin).toString();
}
