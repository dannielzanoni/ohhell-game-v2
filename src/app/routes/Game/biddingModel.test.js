import { describe, expect, it } from 'vitest';
import { canSubmitBid, normalizePossibleBids } from './biddingModel.js';

describe('bidding model', () => {
  it('exposes only unique valid values supplied by possible_bids', () => {
    expect(normalizePossibleBids([0, 2, 2, -1, 1.5, '3'])).toEqual([0, 2]);
  });

  it('rejects a value absent from possible_bids', () => {
    expect(canSubmitBid([0, 2], 2)).toBe(true);
    expect(canSubmitBid([0, 2], 1)).toBe(false);
  });
});
