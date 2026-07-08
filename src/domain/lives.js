export const DEFAULT_LIVES = 5;
export const MIN_LIVES = 1;
export const MAX_LIVES = 5;
export const lifeOptions = Object.freeze(
  Array.from({ length: MAX_LIVES }, (_, index) => String(index + MIN_LIVES)),
);

export function isValidLives(value) {
  const lives = Number(value);
  return Number.isInteger(lives) && lives >= MIN_LIVES && lives <= MAX_LIVES;
}

export function normalizeLives(value) {
  if (!isValidLives(value)) {
    const error = new RangeError(`Lives must be between ${MIN_LIVES} and ${MAX_LIVES}.`);
    error.code = 'invalid_lives';
    throw error;
  }
  return Number(value);
}
