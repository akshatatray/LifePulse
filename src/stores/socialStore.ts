/**
 * LifePulse - Social Store
 * Manages friends, activity feed, challenges, and leaderboard
 * Connected to Firebase for real-time data
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
    ActivityItem,
    Challenge,
    Friend,
    LeaderboardEntry,
} from '../data/social';
import {
    activityService,
    challengeService,
    friendService,
    leaderboardService,
} from '../services/socialFirestore';
import { shallow } from 'zustand/shallow';

interface SocialState {
    // Friends
    friends: Friend[];
    pendingRequests: Friend[];
    sentRequests: Friend[];

    // Activity
    activityFeed: ActivityItem[];

    // Challenges
    activeChallenges: Challenge[];
    joinedChallenges: string[];

    // Leaderboard
    leaderboard: LeaderboardEntry[];
    leaderboardFilter: 'week' | 'month' | 'allTime';
    currentUserRank: number | null;

    // UI State
    isLoading: boolean;
    error: string | null;

    // Friend Actions
    fetchFriends: (userId: string) => Promise<void>;
    fetchPendingRequests: (userId: string) => Promise<void>;
    fetchSentRequests: (userId: string) => Promise<void>;
    sendFriendRequest: (fromUserId: string, toUserId: string, fromUserName: string, toUserName: string) => Promise<void>;
    cancelFriendRequest: (userId: string, targetUserId: string) => Promise<void>;
    acceptFriendRequest: (userId: string, friendId: string, friendData: Partial<Friend>) => Promise<void>;
    declineFriendRequest: (userId: string, friendId: string) => Promise<void>;
    removeFriend: (userId: string, friendId: string) => Promise<void>;
    searchUsers: (query: string, currentUserId: string) => Promise<Friend[]>;

    // Activity Actions
    fetchActivityFeed: (userId: string) => Promise<void>;
    likeActivity: (userId: string, activityId: string) => Promise<void>;
    unlikeActivity: (userId: string, activityId: string) => Promise<void>;

    // Challenge Actions
    fetchChallenges: () => Promise<void>;
    fetchJoinedChallenges: (userId: string) => Promise<void>;
    joinChallenge: (userId: string, challengeId: string, displayName: string) => Promise<void>;
    leaveChallenge: (userId: string, challengeId: string) => Promise<void>;

    // Leaderboard Actions
    fetchLeaderboard: (userId: string) => Promise<void>;
    setLeaderboardFilter: (filter: 'week' | 'month' | 'allTime') => void;

    // Clear all data
    clearSocialData: () => void;
}

export const useSocialStore = create<SocialState>()(
    persist(
        (set, get) => ({
            friends: [],
            pendingRequests: [],
            sentRequests: [],
            activityFeed: [],
            activeChallenges: [],
            joinedChallenges: [],
            leaderboard: [],
            leaderboardFilter: 'week',
            currentUserRank: null,
            isLoading: false,
            error: null,

            // Friend Actions
            fetchFriends: async (userId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const friends = await friendService.getFriends(userId);
                    set({ friends, isLoading: false });
                } catch (error) {
                    console.error('Error fetching friends:', error);
                    set({ isLoading: false, error: 'Failed to fetch friends' });
                }
            },

            fetchPendingRequests: async (userId: string) => {
                try {
                    const pendingRequests = await friendService.getPendingRequests(userId);
                    set({ pendingRequests });
                } catch (error) {
                    console.error('Error fetching pending requests:', error);
                }
            },

            fetchSentRequests: async (userId: string) => {
                try {
                    const sentRequests = await friendService.getSentRequests(userId);
                    set({ sentRequests });
                } catch (error) {
                    console.error('Error fetching sent requests:', error);
                }
            },

            sendFriendRequest: async (fromUserId: string, toUserId: string, fromUserName: string, toUserName: string) => {
                try {
                    await friendService.sendFriendRequest(fromUserId, toUserId, fromUserName, toUserName);
                    // Optimistically add to sent requests
                    set((state) => ({
                        sentRequests: [
                            ...state.sentRequests,
                            {
                                id: toUserId,
                                userId: toUserId,
                                displayName: toUserName,
                                currentStreak: 0,
                                totalCompletions: 0,
                                level: 1,
                                status: 'pending' as const,
                                addedAt: new Date(),
                            },
                        ],
                    }));
                } catch (error) {
                    console.error('Error sending friend request:', error);
                    throw error;
                }
            },

            cancelFriendRequest: async (userId: string, targetUserId: string) => {
                try {
                    await friendService.cancelFriendRequest(userId, targetUserId);
                    // Remove from sent requests
                    set((state) => ({
                        sentRequests: state.sentRequests.filter((r) => r.userId !== targetUserId),
                    }));
                } catch (error) {
                    console.error('Error canceling friend request:', error);
                    throw error;
                }
            },

            acceptFriendRequest: async (userId: string, friendId: string, friendData: Partial<Friend>) => {
                try {
                    await friendService.acceptFriendRequest(userId, friendId, friendData);
                    // Refresh lists
                    const { fetchFriends, fetchPendingRequests } = get();
                    await Promise.all([fetchFriends(userId), fetchPendingRequests(userId)]);
                } catch (error) {
                    console.error('Error accepting friend request:', error);
                    throw error;
                }
            },

            declineFriendRequest: async (userId: string, friendId: string) => {
                try {
                    await friendService.declineFriendRequest(userId, friendId);
                    set((state) => ({
                        pendingRequests: state.pendingRequests.filter((r) => r.id !== friendId),
                    }));
                } catch (error) {
                    console.error('Error declining friend request:', error);
                    throw error;
                }
            },

            removeFriend: async (userId: string, friendId: string) => {
                try {
                    await friendService.removeFriend(userId, friendId);
                    set((state) => ({
                        friends: state.friends.filter((f) => f.id !== friendId),
                    }));
                } catch (error) {
                    console.error('Error removing friend:', error);
                    throw error;
                }
            },

            searchUsers: async (query: string, currentUserId: string) => {
                try {
                    return await friendService.searchUsers(query, currentUserId);
                } catch (error) {
                    console.error('Error searching users:', error);
                    return [];
                }
            },

            // Activity Actions
            fetchActivityFeed: async (userId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const { friends } = get();
                    const friendIds = friends.map((f) => f.userId);
                    const activityFeed = await activityService.getFeed(userId, friendIds);
                    set({ activityFeed, isLoading: false });
                } catch (error) {
                    console.error('Error fetching activity feed:', error);
                    set({ isLoading: false, error: 'Failed to fetch activity' });
                }
            },

            likeActivity: async (userId: string, activityId: string) => {
                try {
                    // Optimistic update
                    set((state) => ({
                        activityFeed: state.activityFeed.map((item) =>
                            item.id === activityId
                                ? { ...item, likes: item.likes + 1, hasLiked: true }
                                : item
                        ),
                    }));
                    await activityService.likeActivity(userId, activityId);
                } catch (error) {
                    console.error('Error liking activity:', error);
                    // Revert on error
                    set((state) => ({
                        activityFeed: state.activityFeed.map((item) =>
                            item.id === activityId
                                ? { ...item, likes: item.likes - 1, hasLiked: false }
                                : item
                        ),
                    }));
                }
            },

            unlikeActivity: async (userId: string, activityId: string) => {
                try {
                    // Optimistic update
                    set((state) => ({
                        activityFeed: state.activityFeed.map((item) =>
                            item.id === activityId
                                ? { ...item, likes: Math.max(0, item.likes - 1), hasLiked: false }
                                : item
                        ),
                    }));
                    await activityService.unlikeActivity(userId, activityId);
                } catch (error) {
                    console.error('Error unliking activity:', error);
                    // Revert on error
                    set((state) => ({
                        activityFeed: state.activityFeed.map((item) =>
                            item.id === activityId
                                ? { ...item, likes: item.likes + 1, hasLiked: true }
                                : item
                        ),
                    }));
                }
            },

            // Challenge Actions
            fetchChallenges: async () => {
                try {
                    set({ isLoading: true, error: null });
                    const activeChallenges = await challengeService.getChallenges();
                    set({ activeChallenges, isLoading: false });
                } catch (error) {
                    console.error('Error fetching challenges:', error);
                    set({ isLoading: false, error: 'Failed to fetch challenges' });
                }
            },

            fetchJoinedChallenges: async (userId: string) => {
                try {
                    const joinedChallenges = await challengeService.getJoinedChallenges(userId);
                    set({ joinedChallenges });
                } catch (error) {
                    console.error('Error fetching joined challenges:', error);
                }
            },

            joinChallenge: async (userId: string, challengeId: string, displayName: string) => {
                try {
                    // Optimistic update
                    set((state) => ({
                        joinedChallenges: [...state.joinedChallenges, challengeId],
                    }));
                    await challengeService.joinChallenge(userId, challengeId, displayName);
                } catch (error) {
                    console.error('Error joining challenge:', error);
                    // Revert on error
                    set((state) => ({
                        joinedChallenges: state.joinedChallenges.filter((id) => id !== challengeId),
                    }));
                    throw error;
                }
            },

            leaveChallenge: async (userId: string, challengeId: string) => {
                try {
                    // Optimistic update
                    set((state) => ({
                        joinedChallenges: state.joinedChallenges.filter((id) => id !== challengeId),
                    }));
                    await challengeService.leaveChallenge(userId, challengeId);
                } catch (error) {
                    console.error('Error leaving challenge:', error);
                    // Revert on error
                    set((state) => ({
                        joinedChallenges: [...state.joinedChallenges, challengeId],
                    }));
                    throw error;
                }
            },

            // Leaderboard Actions
            fetchLeaderboard: async (userId: string) => {
                try {
                    set({ isLoading: true, error: null });
                    const { leaderboardFilter } = get();
                    const [leaderboard, currentUserRank] = await Promise.all([
                        leaderboardService.getLeaderboard(userId, leaderboardFilter),
                        leaderboardService.getUserRank(userId, leaderboardFilter),
                    ]);
                    set({ leaderboard, currentUserRank, isLoading: false });
                } catch (error) {
                    console.error('Error fetching leaderboard:', error);
                    set({ isLoading: false, error: 'Failed to fetch leaderboard' });
                }
            },

            setLeaderboardFilter: (filter: 'week' | 'month' | 'allTime') => {
                set({ leaderboardFilter: filter });
            },

            clearSocialData: () => {
                set({
                    friends: [],
                    pendingRequests: [],
                    sentRequests: [],
                    activityFeed: [],
                    activeChallenges: [],
                    joinedChallenges: [],
                    leaderboard: [],
                    currentUserRank: null,
                    isLoading: false,
                    error: null,
                });
            },
        }),
        {
            name: 'lifepulse-social',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                leaderboardFilter: state.leaderboardFilter,
            }),
        }
    )
);

// Helper hooks
export const useFriends = () => {
    const {
        friends,
        pendingRequests,
        sentRequests,
        fetchFriends,
        fetchPendingRequests,
        fetchSentRequests,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        searchUsers,
    } = useSocialStore(
        (state) => ({
            friends: state.friends,
            pendingRequests: state.pendingRequests,
            sentRequests: state.sentRequests,
            fetchFriends: state.fetchFriends,
            fetchPendingRequests: state.fetchPendingRequests,
            fetchSentRequests: state.fetchSentRequests,
            sendFriendRequest: state.sendFriendRequest,
            cancelFriendRequest: state.cancelFriendRequest,
            acceptFriendRequest: state.acceptFriendRequest,
            declineFriendRequest: state.declineFriendRequest,
            removeFriend: state.removeFriend,
            searchUsers: state.searchUsers,
        }),
        shallow
    );

    const acceptedFriends = friends.filter((f) => f.status === 'accepted');

    // Check if a user has already been sent a request
    const hasSentRequest = (userId: string) => sentRequests.some((r) => r.userId === userId);

    // Check if a user is already a friend
    const isFriend = (userId: string) => acceptedFriends.some((f) => f.userId === userId);

    return {
        friends: acceptedFriends,
        pendingRequests,
        sentRequests,
        friendCount: acceptedFriends.length,
        fetchFriends,
        fetchPendingRequests,
        fetchSentRequests,
        sendFriendRequest,
        cancelFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        removeFriend,
        searchUsers,
        hasSentRequest,
        isFriend,
    };
};

export const useLeaderboard = () => {
    const leaderboard = useSocialStore((state) => state.leaderboard);
    const filter = useSocialStore((state) => state.leaderboardFilter);
    const setFilter = useSocialStore((state) => state.setLeaderboardFilter);
    const fetchLeaderboard = useSocialStore((state) => state.fetchLeaderboard);
    const currentUserRank = useSocialStore((state) => state.currentUserRank);

    return {
        leaderboard,
        filter,
        setFilter,
        fetchLeaderboard,
        currentUserRank,
    };
};

export const useChallenges = () => {
    const activeChallenges = useSocialStore((state) => state.activeChallenges);
    const joinedChallenges = useSocialStore((state) => state.joinedChallenges);
    const fetchChallenges = useSocialStore((state) => state.fetchChallenges);
    const fetchJoinedChallenges = useSocialStore((state) => state.fetchJoinedChallenges);
    const joinChallenge = useSocialStore((state) => state.joinChallenge);
    const leaveChallenge = useSocialStore((state) => state.leaveChallenge);

    const isJoined = (challengeId: string) => joinedChallenges.includes(challengeId);

    return {
        activeChallenges,
        joinedChallenges,
        fetchChallenges,
        fetchJoinedChallenges,
        joinChallenge,
        leaveChallenge,
        isJoined,
    };
};
