/**
 * Social Firestore Service
 * Handles all Firestore operations for social features (friends, activity, challenges, leaderboard)
 */

import firestore from '@react-native-firebase/firestore';
import {
    ActivityItem,
    Challenge,
    Friend,
    LeaderboardEntry
} from '../data/social';

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    FRIENDS: 'friends',
    FRIEND_REQUESTS: 'friendRequests',
    SENT_REQUESTS: 'sentFriendRequests',
    ACTIVITY: 'activity',
    CHALLENGES: 'challenges',
    CHALLENGE_PARTICIPANTS: 'participants',
    LEADERBOARD: 'leaderboard',
    ACTIVITY_LIKES: 'activityLikes',
} as const;

// Helper to convert Firestore timestamp to Date
const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
};

// Helper to convert Date to Firestore Timestamp
const toTimestamp = (date: Date | string | null | undefined) => {
    if (!date) return firestore.Timestamp.now();
    if (date instanceof Date) return firestore.Timestamp.fromDate(date);
    return firestore.Timestamp.fromDate(new Date(date));
};

// Get user's friends collection
const getUserFriendsRef = (userId: string) =>
    firestore().collection(COLLECTIONS.USERS).doc(userId).collection(COLLECTIONS.FRIENDS);

// Get user's friend requests collection (incoming)
const getUserFriendRequestsRef = (userId: string) =>
    firestore().collection(COLLECTIONS.USERS).doc(userId).collection(COLLECTIONS.FRIEND_REQUESTS);

// Get user's sent friend requests collection (outgoing)
const getUserSentRequestsRef = (userId: string) =>
    firestore().collection(COLLECTIONS.USERS).doc(userId).collection(COLLECTIONS.SENT_REQUESTS);

// Get global activity feed
const getActivityRef = () =>
    firestore().collection(COLLECTIONS.ACTIVITY);

// Get challenges collection
const getChallengesRef = () =>
    firestore().collection(COLLECTIONS.CHALLENGES);

// Get leaderboard collection
const getLeaderboardRef = (timeFrame: 'week' | 'month' | 'allTime') =>
    firestore().collection(COLLECTIONS.LEADERBOARD).doc(timeFrame).collection('entries');

/**
 * Friend Operations
 */
export const friendService = {
    /**
     * Get all friends for a user
     */
    async getFriends(userId: string): Promise<Friend[]> {
        try {
            const snapshot = await getUserFriendsRef(userId)
                .where('status', '==', 'accepted')
                .get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                addedAt: toDate(doc.data().addedAt),
                lastActive: doc.data().lastActive ? toDate(doc.data().lastActive) : undefined,
            })) as Friend[];
        } catch (error) {
            console.error('Error fetching friends:', error);
            return [];
        }
    },

    /**
     * Get pending friend requests (incoming)
     */
    async getPendingRequests(userId: string): Promise<Friend[]> {
        try {
            const snapshot = await getUserFriendRequestsRef(userId).get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                addedAt: toDate(doc.data().addedAt),
            })) as Friend[];
        } catch (error) {
            console.error('Error fetching friend requests:', error);
            return [];
        }
    },

    /**
     * Get sent friend requests (outgoing)
     */
    async getSentRequests(userId: string): Promise<Friend[]> {
        try {
            const snapshot = await getUserSentRequestsRef(userId).get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                addedAt: toDate(doc.data().addedAt),
            })) as Friend[];
        } catch (error) {
            console.error('Error fetching sent requests:', error);
            return [];
        }
    },

    /**
     * Send a friend request
     */
    async sendFriendRequest(
        fromUserId: string,
        toUserId: string,
        fromUserName: string,
        toUserName: string = 'User'
    ): Promise<void> {
        try {
            const batch = firestore().batch();
            const now = firestore.Timestamp.now();

            // Create request in recipient's collection (incoming request)
            const incomingRequestData = {
                userId: fromUserId,
                displayName: fromUserName,
                currentStreak: 0,
                totalCompletions: 0,
                level: 1,
                status: 'pending',
                addedAt: now,
            };
            const incomingRef = getUserFriendRequestsRef(toUserId).doc(fromUserId);
            batch.set(incomingRef, incomingRequestData);

            // Create request in sender's collection (outgoing/sent request)
            const outgoingRequestData = {
                userId: toUserId,
                displayName: toUserName,
                currentStreak: 0,
                totalCompletions: 0,
                level: 1,
                status: 'pending',
                addedAt: now,
            };
            const outgoingRef = getUserSentRequestsRef(fromUserId).doc(toUserId);
            batch.set(outgoingRef, outgoingRequestData);

            await batch.commit();
        } catch (error) {
            console.error('Error sending friend request:', error);
            throw error;
        }
    },

    /**
     * Cancel a sent friend request
     */
    async cancelFriendRequest(userId: string, targetUserId: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Remove from sender's sent requests
            const sentRef = getUserSentRequestsRef(userId).doc(targetUserId);
            batch.delete(sentRef);

            // Remove from recipient's incoming requests
            const incomingRef = getUserFriendRequestsRef(targetUserId).doc(userId);
            batch.delete(incomingRef);

            await batch.commit();
        } catch (error) {
            console.error('Error canceling friend request:', error);
            throw error;
        }
    },

    /**
     * Accept a friend request
     */
    async acceptFriendRequest(
        userId: string,
        friendId: string,
        friendData: Partial<Friend>
    ): Promise<void> {
        try {
            const batch = firestore().batch();

            // Add to friends list (both ways)
            const friendDoc = getUserFriendsRef(userId).doc(friendId);
            batch.set(friendDoc, {
                ...friendData,
                status: 'accepted',
                addedAt: firestore.Timestamp.now(),
            });

            // Add current user to friend's list
            const userSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .get();
            const userData = userSnapshot.data();

            const reverseDoc = getUserFriendsRef(friendId).doc(userId);
            batch.set(reverseDoc, {
                userId: userId,
                displayName: userData?.displayName || 'User',
                currentStreak: 0,
                totalCompletions: 0,
                level: 1,
                status: 'accepted',
                addedAt: firestore.Timestamp.now(),
            });

            // Delete the incoming friend request
            const requestDoc = getUserFriendRequestsRef(userId).doc(friendId);
            batch.delete(requestDoc);

            // Delete the sender's sent request
            const sentRequestDoc = getUserSentRequestsRef(friendId).doc(userId);
            batch.delete(sentRequestDoc);

            await batch.commit();
        } catch (error) {
            console.error('Error accepting friend request:', error);
            throw error;
        }
    },

    /**
     * Decline a friend request
     */
    async declineFriendRequest(userId: string, friendId: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Delete the incoming request
            const requestDoc = getUserFriendRequestsRef(userId).doc(friendId);
            batch.delete(requestDoc);

            // Delete the sender's sent request
            const sentRequestDoc = getUserSentRequestsRef(friendId).doc(userId);
            batch.delete(sentRequestDoc);

            await batch.commit();
        } catch (error) {
            console.error('Error declining friend request:', error);
            throw error;
        }
    },

    /**
     * Remove a friend
     */
    async removeFriend(userId: string, friendId: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Remove from both users' friend lists
            batch.delete(getUserFriendsRef(userId).doc(friendId));
            batch.delete(getUserFriendsRef(friendId).doc(userId));

            await batch.commit();
        } catch (error) {
            console.error('Error removing friend:', error);
            throw error;
        }
    },

    /**
     * Search users by display name or email
     */
    async searchUsers(query: string, currentUserId: string): Promise<Friend[]> {
        try {
            const queryLower = query.toLowerCase().trim();
            const results: Map<string, Friend> = new Map();

            console.log('[Search] Searching for:', queryLower, 'currentUser:', currentUserId);

            // Helper to map document to Friend
            const mapDocToFriend = (doc: any): Friend => ({
                id: doc.id,
                userId: doc.id,
                displayName: doc.data().displayName || doc.data().email?.split('@')[0] || 'User',
                photoURL: doc.data().photoURL,
                currentStreak: doc.data().currentStreak || 0,
                totalCompletions: doc.data().totalCompletions || 0,
                level: doc.data().level || 1,
                status: 'pending' as const,
                addedAt: new Date(),
            });

            // Search by display name (case insensitive partial match)
            try {
                const displayNameSnapshot = await firestore()
                    .collection(COLLECTIONS.USERS)
                    .where('displayNameLower', '>=', queryLower)
                    .where('displayNameLower', '<=', queryLower + '\uf8ff')
                    .limit(10)
                    .get();

                console.log('[Search] Display name results:', displayNameSnapshot.docs.length);
                displayNameSnapshot.docs.forEach((doc) => {
                    if (doc.id !== currentUserId) {
                        results.set(doc.id, mapDocToFriend(doc));
                    }
                });
            } catch (e) {
                console.log('[Search] Display name search failed:', e);
            }

            // Search by email prefix (case insensitive)
            try {
                const emailSnapshot = await firestore()
                    .collection(COLLECTIONS.USERS)
                    .where('email', '>=', queryLower)
                    .where('email', '<=', queryLower + '\uf8ff')
                    .limit(10)
                    .get();

                console.log('[Search] Email prefix results:', emailSnapshot.docs.length);
                emailSnapshot.docs.forEach((doc) => {
                    if (doc.id !== currentUserId && !results.has(doc.id)) {
                        results.set(doc.id, mapDocToFriend(doc));
                    }
                });
            } catch (e) {
                console.log('[Search] Email search failed:', e);
            }

            // Also try exact email match (for full email addresses)
            if (query.includes('@')) {
                try {
                    const exactEmailSnapshot = await firestore()
                        .collection(COLLECTIONS.USERS)
                        .where('email', '==', query.trim().toLowerCase())
                        .limit(1)
                        .get();

                    console.log('[Search] Exact email results:', exactEmailSnapshot.docs.length);
                    exactEmailSnapshot.docs.forEach((doc) => {
                        if (doc.id !== currentUserId && !results.has(doc.id)) {
                            results.set(doc.id, mapDocToFriend(doc));
                        }
                    });
                } catch (e) {
                    console.log('[Search] Exact email search failed:', e);
                }
            }

            // Fallback: If no results and query is short, try getting all users and filter client-side
            // This handles cases where documents might have missing fields
            if (results.size === 0 && queryLower.length >= 2) {
                try {
                    console.log('[Search] Trying fallback search...');
                    const allUsersSnapshot = await firestore()
                        .collection(COLLECTIONS.USERS)
                        .limit(50)
                        .get();

                    console.log('[Search] Total users in DB:', allUsersSnapshot.docs.length);
                    allUsersSnapshot.docs.forEach((doc) => {
                        if (doc.id === currentUserId) return;

                        const data = doc.data();
                        const email = (data.email || '').toLowerCase();
                        const displayName = (data.displayName || '').toLowerCase();
                        const displayNameLower = (data.displayNameLower || '').toLowerCase();

                        // Check if query matches email or display name
                        if (
                            email.includes(queryLower) ||
                            displayName.includes(queryLower) ||
                            displayNameLower.includes(queryLower)
                        ) {
                            console.log('[Search] Fallback found:', email, displayName);
                            results.set(doc.id, mapDocToFriend(doc));
                        }
                    });
                } catch (e) {
                    console.log('[Search] Fallback search failed:', e);
                }
            }

            console.log('[Search] Total results:', results.size);
            return Array.from(results.values());
        } catch (error) {
            console.error('Error searching users:', error);
            return [];
        }
    },
};

/**
 * Activity Feed Operations
 */
export const activityService = {
    /**
     * Get activity feed for a user (from friends)
     */
    async getFeed(userId: string, friendIds: string[]): Promise<ActivityItem[]> {
        try {
            if (friendIds.length === 0) return [];

            // Firestore 'in' query is limited to 10 items
            const chunks = [];
            for (let i = 0; i < friendIds.length; i += 10) {
                chunks.push(friendIds.slice(i, i + 10));
            }

            const allActivities: ActivityItem[] = [];

            for (const chunk of chunks) {
                const snapshot = await getActivityRef()
                    .where('userId', 'in', chunk)
                    .orderBy('timestamp', 'desc')
                    .limit(20)
                    .get();

                const activities = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: toDate(doc.data().timestamp),
                    hasLiked: false, // Will be updated below
                })) as ActivityItem[];

                allActivities.push(...activities);
            }

            // Check which activities the user has liked
            const likedSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.ACTIVITY_LIKES)
                .get();

            const likedIds = new Set(likedSnapshot.docs.map((doc) => doc.id));

            return allActivities
                .map((activity) => ({
                    ...activity,
                    hasLiked: likedIds.has(activity.id),
                }))
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 50);
        } catch (error) {
            console.error('Error fetching activity feed:', error);
            return [];
        }
    },

    /**
     * Post an activity (for the current user's achievements)
     */
    async postActivity(activity: Omit<ActivityItem, 'id' | 'likes' | 'hasLiked'>): Promise<void> {
        try {
            await getActivityRef().add({
                ...activity,
                timestamp: toTimestamp(activity.timestamp),
                likes: 0,
            });
        } catch (error) {
            console.error('Error posting activity:', error);
            throw error;
        }
    },

    /**
     * Like an activity
     */
    async likeActivity(userId: string, activityId: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Add to user's liked activities
            const likeRef = firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.ACTIVITY_LIKES)
                .doc(activityId);
            batch.set(likeRef, { likedAt: firestore.Timestamp.now() });

            // Increment likes count on the activity
            const activityRef = getActivityRef().doc(activityId);
            batch.update(activityRef, {
                likes: firestore.FieldValue.increment(1),
            });

            await batch.commit();
        } catch (error) {
            console.error('Error liking activity:', error);
            throw error;
        }
    },

    /**
     * Unlike an activity
     */
    async unlikeActivity(userId: string, activityId: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Remove from user's liked activities
            const likeRef = firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.ACTIVITY_LIKES)
                .doc(activityId);
            batch.delete(likeRef);

            // Decrement likes count on the activity
            const activityRef = getActivityRef().doc(activityId);
            batch.update(activityRef, {
                likes: firestore.FieldValue.increment(-1),
            });

            await batch.commit();
        } catch (error) {
            console.error('Error unliking activity:', error);
            throw error;
        }
    },
};

/**
 * Challenge Operations
 */
export const challengeService = {
    /**
     * Get all public challenges
     */
    async getChallenges(): Promise<Challenge[]> {
        try {
            const now = firestore.Timestamp.now();
            const snapshot = await getChallengesRef()
                .where('isPublic', '==', true)
                .where('endDate', '>', now)
                .orderBy('endDate', 'asc')
                .get();

            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                startDate: toDate(doc.data().startDate),
                endDate: toDate(doc.data().endDate),
                participants: doc.data().participants || [],
            })) as Challenge[];
        } catch (error) {
            console.error('Error fetching challenges:', error);
            return [];
        }
    },

    /**
     * Get challenges a user has joined
     */
    async getJoinedChallenges(userId: string): Promise<string[]> {
        try {
            const snapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection('joinedChallenges')
                .get();

            return snapshot.docs.map((doc) => doc.id);
        } catch (error) {
            console.error('Error fetching joined challenges:', error);
            return [];
        }
    },

    /**
     * Join a challenge
     */
    async joinChallenge(
        userId: string,
        challengeId: string,
        displayName: string
    ): Promise<void> {
        try {
            const batch = firestore().batch();

            // Add user to challenge participants
            const participantRef = getChallengesRef()
                .doc(challengeId)
                .collection(COLLECTIONS.CHALLENGE_PARTICIPANTS)
                .doc(userId);

            batch.set(participantRef, {
                userId,
                displayName,
                progress: 0,
                rank: 0,
                joinedAt: firestore.Timestamp.now(),
            });

            // Add challenge to user's joined challenges
            const userChallengeRef = firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection('joinedChallenges')
                .doc(challengeId);

            batch.set(userChallengeRef, { joinedAt: firestore.Timestamp.now() });

            await batch.commit();
        } catch (error) {
            console.error('Error joining challenge:', error);
            throw error;
        }
    },

    /**
     * Leave a challenge
     */
    async leaveChallenge(userId: string, challengeId: string): Promise<void> {
        try {
            const batch = firestore().batch();

            // Remove user from challenge participants
            const participantRef = getChallengesRef()
                .doc(challengeId)
                .collection(COLLECTIONS.CHALLENGE_PARTICIPANTS)
                .doc(userId);
            batch.delete(participantRef);

            // Remove challenge from user's joined challenges
            const userChallengeRef = firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection('joinedChallenges')
                .doc(challengeId);
            batch.delete(userChallengeRef);

            await batch.commit();
        } catch (error) {
            console.error('Error leaving challenge:', error);
            throw error;
        }
    },

    /**
     * Update challenge progress
     */
    async updateProgress(
        userId: string,
        challengeId: string,
        progress: number
    ): Promise<void> {
        try {
            await getChallengesRef()
                .doc(challengeId)
                .collection(COLLECTIONS.CHALLENGE_PARTICIPANTS)
                .doc(userId)
                .update({ progress });
        } catch (error) {
            console.error('Error updating challenge progress:', error);
            throw error;
        }
    },
};

/**
 * Leaderboard Operations
 */
export const leaderboardService = {
    /**
     * Get leaderboard entries
     */
    async getLeaderboard(
        userId: string,
        timeFrame: 'week' | 'month' | 'allTime'
    ): Promise<LeaderboardEntry[]> {
        try {
            const snapshot = await getLeaderboardRef(timeFrame)
                .orderBy('score', 'desc')
                .limit(50)
                .get();

            return snapshot.docs.map((doc, index) => ({
                rank: index + 1,
                userId: doc.id,
                ...doc.data(),
                isCurrentUser: doc.id === userId,
            })) as LeaderboardEntry[];
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    },

    /**
     * Update user's score on leaderboard
     */
    async updateScore(
        userId: string,
        displayName: string,
        score: number,
        photoURL?: string
    ): Promise<void> {
        try {
            const batch = firestore().batch();

            // Update all timeframes
            const timeFrames: ('week' | 'month' | 'allTime')[] = ['week', 'month', 'allTime'];

            for (const timeFrame of timeFrames) {
                const ref = getLeaderboardRef(timeFrame).doc(userId);
                batch.set(
                    ref,
                    {
                        displayName,
                        score,
                        photoURL,
                        change: 0,
                        updatedAt: firestore.Timestamp.now(),
                    },
                    { merge: true }
                );
            }

            await batch.commit();
        } catch (error) {
            console.error('Error updating leaderboard score:', error);
            throw error;
        }
    },

    /**
     * Get user's current rank
     */
    async getUserRank(
        userId: string,
        timeFrame: 'week' | 'month' | 'allTime'
    ): Promise<number | null> {
        try {
            const userDoc = await getLeaderboardRef(timeFrame).doc(userId).get();

            if (!userDoc.exists) return null;

            const userScore = userDoc.data()?.score || 0;

            // Count how many users have a higher score
            const higherScoresSnapshot = await getLeaderboardRef(timeFrame)
                .where('score', '>', userScore)
                .get();

            return higherScoresSnapshot.size + 1;
        } catch (error) {
            console.error('Error getting user rank:', error);
            return null;
        }
    },
};

/**
 * User Profile Operations (for social features)
 */
export const userProfileService = {
    /**
     * Update user's public profile data
     */
    async updateProfile(
        userId: string,
        data: {
            displayName?: string;
            displayNameLower?: string;
            photoURL?: string;
            currentStreak?: number;
            totalCompletions?: number;
            level?: number;
            points?: number;
        }
    ): Promise<void> {
        try {
            // Include lowercase displayName for search
            const updateData = { ...data };
            if (data.displayName) {
                updateData.displayNameLower = data.displayName.toLowerCase();
            }

            await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .set(updateData, { merge: true });
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },

    /**
     * Get user's public profile
     */
    async getProfile(userId: string) {
        try {
            const doc = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .get();

            if (!doc.exists) return null;

            return {
                id: doc.id,
                ...doc.data(),
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },
};
