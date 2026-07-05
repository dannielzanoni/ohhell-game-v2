import { gamePath } from '../routeContract.js';
import { copyText } from '@/infrastructure/browser/clipboard.js';

export function getRoomInviteLink(lobbyId, browser = globalThis) {
  return new URL(gamePath(lobbyId), browser.location.origin).toString();
}

export async function shareRoomInvite({ lobbyId, title }, browser = globalThis) {
  const url = getRoomInviteLink(lobbyId, browser);
  if (browser.navigator?.share) {
    try {
      await browser.navigator.share({ title, url });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';
      throw error;
    }
  }
  await copyText(url, browser);
  return 'copied';
}
