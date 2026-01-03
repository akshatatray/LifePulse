/**
 * LifePulse - Premium Store
 * Manages subscription state and feature gating
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FEATURE_LIMITS, isFeatureAvailable, SubscriptionTier } from '../data/premium';

interface PremiumState {
    // Subscription state
    tier: SubscriptionTier;
    isSubscribed: boolean;
    subscriptionExpiry: string | null; // ISO date string
    purchaseDate: string | null;

    // Trial state
    trialStartDate: string | null;
    trialEndDate: string | null;
    hasUsedTrial: boolean;

    // Feature usage tracking
    habitsCreated: number;

    // Actions
    setTier: (tier: SubscriptionTier) => void;
    startTrial: () => void;
    endTrial: () => void;
    subscribe: (tier: SubscriptionTier, expiryDate?: string) => void;
    cancelSubscription: () => void;
    incrementHabitsCreated: () => void;
    decrementHabitsCreated: () => void;

    // Queries
    isPro: () => boolean;
    isLifetime: () => boolean;
    canCreateHabit: () => boolean;
    canUseFeature: (featureId: string) => boolean;
    getMaxHabits: () => number;
    getMaxReminders: () => number;
    getDaysUntilExpiry: () => number | null;
    isTrialActive: () => boolean;
    getTrialDaysRemaining: () => number;
}

// Trial duration in days
const TRIAL_DURATION_DAYS = 7;

export const usePremiumStore = create<PremiumState>()(
    persist(
        (set, get) => ({
            tier: 'free',
            isSubscribed: false,
            subscriptionExpiry: null,
            purchaseDate: null,
            trialStartDate: null,
            trialEndDate: null,
            hasUsedTrial: false,
            habitsCreated: 0,

            setTier: (tier: SubscriptionTier) => {
                set({ tier, isSubscribed: tier !== 'free' });
            },

            startTrial: () => {
                const { hasUsedTrial } = get();
                if (hasUsedTrial) return;

                const now = new Date();
                const trialEnd = new Date(now);
                trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

                set({
                    tier: 'pro',
                    isSubscribed: true,
                    trialStartDate: now.toISOString(),
                    trialEndDate: trialEnd.toISOString(),
                    hasUsedTrial: true,
                });
            },

            endTrial: () => {
                set({
                    tier: 'free',
                    isSubscribed: false,
                    trialStartDate: null,
                    trialEndDate: null,
                });
            },

            subscribe: (tier: SubscriptionTier, expiryDate?: string) => {
                const purchaseDate = new Date().toISOString();

                set({
                    tier,
                    isSubscribed: true,
                    purchaseDate,
                    subscriptionExpiry: tier === 'lifetime' ? null : expiryDate || null,
                    // Clear trial state when subscribing
                    trialStartDate: null,
                    trialEndDate: null,
                });
            },

            cancelSubscription: () => {
                // Subscription remains active until expiry
                // Just mark that user cancelled
                // The actual downgrade happens when expiry is checked
            },

            incrementHabitsCreated: () => {
                set((state) => ({ habitsCreated: state.habitsCreated + 1 }));
            },

            decrementHabitsCreated: () => {
                set((state) => ({ habitsCreated: Math.max(0, state.habitsCreated - 1) }));
            },

            isPro: () => {
                const { tier, isTrialActive } = get();
                return tier === 'pro' || tier === 'lifetime' || isTrialActive();
            },

            isLifetime: () => {
                const { tier } = get();
                return tier === 'lifetime';
            },

            canCreateHabit: () => {
                const { tier, habitsCreated, isTrialActive } = get();
                const effectiveTier = isTrialActive() ? 'pro' : tier;
                const maxHabits = FEATURE_LIMITS[effectiveTier].maxHabits;
                return habitsCreated < maxHabits;
            },

            canUseFeature: (featureId: string) => {
                const { tier, isTrialActive } = get();
                const effectiveTier = isTrialActive() ? 'pro' : tier;
                return isFeatureAvailable(featureId, effectiveTier);
            },

            getMaxHabits: () => {
                const { tier, isTrialActive } = get();
                const effectiveTier = isTrialActive() ? 'pro' : tier;
                return FEATURE_LIMITS[effectiveTier].maxHabits;
            },

            getMaxReminders: () => {
                const { tier, isTrialActive } = get();
                const effectiveTier = isTrialActive() ? 'pro' : tier;
                return FEATURE_LIMITS[effectiveTier].maxRemindersPerHabit;
            },

            getDaysUntilExpiry: () => {
                const { subscriptionExpiry, tier } = get();
                if (tier === 'lifetime' || tier === 'free') return null;
                if (!subscriptionExpiry) return null;

                const expiry = new Date(subscriptionExpiry);
                const now = new Date();
                const diffTime = expiry.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return diffDays > 0 ? diffDays : 0;
            },

            isTrialActive: () => {
                const { trialEndDate, tier, isSubscribed } = get();
                if (!trialEndDate) return false;
                if (tier !== 'pro' || !isSubscribed) return false;

                const now = new Date();
                const trialEnd = new Date(trialEndDate);
                return now < trialEnd;
            },

            getTrialDaysRemaining: () => {
                const { trialEndDate, isTrialActive } = get();
                if (!isTrialActive() || !trialEndDate) return 0;

                const now = new Date();
                const trialEnd = new Date(trialEndDate);
                const diffTime = trialEnd.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return diffDays > 0 ? diffDays : 0;
            },
        }),
        {
            name: 'lifepulse-premium',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                tier: state.tier,
                isSubscribed: state.isSubscribed,
                subscriptionExpiry: state.subscriptionExpiry,
                purchaseDate: state.purchaseDate,
                trialStartDate: state.trialStartDate,
                trialEndDate: state.trialEndDate,
                hasUsedTrial: state.hasUsedTrial,
                habitsCreated: state.habitsCreated,
            }),
        }
    )
);

// Hook for checking if user can access a feature
export const useFeatureGate = (featureId: string) => {
    const canUse = usePremiumStore((state) => state.canUseFeature(featureId));
    const tier = usePremiumStore((state) => state.tier);
    return { canUse, tier, isLocked: !canUse };
};

// Hook for habit limit
export const useHabitLimit = () => {
    const canCreate = usePremiumStore((state) => state.canCreateHabit());
    const maxHabits = usePremiumStore((state) => state.getMaxHabits());
    const habitsCreated = usePremiumStore((state) => state.habitsCreated);
    const isPro = usePremiumStore((state) => state.isPro());

    return {
        canCreate,
        maxHabits,
        habitsCreated,
        remaining: Math.max(0, maxHabits - habitsCreated),
        isUnlimited: isPro,
    };
};

