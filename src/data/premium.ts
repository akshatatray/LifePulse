/**
 * LifePulse - Premium Subscription Data
 * Defines subscription tiers, features, and pricing
 */

export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface PremiumFeature {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji
    tier: SubscriptionTier; // Minimum tier required
    category: FeatureCategory;
}

export type FeatureCategory = 'habits' | 'analytics' | 'customization' | 'sync' | 'gamification';

export interface SubscriptionPlan {
    id: SubscriptionTier;
    name: string;
    tagline: string;
    price: string;
    priceSubtext?: string;
    period?: string;
    features: string[];
    highlighted?: boolean;
    badge?: string;
    color: string;
}

// Feature categories with icons
export const FEATURE_CATEGORIES: Record<FeatureCategory, { icon: string; label: string }> = {
    habits: { icon: '✅', label: 'Habits' },
    analytics: { icon: '📊', label: 'Analytics' },
    customization: { icon: '🎨', label: 'Customization' },
    sync: { icon: '☁️', label: 'Sync & Backup' },
    gamification: { icon: '🏆', label: 'Gamification' },
};

// All premium features
export const PREMIUM_FEATURES: PremiumFeature[] = [
    // Free tier features (available to all)
    {
        id: 'basic_habits',
        name: 'Up to 5 Habits',
        description: 'Track up to 5 daily habits',
        icon: '✅',
        tier: 'free',
        category: 'habits',
    },
    {
        id: 'basic_streaks',
        name: 'Basic Streaks',
        description: 'Track your daily streaks',
        icon: '🔥',
        tier: 'free',
        category: 'habits',
    },
    {
        id: 'weekly_stats',
        name: 'Weekly Stats',
        description: 'View your weekly progress',
        icon: '📈',
        tier: 'free',
        category: 'analytics',
    },
    {
        id: 'basic_reminders',
        name: 'Daily Reminders',
        description: '1 reminder per habit',
        icon: '🔔',
        tier: 'free',
        category: 'habits',
    },

    // Pro tier features
    {
        id: 'unlimited_habits',
        name: 'Unlimited Habits',
        description: 'Create as many habits as you want',
        icon: '♾️',
        tier: 'pro',
        category: 'habits',
    },
    {
        id: 'habit_categories',
        name: 'Habit Categories',
        description: 'Organize habits into custom categories',
        icon: '📁',
        tier: 'pro',
        category: 'habits',
    },
    {
        id: 'advanced_frequency',
        name: 'Advanced Scheduling',
        description: 'X times per week, custom patterns',
        icon: '📅',
        tier: 'pro',
        category: 'habits',
    },
    {
        id: 'multiple_reminders',
        name: 'Multiple Reminders',
        description: 'Set up to 5 reminders per habit',
        icon: '⏰',
        tier: 'pro',
        category: 'habits',
    },
    {
        id: 'habit_notes',
        name: 'Habit Notes',
        description: 'Add notes to your completions',
        icon: '📝',
        tier: 'pro',
        category: 'habits',
    },
    {
        id: 'full_history',
        name: 'Full History',
        description: 'Access all your historical data',
        icon: '📚',
        tier: 'pro',
        category: 'analytics',
    },
    {
        id: 'monthly_reports',
        name: 'Monthly Reports',
        description: 'Detailed monthly analytics',
        icon: '📊',
        tier: 'pro',
        category: 'analytics',
    },
    {
        id: 'export_data',
        name: 'Export Data',
        description: 'Export your data to CSV/PDF',
        icon: '💾',
        tier: 'pro',
        category: 'analytics',
    },
    {
        id: 'custom_themes',
        name: 'Custom Themes',
        description: 'Choose from premium color themes',
        icon: '🎨',
        tier: 'pro',
        category: 'customization',
    },
    {
        id: 'custom_icons',
        name: 'Premium Icons',
        description: 'Access exclusive habit icons',
        icon: '✨',
        tier: 'pro',
        category: 'customization',
    },
    {
        id: 'widget_support',
        name: 'Home Screen Widgets',
        description: 'Quick access widgets',
        icon: '📱',
        tier: 'pro',
        category: 'customization',
    },
    {
        id: 'cloud_sync',
        name: 'Cloud Sync',
        description: 'Sync across all your devices',
        icon: '☁️',
        tier: 'pro',
        category: 'sync',
    },
    {
        id: 'unlimited_freezes',
        name: 'Unlimited Streak Freezes',
        description: 'Never lose your streaks',
        icon: '❄️',
        tier: 'pro',
        category: 'gamification',
    },
    {
        id: 'exclusive_badges',
        name: 'Exclusive Badges',
        description: 'Unlock premium achievements',
        icon: '🏅',
        tier: 'pro',
        category: 'gamification',
    },

    // Lifetime exclusive features
    {
        id: 'lifetime_badge',
        name: 'Lifetime Supporter Badge',
        description: 'Show your support with an exclusive badge',
        icon: '💎',
        tier: 'lifetime',
        category: 'gamification',
    },
    {
        id: 'early_access',
        name: 'Early Access',
        description: 'Be the first to try new features',
        icon: '🚀',
        tier: 'lifetime',
        category: 'customization',
    },
    {
        id: 'priority_support',
        name: 'Priority Support',
        description: 'Get help faster from our team',
        icon: '💬',
        tier: 'lifetime',
        category: 'sync',
    },
];

// Subscription plans
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        tagline: 'Get started with the basics',
        price: '$0',
        features: [
            'Up to 5 habits',
            'Basic streak tracking',
            'Weekly stats',
            '1 reminder per habit',
            'Basic achievements',
        ],
        color: '#6B7280',
    },
    {
        id: 'pro',
        name: 'Pro',
        tagline: 'Unlock your full potential',
        price: '$4.99',
        period: 'month',
        priceSubtext: 'or $39.99/year (save 33%)',
        features: [
            'Everything in Free',
            'Unlimited habits',
            'Habit categories',
            'Advanced scheduling',
            'Multiple reminders',
            'Full history & reports',
            'Export data',
            'Custom themes & icons',
            'Cloud sync',
            'Unlimited streak freezes',
            'Exclusive badges',
        ],
        highlighted: true,
        badge: 'Most Popular',
        color: '#00FF9D',
    },
    {
        id: 'lifetime',
        name: 'Lifetime',
        tagline: 'One-time purchase, forever yours',
        price: '$79.99',
        priceSubtext: 'One-time payment',
        features: [
            'Everything in Pro',
            'Lifetime access',
            'All future features',
            'Lifetime Supporter badge',
            'Early access to new features',
            'Priority support',
            'No recurring charges',
        ],
        badge: 'Best Value',
        color: '#F59E0B',
    },
];

// Feature limits by tier
export const FEATURE_LIMITS: Record<SubscriptionTier, {
    maxHabits: number;
    maxRemindersPerHabit: number;
    maxStreakFreezes: number;
    historyDays: number;
}> = {
    free: {
        maxHabits: 5,
        maxRemindersPerHabit: 1,
        maxStreakFreezes: 3,
        historyDays: 7,
    },
    pro: {
        maxHabits: Infinity,
        maxRemindersPerHabit: 5,
        maxStreakFreezes: Infinity,
        historyDays: Infinity,
    },
    lifetime: {
        maxHabits: Infinity,
        maxRemindersPerHabit: 5,
        maxStreakFreezes: Infinity,
        historyDays: Infinity,
    },
};

// Get features by tier
export const getFeaturesByTier = (tier: SubscriptionTier): PremiumFeature[] => {
    const tierOrder: SubscriptionTier[] = ['free', 'pro', 'lifetime'];
    const tierIndex = tierOrder.indexOf(tier);
    return PREMIUM_FEATURES.filter((feature) => {
        const featureTierIndex = tierOrder.indexOf(feature.tier);
        return featureTierIndex <= tierIndex;
    });
};

// Check if a feature is available for a tier
export const isFeatureAvailable = (featureId: string, userTier: SubscriptionTier): boolean => {
    const feature = PREMIUM_FEATURES.find((f) => f.id === featureId);
    if (!feature) return false;

    const tierOrder: SubscriptionTier[] = ['free', 'pro', 'lifetime'];
    const featureTierIndex = tierOrder.indexOf(feature.tier);
    const userTierIndex = tierOrder.indexOf(userTier);

    return userTierIndex >= featureTierIndex;
};

// Get plan by ID
export const getPlanById = (id: SubscriptionTier): SubscriptionPlan | undefined => {
    return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
};

// Benefits for upgrade prompts
export const UPGRADE_BENEFITS = [
    { icon: '♾️', text: 'Unlimited habits to build any routine' },
    { icon: '📊', text: 'Deep insights into your progress' },
    { icon: '☁️', text: 'Sync across all your devices' },
    { icon: '🎨', text: 'Personalize with custom themes' },
    { icon: '❄️', text: 'Never lose your streaks again' },
    { icon: '🏅', text: 'Unlock exclusive achievements' },
];

