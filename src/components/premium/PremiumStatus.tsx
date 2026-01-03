/**
 * PremiumStatus - Shows current subscription status in profile
 */

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
} from 'react-native-reanimated';
import { getPlanById } from '../../data/premium';
import { useHaptics } from '../../hooks/useHaptics';
import { usePremiumStore } from '../../stores/premiumStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

export const PremiumStatus = () => {
    const navigation = useNavigation<any>();
    const haptics = useHaptics();
    const {
        tier,
        isPro,
        isLifetime,
        isTrialActive,
        getTrialDaysRemaining,
        getDaysUntilExpiry,
    } = usePremiumStore();

    const scale = useSharedValue(1);

    const handlePress = () => {
        haptics.medium();
        scale.value = withSequence(withSpring(0.95), withSpring(1));
        navigation.navigate('Premium');
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const plan = getPlanById(tier);
    const trialDays = getTrialDaysRemaining();
    const expiryDays = getDaysUntilExpiry();

    // Free user
    if (tier === 'free' && !isTrialActive()) {
        return (
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.container, animatedStyle]}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🌱</Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.title}>Free Plan</Text>
                        <Text style={styles.subtitle}>
                            Upgrade to unlock all features
                        </Text>
                    </View>
                    <View style={styles.action}>
                        <LinearGradient
                            colors={[colors.accent.success, '#059669']}
                            style={styles.upgradeButton}
                        >
                            <Text style={styles.upgradeText}>Upgrade</Text>
                        </LinearGradient>
                    </View>
                </Animated.View>
            </Pressable>
        );
    }

    // Trial active
    if (isTrialActive()) {
        return (
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.container, styles.trialContainer, animatedStyle]}>
                    <LinearGradient
                        colors={['#F59E0B20', '#F59E0B10']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>⏳</Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.title}>Pro Trial</Text>
                        <Text style={[styles.subtitle, { color: colors.accent.warning }]}>
                            {trialDays} day{trialDays !== 1 ? 's' : ''} remaining
                        </Text>
                    </View>
                    <View style={styles.action}>
                        <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            style={styles.upgradeButton}
                        >
                            <Text style={styles.upgradeText}>Subscribe</Text>
                        </LinearGradient>
                    </View>
                </Animated.View>
            </Pressable>
        );
    }

    // Lifetime
    if (isLifetime()) {
        return (
            <Pressable onPress={handlePress}>
                <Animated.View style={[styles.container, styles.lifetimeContainer, animatedStyle]}>
                    <LinearGradient
                        colors={['#F59E0B20', '#F59E0B10']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>💎</Text>
                    </View>
                    <View style={styles.info}>
                        <Text style={styles.title}>Lifetime Member</Text>
                        <Text style={[styles.subtitle, { color: colors.accent.warning }]}>
                            Forever access to all features
                        </Text>
                    </View>
                    <Feather name="check-circle" size={24} color={colors.accent.warning} />
                </Animated.View>
            </Pressable>
        );
    }

    // Pro subscriber
    return (
        <Pressable onPress={handlePress}>
            <Animated.View style={[styles.container, styles.proContainer, animatedStyle]}>
                <LinearGradient
                    colors={['#00FF9D20', '#00FF9D10']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>⭐</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>Pro Member</Text>
                    <Text style={[styles.subtitle, { color: colors.accent.success }]}>
                        {expiryDays !== null
                            ? `Renews in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}`
                            : 'Active subscription'}
                    </Text>
                </View>
                <Feather name="check-circle" size={24} color={colors.accent.success} />
            </Animated.View>
        </Pressable>
    );
};

/**
 * Compact version for headers/nav
 */
export const PremiumStatusBadge = () => {
    const navigation = useNavigation<any>();
    const haptics = useHaptics();
    const { tier, isPro, isTrialActive, getTrialDaysRemaining } = usePremiumStore();

    const handlePress = () => {
        haptics.light();
        navigation.navigate('Premium');
    };

    if (isPro() || isTrialActive()) {
        const trialDays = getTrialDaysRemaining();
        return (
            <Pressable onPress={handlePress}>
                <LinearGradient
                    colors={
                        isTrialActive()
                            ? ['#F59E0B', '#D97706']
                            : tier === 'lifetime'
                                ? ['#F59E0B', '#D97706']
                                : [colors.accent.success, '#059669']
                    }
                    style={styles.badge}
                >
                    <Text style={styles.badgeText}>
                        {isTrialActive()
                            ? `Trial: ${trialDays}d`
                            : tier === 'lifetime'
                                ? '💎 LIFETIME'
                                : '⭐ PRO'}
                    </Text>
                </LinearGradient>
            </Pressable>
        );
    }

    return (
        <Pressable onPress={handlePress} style={styles.freeBadge}>
            <Text style={styles.freeBadgeText}>Upgrade</Text>
            <Feather name="chevron-right" size={14} color={colors.accent.success} />
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    proContainer: {
        borderWidth: 1,
        borderColor: colors.accent.success + '30',
        overflow: 'hidden',
    },
    lifetimeContainer: {
        borderWidth: 1,
        borderColor: colors.accent.warning + '30',
        overflow: 'hidden',
    },
    trialContainer: {
        borderWidth: 1,
        borderColor: colors.accent.warning + '40',
        overflow: 'hidden',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    icon: {
        fontSize: 22,
    },
    info: {
        flex: 1,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
    },
    action: {},
    upgradeButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    upgradeText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
    },

    // Badge styles
    badge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    badgeText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xs,
        color: colors.text.inverse,
    },
    freeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    freeBadgeText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.accent.success,
    },
});

