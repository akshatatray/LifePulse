/**
 * StreakFreeze Component
 * Shows streak freeze inventory and allows using them to protect streaks
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useGamificationStore } from '../../stores/gamificationStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface StreakFreezeCardProps {
    compact?: boolean;
    onPress?: () => void;
}

export const StreakFreezeCard = ({ compact = false, onPress }: StreakFreezeCardProps) => {
    const { streakFreezes } = useGamificationStore();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (compact) {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Animated.View style={[styles.compactCard, animatedStyle]}>
                    <Text style={styles.freezeIcon}>❄️</Text>
                    <Text style={styles.compactCount}>{streakFreezes}</Text>
                </Animated.View>
            </Pressable>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View style={[styles.card, animatedStyle]}>
                <LinearGradient
                    colors={['#60A5FA', '#3B82F6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardGradient}
                />

                <View style={styles.cardContent}>
                    <View style={styles.freezeIconContainer}>
                        <Text style={styles.freezeIconLarge}>❄️</Text>
                    </View>

                    <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle}>Streak Freezes</Text>
                        <Text style={styles.cardDescription}>
                            Protect your streak when you miss a day
                        </Text>
                    </View>

                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{streakFreezes}</Text>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

/**
 * StreakFreezeModal - Modal to confirm using a streak freeze
 */
interface StreakFreezeModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    habitName?: string;
}

export const StreakFreezeModal = ({
    visible,
    onClose,
    onConfirm,
    habitName,
}: StreakFreezeModalProps) => {
    const { streakFreezes, useStreakFreeze } = useGamificationStore();
    const haptics = useHaptics();
    const sound = useSound();
    const [isUsing, setIsUsing] = useState(false);

    const iconRotation = useSharedValue(0);

    const handleUseFreeze = async () => {
        if (streakFreezes <= 0) {
            Alert.alert(
                'No Freezes Available',
                "You don't have any streak freezes. Earn more by completing achievements!",
                [{ text: 'OK' }]
            );
            return;
        }

        setIsUsing(true);
        haptics.medium();

        // Animate the freeze icon
        iconRotation.value = withSequence(
            withTiming(180, { duration: 300 }),
            withTiming(360, { duration: 300 })
        );

        // Use the freeze
        const success = useStreakFreeze();

        if (success) {
            sound.success();
            haptics.success();

            // Wait for animation then close
            setTimeout(() => {
                onConfirm();
                setIsUsing(false);
            }, 700);
        } else {
            setIsUsing(false);
            Alert.alert(
                'Already Used',
                "You've already used a streak freeze today.",
                [{ text: 'OK' }]
            );
        }
    };

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${iconRotation.value}deg` }],
    }));

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <Animated.View
                    entering={SlideInDown.springify().damping(15)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.modalContent}
                >
                    <View style={styles.modalHeader}>
                        <Animated.Text style={[styles.modalIcon, iconStyle]}>❄️</Animated.Text>
                        <Text style={styles.modalTitle}>Use Streak Freeze?</Text>
                    </View>

                    <Text style={styles.modalDescription}>
                        {habitName
                            ? `Protect your streak for "${habitName}" by using a freeze.`
                            : 'Using a streak freeze will protect your streak for today.'}
                    </Text>

                    <View style={styles.modalInfo}>
                        <Feather name="info" size={16} color={colors.text.muted} />
                        <Text style={styles.modalInfoText}>
                            You have {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''} remaining
                        </Text>
                    </View>

                    <View style={styles.modalActions}>
                        <Pressable
                            onPress={onClose}
                            style={[styles.modalButton, styles.cancelButton]}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            onPress={handleUseFreeze}
                            disabled={isUsing || streakFreezes <= 0}
                            style={[
                                styles.modalButton,
                                styles.useButton,
                                (isUsing || streakFreezes <= 0) && styles.disabledButton,
                            ]}
                        >
                            <LinearGradient
                                colors={['#60A5FA', '#3B82F6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.useButtonText}>
                                {isUsing ? 'Using...' : 'Use Freeze'}
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

/**
 * StreakFreezeEarnedToast - Shows when user earns a streak freeze
 */
interface StreakFreezeEarnedToastProps {
    visible: boolean;
    onDismiss: () => void;
}

export const StreakFreezeEarnedToast = ({
    visible,
    onDismiss,
}: StreakFreezeEarnedToastProps) => {
    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(300).delay(100)}
            exiting={FadeOut.duration(200)}
            style={styles.toast}
        >
            <Pressable onPress={onDismiss} style={styles.toastContent}>
                <LinearGradient
                    colors={['#60A5FA20', '#3B82F620']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />

                <Text style={styles.toastIcon}>❄️</Text>
                <View style={styles.toastTextContainer}>
                    <Text style={styles.toastTitle}>Streak Freeze Earned!</Text>
                    <Text style={styles.toastDescription}>Keep up the great work!</Text>
                </View>
                <Feather name="x" size={20} color={colors.text.muted} />
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    // Compact card styles
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent.info + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
    },
    freezeIcon: {
        fontSize: 14,
    },
    compactCount: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.accent.info,
    },

    // Full card styles
    card: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.md,
    },
    cardGradient: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    freezeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accent.info + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    freezeIconLarge: {
        fontSize: 24,
    },
    cardInfo: {
        flex: 1,
    },
    cardTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
    },
    cardDescription: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
    },
    countBadge: {
        backgroundColor: colors.accent.info,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
    },
    countText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.inverse,
    },

    // Modal styles
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
    modalHeader: {
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    modalIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
    },
    modalDescription: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    modalInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        marginBottom: spacing.xl,
        backgroundColor: colors.background.elevated,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    modalInfoText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    cancelButton: {
        backgroundColor: colors.background.elevated,
    },
    cancelButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.secondary,
    },
    useButton: {
        flex: 2,
    },
    useButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
    disabledButton: {
        opacity: 0.5,
    },

    // Toast styles
    toast: {
        position: 'absolute',
        bottom: 100,
        left: spacing.lg,
        right: spacing.lg,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.accent.info + '40',
        overflow: 'hidden',
    },
    toastIcon: {
        fontSize: 28,
        marginRight: spacing.md,
    },
    toastTextContainer: {
        flex: 1,
    },
    toastTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    toastDescription: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
});

