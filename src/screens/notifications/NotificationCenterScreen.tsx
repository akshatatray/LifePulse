/**
 * NotificationCenterScreen - Central hub for all notifications
 * Shows friend requests, activity updates, and other notifications
 */

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Friend, formatTimeAgo } from '../../data/social';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { useFriends, useSocialStore } from '../../stores/socialStore';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '../../theme';
import { useToast } from '../../components/ui';

interface NotificationCardProps {
  type: 'friend_request' | 'sent_request' | 'friend_accepted' | 'challenge_invite' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isUnread: boolean;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  showCancelAction?: boolean;
  index: number;
}

const NotificationCard = ({
  type,
  title,
  message,
  timestamp,
  isUnread,
  onPress,
  onAccept,
  onDecline,
  onCancel,
  showActions,
  showCancelAction,
  index,
}: NotificationCardProps) => {
  const scale = useSharedValue(1);
  const haptics = useHaptics();

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const getIcon = () => {
    switch (type) {
      case 'friend_request':
        return 'user-plus';
      case 'sent_request':
        return 'send';
      case 'friend_accepted':
        return 'user-check';
      case 'challenge_invite':
        return 'target';
      default:
        return 'bell';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'friend_request':
        return '#3B82F6';
      case 'sent_request':
        return '#8B5CF6';
      case 'friend_accepted':
        return colors.accent.success;
      case 'challenge_invite':
        return '#F59E0B';
      default:
        return colors.accent.info;
    }
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      layout={Layout.springify()}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress && !showActions}
      >
        <Animated.View
          style={[
            styles.notificationCard,
            isUnread && styles.notificationCardUnread,
            animatedStyle,
          ]}
        >
          {/* Unread indicator */}
          {isUnread && <View style={styles.unreadDot} />}

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
            <Feather name={getIcon()} size={20} color={getIconColor()} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{title}</Text>
            <Text style={styles.notificationMessage}>{message}</Text>
            <Text style={styles.notificationTime}>{formatTimeAgo(timestamp)}</Text>

            {/* Actions for incoming friend requests */}
            {showActions && (
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => {
                    haptics.medium();
                    onAccept?.();
                  }}
                  style={styles.acceptButton}
                >
                  <LinearGradient
                    colors={[colors.accent.success, '#059669']}
                    style={styles.acceptButtonGradient}
                  >
                    <Feather name="check" size={16} color={colors.text.inverse} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    onDecline?.();
                  }}
                  style={styles.declineButton}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </Pressable>
              </View>
            )}

            {/* Cancel action for sent requests */}
            {showCancelAction && (
              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => {
                    haptics.light();
                    onCancel?.();
                  }}
                  style={styles.cancelRequestButton}
                >
                  <Feather name="x" size={14} color={colors.accent.error} />
                  <Text style={styles.cancelRequestText}>Cancel Request</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

export default function NotificationCenterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHaptics();
  const toast = useToast();

  const user = useAuthStore((state) => state.user);
  const {
    pendingRequests,
    sentRequests,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    fetchPendingRequests,
    fetchSentRequests,
  } = useFriends();
  const isLoading = useSocialStore((state) => state.isLoading);
  const { markAllAsRead, markAsRead, getUnreadCount } = useNotificationStore();

  // Mark notifications as read when screen is viewed
  useEffect(() => {
    // Mark friend requests as read after a brief delay
    const timer = setTimeout(() => {
      markAllAsRead();
    }, 2000);
    return () => clearTimeout(timer);
  }, [pendingRequests]);

  const handleRefresh = async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    await Promise.all([
      fetchPendingRequests(user.uid),
      fetchSentRequests(user.uid),
    ]);
    setRefreshing(false);
  };

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
      markAsRead(`friend_request_${request.id}`);
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
      markAsRead(`friend_request_${request.id}`);
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

  const handleGoBack = () => {
    haptics.light();
    navigation.goBack();
  };

  // Combine all notifications (friend requests + sent requests)
  const allNotifications = [
    ...pendingRequests.map((request) => ({
      id: `friend_request_${request.id}`,
      type: 'friend_request' as const,
      title: 'Friend Request',
      message: `${request.displayName} wants to be your friend`,
      timestamp: request.addedAt,
      data: request,
    })),
    ...sentRequests.map((request) => ({
      id: `sent_request_${request.id}`,
      type: 'sent_request' as const,
      title: 'Sent Request',
      message: `Waiting for ${request.displayName} to respond`,
      timestamp: request.addedAt,
      data: request,
    })),
  ];

  const hasNotifications = pendingRequests.length > 0 || sentRequests.length > 0;
  const totalNotificationCount = pendingRequests.length + sentRequests.length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Pressable onPress={handleGoBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Notifications</Text>
          {hasNotifications && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalNotificationCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight} />
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.success}
            colors={[colors.accent.success]}
          />
        }
      >
        {/* Loading state */}
        {isLoading && !hasNotifications && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accent.success} />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !hasNotifications && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="bell-off" size={48} color={colors.text.muted} />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>
              You don't have any notifications right now.{'\n'}
              We'll let you know when something happens.
            </Text>
          </Animated.View>
        )}

        {/* Friend Requests Section (Incoming) */}
        {pendingRequests.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="user-plus" size={18} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Friend Requests</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionBadgeText}>{pendingRequests.length}</Text>
              </View>
            </View>
            {pendingRequests.map((request, index) => (
              <NotificationCard
                key={request.id}
                type="friend_request"
                title="Friend Request"
                message={`${request.displayName} wants to be your friend`}
                timestamp={request.addedAt}
                isUnread={true}
                showActions
                onAccept={() => handleAcceptRequest(request)}
                onDecline={() => handleDeclineRequest(request)}
                index={index}
              />
            ))}
          </Animated.View>
        )}

        {/* Sent Requests Section (Outgoing) */}
        {sentRequests.length > 0 && (
          <Animated.View entering={FadeIn.duration(300).delay(100)} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="send" size={18} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Sent Requests</Text>
              <View style={[styles.sectionBadge, styles.sentSectionBadge]}>
                <Text style={[styles.sectionBadgeText, styles.sentSectionBadgeText]}>{sentRequests.length}</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Waiting for a response</Text>
            {sentRequests.map((request, index) => (
              <NotificationCard
                key={request.id}
                type="sent_request"
                title={request.displayName}
                message="Friend request pending"
                timestamp={request.addedAt}
                isUnread={false}
                showCancelAction
                onCancel={() => handleCancelRequest(request)}
                index={index}
              />
            ))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  headerBadge: {
    backgroundColor: colors.accent.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  headerBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    color: colors.text.inverse,
  },
  headerRight: {
    width: 40,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: colors.accent.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 22,
    alignItems: 'center',
  },
  sectionBadgeText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent.success,
  },
  sentSectionBadge: {
    backgroundColor: '#8B5CF6' + '20',
  },
  sentSectionBadgeText: {
    color: '#8B5CF6',
  },
  sectionSubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
    marginTop: -spacing.xs,
  },

  // Notification card
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    position: 'relative',
  },
  notificationCardUnread: {
    backgroundColor: colors.background.card,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent.success,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent.success,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },

  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  acceptButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  acceptButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
  },
  declineButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.elevated,
  },
  declineButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  cancelRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent.error + '15',
  },
  cancelRequestText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.accent.error,
  },

  // Loading state
  loadingState: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  loadingText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: spacing.md,
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
