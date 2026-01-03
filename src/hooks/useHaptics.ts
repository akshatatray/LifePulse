/**
 * Haptics Hook
 * Provides haptic feedback with settings-aware functionality
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../stores/settingsStore';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

export const useHaptics = () => {
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);

  const trigger = useCallback(
    async (type: HapticType = 'medium') => {
      if (!hapticsEnabled) return;

      try {
        switch (type) {
          case 'light':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case 'medium':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case 'heavy':
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          case 'success':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            break;
          case 'warning':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            break;
          case 'error':
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case 'selection':
            await Haptics.selectionAsync();
            break;
        }
      } catch (error) {
        // Silently fail - haptics are non-critical
      }
    },
    [hapticsEnabled]
  );

  return {
    trigger,
    light: () => trigger('light'),
    medium: () => trigger('medium'),
    heavy: () => trigger('heavy'),
    success: () => trigger('success'),
    warning: () => trigger('warning'),
    error: () => trigger('error'),
    selection: () => trigger('selection'),
  };
};

