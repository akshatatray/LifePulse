/**
 * LevelProgress Component
 * Shows user's current level and XP progress with beautiful animations
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Extrapolation,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useGamificationStore } from '../../stores/gamificationStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface LevelProgressProps {
    showDetails?: boolean;
    compact?: boolean;
    onPress?: () => void;
}

// Level titles based on level number
const getLevelTitle = (level: number): string => {
    if (level >= 50) return 'Legend';
    if (level >= 40) return 'Master';
    if (level >= 30) return 'Expert';
    if (level >= 20) return 'Adept';
    if (level >= 15) return 'Skilled';
    if (level >= 10) return 'Apprentice';
    if (level >= 5) return 'Novice';
    return 'Beginner';
};

// Level colors based on level tier
const getLevelColor = (level: number): [string, string] => {
    if (level >= 50) return ['#F59E0B', '#D97706']; // Gold
    if (level >= 40) return ['#8B5CF6', '#7C3AED']; // Purple
    if (level >= 30) return ['#EC4899', '#DB2777']; // Pink
    if (level >= 20) return ['#3B82F6', '#2563EB']; // Blue
    if (level >= 10) return ['#10B981', '#059669']; // Green
    return ['#6B7280', '#4B5563']; // Gray
};

export const LevelProgress = ({
    showDetails = true,
    compact = false,
    onPress,
}: LevelProgressProps) => {
    const { totalPoints, level, getProgress } = useGamificationStore();
    const progress = getProgress();

    const progressWidth = useSharedValue(0);
    const shine = useSharedValue(0);
    const levelScale = useSharedValue(1);

    const levelColor = getLevelColor(level);
    const levelTitle = getLevelTitle(level);

    useEffect(() => {
        progressWidth.value = withSpring(progress.percentage, {
            damping: 15,
            stiffness: 100,
        });

        // Subtle shine animation
        shine.value = withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(0, { duration: 1000 })
        );
    }, [progress.percentage]);

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${progressWidth.value}%`,
    }));

    const shineStyle = useAnimatedStyle(() => ({
        opacity: shine.value * 0.3,
        transform: [
            {
                translateX: interpolate(
                    shine.value,
                    [0, 1],
                    [-100, 200],
                    Extrapolation.CLAMP
                ),
            },
        ],
    }));

    const handlePress = () => {
        levelScale.value = withSequence(
            withSpring(1.1),
            withSpring(1)
        );
        onPress?.();
    };

    const levelStyle = useAnimatedStyle(() => ({
        transform: [{ scale: levelScale.value }],
    }));

    if (compact) {
        return (
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.compactContainer, levelStyle]}>
                    <LinearGradient
                        colors={levelColor}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.compactLevelBadge}
                    >
                        <Text style={styles.compactLevelNumber}>{level}</Text>
                    </LinearGradient>
                    <View style={styles.compactProgress}>
                        <View style={styles.compactProgressBar}>
                            <Animated.View style={[styles.compactProgressFill, progressBarStyle]}>
                                <LinearGradient
                                    colors={levelColor}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={StyleSheet.absoluteFill}
                                />
                            </Animated.View>
                        </View>
                    </View>
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <Pressable onPress={handlePress}>
            <View style={styles.container}>
                {/* Level Badge */}
                <Animated.View style={levelStyle}>
                    <View style={styles.levelBadgeContainer}>
                        <LinearGradient
                            colors={levelColor}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.levelBadge}
                        >
                            <Text style={styles.levelNumber}>{level}</Text>
                        </LinearGradient>
                        <View style={styles.levelRing} />
                    </View>
                </Animated.View>

                {/* Info Section */}
                {showDetails && (
                    <View style={styles.infoSection}>
                        <View style={styles.levelInfo}>
                            <Text style={styles.levelTitle}>{levelTitle}</Text>
                            <Text style={styles.totalPoints}>{totalPoints.toLocaleString()} XP</Text>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <Animated.View style={[styles.progressFill, progressBarStyle]}>
                                    <LinearGradient
                                        colors={levelColor}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={StyleSheet.absoluteFill}
                                    />
                                    {/* Shine effect */}
                                    <Animated.View style={[styles.progressShine, shineStyle]} />
                                </Animated.View>
                            </View>

                            <View style={styles.progressLabels}>
                                <Text style={styles.progressText}>
                                    {progress.currentXP} / {progress.nextLevelXP} XP
                                </Text>
                                <Text style={[styles.progressText, { color: levelColor[0] }]}>
                                    Level {level + 1}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        </Pressable>
    );
};

/**
 * LevelUpAnimation - Shows when user levels up
 */
interface LevelUpAnimationProps {
    visible: boolean;
    newLevel: number;
    onDismiss: () => void;
}

export const LevelUpAnimation = ({
    visible,
    newLevel,
    onDismiss,
}: LevelUpAnimationProps) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);
    const starScale = useSharedValue(0);

    const levelColor = getLevelColor(newLevel);
    const levelTitle = getLevelTitle(newLevel);

    useEffect(() => {
        if (visible) {
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSequence(
                withSpring(1.3, { damping: 8 }),
                withSpring(1, { damping: 10 })
            );
            starScale.value = withSequence(
                withTiming(0, { duration: 0 }),
                withTiming(1.5, { duration: 400 }),
                withTiming(1, { duration: 200 })
            );
        } else {
            scale.value = withTiming(0, { duration: 200 });
            opacity.value = withTiming(0, { duration: 200 });
        }
    }, [visible]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const starStyle = useAnimatedStyle(() => ({
        transform: [{ scale: starScale.value }],
        opacity: starScale.value,
    }));

    if (!visible) return null;

    return (
        <Animated.View style={[styles.levelUpOverlay, containerStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

            <View style={styles.levelUpContent}>
                {/* Stars */}
                <Animated.Text style={[styles.starLeft, starStyle]}>⭐</Animated.Text>
                <Animated.Text style={[styles.starRight, starStyle]}>⭐</Animated.Text>

                {/* Level Badge */}
                <Animated.View style={badgeStyle}>
                    <View style={styles.levelUpBadgeContainer}>
                        <LinearGradient
                            colors={levelColor}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.levelUpBadge}
                        >
                            <Text style={styles.levelUpNumber}>{newLevel}</Text>
                        </LinearGradient>
                    </View>
                </Animated.View>

                <Text style={styles.levelUpTitle}>Level Up!</Text>
                <Text style={[styles.levelUpSubtitle, { color: levelColor[0] }]}>
                    {levelTitle}
                </Text>
                <Text style={styles.levelUpDescription}>
                    Keep crushing your habits to reach new heights!
                </Text>

                <Pressable onPress={onDismiss} style={styles.levelUpButton}>
                    <LinearGradient
                        colors={levelColor}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.levelUpButtonText}>Continue</Text>
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    // Compact styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    compactLevelBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactLevelNumber: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
    },
    compactProgress: {
        flex: 1,
        maxWidth: 80,
    },
    compactProgressBar: {
        height: 4,
        backgroundColor: colors.background.elevated,
        borderRadius: 2,
        overflow: 'hidden',
    },
    compactProgressFill: {
        height: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },

    // Full styles
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
    },
    levelBadgeContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    levelBadge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelRing: {
        position: 'absolute',
        top: -3,
        left: -3,
        right: -3,
        bottom: -3,
        borderRadius: 32,
        borderWidth: 2,
        borderColor: colors.border.subtle,
    },
    levelNumber: {
        fontFamily: fontFamily.extraBold,
        fontSize: fontSize['2xl'],
        color: colors.text.inverse,
    },
    infoSection: {
        flex: 1,
    },
    levelInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    levelTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
    },
    totalPoints: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    progressContainer: {},
    progressBar: {
        height: 8,
        backgroundColor: colors.background.elevated,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressShine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    progressText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.text.muted,
    },

    // Level up animation styles
    levelUpOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    levelUpContent: {
        alignItems: 'center',
        padding: spacing.xl,
    },
    starLeft: {
        position: 'absolute',
        top: 0,
        left: 40,
        fontSize: 32,
    },
    starRight: {
        position: 'absolute',
        top: 0,
        right: 40,
        fontSize: 32,
    },
    levelUpBadgeContainer: {
        marginBottom: spacing.xl,
    },
    levelUpBadge: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    levelUpNumber: {
        fontFamily: fontFamily.extraBold,
        fontSize: 42,
        color: colors.text.inverse,
    },
    levelUpTitle: {
        fontFamily: fontFamily.extraBold,
        fontSize: fontSize['3xl'],
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    levelUpSubtitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        marginBottom: spacing.md,
    },
    levelUpDescription: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        maxWidth: 260,
    },
    levelUpButton: {
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
    },
    levelUpButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
});

