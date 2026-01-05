/**
 * Premium Firestore Service
 * Handles syncing subscription/membership data with Firebase
 */

import firestore from '@react-native-firebase/firestore';
import { SubscriptionTier } from '../data/premium';

// Retry helper with exponential backoff for transient errors
const withRetry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 500
): Promise<T> => {
    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            // Only retry on transient errors (unavailable, deadline-exceeded)
            const isTransient = error?.code === 'firestore/unavailable' ||
                error?.code === 'firestore/deadline-exceeded' ||
                error?.message?.includes('unavailable');

            if (!isTransient || attempt === maxRetries - 1) {
                throw error;
            }

            // Exponential backoff: 500ms, 1000ms, 2000ms
            const delay = baseDelay * Math.pow(2, attempt);
            console.log(`[Premium] Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

// Premium data structure in Firestore
export interface PremiumData {
    tier: SubscriptionTier;
    isSubscribed: boolean;
    subscriptionExpiry: string | null; // ISO date string
    purchaseDate: string | null;
    trialStartDate: string | null;
    trialEndDate: string | null;
    hasUsedTrial: boolean;
    habitsCreated: number;
    // Metadata
    lastUpdated: Date;
    platform?: 'ios' | 'android'; // Where subscription was purchased
    productId?: string; // RevenueCat/App Store product ID
    transactionId?: string; // For receipt validation
}

// Default premium data for new users
const DEFAULT_PREMIUM: Omit<PremiumData, 'lastUpdated'> = {
    tier: 'free',
    isSubscribed: false,
    subscriptionExpiry: null,
    purchaseDate: null,
    trialStartDate: null,
    trialEndDate: null,
    hasUsedTrial: false,
    habitsCreated: 0,
};

// Helper to get user document reference
const getUserRef = (userId: string) =>
    firestore().collection('users').doc(userId);

// Helper to get premium subcollection document
const getUserPremiumRef = (userId: string) =>
    firestore().collection('users').doc(userId).collection('subscription').doc('data');

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
};

/**
 * Premium Firestore Service
 */
export const premiumService = {
    /**
     * Get premium/subscription data for a user
     */
    async getData(userId: string): Promise<PremiumData | null> {
        try {
            console.log('[Premium] Fetching subscription data for user:', userId);
            const doc = await withRetry(() => getUserPremiumRef(userId).get());

            if (!doc.exists) {
                console.log('[Premium] No existing subscription data, returning null');
                return null;
            }

            const data = doc.data();
            if (!data) return null;

            const premiumData: PremiumData = {
                tier: data.tier || 'free',
                isSubscribed: data.isSubscribed || false,
                subscriptionExpiry: data.subscriptionExpiry || null,
                purchaseDate: data.purchaseDate || null,
                trialStartDate: data.trialStartDate || null,
                trialEndDate: data.trialEndDate || null,
                hasUsedTrial: data.hasUsedTrial || false,
                habitsCreated: data.habitsCreated || 0,
                lastUpdated: toDate(data.lastUpdated),
                platform: data.platform,
                productId: data.productId,
                transactionId: data.transactionId,
            };

            console.log('[Premium] Loaded subscription data:', {
                tier: premiumData.tier,
                isSubscribed: premiumData.isSubscribed,
                expiry: premiumData.subscriptionExpiry,
            });

            return premiumData;
        } catch (error) {
            console.error('[Premium] Error fetching subscription data:', error);
            return null;
        }
    },

    /**
     * Save premium data (full sync)
     */
    async saveData(userId: string, data: Omit<PremiumData, 'lastUpdated'>): Promise<void> {
        try {
            console.log('[Premium] Saving subscription data for user:', userId, {
                tier: data.tier,
                isSubscribed: data.isSubscribed,
            });

            const batch = firestore().batch();

            // Save to subscription subcollection
            const premiumRef = getUserPremiumRef(userId);
            batch.set(premiumRef, {
                ...data,
                lastUpdated: firestore.Timestamp.now(),
            });

            // Also update user document with subscription status (for queries/display)
            const userRef = getUserRef(userId);
            batch.set(userRef, {
                subscriptionTier: data.tier,
                isSubscribed: data.isSubscribed,
                subscriptionExpiry: data.subscriptionExpiry,
            }, { merge: true });

            await batch.commit();
            console.log('[Premium] Subscription data saved successfully');
        } catch (error) {
            console.error('[Premium] Error saving subscription data:', error);
            throw error;
        }
    },

    /**
     * Update specific fields (partial update)
     */
    async updateFields(userId: string, fields: Partial<Omit<PremiumData, 'lastUpdated'>>): Promise<void> {
        try {
            console.log('[Premium] Updating fields:', Object.keys(fields));

            const batch = firestore().batch();

            const premiumRef = getUserPremiumRef(userId);
            batch.set(premiumRef, {
                ...fields,
                lastUpdated: firestore.Timestamp.now(),
            }, { merge: true });

            // Update user document if tier or subscription status changed
            const userUpdate: any = {};
            if (fields.tier !== undefined) {
                userUpdate.subscriptionTier = fields.tier;
            }
            if (fields.isSubscribed !== undefined) {
                userUpdate.isSubscribed = fields.isSubscribed;
            }
            if (fields.subscriptionExpiry !== undefined) {
                userUpdate.subscriptionExpiry = fields.subscriptionExpiry;
            }

            if (Object.keys(userUpdate).length > 0) {
                const userRef = getUserRef(userId);
                batch.set(userRef, userUpdate, { merge: true });
            }

            await batch.commit();
        } catch (error) {
            console.error('[Premium] Error updating fields:', error);
            // Don't throw - allow offline operation
        }
    },

    /**
     * Start a trial
     */
    async startTrial(userId: string, trialEndDate: string): Promise<void> {
        try {
            await this.updateFields(userId, {
                tier: 'pro',
                isSubscribed: true,
                trialStartDate: new Date().toISOString(),
                trialEndDate,
                hasUsedTrial: true,
            });
            console.log('[Premium] Trial started, ends:', trialEndDate);
        } catch (error) {
            console.error('[Premium] Error starting trial:', error);
        }
    },

    /**
     * End a trial
     */
    async endTrial(userId: string): Promise<void> {
        try {
            await this.updateFields(userId, {
                tier: 'free',
                isSubscribed: false,
                trialStartDate: null,
                trialEndDate: null,
            });
            console.log('[Premium] Trial ended');
        } catch (error) {
            console.error('[Premium] Error ending trial:', error);
        }
    },

    /**
     * Subscribe user
     */
    async subscribe(
        userId: string,
        tier: SubscriptionTier,
        expiryDate: string | null,
        options?: {
            platform?: 'ios' | 'android';
            productId?: string;
            transactionId?: string;
        }
    ): Promise<void> {
        try {
            await this.updateFields(userId, {
                tier,
                isSubscribed: true,
                purchaseDate: new Date().toISOString(),
                subscriptionExpiry: tier === 'lifetime' ? null : expiryDate,
                // Clear trial state
                trialStartDate: null,
                trialEndDate: null,
                // Optional metadata
                platform: options?.platform,
                productId: options?.productId,
                transactionId: options?.transactionId,
            });
            console.log('[Premium] Subscription activated:', tier);
        } catch (error) {
            console.error('[Premium] Error subscribing:', error);
            throw error;
        }
    },

    /**
     * Cancel/expire subscription
     */
    async expireSubscription(userId: string): Promise<void> {
        try {
            await this.updateFields(userId, {
                tier: 'free',
                isSubscribed: false,
            });
            console.log('[Premium] Subscription expired');
        } catch (error) {
            console.error('[Premium] Error expiring subscription:', error);
        }
    },

    /**
     * Update habits created count
     */
    async updateHabitsCreated(userId: string, count: number): Promise<void> {
        try {
            await getUserPremiumRef(userId).set({
                habitsCreated: count,
                lastUpdated: firestore.Timestamp.now(),
            }, { merge: true });
        } catch (error) {
            console.error('[Premium] Error updating habits count:', error);
        }
    },

    /**
     * Initialize premium data for a new user
     */
    async initializeForNewUser(userId: string): Promise<PremiumData> {
        try {
            const initialData = {
                ...DEFAULT_PREMIUM,
                lastUpdated: new Date(),
            };

            await this.saveData(userId, DEFAULT_PREMIUM);
            return initialData;
        } catch (error) {
            console.error('[Premium] Error initializing for new user:', error);
            return { ...DEFAULT_PREMIUM, lastUpdated: new Date() };
        }
    },

    /**
     * Check subscription validity (should be called periodically)
     * Returns true if subscription is still valid, false if expired
     */
    async checkAndUpdateSubscriptionValidity(userId: string): Promise<boolean> {
        try {
            const data = await this.getData(userId);
            if (!data) return false;

            // Lifetime never expires
            if (data.tier === 'lifetime') return true;

            // Free tier - nothing to check
            if (data.tier === 'free' || !data.isSubscribed) return false;

            // Check trial expiry
            if (data.trialEndDate) {
                const trialEnd = new Date(data.trialEndDate);
                if (new Date() > trialEnd) {
                    console.log('[Premium] Trial expired, downgrading...');
                    await this.endTrial(userId);
                    return false;
                }
                return true;
            }

            // Check subscription expiry
            if (data.subscriptionExpiry) {
                const expiry = new Date(data.subscriptionExpiry);
                if (new Date() > expiry) {
                    console.log('[Premium] Subscription expired, downgrading...');
                    await this.expireSubscription(userId);
                    return false;
                }
            }

            return data.isSubscribed;
        } catch (error) {
            console.error('[Premium] Error checking subscription validity:', error);
            return false;
        }
    },
};

