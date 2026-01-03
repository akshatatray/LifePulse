/**
 * Leaderboard - Weekly/Monthly rankings with friends
 * Connected to Firebase for real-time data
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { LEADERBOARD_FILTERS, LeaderboardEntry } from '../../data/social';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { useLeaderboard, useSocialStore } from '../../stores/socialStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    index: number;
}

const getRankDisplay = (rank: number): { emoji: string; colors: string[] } => {
    switch (rank) {
        case 1:
            return { emoji: '🥇', colors: ['#FFD700', '#FFA500'] };
        case 2:
            return { emoji: '🥈', colors: ['#C0C0C0', '#A0A0A0'] };
        case 3:
            return { emoji: '🥉', colors: ['#CD7F32', '#B87333'] };
        default:
            return { emoji: '', colors: [colors.background.elevated, colors.background.elevated] };
    }
};

const getChangeIcon = (change: number): { icon: string; color: string } => {
    if (change > 0) return { icon: 'trending-up', color: colors.accent.success };
    if (change < 0) return { icon: 'trending-down', color: colors.accent.error };
    return { icon: 'minus', color: colors.text.muted };
};

const LeaderboardRow = ({ entry, index }: LeaderboardRowProps) => {
    const scale = useSharedValue(1);
    const rankDisplay = getRankDisplay(entry.rank);
    const changeDisplay = getChangeIcon(entry.change);

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const initial = entry.displayName.charAt(0).toUpperCase();
    const isTop3 = entry.rank <= 3;
    const avatarColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    const avatarColor = avatarColors[entry.displayName.length % avatarColors.length];

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 60).duration(300)}
            layout={Layout.springify()}
        >
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View
                    style={[
                        styles.row,
                        entry.isCurrentUser && styles.currentUserRow,
                        animatedStyle,
                    ]}
                >
                    {/* Rank */}
                    <View style={styles.rankContainer}>
                        {isTop3 ? (
                            <Text style={styles.rankEmoji}>{rankDisplay.emoji}</Text>
                        ) : (
                            <Text style={styles.rankNumber}>{entry.rank}</Text>
                        )}
                    </View>

                    {/* Avatar */}
                    <View
                        style={[
                            styles.avatar,
                            {
                                backgroundColor: entry.isCurrentUser
                                    ? colors.accent.success
                                    : avatarColor,
                            },
                        ]}
                    >
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>

                    {/* Name & Score */}
                    <View style={styles.userInfo}>
                        <Text
                            style={[
                                styles.userName,
                                entry.isCurrentUser && styles.currentUserName,
                            ]}
                        >
                            {entry.displayName}
                            {entry.isCurrentUser && ' (You)'}
                        </Text>
                        <Text style={styles.userScore}>
                            {entry.score.toLocaleString()} pts
                        </Text>
                    </View>

                    {/* Change indicator */}
                    <View style={styles.changeContainer}>
                        <Feather
                            name={changeDisplay.icon as any}
                            size={14}
                            color={changeDisplay.color}
                        />
                        {entry.change !== 0 && (
                            <Text style={[styles.changeText, { color: changeDisplay.color }]}>
                                {Math.abs(entry.change)}
                            </Text>
                        )}
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

interface TopThreeCardProps {
    entries: LeaderboardEntry[];
}

const TopThreeCard = ({ entries }: TopThreeCardProps) => {
    const podiumOrder = [1, 0, 2]; // Second, First, Third
    const heights = [100, 130, 80];
    const podiumColors = [
        ['#C0C0C0', '#A0A0A0'],
        ['#FFD700', '#FFA500'],
        ['#CD7F32', '#B87333'],
    ];

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.topThreeContainer}>
            {podiumOrder.map((orderIndex, displayIndex) => {
                const entry = entries[orderIndex];
                if (!entry) return null;

                const initial = entry.displayName.charAt(0).toUpperCase();
                const isCenter = displayIndex === 1;

                return (
                    <View key={entry.userId} style={styles.podiumItem}>
                        {/* Avatar with crown for 1st */}
                        <View style={styles.podiumAvatarContainer}>
                            {entry.rank === 1 && <Text style={styles.crown}>👑</Text>}
                            <LinearGradient
                                colors={podiumColors[orderIndex] as [string, string]}
                                style={[
                                    styles.podiumAvatar,
                                    isCenter && styles.podiumAvatarCenter,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.podiumAvatarText,
                                        isCenter && styles.podiumAvatarTextCenter,
                                    ]}
                                >
                                    {initial}
                                </Text>
                            </LinearGradient>
                        </View>

                        {/* Name */}
                        <Text style={styles.podiumName} numberOfLines={1}>
                            {entry.isCurrentUser ? 'You' : entry.displayName.split(' ')[0]}
                        </Text>

                        {/* Score */}
                        <Text style={styles.podiumScore}>
                            {entry.score.toLocaleString()}
                        </Text>

                        {/* Podium */}
                        <LinearGradient
                            colors={podiumColors[orderIndex] as [string, string]}
                            style={[styles.podium, { height: heights[displayIndex] }]}
                        >
                            <Text style={styles.podiumRank}>{entry.rank}</Text>
                        </LinearGradient>
                    </View>
                );
            })}
        </Animated.View>
    );
};

export const Leaderboard = () => {
    const user = useAuthStore((state) => state.user);
    const { leaderboard, filter, setFilter, fetchLeaderboard, currentUserRank } = useLeaderboard();
    const isLoading = useSocialStore((state) => state.isLoading);
    const haptics = useHaptics();

    // Refetch when filter changes
    useEffect(() => {
        if (user?.uid) {
            fetchLeaderboard(user.uid);
        }
    }, [filter, user?.uid]);

    const handleFilterChange = (newFilter: 'week' | 'month' | 'allTime') => {
        haptics.light();
        setFilter(newFilter);
    };

    const top3 = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Leaderboard</Text>
                    {currentUserRank && (
                        <Text style={styles.subtitle}>
                            You're ranked #{currentUserRank}
                        </Text>
                    )}
                </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {LEADERBOARD_FILTERS.map((filterOption) => (
                    <Pressable
                        key={filterOption.id}
                        onPress={() => handleFilterChange(filterOption.id as any)}
                        style={[
                            styles.filterTab,
                            filter === filterOption.id && styles.filterTabActive,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterTabText,
                                filter === filterOption.id && styles.filterTabTextActive,
                            ]}
                        >
                            {filterOption.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Loading state */}
            {isLoading && leaderboard.length === 0 && (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={colors.accent.success} />
                    <Text style={styles.loadingText}>Loading rankings...</Text>
                </View>
            )}

            {/* Top 3 Podium */}
            {top3.length >= 3 && <TopThreeCard entries={top3} />}

            {/* Rest of leaderboard */}
            <View style={styles.leaderboardList}>
                {rest.map((entry, index) => (
                    <LeaderboardRow key={entry.userId} entry={entry} index={index} />
                ))}
            </View>

            {/* Empty state */}
            {!isLoading && leaderboard.length === 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🏆</Text>
                    <Text style={styles.emptyTitle}>No rankings yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Complete habits to climb the leaderboard!
                    </Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
        color: colors.accent.success,
        marginTop: 2,
    },

    // Filter tabs
    filterContainer: {
        flexDirection: 'row',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.xs,
        marginBottom: spacing.lg,
    },
    filterTab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    filterTabActive: {
        backgroundColor: colors.background.elevated,
    },
    filterTabText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    filterTabTextActive: {
        color: colors.text.primary,
    },

    // Top 3 podium
    topThreeContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: spacing.xl,
        paddingTop: spacing.xl,
    },
    podiumItem: {
        alignItems: 'center',
        width: 100,
        marginHorizontal: spacing.xs,
    },
    podiumAvatarContainer: {
        position: 'relative',
    },
    crown: {
        position: 'absolute',
        top: -24,
        left: '50%',
        marginLeft: -12,
        fontSize: 24,
        zIndex: 1,
    },
    podiumAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    podiumAvatarCenter: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    podiumAvatarText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.inverse,
    },
    podiumAvatarTextCenter: {
        fontSize: fontSize.xl,
    },
    podiumName: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.primary,
        marginBottom: 2,
    },
    podiumScore: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },
    podium: {
        width: '100%',
        borderTopLeftRadius: borderRadius.md,
        borderTopRightRadius: borderRadius.md,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: spacing.sm,
    },
    podiumRank: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: 'rgba(255, 255, 255, 0.9)',
    },

    // Leaderboard rows
    leaderboardList: {},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    currentUserRow: {
        borderWidth: 1,
        borderColor: colors.accent.success + '50',
        backgroundColor: colors.accent.success + '10',
    },
    rankContainer: {
        width: 32,
        alignItems: 'center',
    },
    rankEmoji: {
        fontSize: 20,
    },
    rankNumber: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.muted,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.sm,
        marginRight: spacing.md,
    },
    avatarText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.primary,
    },
    currentUserName: {
        color: colors.accent.success,
    },
    userScore: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 32,
    },
    changeText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        marginLeft: 2,
    },

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
