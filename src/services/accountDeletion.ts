/**
 * Account Deletion Service
 * Handles complete and graceful deletion of user data from Firebase
 * Ensures other users' data is not broken when a user deletes their account
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    HABITS: 'habits',
    LOGS: 'logs',
    GAMIFICATION: 'gamification',
    SUBSCRIPTION: 'subscription',
    FRIENDS: 'friends',
    FRIEND_REQUESTS: 'friendRequests',
    SENT_REQUESTS: 'sentFriendRequests',
    ACTIVITY: 'activity',
    ACTIVITY_LIKES: 'activityLikes',
    CHALLENGES: 'challenges',
    JOINED_CHALLENGES: 'joinedChallenges',
    LEADERBOARD: 'leaderboard',
} as const;

export interface DeletionProgress {
    step: string;
    currentStep: number;
    totalSteps: number;
    message: string;
}

type ProgressCallback = (progress: DeletionProgress) => void;

/**
 * Account Deletion Service
 */
export const accountDeletionService = {
    /**
     * Re-authenticate user before deletion (required by Firebase for sensitive operations)
     */
    async reauthenticateWithPassword(password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const user = auth().currentUser;
            if (!user || !user.email) {
                return { success: false, error: 'No user logged in' };
            }

            const credential = auth.EmailAuthProvider.credential(user.email, password);
            await user.reauthenticateWithCredential(credential);
            return { success: true };
        } catch (error: any) {
            console.error('[AccountDeletion] Reauthentication failed:', error);
            
            let errorMessage = 'Authentication failed';
            switch (error.code) {
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many attempts. Please try again later.';
                    break;
                case 'auth/user-mismatch':
                    errorMessage = 'Credential mismatch. Please log out and try again.';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    },

    /**
     * Delete all subcollection documents for a user
     */
    async deleteSubcollection(
        userId: string, 
        subcollectionName: string
    ): Promise<number> {
        let deletedCount = 0;
        try {
            const snapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(subcollectionName)
                .get();

            if (snapshot.empty) return 0;

            // Delete in batches of 500 (Firestore limit)
            const batchSize = 500;
            const docs = snapshot.docs;
            
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = firestore().batch();
                const chunk = docs.slice(i, i + batchSize);
                
                chunk.forEach((doc) => {
                    batch.delete(doc.ref);
                    deletedCount++;
                });
                
                await batch.commit();
            }
            
            console.log(`[AccountDeletion] Deleted ${deletedCount} documents from ${subcollectionName}`);
        } catch (error) {
            console.error(`[AccountDeletion] Error deleting ${subcollectionName}:`, error);
        }
        return deletedCount;
    },

    /**
     * Remove user from friends' friend lists (cleanup bidirectional friendship)
     */
    async removeFromFriendsLists(userId: string): Promise<number> {
        let removedCount = 0;
        try {
            // Get all friends of the user
            const friendsSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.FRIENDS)
                .get();

            if (friendsSnapshot.empty) return 0;

            const batch = firestore().batch();

            for (const friendDoc of friendsSnapshot.docs) {
                // Remove user from friend's friend list
                const friendsFriendRef = firestore()
                    .collection(COLLECTIONS.USERS)
                    .doc(friendDoc.id)
                    .collection(COLLECTIONS.FRIENDS)
                    .doc(userId);
                
                batch.delete(friendsFriendRef);
                removedCount++;
            }

            await batch.commit();
            console.log(`[AccountDeletion] Removed from ${removedCount} friends' lists`);
        } catch (error) {
            console.error('[AccountDeletion] Error removing from friends lists:', error);
        }
        return removedCount;
    },

    /**
     * Cleanup pending friend requests (both incoming and outgoing)
     */
    async cleanupFriendRequests(userId: string): Promise<number> {
        let cleanedCount = 0;
        try {
            // Cleanup: Remove user from others' incoming friend requests
            // (requests this user has sent)
            const sentRequestsSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.SENT_REQUESTS)
                .get();

            if (!sentRequestsSnapshot.empty) {
                const batch = firestore().batch();
                for (const doc of sentRequestsSnapshot.docs) {
                    // Remove from recipient's incoming requests
                    const recipientRequestRef = firestore()
                        .collection(COLLECTIONS.USERS)
                        .doc(doc.id)
                        .collection(COLLECTIONS.FRIEND_REQUESTS)
                        .doc(userId);
                    batch.delete(recipientRequestRef);
                    cleanedCount++;
                }
                await batch.commit();
            }

            // Cleanup: Remove user from others' sent requests
            // (requests sent TO this user)
            const incomingRequestsSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.FRIEND_REQUESTS)
                .get();

            if (!incomingRequestsSnapshot.empty) {
                const batch = firestore().batch();
                for (const doc of incomingRequestsSnapshot.docs) {
                    // Remove from sender's sent requests
                    const senderSentRef = firestore()
                        .collection(COLLECTIONS.USERS)
                        .doc(doc.id)
                        .collection(COLLECTIONS.SENT_REQUESTS)
                        .doc(userId);
                    batch.delete(senderSentRef);
                    cleanedCount++;
                }
                await batch.commit();
            }

            console.log(`[AccountDeletion] Cleaned up ${cleanedCount} friend requests`);
        } catch (error) {
            console.error('[AccountDeletion] Error cleaning up friend requests:', error);
        }
        return cleanedCount;
    },

    /**
     * Delete user's activity from global feed
     */
    async deleteUserActivity(userId: string): Promise<number> {
        let deletedCount = 0;
        try {
            const activitySnapshot = await firestore()
                .collection(COLLECTIONS.ACTIVITY)
                .where('userId', '==', userId)
                .get();

            if (activitySnapshot.empty) return 0;

            const batchSize = 500;
            const docs = activitySnapshot.docs;
            
            for (let i = 0; i < docs.length; i += batchSize) {
                const batch = firestore().batch();
                const chunk = docs.slice(i, i + batchSize);
                
                chunk.forEach((doc) => {
                    batch.delete(doc.ref);
                    deletedCount++;
                });
                
                await batch.commit();
            }

            console.log(`[AccountDeletion] Deleted ${deletedCount} activity items`);
        } catch (error) {
            console.error('[AccountDeletion] Error deleting user activity:', error);
        }
        return deletedCount;
    },

    /**
     * Remove user from challenge participants
     */
    async removeFromChallenges(userId: string): Promise<number> {
        let removedCount = 0;
        try {
            // Get joined challenges
            const joinedSnapshot = await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .collection(COLLECTIONS.JOINED_CHALLENGES)
                .get();

            if (joinedSnapshot.empty) return 0;

            for (const joinedDoc of joinedSnapshot.docs) {
                try {
                    // Remove from challenge participants
                    await firestore()
                        .collection(COLLECTIONS.CHALLENGES)
                        .doc(joinedDoc.id)
                        .collection('participants')
                        .doc(userId)
                        .delete();
                    removedCount++;
                } catch (e) {
                    // Challenge might not exist anymore
                    console.log(`[AccountDeletion] Challenge ${joinedDoc.id} might not exist`);
                }
            }

            console.log(`[AccountDeletion] Removed from ${removedCount} challenges`);
        } catch (error) {
            console.error('[AccountDeletion] Error removing from challenges:', error);
        }
        return removedCount;
    },

    /**
     * Remove user from leaderboards
     */
    async removeFromLeaderboards(userId: string): Promise<number> {
        let removedCount = 0;
        try {
            const timeFrames = ['week', 'month', 'allTime'];
            const batch = firestore().batch();

            for (const timeFrame of timeFrames) {
                const leaderboardRef = firestore()
                    .collection(COLLECTIONS.LEADERBOARD)
                    .doc(timeFrame)
                    .collection('entries')
                    .doc(userId);
                
                batch.delete(leaderboardRef);
                removedCount++;
            }

            await batch.commit();
            console.log(`[AccountDeletion] Removed from ${removedCount} leaderboards`);
        } catch (error) {
            console.error('[AccountDeletion] Error removing from leaderboards:', error);
        }
        return removedCount;
    },

    /**
     * Delete the main user document
     */
    async deleteUserDocument(userId: string): Promise<boolean> {
        try {
            await firestore()
                .collection(COLLECTIONS.USERS)
                .doc(userId)
                .delete();
            
            console.log('[AccountDeletion] User document deleted');
            return true;
        } catch (error) {
            console.error('[AccountDeletion] Error deleting user document:', error);
            return false;
        }
    },

    /**
     * Delete Firebase Auth user
     */
    async deleteAuthUser(): Promise<{ success: boolean; error?: string }> {
        try {
            const user = auth().currentUser;
            if (!user) {
                return { success: false, error: 'No user logged in' };
            }

            await user.delete();
            console.log('[AccountDeletion] Firebase Auth user deleted');
            return { success: true };
        } catch (error: any) {
            console.error('[AccountDeletion] Error deleting auth user:', error);
            
            let errorMessage = 'Failed to delete account';
            if (error.code === 'auth/requires-recent-login') {
                errorMessage = 'Please log out and log back in, then try again.';
            }
            
            return { success: false, error: errorMessage };
        }
    },

    /**
     * Complete account deletion process
     * This is the main function that orchestrates the entire deletion
     */
    async deleteAccount(
        userId: string, 
        onProgress?: ProgressCallback
    ): Promise<{ success: boolean; error?: string }> {
        const totalSteps = 12;
        let currentStep = 0;

        const reportProgress = (step: string, message: string) => {
            currentStep++;
            onProgress?.({
                step,
                currentStep,
                totalSteps,
                message,
            });
        };

        try {
            console.log('[AccountDeletion] Starting account deletion for:', userId);

            // Step 1: Remove from friends' lists
            reportProgress('friends', 'Removing from friends lists...');
            await this.removeFromFriendsLists(userId);

            // Step 2: Cleanup friend requests
            reportProgress('friendRequests', 'Cleaning up friend requests...');
            await this.cleanupFriendRequests(userId);

            // Step 3: Delete habits
            reportProgress('habits', 'Deleting habits...');
            await this.deleteSubcollection(userId, COLLECTIONS.HABITS);

            // Step 4: Delete logs
            reportProgress('logs', 'Deleting habit logs...');
            await this.deleteSubcollection(userId, COLLECTIONS.LOGS);

            // Step 5: Delete gamification data
            reportProgress('gamification', 'Deleting achievements...');
            await this.deleteSubcollection(userId, COLLECTIONS.GAMIFICATION);

            // Step 6: Delete subscription data
            reportProgress('subscription', 'Removing subscription data...');
            await this.deleteSubcollection(userId, COLLECTIONS.SUBSCRIPTION);

            // Step 7: Delete friends subcollection
            reportProgress('friendsList', 'Removing friends data...');
            await this.deleteSubcollection(userId, COLLECTIONS.FRIENDS);

            // Step 8: Delete friend requests subcollections
            reportProgress('requests', 'Removing friend requests...');
            await this.deleteSubcollection(userId, COLLECTIONS.FRIEND_REQUESTS);
            await this.deleteSubcollection(userId, COLLECTIONS.SENT_REQUESTS);

            // Step 9: Delete activity likes
            reportProgress('likes', 'Removing activity likes...');
            await this.deleteSubcollection(userId, COLLECTIONS.ACTIVITY_LIKES);

            // Step 10: Delete joined challenges & remove from participants
            reportProgress('challenges', 'Leaving challenges...');
            await this.removeFromChallenges(userId);
            await this.deleteSubcollection(userId, COLLECTIONS.JOINED_CHALLENGES);

            // Step 11: Delete user activity from global feed
            reportProgress('activity', 'Removing activity posts...');
            await this.deleteUserActivity(userId);

            // Step 12: Remove from leaderboards
            reportProgress('leaderboard', 'Removing from leaderboards...');
            await this.removeFromLeaderboards(userId);

            // Step 13: Delete user document
            reportProgress('userDoc', 'Finalizing...');
            await this.deleteUserDocument(userId);

            // Step 14: Delete Firebase Auth user
            const authResult = await this.deleteAuthUser();
            if (!authResult.success) {
                return authResult;
            }

            console.log('[AccountDeletion] Account deletion completed successfully');
            return { success: true };
        } catch (error: any) {
            console.error('[AccountDeletion] Error during account deletion:', error);
            return { 
                success: false, 
                error: error.message || 'An error occurred while deleting your account' 
            };
        }
    },
};
