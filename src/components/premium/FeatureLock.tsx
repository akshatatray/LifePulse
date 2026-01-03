/**
 * FeatureLock - Component to show locked premium features
 */

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    SlideInDown,
    SlideOutDown
} from 'react-native-reanimated';
import { PREMIUM_FEATURES, UPGRADE_BENEFITS } from '../../data/premium';
import { useHaptics } from '../../hooks/useHaptics';
import { usePremiumStore } from '../../stores/premiumStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface FeatureLockProps {
    featureId: string;
    children: React.ReactNode;
    showOverlay?: boolean;
    message?: string;
}

/**
 * Wraps a feature and shows a lock overlay if not available
 */
export const FeatureLock = ({
    featureId,
    children,
    showOverlay = true,
    message,
}: FeatureLockProps) => {
    const navigation = useNavigation<any>();
    const haptics = useHaptics();
    const { canUseFeature, isPro } = usePremiumStore();

    const isUnlocked = canUseFeature(featureId);
    const feature = PREMIUM_FEATURES.find((f) => f.id === featureId);

    const handleUnlock = () => {
        haptics.medium();
        navigation.navigate('Premium');
    };

    if (isUnlocked) {
        return <>{children}</>;
    }

    if (!showOverlay) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Blurred/faded children */}
            <View style={styles.lockedContent} pointerEvents="none">
                {children}
            </View>

            {/* Lock overlay */}
            <Pressable onPress={handleUnlock} style={styles.overlay}>
                <View style={styles.lockBadge}>
                    <Feather name="lock" size={16} color={colors.accent.success} />
                    <Text style={styles.lockText}>Pro Feature</Text>
                </View>
                {message && <Text style={styles.lockMessage}>{message}</Text>}
                {feature && !message && (
                    <Text style={styles.lockMessage}>{feature.name}</Text>
                )}
                <Text style={styles.tapText}>Tap to unlock</Text>
            </Pressable>
        </View>
    );
};

/**
 * Simple lock icon badge for inline use
 */
interface ProBadgeProps {
    size?: 'small' | 'medium';
    onPress?: () => void;
}

export const ProBadge = ({ size = 'small', onPress }: ProBadgeProps) => {
    const navigation = useNavigation<any>();
    const haptics = useHaptics();

    const handlePress = () => {
        haptics.light();
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('Premium');
        }
    };

    const isSmall = size === 'small';

    return (
        <Pressable onPress={handlePress}>
            <LinearGradient
                colors={[colors.accent.success, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                    styles.proBadge,
                    isSmall ? styles.proBadgeSmall : styles.proBadgeMedium,
                ]}
            >
                <Text style={[styles.proBadgeText, isSmall && styles.proBadgeTextSmall]}>
                    PRO
                </Text>
            </LinearGradient>
        </Pressable>
    );
};

/**
 * Upgrade prompt modal
 */
interface UpgradePromptProps {
    visible: boolean;
    onClose: () => void;
    featureId?: string;
    title?: string;
    message?: string;
}

export const UpgradePrompt = ({
    visible,
    onClose,
    featureId,
    title,
    message,
}: UpgradePromptProps) => {
    const navigation = useNavigation<any>();
    const haptics = useHaptics();
    const { hasUsedTrial, startTrial } = usePremiumStore();

    const feature = featureId
        ? PREMIUM_FEATURES.find((f) => f.id === featureId)
        : null;

    const handleUpgrade = () => {
        haptics.medium();
        onClose();
        navigation.navigate('Premium');
    };

    const handleStartTrial = () => {
        haptics.medium();
        startTrial();
        onClose();
    };

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
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View style={styles.modalIconContainer}>
                            <LinearGradient
                                colors={[colors.accent.success + '20', colors.accent.success + '10']}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.modalIcon}>
                                {feature?.icon || '✨'}
                            </Text>
                        </View>
                        <Text style={styles.modalTitle}>
                            {title || `Unlock ${feature?.name || 'This Feature'}`}
                        </Text>
                        <Text style={styles.modalMessage}>
                            {message ||
                                feature?.description ||
                                'Upgrade to Pro to access this feature and many more!'}
                        </Text>
                    </View>

                    {/* Benefits */}
                    <View style={styles.benefitsList}>
                        {UPGRADE_BENEFITS.slice(0, 3).map((benefit, index) => (
                            <View key={index} style={styles.benefitItem}>
                                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                                <Text style={styles.benefitText}>{benefit.text}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        {!hasUsedTrial && (
                            <Pressable onPress={handleStartTrial} style={styles.trialButton}>
                                <Text style={styles.trialButtonText}>
                                    Start 7-Day Free Trial
                                </Text>
                            </Pressable>
                        )}

                        <Pressable onPress={handleUpgrade}>
                            <LinearGradient
                                colors={[colors.accent.success, '#059669']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.upgradeButton}
                            >
                                <Text style={styles.upgradeButtonText}>
                                    {hasUsedTrial ? 'Upgrade to Pro' : 'See All Plans'}
                                </Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable onPress={onClose} style={styles.laterButton}>
                            <Text style={styles.laterButtonText}>Maybe Later</Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

/**
 * Hook for showing upgrade prompt
 */
export const useUpgradePrompt = () => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [promptConfig, setPromptConfig] = React.useState<{
        featureId?: string;
        title?: string;
        message?: string;
    }>({});

    const showUpgradePrompt = (config?: {
        featureId?: string;
        title?: string;
        message?: string;
    }) => {
        setPromptConfig(config || {});
        setIsVisible(true);
    };

    const hideUpgradePrompt = () => {
        setIsVisible(false);
    };

    const UpgradePromptComponent = () => (
        <UpgradePrompt
            visible={isVisible}
            onClose={hideUpgradePrompt}
            {...promptConfig}
        />
    );

    return {
        showUpgradePrompt,
        hideUpgradePrompt,
        UpgradePrompt: UpgradePromptComponent,
        isVisible,
    };
};

const styles = StyleSheet.create({
    // Feature Lock
    container: {
        position: 'relative',
    },
    lockedContent: {
        opacity: 0.3,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.background.primary + 'CC',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: borderRadius.lg,
    },
    lockBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent.success + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    lockText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.accent.success,
    },
    lockMessage: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    tapText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
    },

    // Pro Badge
    proBadge: {
        borderRadius: borderRadius.sm,
    },
    proBadgeSmall: {
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
    },
    proBadgeMedium: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
    },
    proBadgeText: {
        fontFamily: fontFamily.bold,
        color: colors.text.inverse,
    },
    proBadgeTextSmall: {
        fontSize: 9,
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
    modalHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modalIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    modalIcon: {
        fontSize: 36,
    },
    modalTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    modalMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    benefitsList: {
        marginBottom: spacing.xl,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    benefitIcon: {
        fontSize: 20,
    },
    benefitText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        flex: 1,
    },
    modalActions: {
        gap: spacing.md,
    },
    trialButton: {
        backgroundColor: colors.accent.success + '20',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    trialButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.accent.success,
    },
    upgradeButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    upgradeButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
    laterButton: {
        paddingVertical: spacing.sm,
        alignItems: 'center',
    },
    laterButtonText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
});

