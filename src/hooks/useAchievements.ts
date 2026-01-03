/**
 * useAchievements Hook
 * Automatically checks and unlocks achievements based on user progress
 */

import { useCallback, useEffect, useState } from 'react';
import { Badge, getBadgeById } from '../data/badges';
import { useGamificationStore } from '../stores/gamificationStore';
import { useHabitStore } from '../stores/habitStore';
import { checkAllAchievements, checkEarlyBird, checkNightOwl, checkPerfectDay } from '../utils/achievements';
import { useHaptics } from './useHaptics';
import { useSound } from './useSound';

export const useAchievements = () => {
    const { habits, logs } = useHabitStore();
    const {
        unlockedBadges,
        unlockBadge,
        markBadgeNotified,
        perfectDays,
        consecutivePerfectDays,
        earlyBirdCount,
        nightOwlCount,
        comebackCount,
        incrementPerfectDays,
        resetConsecutivePerfectDays,
        incrementEarlyBird,
        incrementNightOwl,
        getUnnotifiedBadges,
    } = useGamificationStore();

    const sound = useSound();
    const haptics = useHaptics();

    // Track newly unlocked badge for animation
    const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<Badge | null>(null);

    // Check achievements whenever habits/logs change
    const checkAchievements = useCallback(() => {
        const unlockedIds = unlockedBadges.map((b) => b.badgeId);

        const results = checkAllAchievements(
            habits,
            logs,
            unlockedIds,
            {
                perfectDays,
                consecutivePerfectDays,
                earlyBirdCount,
                nightOwlCount,
                comebackCount,
            }
        );

        // Unlock any badges that should be unlocked
        const newlyUnlocked: Badge[] = [];
        for (const result of results) {
            if (result.shouldUnlock) {
                const success = unlockBadge(result.badgeId);
                if (success) {
                    const badge = getBadgeById(result.badgeId);
                    if (badge) {
                        newlyUnlocked.push(badge);
                    }
                }
            }
        }

        // Show animation for first newly unlocked badge
        if (newlyUnlocked.length > 0) {
            haptics.success();
            sound.success();
            setNewlyUnlockedBadge(newlyUnlocked[0]);
        }

        return newlyUnlocked;
    }, [
        habits,
        logs,
        unlockedBadges,
        perfectDays,
        consecutivePerfectDays,
        earlyBirdCount,
        nightOwlCount,
        comebackCount,
        unlockBadge,
        haptics,
        sound,
    ]);

    // Check for perfect day
    const checkForPerfectDay = useCallback((date: string) => {
        const isPerfect = checkPerfectDay(habits, logs, date);

        if (isPerfect) {
            incrementPerfectDays();

            // Check if this continues a streak
            const yesterday = new Date(date);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            const wasYesterdayPerfect = checkPerfectDay(habits, logs, yesterdayStr);

            if (!wasYesterdayPerfect) {
                resetConsecutivePerfectDays();
            }
        } else {
            resetConsecutivePerfectDays();
        }
    }, [habits, logs, incrementPerfectDays, resetConsecutivePerfectDays]);

    // Check for early bird
    const checkForEarlyBird = useCallback((date: string) => {
        const isEarlyBird = checkEarlyBird(habits, logs, date, 9);
        if (isEarlyBird) {
            incrementEarlyBird();
        }
    }, [habits, logs, incrementEarlyBird]);

    // Check for night owl
    const checkForNightOwl = useCallback((date: string) => {
        const isNightOwl = checkNightOwl(habits, logs, date, 21);
        if (isNightOwl) {
            incrementNightOwl();
        }
    }, [habits, logs, incrementNightOwl]);

    // Dismiss badge notification
    const dismissBadgeNotification = useCallback(() => {
        if (newlyUnlockedBadge) {
            markBadgeNotified(newlyUnlockedBadge.id);
            setNewlyUnlockedBadge(null);
        }
    }, [newlyUnlockedBadge, markBadgeNotified]);

    // Run achievement check on mount and when dependencies change
    useEffect(() => {
        if (habits.length > 0 || logs.length > 0) {
            checkAchievements();
        }
    }, [habits.length, logs.length]);

    return {
        checkAchievements,
        checkForPerfectDay,
        checkForEarlyBird,
        checkForNightOwl,
        newlyUnlockedBadge,
        dismissBadgeNotification,
        getUnnotifiedBadges,
    };
};

