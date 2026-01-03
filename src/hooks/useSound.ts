/**
 * Sound Hook
 * Provides easy access to sound effects
 */

import { useCallback } from 'react';
import { playSound } from '../services/sound';
import { useSettingsStore } from '../stores/settingsStore';

export const useSound = () => {
  const soundEnabled = useSettingsStore((state) => state.soundEnabled);

  const play = useCallback(
    (type: 'complete' | 'skip' | 'undo' | 'success' | 'pop') => {
      if (soundEnabled) {
        playSound(type);
      }
    },
    [soundEnabled]
  );

  return {
    play,
    complete: () => play('complete'),
    skip: () => play('skip'),
    undo: () => play('undo'),
    success: () => play('success'),
    pop: () => play('pop'),
  };
};

