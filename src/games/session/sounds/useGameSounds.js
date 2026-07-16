import { useCallback } from 'react';
import bidTurnSound from '@/games/classic/assets/sounds/bid.mp3';
import cardAnimationSound from '@/games/classic/assets/sounds/card_animation.mp3';
import { getClassicPlayerTurnSound } from '@/games/classic/assets/cardAssetRegistry.js';

function playGameSound(soundSrc, volume) {
  const normalizedVolume = Math.max(0, Math.min(100, Number(volume) || 0));

  if (!soundSrc || !normalizedVolume) {
    return;
  }

  const audio = new Audio(soundSrc);
  audio.volume = normalizedVolume / 100;
  audio.play().catch(() => {});
}

export function useGameSounds({ gamePreferencesRef, turnPromptSoundRef }) {
  const playConfiguredSound = useCallback(
    (soundSrc) => {
      playGameSound(soundSrc, gamePreferencesRef.current.volume);
    },
    [gamePreferencesRef],
  );

  const clearTurnPromptSound = useCallback(() => {
    turnPromptSoundRef.current = '';
  }, [turnPromptSoundRef]);

  const playTurnPromptSound = useCallback(
    (type, playerId) => {
      const soundKey = `${type}:${playerId}`;

      if (turnPromptSoundRef.current === soundKey) {
        return;
      }

      turnPromptSoundRef.current = soundKey;
      playConfiguredSound(
        type === 'bid'
          ? bidTurnSound
          : getClassicPlayerTurnSound(gamePreferencesRef.current.turnSound),
      );
    },
    [gamePreferencesRef, playConfiguredSound, turnPromptSoundRef],
  );

  const playCardAnimationSound = useCallback(() => {
    playConfiguredSound(cardAnimationSound);
  }, [playConfiguredSound]);

  return {
    clearTurnPromptSound,
    playCardAnimationSound,
    playConfiguredSound,
    playTurnPromptSound,
  };
}
