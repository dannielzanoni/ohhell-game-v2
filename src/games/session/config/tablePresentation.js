export const MAX_TABLE_PLAYERS = 10;
export const MAX_DISPLAYED_LIFES = 5;
export const MAX_VISIBLE_SEAT_CARDS = 6;
export const CURRENT_PLAYER_SEAT_LIFT = 2;
export const ROUND_END_DELAY_MS = 1000;
export const PILE_WEAK_CARD_DELAY_MS = 1000;
export const LIFE_LOSS_HIGHLIGHT_DURATION_MS = 3600;
export const LIFE_LOSS_HIGHLIGHT_THRESHOLD = 3;

export const PLAYER_ACCENT_COLORS = Object.freeze([
  '#ef4444',
  '#7dd3fc',
  '#facc15',
  '#22c55e',
  '#f97316',
  '#f472b6',
  '#2563eb',
  '#a855f7',
  '#a3e635',
  '#92400e',
]);

export function getSeatPosition(
  index,
  totalPlayers,
  isCurrentPlayer = false,
  orbitX = 36,
  orbitY = 28,
  seatLift = CURRENT_PLAYER_SEAT_LIFT,
) {
  if (totalPlayers <= 1) {
    return {
      left: '50%',
      top: `${60 - (isCurrentPlayer ? seatLift : 0)}%`,
    };
  }

  const angle = Math.PI / 2 + (index * 2 * Math.PI) / totalPlayers;
  const left = 50 + Math.cos(angle) * orbitX;
  const top = 48 + Math.sin(angle) * orbitY - (isCurrentPlayer ? seatLift : 0);

  return {
    left: `${left.toFixed(2)}%`,
    top: `${top.toFixed(2)}%`,
  };
}
