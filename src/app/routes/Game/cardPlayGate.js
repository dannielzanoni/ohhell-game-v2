export function createCardPlayGate() {
  let pending = false;

  return {
    reset() {
      pending = false;
    },
    tryPlay(play) {
      if (pending) return false;
      pending = true;

      try {
        play();
        return true;
      } catch (error) {
        pending = false;
        throw error;
      }
    },
  };
}
