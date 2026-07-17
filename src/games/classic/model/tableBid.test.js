import { describe, expect, it } from 'vitest';
import { getClassicTableBidFromPossibleBids } from './tableBid.js';

describe('getClassicTableBidFromPossibleBids', () => {
  it('derives the round card count from the backend bid options', () => {
    expect(getClassicTableBidFromPossibleBids([0, 1, 2, 3])).toBe(3);
  });

  it('does not infer a table bid when the backend did not provide options', () => {
    expect(getClassicTableBidFromPossibleBids([])).toBeNull();
    expect(getClassicTableBidFromPossibleBids(undefined)).toBeNull();
  });
});
