/**
 * LifePulse - Gamification Store
 * Manages badges, points, streak freezes, and achievements
 * Syncs with Firebase for cross-device persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Badge, getBadgeById } from '../data/badges';
import { gamificationService, GamificationData } from '../services/gamificationFirestore';

export interface UnlockedBadge {
    badgeId: string;
    unlockedAt: Date;
    notified: boolean; // Whether user has been shown the unlock notification
}

interface GamificationState {
    // Points system
    totalPoints: number;

    // Badges
    unlockedBadges: UnlockedBadge[];

    // Streak freezes
    streakFreezes: number;
    lastStreakFreezeUsed: string | null; // Date string

    // Stats for achievement tracking
    perfectDays: number;
    consecutivePerfectDays: number;
    earlyBirdCount: number;
    nightOwlCount: number;
    comebackCount: number;

    // Level system
    level: number;

    // User context for Firebase sync
    _userId: string | null;
    _displayName: string;
    _isSyncing: boolean;

    // Actions
    setUserId: (userId: string | null, displayName?: string) => void;
    syncFromFirebase: () => Promise<void>;
    syncToFirebase: () => Promise<void>;
    clearData: () => void;
    loadFromFirebaseData: (data: GamificationData) => void;

    unlockBadge: (badgeId: string) => boolean;
    markBadgeNotified: (badgeId: string) => void;
    addPoints: (points: number) => void;
    useStreakFreeze: () => boolean;
    addStreakFreeze: (count?: number) => void;
    incrementPerfectDays: () => void;
    resetConsecutivePerfectDays: () => void;
    incrementEarlyBird: () => void;
    incrementNightOwl: () => void;
    incrementComeback: () => void;

    // Queries
    isBadgeUnlocked: (badgeId: string) => boolean;
    getUnnotifiedBadges: () => Badge[];
    getProgress: () => { level: number; currentXP: number; nextLevelXP: number; percentage: number };
}

// Calculate level from points
const calculateLevel = (points: number): number => {
    // Each level requires more points: level 1 = 100, level 2 = 250, level 3 = 450, etc.
    // Formula: pointsRequired = 100 * level + 50 * (level - 1) * level / 2
    let level = 1;
    let totalRequired = 0;

    while (true) {
        const levelPoints = 100 + (level - 1) * 50;
        if (totalRequired + levelPoints > points) {
            break;
        }
        totalRequired += levelPoints;
        level++;
    }

    return level;
};

// Get XP required for a specific level
const getXPForLevel = (level: number): number => {
    return 100 + (level - 1) * 50;
};

// Get total XP needed to reach a level
const getTotalXPForLevel = (level: number): number => {
    let total = 0;
    for (let i = 1; i < level; i++) {
        total += getXPForLevel(i);
    }
    return total;
};

// Default state values
const DEFAULT_STATE = {
    totalPoints: 0,
    unlockedBadges: [] as UnlockedBadge[],
    streakFreezes: 1, // Start with 1 free streak freeze
    lastStreakFreezeUsed: null as string | null,
    perfectDays: 0,
    consecutivePerfectDays: 0,
    earlyBirdCount: 0,
    nightOwlCount: 0,
    comebackCount: 0,
    level: 1,
    _userId: null as string | null,
    _displayName: 'User',
    _isSyncing: false,
};

export const useGamificationStore = create<GamificationState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_STATE,

            setUserId: (userId: string | null, displayName = 'User') => {
                set({ _userId: userId, _displayName: displayName });
            },

            clearData: () => {
                console.log('[Gamification] Clearing local data');
                set({
                    ...DEFAULT_STATE,
                    _userId: get()._userId, // Preserve userId
                    _displayName: get()._displayName,
                });
            },

            loadFromFirebaseData: (data: GamificationData) => {
                console.log('[Gamification] Loading from Firebase data');
                set({
                    totalPoints: data.totalPoints,
                    level: data.level,
                    unlockedBadges: data.unlockedBadges,
                    streakFreezes: data.streakFreezes,
                    lastStreakFreezeUsed: data.lastStreakFreezeUsed,
                    perfectDays: data.perfectDays,
                    consecutivePerfectDays: data.consecutivePerfectDays,
                    earlyBirdCount: data.earlyBirdCount,
                    nightOwlCount: data.nightOwlCount,
                    comebackCount: data.comebackCount,
                });
            },

            syncFromFirebase: async () => {
                const { _userId, _isSyncing } = get();
                if (!_userId || _isSyncing) return;

                set({ _isSyncing: true });

                try {
                    const data = await gamificationService.getData(_userId);
                    if (data) {
                        get().loadFromFirebaseData(data);
                        console.log('[Gamification] Synced from Firebase');
                    } else {
                        // No data in Firebase, initialize with defaults
                        console.log('[Gamification] No Firebase data, initializing...');
                        await gamificationService.initializeForNewUser(_userId);
                    }
                } catch (error) {
                    console.error('[Gamification] Error syncing from Firebase:', error);
                } finally {
                    set({ _isSyncing: false });
                }
            },

            syncToFirebase: async () => {
                const state = get();
                if (!state._userId || state._isSyncing) return;

                try {
                    await gamificationService.saveData(state._userId, {
                        totalPoints: state.totalPoints,
                        level: state.level,
                        unlockedBadges: state.unlockedBadges,
                        streakFreezes: state.streakFreezes,
                        lastStreakFreezeUsed: state.lastStreakFreezeUsed,
                        perfectDays: state.perfectDays,
                        consecutivePerfectDays: state.consecutivePerfectDays,
                        earlyBirdCount: state.earlyBirdCount,
                        nightOwlCount: state.nightOwlCount,
                        comebackCount: state.comebackCount,
                    });
                } catch (error) {
                    console.error('[Gamification] Error syncing to Firebase:', error);
                }
            },

            unlockBadge: (badgeId: string) => {
                const { unlockedBadges, totalPoints, _userId, _displayName } = get();

                // Check if already unlocked
                if (unlockedBadges.some((b) => b.badgeId === badgeId)) {
                    return false;
                }

                const badge = getBadgeById(badgeId);
                if (!badge) return false;

                const newUnlockedBadge: UnlockedBadge = {
                    badgeId,
                    unlockedAt: new Date(),
                    notified: false,
                };

                const newPoints = totalPoints + badge.points;
                const newLevel = calculateLevel(newPoints);

                set({
                    unlockedBadges: [...unlockedBadges, newUnlockedBadge],
                    totalPoints: newPoints,
                    level: newLevel,
                });

                // Sync to Firebase (non-blocking)
                if (_userId) {
                    gamificationService.unlockBadge(_userId, newUnlockedBadge).catch(console.error);
                    gamificationService.addPoints(_userId, badge.points, _displayName).catch(console.error);
                }

                return true;
            },

            markBadgeNotified: (badgeId: string) => {
                const { _userId } = get();

                set((state) => {
                    const newBadges = state.unlockedBadges.map((b) =>
                        b.badgeId === badgeId ? { ...b, notified: true } : b
                    );

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        gamificationService.updateFields(_userId, { unlockedBadges: newBadges }).catch(console.error);
                    }

                    return { unlockedBadges: newBadges };
                });
            },

            addPoints: (points: number) => {
                const { totalPoints, _userId, _displayName } = get();
                const newPoints = totalPoints + points;
                const newLevel = calculateLevel(newPoints);

                set({
                    totalPoints: newPoints,
                    level: newLevel,
                });

                // Sync to Firebase and update leaderboard (non-blocking)
                if (_userId) {
                    gamificationService.addPoints(_userId, points, _displayName).catch(console.error);
                }
            },

            useStreakFreeze: () => {
                const { streakFreezes, lastStreakFreezeUsed, _userId } = get();

                // Check if already used today
                const today = new Date().toISOString().split('T')[0];
                if (lastStreakFreezeUsed === today) {
                    return false;
                }

                // Check if we have freezes available
                if (streakFreezes <= 0) {
                    return false;
                }

                const newCount = streakFreezes - 1;

                set({
                    streakFreezes: newCount,
                    lastStreakFreezeUsed: today,
                });

                // Sync to Firebase (non-blocking)
                if (_userId) {
                    gamificationService.useStreakFreeze(_userId, newCount, today).catch(console.error);
                }

                return true;
            },

            addStreakFreeze: (count = 1) => {
                const { _userId } = get();

                set((state) => {
                    const newCount = state.streakFreezes + count;

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        gamificationService.updateFields(_userId, { streakFreezes: newCount }).catch(console.error);
                    }

                    return { streakFreezes: newCount };
                });
            },

            incrementPerfectDays: () => {
                const { _userId } = get();

                set((state) => {
                    const newPerfectDays = state.perfectDays + 1;
                    const newConsecutive = state.consecutivePerfectDays + 1;

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        gamificationService.updateFields(_userId, {
                            perfectDays: newPerfectDays,
                            consecutivePerfectDays: newConsecutive,
                        }).catch(console.error);
                    }

                    return {
                        perfectDays: newPerfectDays,
                        consecutivePerfectDays: newConsecutive,
                    };
                });
            },

            resetConsecutivePerfectDays: () => {
                const { _userId } = get();

                set({ consecutivePerfectDays: 0 });

                // Sync to Firebase (non-blocking)
                if (_userId) {
                    gamificationService.updateFields(_userId, { consecutivePerfectDays: 0 }).catch(console.error);
                }
            },

            incrementEarlyBird: () => {
                const { _userId } = get();

                set((state) => {
                    const newCount = state.earlyBirdCount + 1;

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        gamificationService.updateFields(_userId, { earlyBirdCount: newCount }).catch(console.error);
                    }

                    return { earlyBirdCount: newCount };
                });
            },

            incrementNightOwl: () => {
                const { _userId } = get();

                set((state) => {
                    const newCount = state.nightOwlCount + 1;

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        gamificationService.updateFields(_userId, { nightOwlCount: newCount }).catch(console.error);
                    }

                    return { nightOwlCount: newCount };
                });
            },

            incrementComeback: () => {
                const { _userId } = get();

                set((state) => {
                    const newCount = state.comebackCount + 1;

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        gamificationService.updateFields(_userId, { comebackCount: newCount }).catch(console.error);
                    }

                    return { comebackCount: newCount };
                });
            },

            isBadgeUnlocked: (badgeId: string) => {
                return get().unlockedBadges.some((b) => b.badgeId === badgeId);
            },

            getUnnotifiedBadges: () => {
                const { unlockedBadges } = get();
                return unlockedBadges
                    .filter((b) => !b.notified)
                    .map((b) => getBadgeById(b.badgeId))
                    .filter((b): b is Badge => b !== undefined);
            },

            getProgress: () => {
                const { totalPoints, level } = get();
                const currentLevelStart = getTotalXPForLevel(level);
                const nextLevelStart = getTotalXPForLevel(level + 1);
                const currentXP = totalPoints - currentLevelStart;
                const nextLevelXP = nextLevelStart - currentLevelStart;
                const percentage = Math.min((currentXP / nextLevelXP) * 100, 100);

                return { level, currentXP, nextLevelXP, percentage };
            },
        }),
        {
            name: 'lifepulse-gamification',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                totalPoints: state.totalPoints,
                unlockedBadges: state.unlockedBadges,
                streakFreezes: state.streakFreezes,
                lastStreakFreezeUsed: state.lastStreakFreezeUsed,
                perfectDays: state.perfectDays,
                consecutivePerfectDays: state.consecutivePerfectDays,
                earlyBirdCount: state.earlyBirdCount,
                nightOwlCount: state.nightOwlCount,
                comebackCount: state.comebackCount,
                level: state.level,
                // Don't persist _userId, _displayName - set on login
            }),
        }
    )
);
