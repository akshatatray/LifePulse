/**
 * LifePulse Stores
 * Central export for all Zustand stores
 */

export { useAuthStore } from './authStore';
export type { User } from './authStore';

export { useHabitStore } from './habitStore';

export { useSettingsStore } from './settingsStore';

export { useGamificationStore } from './gamificationStore';
export type { UnlockedBadge } from './gamificationStore';

export { useFeatureGate, useHabitLimit, usePremiumStore } from './premiumStore';

export { useChallenges, useFriends, useLeaderboard, useSocialStore } from './socialStore';

