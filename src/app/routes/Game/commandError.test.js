import { describe, expect, it } from 'vitest';
import { classifyServerCommandError, commandErrorKey, commandErrorKinds } from './commandError.js';

describe('command error classification', () => {
  it.each([
    [commandErrorKinds.CONNECTION, 'game.commandConnectionError'],
    [commandErrorKinds.PHASE, 'game.commandPhaseError'],
    [commandErrorKinds.TURN, 'game.commandTurnError'],
    [commandErrorKinds.SERVER, 'game.commandServerError'],
  ])('maps %s to a distinct safe product message', (kind, key) => {
    expect(commandErrorKey(kind)).toBe(key);
  });

  it('classifies known server reasons without exposing server text', () => {
    expect(classifyServerCommandError('Not your turn')).toBe(commandErrorKinds.TURN);
    expect(classifyServerCommandError('Wrong game phase')).toBe(commandErrorKinds.PHASE);
    expect(classifyServerCommandError('database details')).toBe(commandErrorKinds.SERVER);
  });
});
