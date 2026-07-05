import { describe, expect, it, vi } from 'vitest';
import fixtures from '../../contracts/v1/realtime-server.json';
import { createGameStateController, initialGameState, reduceGameMessage } from './gameStateReducer.js';

describe('shared game state machine', () => {
  it('reduces all fourteen server fixtures without throwing', () => {
    expect(fixtures).toHaveLength(14);
    const types = new Set();
    let state = initialGameState;
    for (const message of fixtures) {
      types.add(message.type);
      expect(() => { state = reduceGameMessage(state, message); }).not.toThrow();
    }
    expect(types.size).toBe(14);
  });

  it('represents waiting, bidding, dealing and ended phases', () => {
    let state = reduceGameMessage(initialGameState, fixtures.find(({ type }) => type === 'Snapshot'));
    expect(state.phase).toBe('waiting');
    state = reduceGameMessage(state, fixtures.find(({ type }) => type === 'PlayerBiddingTurn'));
    expect(state.phase).toBe('bidding');
    state = reduceGameMessage(state, fixtures.find(({ type }) => type === 'PlayerTurn'));
    expect(state.phase).toBe('dealing');
    state = reduceGameMessage(state, fixtures.find(({ type }) => type === 'GameEnded'));
    expect(state.phase).toBe('ended');
  });

  it('ignores and reports unknown messages without mutating state', () => {
    const onUnknown = vi.fn();
    const controller = createGameStateController({ onUnknown });
    const before = controller.getState();
    expect(controller.consume({ type: 'FutureMessage', data: {} })).toBe(before);
    expect(onUnknown).toHaveBeenCalledWith({ code: 'unknown_server_message', type: 'FutureMessage' });
  });
});
