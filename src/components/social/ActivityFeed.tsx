/**
 * ActivityFeed - Shows friends' activities and achievements
 * Connected to Firebase for real-time data
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import {
    ACTIVITY_TEMPLATES,
    ActivityItem,
    ActivityType,
    formatTimeAgo,
} from '../../data/social';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore } from '../../stores/socialStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface ActivityCardProps {
    activity: ActivityItem;
    index: number;
    onLike: () => void;
    onUnlike: () => void;
}

const getActivityEmoji = (type: ActivityType): string => {
    switch (type) {
        case 'habit_completed':
            return '✅';
        case 'streak_milestone':
            return '🔥';
        case 'badge_earned':
            return '🏅';
        case 'level_up':
            return '⭐';
        case 'perfect_day':
            return '🌈';
        case 'challenge_joined':
            return '🎯';
        case 'challenge_completed':
            return '🏆';
        default:
            return '📍';
    }
};

const getActivityColor = (type: ActivityType): string => {
    switch (type) {
        case 'habit_completed':
            return colors.accent.success;
        case 'streak_milestone':
            return '#F59E0B';
        case 'badge_earned':
            return '#8B5CF6';
        case 'level_up':
            return '#3B82F6';
        case 'perfect_day':
            return '#EC4899';
        case 'challenge_joined':
            return '#10B981';
        case 'challenge_completed':
            return '#EF4444';
        default:
            return colors.text.muted;
    }
};

const ActivityCard = ({ activity, index, onLike, onUnlike }: ActivityCardProps) => {
    const haptics = useHaptics();
    const scale = useSharedValue(1);
    const likeScale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handleLike = () => {
        likeScale.value = withSpring(1.3, { damping: 4 }, () => {
            likeScale.value = withSpring(1);
        });
        haptics.light();

        if (activity.hasLiked) {
            onUnlike();
        } else {
            onLike();
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const likeAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: likeScale.value }],
    }));

    const initial = activity.userName.charAt(0).toUpperCase();
    const activityColor = getActivityColor(activity.type);
    const activityEmoji = getActivityEmoji(activity.type);
    const activityText = ACTIVITY_TEMPLATES[activity.type](activity.data, activity.userName);

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 80).duration(300)}
            layout={Layout.springify()}
        >
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View style={[styles.activityCard, animatedStyle]}>
                    {/* Left - Avatar with emoji overlay */}
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: activityColor + '30' }]}>
                            <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                        <View style={[styles.emojiOverlay, { backgroundColor: activityColor }]}>
                            <Text style={styles.emojiText}>{activityEmoji}</Text>
                        </View>
                    </View>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.activityText}>{activityText}</Text>
                        <Text style={styles.timestamp}>
                            {formatTimeAgo(new Date(activity.timestamp))}
                        </Text>
                    </View>

                    {/* Like button */}
                    <Pressable onPress={handleLike} style={styles.likeButton}>
                        <Animated.View style={likeAnimatedStyle}>
                            <Feather
                                name={activity.hasLiked ? 'heart' : 'heart'}
                                size={18}
                                color={activity.hasLiked ? '#EF4444' : colors.text.muted}
                                style={{ opacity: activity.hasLiked ? 1 : 0.6 }}
                            />
                        </Animated.View>
                        {activity.likes > 0 && (
                            <Text
                                style={[
                                    styles.likeCount,
                                    activity.hasLiked && styles.likeCountActive,
                                ]}
                            >
                                {activity.likes}
                            </Text>
                        )}
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

export const ActivityFeed = () => {
    const user = useAuthStore((state) => state.user);
    const activityFeed = useSocialStore((state) => state.activityFeed);
    const isLoading = useSocialStore((state) => state.isLoading);
    const likeActivity = useSocialStore((state) => state.likeActivity);
    const unlikeActivity = useSocialStore((state) => state.unlikeActivity);

    const handleLike = (activityId: string) => {
        if (user?.uid) {
            likeActivity(user.uid, activityId);
        }
    };

    const handleUnlike = (activityId: string) => {
        if (user?.uid) {
            unlikeActivity(user.uid, activityId);
        }
    };

    // Loading state
    if (isLoading && activityFeed.length === 0) {
        return (
            <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={colors.accent.success} />
                <Text style={styles.loadingText}>Loading activity...</Text>
            </View>
        );
    }

    // Empty state
    if (activityFeed.length === 0) {
        return (
            <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📰</Text>
                <Text style={styles.emptyTitle}>No activity yet</Text>
                <Text style={styles.emptySubtitle}>
                    Add friends to see their activities and achievements here
                </Text>
            </Animated.View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Activity</Text>
                <Text style={styles.subtitle}>What your friends are up to</Text>
            </View>

            <View style={styles.feedList}>
                {activityFeed.map((activity, index) => (
                    <ActivityCard
                        key={activity.id}
                        activity={activity}
                        index={index}
                        onLike={() => handleLike(activity.id)}
                        onUnlike={() => handleUnlike(activity.id)}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: spacing.md,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
    },

    // Activity card
    activityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
    },
    emojiOverlay: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.background.card,
    },
    emojiText: {
        fontSize: 10,
    },
    content: {
        flex: 1,
    },
    activityText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.primary,
        lineHeight: 20,
    },
    timestamp: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.sm,
    },
    likeCount: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginLeft: 4,
    },
    likeCountActive: {
        color: '#EF4444',
    },
    feedList: {},

    // Loading state
    loadingState: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    loadingText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: spacing.md,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        textAlign: 'center',
        maxWidth: 240,
    },
});
