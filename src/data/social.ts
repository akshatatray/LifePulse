/**
 * LifePulse - Social Data Types
 * Types and constants for social features
 */

export interface Friend {
    id: string;
    userId: string;
    displayName: string;
    photoURL?: string;
    currentStreak: number;
    totalCompletions: number;
    level: number;
    status: 'pending' | 'accepted' | 'blocked';
    addedAt: Date;
    lastActive?: Date;
}

export interface ActivityItem {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string;
    type: ActivityType;
    data: ActivityData;
    timestamp: Date;
    likes: number;
    hasLiked: boolean;
}

export type ActivityType =
    | 'habit_completed'
    | 'streak_milestone'
    | 'badge_earned'
    | 'level_up'
    | 'perfect_day'
    | 'challenge_joined'
    | 'challenge_completed';

export interface ActivityData {
    habitName?: string;
    habitIcon?: string;
    streakCount?: number;
    badgeName?: string;
    badgeIcon?: string;
    level?: number;
    challengeName?: string;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    icon: string;
    type: ChallengeType;
    category: string;
    duration: number; // days
    startDate: Date;
    endDate: Date;
    goal: number;
    participants: ChallengeParticipant[];
    createdBy: string;
    isPublic: boolean;
    maxParticipants?: number;
}

export type ChallengeType =
    | 'streak'
    | 'completions'
    | 'perfect_days'
    | 'habit_specific';

export interface ChallengeParticipant {
    id: string;
    userId: string;
    displayName: string;
    photoURL?: string;
    progress: number;
    rank: number;
    joinedAt: Date;
}

export interface LeaderboardEntry {
    rank: number;
    userId: string;
    displayName: string;
    photoURL?: string;
    score: number;
    change: number; // Position change from yesterday
    isCurrentUser: boolean;
}

// Activity templates
export const ACTIVITY_TEMPLATES: Record<ActivityType, (data: ActivityData, userName: string) => string> = {
    habit_completed: (data, name) => `${name} completed "${data.habitName}"`,
    streak_milestone: (data, name) => `${name} reached a ${data.streakCount}-day streak! 🔥`,
    badge_earned: (data, name) => `${name} earned the "${data.badgeName}" badge ${data.badgeIcon}`,
    level_up: (data, name) => `${name} leveled up to Level ${data.level}! ⭐`,
    perfect_day: (data, name) => `${name} had a perfect day! 🌈`,
    challenge_joined: (data, name) => `${name} joined "${data.challengeName}"`,
    challenge_completed: (data, name) => `${name} completed "${data.challengeName}" challenge! 🏆`,
};

// Challenge categories
export const CHALLENGE_CATEGORIES = [
    { id: 'fitness', name: 'Fitness', icon: '💪', color: '#EF4444' },
    { id: 'mindfulness', name: 'Mindfulness', icon: '🧘', color: '#8B5CF6' },
    { id: 'productivity', name: 'Productivity', icon: '📚', color: '#3B82F6' },
    { id: 'health', name: 'Health', icon: '🥗', color: '#10B981' },
    { id: 'social', name: 'Social', icon: '👥', color: '#F59E0B' },
    { id: 'creative', name: 'Creative', icon: '🎨', color: '#EC4899' },
];

// Leaderboard time filters
export const LEADERBOARD_FILTERS = [
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'allTime', label: 'All Time' },
];

// Helper to format time ago
export const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};
