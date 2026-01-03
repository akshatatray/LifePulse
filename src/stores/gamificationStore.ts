/**
 * LifePulse - Gamification Store
 * Manages badges, points, streak freezes, and achievements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Badge, getBadgeById } from '../data/badges';

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

    // Actions
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

export const useGamificationStore = create<GamificationState>()(
    persist(
        (set, get) => ({
            totalPoints: 0,
            unlockedBadges: [],
            streakFreezes: 1, // Start with 1 free streak freeze
            lastStreakFreezeUsed: null,
            perfectDays: 0,
            consecutivePerfectDays: 0,
            earlyBirdCount: 0,
            nightOwlCount: 0,
            comebackCount: 0,
            level: 1,

            unlockBadge: (badgeId: string) => {
                const { unlockedBadges, totalPoints } = get();

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

                return true;
            },

            markBadgeNotified: (badgeId: string) => {
                set((state) => ({
                    unlockedBadges: state.unlockedBadges.map((b) =>
                        b.badgeId === badgeId ? { ...b, notified: true } : b
                    ),
                }));
            },

            addPoints: (points: number) => {
                const { totalPoints } = get();
                const newPoints = totalPoints + points;
                const newLevel = calculateLevel(newPoints);

                set({
                    totalPoints: newPoints,
                    level: newLevel,
                });
            },

            useStreakFreeze: () => {
                const { streakFreezes, lastStreakFreezeUsed } = get();

                // Check if already used today
                const today = new Date().toISOString().split('T')[0];
                if (lastStreakFreezeUsed === today) {
                    return false;
                }

                // Check if we have freezes available
                if (streakFreezes <= 0) {
                    return false;
                }

                set({
                    streakFreezes: streakFreezes - 1,
                    lastStreakFreezeUsed: today,
                });

                return true;
            },

            addStreakFreeze: (count = 1) => {
                set((state) => ({
                    streakFreezes: state.streakFreezes + count,
                }));
            },

            incrementPerfectDays: () => {
                set((state) => ({
                    perfectDays: state.perfectDays + 1,
                    consecutivePerfectDays: state.consecutivePerfectDays + 1,
                }));
            },

            resetConsecutivePerfectDays: () => {
                set({ consecutivePerfectDays: 0 });
            },

            incrementEarlyBird: () => {
                set((state) => ({ earlyBirdCount: state.earlyBirdCount + 1 }));
            },

            incrementNightOwl: () => {
                set((state) => ({ nightOwlCount: state.nightOwlCount + 1 }));
            },

            incrementComeback: () => {
                set((state) => ({ comebackCount: state.comebackCount + 1 }));
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
            }),
        }
    )
);

