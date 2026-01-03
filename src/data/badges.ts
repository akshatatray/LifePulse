/**
 * LifePulse - Badge/Achievement Definitions
 * All badges and their unlock requirements
 */

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji
    category: BadgeCategory;
    rarity: BadgeRarity;
    requirement: BadgeRequirement;
    points: number; // Points awarded when unlocked
}

export type BadgeCategory = 'starter' | 'streak' | 'consistency' | 'milestone' | 'special';
export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface BadgeRequirement {
    type: 'habit_count' | 'streak' | 'completions' | 'perfect_days' | 'perfect_week' | 'early_bird' | 'night_owl' | 'consistency' | 'custom';
    value: number;
    habitId?: string; // For habit-specific badges
}

// Rarity colors
export const RARITY_COLORS: Record<BadgeRarity, string> = {
    common: '#9CA3AF',      // Gray
    uncommon: '#10B981',    // Green
    rare: '#3B82F6',        // Blue
    epic: '#8B5CF6',        // Purple
    legendary: '#F59E0B',   // Gold
};

// Category icons
export const CATEGORY_ICONS: Record<BadgeCategory, string> = {
    starter: '🌱',
    streak: '🔥',
    consistency: '📊',
    milestone: '🏆',
    special: '⭐',
};

// All available badges
export const BADGES: Badge[] = [
    // === STARTER BADGES ===
    {
        id: 'first_step',
        name: 'First Step',
        description: 'Create your first habit',
        icon: '🌱',
        category: 'starter',
        rarity: 'common',
        requirement: { type: 'habit_count', value: 1 },
        points: 10,
    },
    {
        id: 'habit_builder',
        name: 'Habit Builder',
        description: 'Create 5 habits',
        icon: '🏗️',
        category: 'starter',
        rarity: 'uncommon',
        requirement: { type: 'habit_count', value: 5 },
        points: 25,
    },
    {
        id: 'habit_master',
        name: 'Habit Master',
        description: 'Create 10 habits',
        icon: '👑',
        category: 'starter',
        rarity: 'rare',
        requirement: { type: 'habit_count', value: 10 },
        points: 50,
    },
    {
        id: 'first_completion',
        name: 'Getting Started',
        description: 'Complete your first habit',
        icon: '✅',
        category: 'starter',
        rarity: 'common',
        requirement: { type: 'completions', value: 1 },
        points: 10,
    },

    // === STREAK BADGES ===
    {
        id: 'streak_3',
        name: 'On Fire',
        description: '3-day streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        requirement: { type: 'streak', value: 3 },
        points: 15,
    },
    {
        id: 'streak_7',
        name: 'Week Warrior',
        description: '7-day streak',
        icon: '⚔️',
        category: 'streak',
        rarity: 'uncommon',
        requirement: { type: 'streak', value: 7 },
        points: 30,
    },
    {
        id: 'streak_14',
        name: 'Two Week Champion',
        description: '14-day streak',
        icon: '🥇',
        category: 'streak',
        rarity: 'rare',
        requirement: { type: 'streak', value: 14 },
        points: 50,
    },
    {
        id: 'streak_30',
        name: 'Monthly Master',
        description: '30-day streak',
        icon: '🌟',
        category: 'streak',
        rarity: 'epic',
        requirement: { type: 'streak', value: 30 },
        points: 100,
    },
    {
        id: 'streak_60',
        name: 'Unstoppable',
        description: '60-day streak',
        icon: '💪',
        category: 'streak',
        rarity: 'epic',
        requirement: { type: 'streak', value: 60 },
        points: 150,
    },
    {
        id: 'streak_100',
        name: 'Century Legend',
        description: '100-day streak',
        icon: '💯',
        category: 'streak',
        rarity: 'legendary',
        requirement: { type: 'streak', value: 100 },
        points: 250,
    },
    {
        id: 'streak_365',
        name: 'Year of Greatness',
        description: '365-day streak',
        icon: '🎊',
        category: 'streak',
        rarity: 'legendary',
        requirement: { type: 'streak', value: 365 },
        points: 1000,
    },

    // === CONSISTENCY BADGES ===
    {
        id: 'perfect_day',
        name: 'Perfect Day',
        description: 'Complete all habits in a day',
        icon: '🌈',
        category: 'consistency',
        rarity: 'common',
        requirement: { type: 'perfect_days', value: 1 },
        points: 15,
    },
    {
        id: 'perfect_week',
        name: 'Perfect Week',
        description: '7 perfect days in a row',
        icon: '🏅',
        category: 'consistency',
        rarity: 'rare',
        requirement: { type: 'perfect_week', value: 1 },
        points: 75,
    },
    {
        id: 'perfect_month',
        name: 'Perfect Month',
        description: '30 perfect days',
        icon: '🌙',
        category: 'consistency',
        rarity: 'epic',
        requirement: { type: 'perfect_days', value: 30 },
        points: 200,
    },

    // === MILESTONE BADGES ===
    {
        id: 'completions_10',
        name: 'Getting Consistent',
        description: 'Complete 10 habit check-ins',
        icon: '📈',
        category: 'milestone',
        rarity: 'common',
        requirement: { type: 'completions', value: 10 },
        points: 20,
    },
    {
        id: 'completions_50',
        name: 'Habit Hero',
        description: 'Complete 50 habit check-ins',
        icon: '🦸',
        category: 'milestone',
        rarity: 'uncommon',
        requirement: { type: 'completions', value: 50 },
        points: 50,
    },
    {
        id: 'completions_100',
        name: 'Centurion',
        description: 'Complete 100 habit check-ins',
        icon: '💎',
        category: 'milestone',
        rarity: 'rare',
        requirement: { type: 'completions', value: 100 },
        points: 100,
    },
    {
        id: 'completions_500',
        name: 'Dedication',
        description: 'Complete 500 habit check-ins',
        icon: '🎯',
        category: 'milestone',
        rarity: 'epic',
        requirement: { type: 'completions', value: 500 },
        points: 250,
    },
    {
        id: 'completions_1000',
        name: 'Thousand Strong',
        description: 'Complete 1000 habit check-ins',
        icon: '🏰',
        category: 'milestone',
        rarity: 'legendary',
        requirement: { type: 'completions', value: 1000 },
        points: 500,
    },

    // === SPECIAL BADGES ===
    {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Complete all habits before 9 AM',
        icon: '🐦',
        category: 'special',
        rarity: 'uncommon',
        requirement: { type: 'early_bird', value: 1 },
        points: 25,
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Complete all habits after 9 PM',
        icon: '🦉',
        category: 'special',
        rarity: 'uncommon',
        requirement: { type: 'night_owl', value: 1 },
        points: 25,
    },
    {
        id: 'comeback_kid',
        name: 'Comeback Kid',
        description: 'Resume after missing 3+ days',
        icon: '🔄',
        category: 'special',
        rarity: 'rare',
        requirement: { type: 'custom', value: 1 },
        points: 40,
    },
    {
        id: 'weekend_warrior',
        name: 'Weekend Warrior',
        description: 'Complete all habits on Saturday & Sunday',
        icon: '🎉',
        category: 'special',
        rarity: 'uncommon',
        requirement: { type: 'custom', value: 1 },
        points: 30,
    },
];

// Get badge by ID
export const getBadgeById = (id: string): Badge | undefined => {
    return BADGES.find((badge) => badge.id === id);
};

// Get badges by category
export const getBadgesByCategory = (category: BadgeCategory): Badge[] => {
    return BADGES.filter((badge) => badge.category === category);
};

// Get badges by rarity
export const getBadgesByRarity = (rarity: BadgeRarity): Badge[] => {
    return BADGES.filter((badge) => badge.rarity === rarity);
};

// Sort badges by rarity (for display)
export const sortBadgesByRarity = (badges: Badge[]): Badge[] => {
    const rarityOrder: Record<BadgeRarity, number> = {
        legendary: 0,
        epic: 1,
        rare: 2,
        uncommon: 3,
        common: 4,
    };
    return [...badges].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
};

