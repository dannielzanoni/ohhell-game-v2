export function normalizePossibleBids(possibleBids) {
  if (!Array.isArray(possibleBids)) return [];
  return [...new Set(possibleBids.filter((bid) => Number.isInteger(bid) && bid >= 0))];
}

export function canSubmitBid(possibleBids, bid) {
  return normalizePossibleBids(possibleBids).includes(bid);
}
