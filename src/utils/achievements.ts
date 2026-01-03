/**
 * LifePulse - Achievement System
 * Logic for checking and awarding badges based on user progress
 */

import { BADGES, Badge } from '../data/badges';
import { Habit, HabitLog } from '../types/habit';

export interface AchievementCheckResult {
    badgeId: string;
    shouldUnlock: boolean;
}

/**
 * Check all badges and return which ones should be unlocked
 */
export const checkAllAchievements = (
    habits: Habit[],
    logs: HabitLog[],
    unlockedBadgeIds: string[],
    stats: {
        perfectDays: number;
        consecutivePerfectDays: number;
        earlyBirdCount: number;
        nightOwlCount: number;
        comebackCount: number;
    }
): AchievementCheckResult[] => {
    const results: AchievementCheckResult[] = [];

    // Calculate stats needed for badge checks
    const totalHabits = habits.length;
    const totalCompletions = logs.filter((l) => l.status === 'completed').length;
    const bestStreak = calculateBestStreak(habits, logs);

    for (const badge of BADGES) {
        // Skip if already unlocked
        if (unlockedBadgeIds.includes(badge.id)) {
            continue;
        }

        const shouldUnlock = checkBadgeRequirement(badge, {
            totalHabits,
            totalCompletions,
            bestStreak,
            perfectDays: stats.perfectDays,
            consecutivePerfectDays: stats.consecutivePerfectDays,
            earlyBirdCount: stats.earlyBirdCount,
            nightOwlCount: stats.nightOwlCount,
            comebackCount: stats.comebackCount,
        });

        results.push({ badgeId: badge.id, shouldUnlock });
    }

    return results;
};

/**
 * Check if a specific badge's requirements are met
 */
const checkBadgeRequirement = (
    badge: Badge,
    stats: {
        totalHabits: number;
        totalCompletions: number;
        bestStreak: number;
        perfectDays: number;
        consecutivePerfectDays: number;
        earlyBirdCount: number;
        nightOwlCount: number;
        comebackCount: number;
    }
): boolean => {
    const { requirement } = badge;

    switch (requirement.type) {
        case 'habit_count':
            return stats.totalHabits >= requirement.value;

        case 'completions':
            return stats.totalCompletions >= requirement.value;

        case 'streak':
            return stats.bestStreak >= requirement.value;

        case 'perfect_days':
            return stats.perfectDays >= requirement.value;

        case 'perfect_week':
            return stats.consecutivePerfectDays >= 7 * requirement.value;

        case 'early_bird':
            return stats.earlyBirdCount >= requirement.value;

        case 'night_owl':
            return stats.nightOwlCount >= requirement.value;

        case 'custom':
            // Handle custom badges
            switch (badge.id) {
                case 'comeback_kid':
                    return stats.comebackCount >= requirement.value;
                case 'weekend_warrior':
                    // This would need more complex logic
                    return false;
                default:
                    return false;
            }

        default:
            return false;
    }
};

/**
 * Calculate the best (longest) streak across all habits
 */
export const calculateBestStreak = (habits: Habit[], logs: HabitLog[]): number => {
    let bestStreak = 0;

    // Check each habit's streak
    for (const habit of habits) {
        if (habit.longestStreak > bestStreak) {
            bestStreak = habit.longestStreak;
        }
    }

    // Also calculate overall streak (any completion per day)
    const overallStreak = calculateOverallStreak(logs);
    if (overallStreak > bestStreak) {
        bestStreak = overallStreak;
    }

    return bestStreak;
};

/**
 * Calculate overall streak (days with at least one completion)
 */
const calculateOverallStreak = (logs: HabitLog[]): number => {
    if (logs.length === 0) return 0;

    // Get unique dates with completions
    const completedDates = new Set<string>();
    logs.forEach((log) => {
        if (log.status === 'completed') {
            completedDates.add(log.date);
        }
    });

    if (completedDates.size === 0) return 0;

    // Sort dates
    const sortedDates = Array.from(completedDates).sort();

    // Find longest consecutive streak
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);

        // Check if consecutive
        prevDate.setDate(prevDate.getDate() + 1);
        if (prevDate.toISOString().split('T')[0] === sortedDates[i]) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
        } else {
            currentStreak = 1;
        }
    }

    return maxStreak;
};

/**
 * Check if today is a perfect day (all active habits completed)
 */
export const checkPerfectDay = (
    habits: Habit[],
    logs: HabitLog[],
    date: string
): boolean => {
    // Get active habits for this date
    const activeHabits = habits.filter((habit) => {
        // Check if habit was created before or on this date
        const habitCreatedDate = new Date(habit.createdAt).toISOString().split('T')[0];
        if (habitCreatedDate > date) return false;

        // Check frequency config
        return isHabitActiveOnDate(habit, date);
    });

    if (activeHabits.length === 0) return false;

    // Check if all active habits are completed
    const completedHabitIds = new Set(
        logs
            .filter((log) => log.date === date && log.status === 'completed')
            .map((log) => log.habitId)
    );

    return activeHabits.every((habit) => completedHabitIds.has(habit.id));
};

/**
 * Check if a habit should be active on a specific date based on frequency config
 */
const isHabitActiveOnDate = (habit: Habit, dateString: string): boolean => {
    const date = new Date(dateString);
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    const { frequencyConfig } = habit;

    switch (frequencyConfig.type) {
        case 'daily':
            // Check exceptions
            if (frequencyConfig.exceptions?.includes(dayOfWeek as any)) {
                return false;
            }
            return true;

        case 'specific_days':
            return frequencyConfig.days?.includes(dayOfWeek as any) ?? false;

        case 'x_times_per_period':
            // For flexible frequency, habit is "active" any day
            return true;

        default:
            return true;
    }
};

/**
 * Check if all habits were completed before a specific time
 */
export const checkEarlyBird = (
    habits: Habit[],
    logs: HabitLog[],
    date: string,
    beforeHour: number = 9
): boolean => {
    const activeHabits = habits.filter((habit) => isHabitActiveOnDate(habit, date));
    if (activeHabits.length === 0) return false;

    const todaysCompletions = logs.filter(
        (log) => log.date === date && log.status === 'completed'
    );

    // All habits must be completed
    if (todaysCompletions.length < activeHabits.length) return false;

    // All completions must be before the specified hour
    return todaysCompletions.every((log) => {
        if (!log.completedAt) return false;
        const completedAt = new Date(log.completedAt);
        return completedAt.getHours() < beforeHour;
    });
};

/**
 * Check if all habits were completed after a specific time
 */
export const checkNightOwl = (
    habits: Habit[],
    logs: HabitLog[],
    date: string,
    afterHour: number = 21
): boolean => {
    const activeHabits = habits.filter((habit) => isHabitActiveOnDate(habit, date));
    if (activeHabits.length === 0) return false;

    const todaysCompletions = logs.filter(
        (log) => log.date === date && log.status === 'completed'
    );

    // All habits must be completed
    if (todaysCompletions.length < activeHabits.length) return false;

    // All completions must be after the specified hour
    return todaysCompletions.every((log) => {
        if (!log.completedAt) return false;
        const completedAt = new Date(log.completedAt);
        return completedAt.getHours() >= afterHour;
    });
};

/**
 * Get progress towards next milestone for a specific badge type
 */
export const getBadgeProgress = (
    badgeId: string,
    stats: {
        totalHabits: number;
        totalCompletions: number;
        bestStreak: number;
        perfectDays: number;
    }
): { current: number; target: number; percentage: number } | null => {
    const badge = BADGES.find((b) => b.id === badgeId);
    if (!badge) return null;

    let current = 0;
    const target = badge.requirement.value;

    switch (badge.requirement.type) {
        case 'habit_count':
            current = stats.totalHabits;
            break;
        case 'completions':
            current = stats.totalCompletions;
            break;
        case 'streak':
            current = stats.bestStreak;
            break;
        case 'perfect_days':
            current = stats.perfectDays;
            break;
        default:
            return null;
    }

    const percentage = Math.min((current / target) * 100, 100);

    return { current, target, percentage };
};

