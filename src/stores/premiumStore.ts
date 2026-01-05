/**
 * LifePulse - Premium Store
 * Manages subscription state and feature gating
 * Syncs with Firebase for cross-device persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { FEATURE_LIMITS, isFeatureAvailable, SubscriptionTier } from '../data/premium';
import { premiumService, PremiumData } from '../services/premiumFirestore';

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

    // User context for Firebase sync
    _userId: string | null;
    _isSyncing: boolean;

    // Sync actions
    setUserId: (userId: string | null) => void;
    syncFromFirebase: () => Promise<void>;
    syncToFirebase: () => Promise<void>;
    clearData: () => void;
    loadFromFirebaseData: (data: PremiumData) => void;
    checkSubscriptionValidity: () => Promise<void>;

    // Actions
    setTier: (tier: SubscriptionTier) => void;
    startTrial: () => void;
    endTrial: () => void;
    subscribe: (tier: SubscriptionTier, expiryDate?: string, options?: {
        platform?: 'ios' | 'android';
        productId?: string;
        transactionId?: string;
    }) => void;
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

// Default state values
const DEFAULT_STATE = {
    tier: 'free' as SubscriptionTier,
    isSubscribed: false,
    subscriptionExpiry: null as string | null,
    purchaseDate: null as string | null,
    trialStartDate: null as string | null,
    trialEndDate: null as string | null,
    hasUsedTrial: false,
    habitsCreated: 0,
    _userId: null as string | null,
    _isSyncing: false,
};

export const usePremiumStore = create<PremiumState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_STATE,

            setUserId: (userId: string | null) => {
                set({ _userId: userId });
            },

            clearData: () => {
                console.log('[Premium] Clearing local data');
                set({
                    ...DEFAULT_STATE,
                    _userId: get()._userId, // Preserve userId
                });
            },

            loadFromFirebaseData: (data: PremiumData) => {
                console.log('[Premium] Loading from Firebase data');
                set({
                    tier: data.tier,
                    isSubscribed: data.isSubscribed,
                    subscriptionExpiry: data.subscriptionExpiry,
                    purchaseDate: data.purchaseDate,
                    trialStartDate: data.trialStartDate,
                    trialEndDate: data.trialEndDate,
                    hasUsedTrial: data.hasUsedTrial,
                    habitsCreated: data.habitsCreated,
                });
            },

            syncFromFirebase: async () => {
                const { _userId, _isSyncing } = get();
                if (!_userId || _isSyncing) return;

                set({ _isSyncing: true });

                try {
                    const data = await premiumService.getData(_userId);
                    if (data) {
                        get().loadFromFirebaseData(data);
                        console.log('[Premium] Synced from Firebase');
                    } else {
                        // No data in Firebase, initialize with defaults
                        console.log('[Premium] No Firebase data, initializing...');
                        await premiumService.initializeForNewUser(_userId);
                    }
                } catch (error) {
                    console.error('[Premium] Error syncing from Firebase:', error);
                } finally {
                    set({ _isSyncing: false });
                }
            },

            syncToFirebase: async () => {
                const state = get();
                if (!state._userId || state._isSyncing) return;

                try {
                    await premiumService.saveData(state._userId, {
                        tier: state.tier,
                        isSubscribed: state.isSubscribed,
                        subscriptionExpiry: state.subscriptionExpiry,
                        purchaseDate: state.purchaseDate,
                        trialStartDate: state.trialStartDate,
                        trialEndDate: state.trialEndDate,
                        hasUsedTrial: state.hasUsedTrial,
                        habitsCreated: state.habitsCreated,
                    });
                } catch (error) {
                    console.error('[Premium] Error syncing to Firebase:', error);
                }
            },

            checkSubscriptionValidity: async () => {
                const { _userId } = get();
                if (!_userId) return;

                try {
                    const isValid = await premiumService.checkAndUpdateSubscriptionValidity(_userId);
                    if (!isValid) {
                        // Subscription expired, update local state
                        const data = await premiumService.getData(_userId);
                        if (data) {
                            get().loadFromFirebaseData(data);
                        }
                    }
                } catch (error) {
                    console.error('[Premium] Error checking subscription validity:', error);
                }
            },

            setTier: (tier: SubscriptionTier) => {
                const { _userId } = get();
                set({ tier, isSubscribed: tier !== 'free' });

                // Sync to Firebase
                if (_userId) {
                    premiumService.updateFields(_userId, {
                        tier,
                        isSubscribed: tier !== 'free',
                    }).catch(console.error);
                }
            },

            startTrial: () => {
                const { hasUsedTrial, _userId } = get();
                if (hasUsedTrial) return;

                const now = new Date();
                const trialEnd = new Date(now);
                trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
                const trialEndISO = trialEnd.toISOString();

                set({
                    tier: 'pro',
                    isSubscribed: true,
                    trialStartDate: now.toISOString(),
                    trialEndDate: trialEndISO,
                    hasUsedTrial: true,
                });

                // Sync to Firebase
                if (_userId) {
                    premiumService.startTrial(_userId, trialEndISO).catch(console.error);
                }
            },

            endTrial: () => {
                const { _userId } = get();

                set({
                    tier: 'free',
                    isSubscribed: false,
                    trialStartDate: null,
                    trialEndDate: null,
                });

                // Sync to Firebase
                if (_userId) {
                    premiumService.endTrial(_userId).catch(console.error);
                }
            },

            subscribe: (tier: SubscriptionTier, expiryDate?: string, options?: {
                platform?: 'ios' | 'android';
                productId?: string;
                transactionId?: string;
            }) => {
                const { _userId } = get();
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

                // Sync to Firebase
                if (_userId) {
                    premiumService.subscribe(
                        _userId,
                        tier,
                        tier === 'lifetime' ? null : expiryDate || null,
                        options
                    ).catch(console.error);
                }
            },

            cancelSubscription: () => {
                // Subscription remains active until expiry
                // Just mark that user cancelled
                // The actual downgrade happens when expiry is checked
            },

            incrementHabitsCreated: () => {
                const { _userId } = get();

                set((state) => {
                    const newCount = state.habitsCreated + 1;

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        premiumService.updateHabitsCreated(_userId, newCount).catch(console.error);
                    }

                    return { habitsCreated: newCount };
                });
            },

            decrementHabitsCreated: () => {
                const { _userId } = get();

                set((state) => {
                    const newCount = Math.max(0, state.habitsCreated - 1);

                    // Sync to Firebase (non-blocking)
                    if (_userId) {
                        premiumService.updateHabitsCreated(_userId, newCount).catch(console.error);
                    }

                    return { habitsCreated: newCount };
                });
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
                // Don't persist _userId, _isSyncing - set on login
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
