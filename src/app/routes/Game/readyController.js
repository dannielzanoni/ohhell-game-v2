export function createReadyController({ send }) {
  let pending = false;
  return {
    settle() { pending = false; },
    toggle({ playerCount, ready, socket, socketOpen }) {
      if (pending || playerCount < 2 || !socket || !socketOpen) return false;
      pending = true;
      try {
        send(socket, !ready);
        return true;
      } catch (error) {
        pending = false;
        throw error;
      }
    },
  };
}
