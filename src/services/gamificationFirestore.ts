/**
 * Gamification Firestore Service
 * Handles syncing gamification data (XP, badges, stats) with Firebase
 */

import firestore from '@react-native-firebase/firestore';
import { UnlockedBadge } from '../stores/gamificationStore';

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
            console.log(`[Gamification] Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
};

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    GAMIFICATION: 'gamification',
} as const;

// Gamification data structure in Firestore
export interface GamificationData {
    totalPoints: number;
    level: number;
    unlockedBadges: UnlockedBadge[];
    streakFreezes: number;
    lastStreakFreezeUsed: string | null;
    perfectDays: number;
    consecutivePerfectDays: number;
    earlyBirdCount: number;
    nightOwlCount: number;
    comebackCount: number;
    updatedAt: Date;
}

// Default gamification data for new users
const DEFAULT_GAMIFICATION: Omit<GamificationData, 'updatedAt'> = {
    totalPoints: 0,
    level: 1,
    unlockedBadges: [],
    streakFreezes: 1,
    lastStreakFreezeUsed: null,
    perfectDays: 0,
    consecutivePerfectDays: 0,
    earlyBirdCount: 0,
    nightOwlCount: 0,
    comebackCount: 0,
};

// Helper to get user's gamification document reference
const getUserGamificationRef = (userId: string) =>
    firestore().collection(COLLECTIONS.USERS).doc(userId).collection(COLLECTIONS.GAMIFICATION).doc('data');

// Helper to get user document reference (for leaderboard fields)
const getUserRef = (userId: string) =>
    firestore().collection(COLLECTIONS.USERS).doc(userId);

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
};

/**
 * Gamification Firestore Service
 */
export const gamificationService = {
    /**
     * Get gamification data for a user
     */
    async getData(userId: string): Promise<GamificationData | null> {
        try {
            console.log('[Gamification] Fetching data for user:', userId);
            const doc = await withRetry(() => getUserGamificationRef(userId).get());

            if (!doc.exists) {
                console.log('[Gamification] No existing data, returning defaults');
                return null;
            }

            const data = doc.data();
            if (!data) return null;

            // Convert timestamps and ensure correct types
            const gamificationData: GamificationData = {
                totalPoints: data.totalPoints || 0,
                level: data.level || 1,
                unlockedBadges: (data.unlockedBadges || []).map((badge: any) => ({
                    ...badge,
                    unlockedAt: toDate(badge.unlockedAt),
                })),
                streakFreezes: data.streakFreezes ?? 1,
                lastStreakFreezeUsed: data.lastStreakFreezeUsed || null,
                perfectDays: data.perfectDays || 0,
                consecutivePerfectDays: data.consecutivePerfectDays || 0,
                earlyBirdCount: data.earlyBirdCount || 0,
                nightOwlCount: data.nightOwlCount || 0,
                comebackCount: data.comebackCount || 0,
                updatedAt: toDate(data.updatedAt),
            };

            console.log('[Gamification] Loaded data:', {
                points: gamificationData.totalPoints,
                level: gamificationData.level,
                badges: gamificationData.unlockedBadges.length,
            });

            return gamificationData;
        } catch (error) {
            console.error('[Gamification] Error fetching data:', error);
            return null;
        }
    },

    /**
     * Save gamification data (full sync)
     */
    async saveData(userId: string, data: Omit<GamificationData, 'updatedAt'>): Promise<void> {
        try {
            console.log('[Gamification] Saving data for user:', userId, {
                points: data.totalPoints,
                level: data.level,
                badges: data.unlockedBadges.length,
            });

            // Prepare badge data with Firestore timestamps
            const badgesForFirestore = data.unlockedBadges.map((badge) => ({
                ...badge,
                unlockedAt: badge.unlockedAt instanceof Date
                    ? firestore.Timestamp.fromDate(badge.unlockedAt)
                    : firestore.Timestamp.fromDate(new Date(badge.unlockedAt)),
            }));

            await getUserGamificationRef(userId).set({
                ...data,
                unlockedBadges: badgesForFirestore,
                updatedAt: firestore.Timestamp.now(),
            });

            // Also update the user document with key gamification stats (for leaderboard/social)
            await getUserRef(userId).set({
                gamificationPoints: data.totalPoints,
                level: data.level,
                streakFreezes: data.streakFreezes,
            }, { merge: true });

            console.log('[Gamification] Data saved successfully');
        } catch (error) {
            console.error('[Gamification] Error saving data:', error);
            throw error;
        }
    },

    /**
     * Update specific fields (partial update)
     */
    async updateFields(userId: string, fields: Partial<Omit<GamificationData, 'updatedAt'>>): Promise<void> {
        try {
            console.log('[Gamification] Updating fields:', Object.keys(fields));

            const updateData: any = {
                ...fields,
                updatedAt: firestore.Timestamp.now(),
            };

            // Convert badge dates if present
            if (fields.unlockedBadges) {
                updateData.unlockedBadges = fields.unlockedBadges.map((badge) => ({
                    ...badge,
                    unlockedAt: badge.unlockedAt instanceof Date
                        ? firestore.Timestamp.fromDate(badge.unlockedAt)
                        : firestore.Timestamp.fromDate(new Date(badge.unlockedAt)),
                }));
            }

            await getUserGamificationRef(userId).set(updateData, { merge: true });

            // Update user document if points or level changed
            const userUpdate: any = {};
            if (fields.totalPoints !== undefined) {
                userUpdate.gamificationPoints = fields.totalPoints;
            }
            if (fields.level !== undefined) {
                userUpdate.level = fields.level;
            }
            if (fields.streakFreezes !== undefined) {
                userUpdate.streakFreezes = fields.streakFreezes;
            }

            if (Object.keys(userUpdate).length > 0) {
                await getUserRef(userId).set(userUpdate, { merge: true });
            }
        } catch (error) {
            console.error('[Gamification] Error updating fields:', error);
            // Don't throw - allow offline operation
        }
    },

    /**
     * Add points and update leaderboard
     */
    async addPoints(userId: string, points: number, displayName: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Update gamification points atomically
            const gamificationRef = getUserGamificationRef(userId);
            batch.set(gamificationRef, {
                totalPoints: firestore.FieldValue.increment(points),
                updatedAt: firestore.Timestamp.now(),
            }, { merge: true });

            // Update user document
            const userRef = getUserRef(userId);
            batch.set(userRef, {
                gamificationPoints: firestore.FieldValue.increment(points),
            }, { merge: true });

            // Update leaderboard entries
            const timeFrames: ('week' | 'month' | 'allTime')[] = ['week', 'month', 'allTime'];
            for (const timeFrame of timeFrames) {
                const leaderboardRef = firestore()
                    .collection('leaderboard')
                    .doc(timeFrame)
                    .collection('entries')
                    .doc(userId);

                batch.set(leaderboardRef, {
                    displayName,
                    score: firestore.FieldValue.increment(points),
                    updatedAt: firestore.Timestamp.now(),
                }, { merge: true });
            }

            await batch.commit();
            console.log('[Gamification] Added points and updated leaderboard:', points);
        } catch (error) {
            console.error('[Gamification] Error adding points:', error);
            // Don't throw - allow offline operation
        }
    },

    /**
     * Unlock a badge and sync
     */
    async unlockBadge(userId: string, badge: UnlockedBadge): Promise<void> {
        try {
            await getUserGamificationRef(userId).set({
                unlockedBadges: firestore.FieldValue.arrayUnion({
                    ...badge,
                    unlockedAt: firestore.Timestamp.fromDate(
                        badge.unlockedAt instanceof Date
                            ? badge.unlockedAt
                            : new Date(badge.unlockedAt)
                    ),
                }),
                updatedAt: firestore.Timestamp.now(),
            }, { merge: true });

            console.log('[Gamification] Badge unlocked:', badge.badgeId);
        } catch (error) {
            console.error('[Gamification] Error unlocking badge:', error);
            // Don't throw - allow offline operation
        }
    },

    /**
     * Use a streak freeze
     */
    async useStreakFreeze(userId: string, newCount: number, date: string): Promise<void> {
        try {
            const batch = firestore().batch();

            const gamificationRef = getUserGamificationRef(userId);
            batch.set(gamificationRef, {
                streakFreezes: newCount,
                lastStreakFreezeUsed: date,
                updatedAt: firestore.Timestamp.now(),
            }, { merge: true });

            const userRef = getUserRef(userId);
            batch.set(userRef, {
                streakFreezes: newCount,
            }, { merge: true });

            await batch.commit();
            console.log('[Gamification] Streak freeze used');
        } catch (error) {
            console.error('[Gamification] Error using streak freeze:', error);
        }
    },

    /**
     * Initialize gamification data for a new user
     */
    async initializeForNewUser(userId: string): Promise<GamificationData> {
        try {
            const initialData = {
                ...DEFAULT_GAMIFICATION,
                updatedAt: new Date(),
            };

            await this.saveData(userId, DEFAULT_GAMIFICATION);
            return initialData;
        } catch (error) {
            console.error('[Gamification] Error initializing for new user:', error);
            return { ...DEFAULT_GAMIFICATION, updatedAt: new Date() };
        }
    },
};

