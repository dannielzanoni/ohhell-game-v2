export const RECONNECT_DELAYS_MS = Object.freeze([100, 250, 500, 1000, 1500, 2500]);

export function reconnectDelay(attempt) {
  return RECONNECT_DELAYS_MS[attempt] ?? null;
}

export async function reconnectWithSnapshot({ applySnapshot, connect, join }) {
  const snapshot = await join();
  applySnapshot(snapshot);
  connect();
}
