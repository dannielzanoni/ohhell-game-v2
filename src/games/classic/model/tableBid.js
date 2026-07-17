export function getClassicTableBidFromPossibleBids(possibleBids) {
  if (!Array.isArray(possibleBids) || possibleBids.length === 0) {
    return null;
  }

  return Math.max(0, possibleBids.length - 1);
}
