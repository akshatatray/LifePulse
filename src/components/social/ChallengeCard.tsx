/**
 * ChallengeCard - Card for displaying and joining challenges
 * Connected to Firebase for real-time data
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInRight,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Challenge, CHALLENGE_CATEGORIES } from '../../data/social';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useAuthStore } from '../../stores/authStore';
import { useChallenges, useSocialStore } from '../../stores/socialStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface ChallengeCardProps {
    challenge: Challenge;
    index: number;
    onPress?: () => void;
}

const getCategoryColor = (categoryId: string): string => {
    const category = CHALLENGE_CATEGORIES.find((c) => c.id === categoryId);
    return category?.color || colors.text.muted;
};

const getCategoryIcon = (categoryId: string): string => {
    const category = CHALLENGE_CATEGORIES.find((c) => c.id === categoryId);
    return category?.icon || '🎯';
};

const formatDaysLeft = (endDate: Date): string => {
    const now = new Date();
    const diff = new Date(endDate).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Ended';
    if (days === 1) return '1 day left';
    return `${days} days left`;
};

export const ChallengeCard = ({ challenge, index, onPress }: ChallengeCardProps) => {
    const user = useAuthStore((state) => state.user);
    const { isJoined, joinChallenge, leaveChallenge } = useChallenges();
    const haptics = useHaptics();
    const sound = useSound();
    const scale = useSharedValue(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const joined = isJoined(challenge.id);

    const handlePressIn = () => {
        scale.value = withSpring(0.97);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handleJoinToggle = async () => {
        if (!user?.uid || isProcessing) return;

        setIsProcessing(true);
        haptics.medium();

        try {
            if (joined) {
                await leaveChallenge(user.uid, challenge.id);
            } else {
                sound.success();
                await joinChallenge(user.uid, challenge.id, user.displayName || 'User');
            }
        } catch (error) {
            console.error('Error toggling challenge:', error);
            haptics.error();
        } finally {
            setIsProcessing(false);
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const categoryColor = getCategoryColor(challenge.category);
    const categoryIcon = getCategoryIcon(challenge.category);
    const daysLeft = formatDaysLeft(new Date(challenge.endDate));
    const participantCount = challenge.participants.length;

    return (
        <Animated.View
            entering={FadeInRight.delay(index * 80).duration(300)}
        >
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Animated.View style={[styles.card, animatedStyle]}>
                    {/* Header with icon and category */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
                            <Text style={styles.icon}>{challenge.icon}</Text>
                        </View>
                        <View
                            style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}
                        >
                            <Text style={[styles.categoryText, { color: categoryColor }]}>
                                {categoryIcon} {challenge.category}
                            </Text>
                        </View>
                    </View>

                    {/* Title and description */}
                    <Text style={styles.title}>{challenge.title}</Text>
                    <Text style={styles.description} numberOfLines={2}>
                        {challenge.description}
                    </Text>

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <Feather name="users" size={14} color={colors.text.muted} />
                            <Text style={styles.statText}>
                                {participantCount} joined
                            </Text>
                        </View>
                        <View style={styles.stat}>
                            <Feather name="clock" size={14} color={colors.text.muted} />
                            <Text style={styles.statText}>{daysLeft}</Text>
                        </View>
                        <View style={styles.stat}>
                            <Feather name="target" size={14} color={colors.text.muted} />
                            <Text style={styles.statText}>
                                {challenge.duration}d challenge
                            </Text>
                        </View>
                    </View>

                    {/* Join button */}
                    <Pressable onPress={handleJoinToggle} disabled={isProcessing}>
                        {isProcessing ? (
                            <View style={styles.processingButton}>
                                <ActivityIndicator size="small" color={colors.accent.success} />
                            </View>
                        ) : joined ? (
                            <View style={styles.joinedButton}>
                                <Feather
                                    name="check-circle"
                                    size={16}
                                    color={colors.accent.success}
                                />
                                <Text style={styles.joinedButtonText}>Joined</Text>
                            </View>
                        ) : (
                            <LinearGradient
                                colors={[categoryColor, categoryColor + 'DD']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.joinButton}
                            >
                                <Text style={styles.joinButtonText}>Join Challenge</Text>
                            </LinearGradient>
                        )}
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

// Challenges list component
interface ChallengesListProps {
    showHeader?: boolean;
}

export const ChallengesList = ({ showHeader = true }: ChallengesListProps) => {
    const user = useAuthStore((state) => state.user);
    const { activeChallenges, joinedChallenges } = useChallenges();
    const isLoading = useSocialStore((state) => state.isLoading);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const haptics = useHaptics();

    const filteredChallenges = selectedCategory
        ? activeChallenges.filter((c) => c.category === selectedCategory)
        : activeChallenges;

    const joinedChallengesList = activeChallenges.filter((c) =>
        joinedChallenges.includes(c.id)
    );

    return (
        <View style={styles.container}>
            {showHeader && (
                <>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Challenges</Text>
                        <Text style={styles.headerSubtitle}>
                            {joinedChallenges.length} active challenges
                        </Text>
                    </View>

                    {/* Category filters */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.categoryScroll}
                        contentContainerStyle={styles.categoryScrollContent}
                    >
                        <Pressable
                            onPress={() => {
                                haptics.light();
                                setSelectedCategory(null);
                            }}
                            style={[
                                styles.categoryChip,
                                !selectedCategory && styles.categoryChipActive,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.categoryChipText,
                                    !selectedCategory && styles.categoryChipTextActive,
                                ]}
                            >
                                All
                            </Text>
                        </Pressable>
                        {CHALLENGE_CATEGORIES.map((category) => (
                            <Pressable
                                key={category.id}
                                onPress={() => {
                                    haptics.light();
                                    setSelectedCategory(category.id);
                                }}
                                style={[
                                    styles.categoryChip,
                                    selectedCategory === category.id && styles.categoryChipActive,
                                    selectedCategory === category.id && {
                                        backgroundColor: category.color + '20',
                                        borderColor: category.color,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.categoryChipText,
                                        selectedCategory === category.id &&
                                        styles.categoryChipTextActive,
                                        selectedCategory === category.id && {
                                            color: category.color,
                                        },
                                    ]}
                                >
                                    {category.icon} {category.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </>
            )}

            {/* Loading state */}
            {isLoading && activeChallenges.length === 0 && (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={colors.accent.success} />
                    <Text style={styles.loadingText}>Loading challenges...</Text>
                </View>
            )}

            {/* Your Challenges */}
            {joinedChallengesList.length > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Your Challenges</Text>
                    {joinedChallengesList.map((challenge, index) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            index={index}
                            onPress={() => setSelectedChallenge(challenge)}
                        />
                    ))}
                </Animated.View>
            )}

            {/* All Challenges */}
            {!isLoading && (
                <View style={styles.section}>
                    {joinedChallengesList.length > 0 && (
                        <Text style={styles.sectionTitle}>Discover</Text>
                    )}
                    {filteredChallenges.length === 0 ? (
                        <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🎯</Text>
                            <Text style={styles.emptyTitle}>No challenges found</Text>
                            <Text style={styles.emptySubtitle}>
                                Check back later for new challenges!
                            </Text>
                        </Animated.View>
                    ) : (
                        filteredChallenges.map((challenge, index) => (
                            <ChallengeCard
                                key={challenge.id}
                                challenge={challenge}
                                index={index}
                                onPress={() => setSelectedChallenge(challenge)}
                            />
                        ))
                    )}
                </View>
            )}

            {/* Challenge Detail Modal */}
            <ChallengeDetailModal
                challenge={selectedChallenge}
                onClose={() => setSelectedChallenge(null)}
            />
        </View>
    );
};

interface ChallengeDetailModalProps {
    challenge: Challenge | null;
    onClose: () => void;
}

const ChallengeDetailModal = ({ challenge, onClose }: ChallengeDetailModalProps) => {
    const user = useAuthStore((state) => state.user);
    const { isJoined, joinChallenge, leaveChallenge } = useChallenges();
    const haptics = useHaptics();
    const sound = useSound();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!challenge) return null;

    const joined = isJoined(challenge.id);
    const categoryColor = getCategoryColor(challenge.category);
    const daysLeft = formatDaysLeft(new Date(challenge.endDate));

    const handleJoinToggle = async () => {
        if (!user?.uid || isProcessing) return;

        setIsProcessing(true);
        haptics.medium();

        try {
            if (joined) {
                await leaveChallenge(user.uid, challenge.id);
            } else {
                sound.success();
                await joinChallenge(user.uid, challenge.id, user.displayName || 'User');
            }
            onClose();
        } catch (error) {
            console.error('Error toggling challenge:', error);
            haptics.error();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.springify().damping(15)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.modalContent}
                >
                    <View style={styles.modalHandle} />

                    {/* Challenge header */}
                    <View style={styles.modalHeader}>
                        <View
                            style={[
                                styles.modalIconContainer,
                                { backgroundColor: categoryColor + '20' },
                            ]}
                        >
                            <Text style={styles.modalIcon}>{challenge.icon}</Text>
                        </View>
                        <View style={styles.modalHeaderInfo}>
                            <Text style={styles.modalTitle}>{challenge.title}</Text>
                            <Text style={styles.modalCategory}>
                                {getCategoryIcon(challenge.category)} {challenge.category} • {daysLeft}
                            </Text>
                        </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.modalDescription}>{challenge.description}</Text>

                    {/* Stats */}
                    <View style={styles.modalStats}>
                        <View style={styles.modalStat}>
                            <Text style={styles.modalStatValue}>{challenge.goal}</Text>
                            <Text style={styles.modalStatLabel}>Goal</Text>
                        </View>
                        <View style={styles.modalStatDivider} />
                        <View style={styles.modalStat}>
                            <Text style={styles.modalStatValue}>{challenge.duration}</Text>
                            <Text style={styles.modalStatLabel}>Days</Text>
                        </View>
                        <View style={styles.modalStatDivider} />
                        <View style={styles.modalStat}>
                            <Text style={styles.modalStatValue}>
                                {challenge.participants.length}
                            </Text>
                            <Text style={styles.modalStatLabel}>Joined</Text>
                        </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.modalActions}>
                        <Pressable onPress={onClose} style={styles.modalCancelButton}>
                            <Text style={styles.modalCancelButtonText}>Close</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleJoinToggle}
                            disabled={isProcessing}
                            style={{ flex: 2 }}
                        >
                            {isProcessing ? (
                                <View style={[styles.modalActionButton, { backgroundColor: colors.background.elevated }]}>
                                    <ActivityIndicator size="small" color={colors.accent.success} />
                                </View>
                            ) : (
                                <LinearGradient
                                    colors={
                                        joined
                                            ? [colors.accent.error, '#DC2626']
                                            : [categoryColor, categoryColor + 'DD']
                                    }
                                    style={styles.modalActionButton}
                                >
                                    <Text style={styles.modalActionButtonText}>
                                        {joined ? 'Leave Challenge' : 'Join Challenge'}
                                    </Text>
                                </LinearGradient>
                            )}
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
    },
    headerSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
    },

    // Category scroll
    categoryScroll: {
        marginBottom: spacing.lg,
        marginHorizontal: -spacing.lg,
    },
    categoryScrollContent: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    categoryChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        backgroundColor: colors.background.card,
        borderWidth: 1,
        borderColor: colors.background.elevated,
    },
    categoryChipActive: {
        backgroundColor: colors.accent.success + '20',
        borderColor: colors.accent.success,
    },
    categoryChipText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    categoryChipTextActive: {
        color: colors.accent.success,
    },

    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },

    // Challenge card
    card: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 24,
    },
    categoryBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    categoryText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        textTransform: 'capitalize',
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    description: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: spacing.md,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    statText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginLeft: 4,
    },
    joinButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    joinButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
    joinedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.accent.success + '15',
        gap: spacing.sm,
    },
    joinedButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.accent.success,
    },
    processingButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        backgroundColor: colors.background.elevated,
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
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background.card,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        paddingBottom: spacing['2xl'],
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.muted,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    modalIcon: {
        fontSize: 32,
    },
    modalHeaderInfo: {
        flex: 1,
    },
    modalTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
    },
    modalCategory: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
        textTransform: 'capitalize',
    },
    modalDescription: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    modalStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    modalStat: {
        alignItems: 'center',
    },
    modalStatValue: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['2xl'],
        color: colors.text.primary,
    },
    modalStatLabel: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
    },
    modalStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.background.card,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: colors.background.elevated,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    modalCancelButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.secondary,
    },
    modalActionButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalActionButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
});
