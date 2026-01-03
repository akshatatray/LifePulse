/**
 * PremiumScreen - Beautiful paywall with subscription options
 */

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    SUBSCRIPTION_PLANS,
    SubscriptionTier,
    UPGRADE_BENEFITS,
    getPlanById,
} from '../../data/premium';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { usePremiumStore } from '../../stores/premiumStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PlanCardProps {
    plan: typeof SUBSCRIPTION_PLANS[0];
    isSelected: boolean;
    onSelect: () => void;
}

const PlanCard = ({ plan, isSelected, onSelect }: PlanCardProps) => {
    const scale = useSharedValue(1);
    const haptics = useHaptics();

    const handlePressIn = () => {
        scale.value = withSpring(0.97);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        haptics.medium();
        onSelect();
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const borderStyle = useAnimatedStyle(() => ({
        borderColor: isSelected ? plan.color : colors.border.default,
        borderWidth: isSelected ? 2 : 1,
    }));

    return (
        <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View
                style={[
                    styles.planCard,
                    animatedStyle,
                    borderStyle,
                    plan.highlighted && styles.highlightedCard,
                ]}
            >
                {/* Badge */}
                {plan.badge && (
                    <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
                        <Text style={styles.planBadgeText}>{plan.badge}</Text>
                    </View>
                )}

                {/* Selection indicator */}
                <View style={styles.planHeader}>
                    <View
                        style={[
                            styles.radioOuter,
                            isSelected && { borderColor: plan.color },
                        ]}
                    >
                        {isSelected && (
                            <View style={[styles.radioInner, { backgroundColor: plan.color }]} />
                        )}
                    </View>

                    <View style={styles.planInfo}>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planTagline}>{plan.tagline}</Text>
                    </View>

                    <View style={styles.planPricing}>
                        <Text style={[styles.planPrice, { color: plan.color }]}>
                            {plan.price}
                        </Text>
                        {plan.period && (
                            <Text style={styles.planPeriod}>/{plan.period}</Text>
                        )}
                    </View>
                </View>

                {/* Price subtext */}
                {plan.priceSubtext && (
                    <Text style={styles.priceSubtext}>{plan.priceSubtext}</Text>
                )}

                {/* Features preview */}
                {isSelected && (
                    <Animated.View
                        entering={FadeInDown.duration(200)}
                        style={styles.featuresPreview}
                    >
                        {plan.features.slice(0, 4).map((feature, index) => (
                            <View key={index} style={styles.featureRow}>
                                <Feather name="check" size={14} color={plan.color} />
                                <Text style={styles.featureText}>{feature}</Text>
                            </View>
                        ))}
                        {plan.features.length > 4 && (
                            <Text style={styles.moreFeatures}>
                                +{plan.features.length - 4} more features
                            </Text>
                        )}
                    </Animated.View>
                )}
            </Animated.View>
        </Pressable>
    );
};

export default function PremiumScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const haptics = useHaptics();
    const sound = useSound();
    const { tier: currentTier, subscribe, startTrial, hasUsedTrial, isTrialActive } = usePremiumStore();

    const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('pro');
    const [isLoading, setIsLoading] = useState(false);

    const handleClose = () => {
        haptics.light();
        navigation.goBack();
    };

    const handleSelectPlan = (planId: SubscriptionTier) => {
        setSelectedPlan(planId);
    };

    const handleSubscribe = async () => {
        setIsLoading(true);
        haptics.medium();

        // Simulate purchase flow (RevenueCat integration would go here)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // For now, just set the subscription
        subscribe(selectedPlan);
        sound.success();
        haptics.success();

        setIsLoading(false);
        navigation.goBack();
    };

    const handleStartTrial = () => {
        haptics.medium();
        startTrial();
        sound.success();
        navigation.goBack();
    };

    const handleRestorePurchases = async () => {
        haptics.light();
        setIsLoading(true);

        // Simulate restore (RevenueCat integration would go here)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsLoading(false);
        // Show appropriate feedback
    };

    const selectedPlanData = getPlanById(selectedPlan);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header gradient */}
            <LinearGradient
                colors={['#00FF9D15', 'transparent']}
                style={styles.headerGradient}
            />

            {/* Close button */}
            <Pressable onPress={handleClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.text.secondary} />
            </Pressable>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero section */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.hero}>
                    <Text style={styles.heroEmoji}>✨</Text>
                    <Text style={styles.heroTitle}>Unlock Your</Text>
                    <Text style={styles.heroTitleAccent}>Full Potential</Text>
                    <Text style={styles.heroSubtitle}>
                        Take your habits to the next level with LifePulse Pro
                    </Text>
                </Animated.View>

                {/* Benefits carousel */}
                <Animated.View
                    entering={FadeInUp.delay(200).duration(400)}
                    style={styles.benefitsContainer}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.benefitsScroll}
                    >
                        {UPGRADE_BENEFITS.map((benefit, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInUp.delay(300 + index * 50).duration(300)}
                                style={styles.benefitCard}
                            >
                                <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                                <Text style={styles.benefitText}>{benefit.text}</Text>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </Animated.View>

                {/* Trial banner */}
                {!hasUsedTrial && !isTrialActive() && (
                    <Animated.View
                        entering={FadeInDown.delay(400).duration(300)}
                        style={styles.trialBanner}
                    >
                        <LinearGradient
                            colors={['#00FF9D20', '#00FF9D10']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.trialContent}>
                            <View>
                                <Text style={styles.trialTitle}>
                                    🎁 Try Pro Free for 7 Days
                                </Text>
                                <Text style={styles.trialSubtitle}>
                                    No credit card required • Cancel anytime
                                </Text>
                            </View>
                            <Pressable onPress={handleStartTrial} style={styles.trialButton}>
                                <Text style={styles.trialButtonText}>Start Trial</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                )}

                {/* Plan cards */}
                <Animated.View
                    entering={FadeInDown.delay(500).duration(400)}
                    style={styles.plansSection}
                >
                    <Text style={styles.sectionTitle}>Choose Your Plan</Text>

                    {SUBSCRIPTION_PLANS.filter((p) => p.id !== 'free').map((plan, index) => (
                        <Animated.View
                            key={plan.id}
                            entering={FadeInDown.delay(600 + index * 100).duration(300)}
                        >
                            <PlanCard
                                plan={plan}
                                isSelected={selectedPlan === plan.id}
                                onSelect={() => handleSelectPlan(plan.id as SubscriptionTier)}
                            />
                        </Animated.View>
                    ))}
                </Animated.View>

                {/* Features comparison link */}
                <Pressable style={styles.compareLink}>
                    <Text style={styles.compareLinkText}>Compare all features</Text>
                    <Feather name="chevron-right" size={16} color={colors.accent.success} />
                </Pressable>

                {/* Footer info */}
                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>
                        • Subscription auto-renews unless cancelled
                    </Text>
                    <Text style={styles.footerText}>
                        • Payment will be charged to your Apple ID account
                    </Text>
                    <Text style={styles.footerText}>
                        • Manage subscriptions in your Account Settings
                    </Text>
                </View>

                {/* Links */}
                <View style={styles.linksRow}>
                    <Pressable>
                        <Text style={styles.linkText}>Terms of Use</Text>
                    </Pressable>
                    <Text style={styles.linkDivider}>•</Text>
                    <Pressable>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                    </Pressable>
                    <Text style={styles.linkDivider}>•</Text>
                    <Pressable onPress={handleRestorePurchases}>
                        <Text style={styles.linkText}>Restore Purchases</Text>
                    </Pressable>
                </View>

                <View style={{ height: 120 }} />
            </ScrollView>

            {/* CTA Button - Fixed at bottom */}
            <Animated.View
                entering={FadeInUp.delay(800).duration(300)}
                style={[styles.ctaContainer, { paddingBottom: insets.bottom + spacing.md }]}
            >
                <LinearGradient
                    colors={[selectedPlanData?.color || colors.accent.success, colors.accent.success]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                >
                    <Pressable
                        onPress={handleSubscribe}
                        disabled={isLoading}
                        style={styles.ctaButton}
                    >
                        {isLoading ? (
                            <Text style={styles.ctaText}>Processing...</Text>
                        ) : (
                            <>
                                <Text style={styles.ctaText}>
                                    {selectedPlan === 'lifetime'
                                        ? 'Get Lifetime Access'
                                        : `Continue with ${selectedPlanData?.name}`}
                                </Text>
                                <Text style={styles.ctaPrice}>
                                    {selectedPlanData?.price}
                                    {selectedPlanData?.period ? `/${selectedPlanData.period}` : ''}
                                </Text>
                            </>
                        )}
                    </Pressable>
                </LinearGradient>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: SCREEN_HEIGHT * 0.4,
    },
    closeButton: {
        position: 'absolute',
        top: 60,
        right: spacing.lg,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing['2xl'],
    },

    // Hero
    hero: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    heroEmoji: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    heroTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['3xl'],
        color: colors.text.primary,
        textAlign: 'center',
    },
    heroTitleAccent: {
        fontFamily: fontFamily.extraBold,
        fontSize: fontSize['3xl'],
        color: colors.accent.success,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginTop: spacing.sm,
        maxWidth: 280,
    },

    // Benefits
    benefitsContainer: {
        marginBottom: spacing.xl,
        marginHorizontal: -spacing.lg,
    },
    benefitsScroll: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    benefitCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        width: 140,
        alignItems: 'center',
    },
    benefitIcon: {
        fontSize: 24,
        marginBottom: spacing.xs,
    },
    benefitText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.text.secondary,
        textAlign: 'center',
    },

    // Trial banner
    trialBanner: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.accent.success + '30',
    },
    trialContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
    },
    trialTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    trialSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
    trialButton: {
        backgroundColor: colors.accent.success,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.full,
    },
    trialButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
    },

    // Plans section
    plansSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },

    // Plan card
    planCard: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        marginBottom: spacing.md,
        position: 'relative',
        overflow: 'hidden',
    },
    highlightedCard: {
        backgroundColor: colors.background.elevated,
    },
    planBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderBottomLeftRadius: borderRadius.md,
    },
    planBadgeText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xs,
        color: colors.background.primary,
    },
    planHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: colors.border.default,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
    },
    planTagline: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
    planPricing: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    planPrice: {
        fontFamily: fontFamily.extraBold,
        fontSize: fontSize['2xl'],
    },
    planPeriod: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    priceSubtext: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: spacing.xs,
        marginLeft: 38,
    },
    featuresPreview: {
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
        gap: spacing.sm,
    },
    featureText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },
    moreFeatures: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.accent.success,
        marginTop: spacing.xs,
    },

    // Compare link
    compareLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    compareLinkText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.accent.success,
    },

    // Footer
    footerInfo: {
        marginBottom: spacing.lg,
    },
    footerText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginBottom: spacing.xs,
    },
    linksRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    linkText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.accent.info,
    },
    linkDivider: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginHorizontal: spacing.sm,
    },

    // CTA
    ctaContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        backgroundColor: colors.background.primary,
        borderTopWidth: 1,
        borderTopColor: colors.border.subtle,
    },
    ctaGradient: {
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    ctaButton: {
        paddingVertical: spacing.lg,
        alignItems: 'center',
    },
    ctaText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.inverse,
    },
    ctaPrice: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.inverse,
        opacity: 0.9,
        marginTop: 2,
    },
});

