export function createAudioAdapter({ createMedia = (src) => new Audio(src) } = {}) {
  const playedBySlot = new Map();

  const play = (src, volume) => {
    const normalizedVolume = Math.max(0, Math.min(100, Number(volume) || 0));
    if (!normalizedVolume || !src) return false;

    const media = createMedia(src);
    media.volume = normalizedVolume / 100;
    media.play()?.catch?.(() => {});
    return true;
  };

  return {
    clearSlot(slot) {
      playedBySlot.delete(slot);
    },
    play,
    playOnce(slot, eventId, src, volume) {
      if (playedBySlot.get(slot) === eventId) return false;
      const played = play(src, volume);
      if (played) playedBySlot.set(slot, eventId);
      return played;
    },
  };
}
