export function removePowerCardFromHand(cards, cardId) {
  let wasRemoved = false;

  return cards.filter((card) => {
    if (!wasRemoved && card?.id === cardId) {
      wasRemoved = true;
      return false;
    }

    return true;
  });
}
