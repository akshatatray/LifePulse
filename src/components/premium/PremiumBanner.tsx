/**
 * PremiumBanner - Promotional banner for premium upgrade
 */

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useHaptics } from '../../hooks/useHaptics';
import { usePremiumStore } from '../../stores/premiumStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface PremiumBannerProps {
    variant?: 'default' | 'compact' | 'trial';
    onPress?: () => void;
}

export const PremiumBanner = ({ variant = 'default', onPress }: PremiumBannerProps) => {
    const navigation = useNavigation<any>();
    const haptics = useHaptics();
    const { isPro, hasUsedTrial, getTrialDaysRemaining, isTrialActive } = usePremiumStore();

    const scale = useSharedValue(1);
    const shimmer = useSharedValue(0);

    // Don't show if already pro (unless trial)
    if (isPro() && !isTrialActive()) return null;

    React.useEffect(() => {
        shimmer.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2000 }),
                withTiming(0, { duration: 2000 })
            ),
            -1,
            false
        );
    }, []);

    const handlePress = () => {
        haptics.medium();
        scale.value = withSequence(
            withSpring(0.95),
            withSpring(1)
        );
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('Premium');
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const shimmerStyle = useAnimatedStyle(() => ({
        opacity: shimmer.value * 0.3,
        transform: [{ translateX: shimmer.value * 200 - 100 }],
    }));

    // Trial active variant
    if (isTrialActive()) {
        const daysRemaining = getTrialDaysRemaining();
        return (
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.trialBanner, animatedStyle]}>
                    <LinearGradient
                        colors={['#F59E0B20', '#F59E0B10']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.trialContent}>
                        <Text style={styles.trialIcon}>⏰</Text>
                        <View style={styles.trialInfo}>
                            <Text style={styles.trialTitle}>
                                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in trial
                            </Text>
                            <Text style={styles.trialSubtitle}>
                                Upgrade now to keep your Pro features
                            </Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={colors.accent.warning} />
                    </View>
                </Animated.View>
            </Pressable>
        );
    }

    // Compact variant
    if (variant === 'compact') {
        return (
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.compactBanner, animatedStyle]}>
                    <LinearGradient
                        colors={[colors.accent.success, '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.compactIcon}>✨</Text>
                    <Text style={styles.compactText}>Upgrade to Pro</Text>
                    <Feather name="chevron-right" size={16} color={colors.text.inverse} />
                </Animated.View>
            </Pressable>
        );
    }

    // Default variant
    return (
        <Pressable onPress={handlePress}>
            <Animated.View style={[styles.banner, animatedStyle]}>
                <LinearGradient
                    colors={['#00FF9D15', '#00FF9D05']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />

                {/* Shimmer effect */}
                <Animated.View style={[styles.shimmer, shimmerStyle]}>
                    <LinearGradient
                        colors={['transparent', '#00FF9D30', 'transparent']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>

                <View style={styles.bannerContent}>
                    <View style={styles.bannerIcon}>
                        <Text style={styles.iconText}>✨</Text>
                    </View>
                    <View style={styles.bannerInfo}>
                        <Text style={styles.bannerTitle}>Unlock Pro Features</Text>
                        <Text style={styles.bannerSubtitle}>
                            {!hasUsedTrial
                                ? 'Try 7 days free • Cancel anytime'
                                : 'Unlimited habits, themes & more'}
                        </Text>
                    </View>
                    <View style={styles.bannerAction}>
                        <LinearGradient
                            colors={[colors.accent.success, '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.actionGradient}
                        >
                            <Text style={styles.actionText}>
                                {!hasUsedTrial ? 'Try Free' : 'Upgrade'}
                            </Text>
                        </LinearGradient>
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    // Default banner
    banner: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.accent.success + '30',
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 100,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    bannerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.accent.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    iconText: {
        fontSize: 22,
    },
    bannerInfo: {
        flex: 1,
    },
    bannerTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    bannerSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
    bannerAction: {
        marginLeft: spacing.sm,
    },
    actionGradient: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    actionText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
    },

    // Compact banner
    compactBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        overflow: 'hidden',
    },
    compactIcon: {
        fontSize: 14,
    },
    compactText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
    },

    // Trial banner
    trialBanner: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.accent.warning + '40',
    },
    trialContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
    },
    trialIcon: {
        fontSize: 24,
        marginRight: spacing.md,
    },
    trialInfo: {
        flex: 1,
    },
    trialTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.accent.warning,
    },
    trialSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
});

