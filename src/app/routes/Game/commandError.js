export const commandErrorKinds = Object.freeze({
  CONNECTION: 'connection',
  PHASE: 'phase',
  SERVER: 'server',
  TURN: 'turn',
});

export function commandErrorKey(kind) {
  switch (kind) {
    case commandErrorKinds.CONNECTION: return 'game.commandConnectionError';
    case commandErrorKinds.PHASE: return 'game.commandPhaseError';
    case commandErrorKinds.TURN: return 'game.commandTurnError';
    default: return 'game.commandServerError';
  }
}

export function classifyServerCommandError(message = '') {
  const normalized = String(message).toLowerCase();
  if (/turn|vez/.test(normalized)) return commandErrorKinds.TURN;
  if (/phase|stage|fase/.test(normalized)) return commandErrorKinds.PHASE;
  return commandErrorKinds.SERVER;
}
