/**
 * FriendsList - Shows friends and handles friend requests
 * Connected to Firebase for real-time data
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInRight,
    Layout,
    SlideInDown,
    SlideOutDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Friend } from '../../data/social';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { useFriends, useSocialStore } from '../../stores/socialStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';
import { useToast } from '../ui';

interface FriendCardProps {
    friend: Friend;
    onPress?: () => void;
    onRemove?: () => void;
    index: number;
}

const FriendCard = ({ friend, onPress, onRemove, index }: FriendCardProps) => {
    const scale = useSharedValue(1);
    const haptics = useHaptics();

    const handlePressIn = () => {
        scale.value = withSpring(0.97);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const initial = friend.displayName.charAt(0).toUpperCase();
    const colors_avatars = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const avatarColor = colors_avatars[friend.displayName.length % colors_avatars.length];

    return (
        <Animated.View
            entering={FadeInRight.delay(index * 50).duration(300)}
            layout={Layout.springify()}
        >
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <Animated.View style={[styles.friendCard, animatedStyle]}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        {friend.photoURL ? (
                            <Text style={styles.avatarText}>{initial}</Text>
                        ) : (
                            <Text style={styles.avatarText}>{initial}</Text>
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{friend.displayName}</Text>
                        <View style={styles.friendStats}>
                            <Text style={styles.statText}>🔥 {friend.currentStreak}</Text>
                            <Text style={styles.statDivider}>•</Text>
                            <Text style={styles.statText}>Lvl {friend.level}</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    {onRemove && (
                        <Pressable
                            onPress={() => {
                                haptics.light();
                                onRemove();
                            }}
                            style={styles.removeButton}
                        >
                            <Feather name="x" size={18} color={colors.text.muted} />
                        </Pressable>
                    )}
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

interface AddFriendModalProps {
    visible: boolean;
    onClose: () => void;
}

type FriendSearchResult = Friend & { requestSent?: boolean; isFriend?: boolean };

const AddFriendModal = ({ visible, onClose }: AddFriendModalProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const { searchUsers, sendFriendRequest, hasSentRequest, isFriend } = useFriends();
    const user = useAuthStore((state) => state.user);
    const toast = useToast();

    const handleSearch = async () => {
        if (!searchQuery.trim() || !user?.uid) return;

        setHasSearched(true);
        setIsSearching(true);
        try {
            const results = await searchUsers(searchQuery.trim(), user.uid);
            // Annotate results with friend/request status from store
            const annotatedResults = results.map((result) => ({
                ...result,
                requestSent: hasSentRequest(result.userId),
                isFriend: isFriend(result.userId),
            }));

            setSearchResults(annotatedResults);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (targetUser: FriendSearchResult) => {
        if (!user?.uid) return;

        setIsSending(true);
        try {
            await sendFriendRequest(
                user.uid,
                targetUser.userId,
                user.displayName || 'User',
                targetUser.displayName
            );
            // Update local search results
            setSearchResults((prev) =>
                prev.map((result) =>
                    result.userId === targetUser.userId
                        ? { ...result, requestSent: true }
                        : result
                )
            );
            // Show success toast and close modal
            toast.success(`Friend request sent to ${targetUser.displayName}!`, {
                title: 'Request Sent',
                duration: 3000,
            });
            setTimeout(() => {
                handleClose();
            }, 300);
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast.error('Failed to send friend request. Please try again.', {
                title: 'Oops!',
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

                <Animated.View
                    entering={SlideInDown.springify().damping(15)}
                    exiting={SlideOutDown.duration(200)}
                    style={styles.modalContent}
                >
                    <View style={styles.modalHandle} />

                    <Text style={styles.modalTitle}>Add Friend</Text>
                    <Text style={styles.modalSubtitle}>
                        Search by username or email
                    </Text>

                    <View style={styles.searchContainer}>
                        <Feather name="search" size={20} color={colors.text.muted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Username or email"
                            placeholderTextColor={colors.text.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="search"
                        />
                        {isSearching && (
                            <ActivityIndicator size="small" color={colors.accent.success} />
                        )}
                    </View>

                    {/* Search button */}
                    <Pressable onPress={handleSearch} disabled={!searchQuery.trim() || isSearching}>
                        <LinearGradient
                            colors={
                                searchQuery.trim()
                                    ? [colors.accent.success, '#059669']
                                    : [colors.text.muted, colors.text.muted]
                            }
                            style={styles.searchButton}
                        >
                            <Text style={styles.searchButtonText}>Search</Text>
                        </LinearGradient>
                    </Pressable>

                    {/* Search results */}
                    {searchResults.length > 0 && (
                        <View style={styles.searchResults}>
                            <Text style={styles.searchResultsTitle}>Results</Text>
                            {searchResults.map((result) => {
                                const isExistingFriend = !!result.isFriend;
                                const isPendingRequest = result.requestSent && !result.isFriend;
                                const disableButton = isSending || isPendingRequest || isExistingFriend;
                                const iconName = isExistingFriend
                                    ? 'check'
                                    : isPendingRequest
                                        ? 'clock'
                                        : 'user-plus';
                                const iconColor = disableButton ? colors.text.muted : colors.accent.success;
                                const buttonBg = isExistingFriend
                                    ? colors.accent.success + '20'
                                    : isPendingRequest
                                        ? colors.accent.warning + '20'
                                        : colors.accent.success + '20';

                                return (
                                    <View key={result.userId} style={styles.searchResultCard}>
                                        <View style={styles.searchResultInfo}>
                                            <View
                                                style={[
                                                    styles.avatar,
                                                    styles.smallAvatar,
                                                    { backgroundColor: '#3B82F6' },
                                                ]}
                                            >
                                                <Text style={[styles.avatarText, styles.smallAvatarText]}>
                                                    {result.displayName.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>
                                            <View style={styles.searchResultTextContainer}>
                                                <Text style={styles.searchResultName}>
                                                    {result.displayName}
                                                </Text>
                                                {/* Status badge */}
                                                {(isExistingFriend || isPendingRequest) && (
                                                    <View
                                                        style={[
                                                            styles.searchResultStatusBadge,
                                                            {
                                                                backgroundColor: isExistingFriend
                                                                    ? colors.accent.success + '15'
                                                                    : colors.accent.warning + '15',
                                                            },
                                                        ]}
                                                    >
                                                        <Feather
                                                            name={isExistingFriend ? 'user-check' : 'clock'}
                                                            size={10}
                                                            color={
                                                                isExistingFriend
                                                                    ? colors.accent.success
                                                                    : colors.accent.warning
                                                            }
                                                        />
                                                        <Text
                                                            style={[
                                                                styles.searchResultStatusText,
                                                                {
                                                                    color: isExistingFriend
                                                                        ? colors.accent.success
                                                                        : colors.accent.warning,
                                                                },
                                                            ]}
                                                        >
                                                            {isExistingFriend ? 'Friends' : 'Request Sent'}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <Pressable
                                            onPress={() => handleSendRequest(result)}
                                            disabled={disableButton}
                                            style={[
                                                styles.addRequestButton,
                                                { backgroundColor: buttonBg },
                                                disableButton && styles.addRequestButtonDisabled,
                                            ]}
                                        >
                                            <Feather
                                                name={iconName as any}
                                                size={16}
                                                color={
                                                    isExistingFriend
                                                        ? colors.accent.success
                                                        : isPendingRequest
                                                            ? colors.accent.warning
                                                            : iconColor
                                                }
                                            />
                                        </Pressable>
                                    </View>
                                );
                            })}
                        </View>
                    )}

                    {/* No results */}
                    {searchResults.length === 0 && hasSearched && searchQuery.trim() && !isSearching && (
                        <View style={styles.noResults}>
                            <Text style={styles.noResultsText}>No users found</Text>
                        </View>
                    )}

                    <Pressable onPress={handleClose} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Close</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </Modal>
    );
};

export const FriendsList = () => {
    const user = useAuthStore((state) => state.user);
    const {
        friends,
        pendingRequests,
        sentRequests,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        removeFriend,
    } = useFriends();
    const isLoading = useSocialStore((state) => state.isLoading);
    const [showAddModal, setShowAddModal] = useState(false);
    const haptics = useHaptics();
    const toast = useToast();

    const handleAcceptRequest = async (request: Friend) => {
        if (!user?.uid) return;
        try {
            await acceptFriendRequest(user.uid, request.id, {
                userId: request.userId,
                displayName: request.displayName,
                currentStreak: request.currentStreak,
                totalCompletions: request.totalCompletions,
                level: request.level,
            });
            toast.success(`You and ${request.displayName} are now friends!`, {
                title: 'New Friend! 🎉',
            });
        } catch (error) {
            console.error('Error accepting request:', error);
            toast.error('Failed to accept friend request. Please try again.');
        }
    };

    const handleDeclineRequest = async (request: Friend) => {
        if (!user?.uid) return;
        haptics.light();
        try {
            await declineFriendRequest(user.uid, request.id);
            toast.info('Friend request declined');
        } catch (error) {
            console.error('Error declining request:', error);
            toast.error('Failed to decline request. Please try again.');
        }
    };

    const handleCancelRequest = async (request: Friend) => {
        if (!user?.uid) return;
        haptics.light();
        try {
            await cancelFriendRequest(user.uid, request.userId);
            toast.info(`Friend request to ${request.displayName} cancelled`);
        } catch (error) {
            console.error('Error canceling request:', error);
            toast.error('Failed to cancel request. Please try again.');
        }
    };

    const handleRemoveFriend = async (friend: Friend) => {
        if (!user?.uid) return;
        haptics.warning();
        try {
            await removeFriend(user.uid, friend.id);
            toast.info(`${friend.displayName} has been removed from your friends`);
        } catch (error) {
            console.error('Error removing friend:', error);
            toast.error('Failed to remove friend. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Friends</Text>
                    <Text style={styles.subtitle}>{friends.length} friends</Text>
                </View>
                <Pressable
                    onPress={() => {
                        haptics.medium();
                        setShowAddModal(true);
                    }}
                    style={styles.addFriendButton}
                >
                    <LinearGradient
                        colors={[colors.accent.success, '#059669']}
                        style={styles.addFriendGradient}
                    >
                        <Feather name="user-plus" size={18} color={colors.text.inverse} />
                    </LinearGradient>
                </Pressable>
            </View>

            {/* Pending Requests (Incoming) */}
            {pendingRequests.length > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Friend Requests</Text>
                    {pendingRequests.map((request) => (
                        <View key={request.id} style={styles.requestCard}>
                            <View style={styles.requestInfo}>
                                <View
                                    style={[
                                        styles.avatar,
                                        styles.smallAvatar,
                                        { backgroundColor: '#3B82F6' },
                                    ]}
                                >
                                    <Text style={[styles.avatarText, styles.smallAvatarText]}>
                                        {request.displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <Text style={styles.requestName}>{request.displayName}</Text>
                            </View>
                            <View style={styles.requestActions}>
                                <Pressable
                                    onPress={() => handleAcceptRequest(request)}
                                    style={styles.acceptButton}
                                >
                                    <Feather name="check" size={16} color={colors.accent.success} />
                                </Pressable>
                                <Pressable
                                    onPress={() => handleDeclineRequest(request)}
                                    style={styles.declineButton}
                                >
                                    <Feather name="x" size={16} color={colors.accent.error} />
                                </Pressable>
                            </View>
                        </View>
                    ))}
                </Animated.View>
            )}

            {/* Sent Requests (Outgoing) */}
            {sentRequests.length > 0 && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
                    <Text style={styles.sectionTitle}>Sent Requests</Text>
                    {sentRequests.map((request) => (
                        <View key={request.id} style={styles.requestCard}>
                            <View style={styles.requestInfo}>
                                <View
                                    style={[
                                        styles.avatar,
                                        styles.smallAvatar,
                                        { backgroundColor: '#8B5CF6' },
                                    ]}
                                >
                                    <Text style={[styles.avatarText, styles.smallAvatarText]}>
                                        {request.displayName.charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.sentRequestInfo}>
                                    <Text style={styles.requestName}>{request.displayName}</Text>
                                    <View style={styles.pendingBadge}>
                                        <Feather name="clock" size={10} color={colors.accent.warning} />
                                        <Text style={styles.pendingText}>Pending</Text>
                                    </View>
                                </View>
                            </View>
                            <Pressable
                                onPress={() => handleCancelRequest(request)}
                                style={styles.cancelRequestButton}
                            >
                                <Text style={styles.cancelRequestText}>Cancel</Text>
                            </Pressable>
                        </View>
                    ))}
                </Animated.View>
            )}

            {/* Loading state */}
            {isLoading && friends.length === 0 && (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={colors.accent.success} />
                    <Text style={styles.loadingText}>Loading friends...</Text>
                </View>
            )}

            {/* Friends List */}
            {!isLoading && friends.length === 0 ? (
                <Animated.View entering={FadeIn.duration(300)} style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Add friends to compete and stay motivated together!
                    </Text>
                </Animated.View>
            ) : (
                <View style={styles.friendsList}>
                    {friends.map((friend, index) => (
                        <FriendCard
                            key={friend.id}
                            friend={friend}
                            index={index}
                            onRemove={() => handleRemoveFriend(friend)}
                        />
                    ))}
                </View>
            )}

            {/* Add Friend Modal */}
            <AddFriendModal
                visible={showAddModal}
                onClose={() => setShowAddModal(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    title: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
    },
    subtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: 2,
    },
    addFriendButton: {},
    addFriendGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Section
    section: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },

    // Friend card
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    smallAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.inverse,
    },
    smallAvatarText: {
        fontSize: fontSize.sm,
    },
    friendInfo: {
        flex: 1,
    },
    friendName: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    friendStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    statDivider: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginHorizontal: spacing.sm,
    },
    removeButton: {
        padding: spacing.sm,
    },
    friendsList: {},

    // Request card
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    requestInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requestName: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    sentRequestInfo: {
        flexDirection: 'column',
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    pendingText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.accent.warning,
    },
    cancelRequestButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        backgroundColor: colors.background.elevated,
    },
    cancelRequestText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    requestActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    acceptButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent.error + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Loading state
    loadingState: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    loadingText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginTop: spacing.md,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: spacing['2xl'],
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    emptyTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    emptySubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        textAlign: 'center',
        maxWidth: 240,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background.card,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        paddingBottom: spacing['2xl'],
        maxHeight: '80%',
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.text.muted,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    modalTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.xs,
    },
    modalSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.md,
    },
    searchInput: {
        flex: 1,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.primary,
        paddingVertical: spacing.md,
        marginLeft: spacing.sm,
    },
    searchButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    searchButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
    searchResults: {
        marginBottom: spacing.lg,
    },
    searchResultsTitle: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        marginBottom: spacing.sm,
    },
    searchResultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    searchResultInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchResultTextContainer: {
        flexDirection: 'column',
        gap: 4,
    },
    searchResultName: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    searchResultStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        alignSelf: 'flex-start',
    },
    searchResultStatusText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.xs,
    },
    addRequestButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.accent.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addRequestButtonDisabled: {
        backgroundColor: colors.background.elevated,
    },
    noResults: {
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    noResultsText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
    },
    cancelButton: {
        backgroundColor: colors.background.elevated,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.secondary,
    },
});
