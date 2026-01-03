/**
 * Settings Store
 * Manages user preferences for sound, haptics, and notifications
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  // Audio & Haptics
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  
  // Notifications
  notificationsEnabled: boolean;
  
  // Display
  showStreakBadges: boolean;
  
  // Actions
  setSoundEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setShowStreakBadges: (enabled: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: true,
  showStreakBadges: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setSoundEnabled: (enabled: boolean) => set({ soundEnabled: enabled }),
      setHapticsEnabled: (enabled: boolean) => set({ hapticsEnabled: enabled }),
      setNotificationsEnabled: (enabled: boolean) => set({ notificationsEnabled: enabled }),
      setShowStreakBadges: (enabled: boolean) => set({ showStreakBadges: enabled }),
      
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'lifepulse-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

