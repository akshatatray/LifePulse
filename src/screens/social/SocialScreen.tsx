/**
 * SocialScreen - Social features hub with tabs for different sections
 * Connected to Firebase for real-time data
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
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
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityFeed,
  ChallengesList,
  FriendsList,
  Leaderboard,
} from '../../components/social';
import { useHaptics } from '../../hooks/useHaptics';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore } from '../../stores/socialStore';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabId = 'feed' | 'leaderboard' | 'challenges' | 'friends';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'feed', label: 'Feed', icon: 'activity' },
  { id: 'leaderboard', label: 'Rankings', icon: 'award' },
  { id: 'challenges', label: 'Challenges', icon: 'target' },
  { id: 'friends', label: 'Friends', icon: 'users' },
];

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [refreshing, setRefreshing] = useState(false);
  const haptics = useHaptics();

  const user = useAuthStore((state) => state.user);
  const {
    friends,
    joinedChallenges,
    currentUserRank,
    isLoading,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    fetchActivityFeed,
    fetchChallenges,
    fetchJoinedChallenges,
    fetchLeaderboard,
  } = useSocialStore();

  const tabIndicatorPosition = useSharedValue(0);
  const tabWidth = (SCREEN_WIDTH - spacing.lg * 2) / TABS.length;

  // Fetch data on mount
  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user?.uid]);

  // Update tab indicator position
  useEffect(() => {
    const index = TABS.findIndex((t) => t.id === activeTab);
    tabIndicatorPosition.value = withSpring(index * tabWidth, {
      damping: 15,
      stiffness: 150,
    });
  }, [activeTab]);

  const loadData = async () => {
    if (!user?.uid) return;

    try {
      await Promise.all([
        fetchFriends(user.uid),
        fetchPendingRequests(user.uid),
        fetchSentRequests(user.uid),
        fetchChallenges(),
        fetchJoinedChallenges(user.uid),
        fetchLeaderboard(user.uid),
      ]);
      // Fetch activity feed after friends are loaded
      await fetchActivityFeed(user.uid);
    } catch (error) {
      console.error('Error loading social data:', error);
    }
  };

  const handleTabPress = (tabId: TabId) => {
    haptics.light();
    setActiveTab(tabId);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorPosition.value }],
  }));

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return <ActivityFeed />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'challenges':
        return <ChallengesList />;
      case 'friends':
        return <FriendsList />;
      default:
        return null;
    }
  };

  // If user is not logged in
  if (!user) {
    return (
      <View style={[styles.container, styles.centerContent, { paddingTop: insets.top }]}>
        <Text style={styles.emptyIcon}>👥</Text>
        <Text style={styles.emptyTitle}>Sign in to connect</Text>
        <Text style={styles.emptySubtitle}>
          Create an account to connect with friends and join challenges
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>
            Stay connected and motivated together
          </Text>
        </View>

        {/* Quick stats */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.quickStats}
        >
          <LinearGradient
            colors={[colors.accent.success + '20', colors.accent.success + '05']}
            style={styles.quickStatCard}
          >
            <Text style={styles.quickStatValue}>{friends.length}</Text>
            <Text style={styles.quickStatLabel}>Friends</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#F59E0B20', '#F59E0B05']}
            style={styles.quickStatCard}
          >
            <Text style={styles.quickStatValue}>
              {currentUserRank ? `#${currentUserRank}` : '-'}
            </Text>
            <Text style={styles.quickStatLabel}>Rank</Text>
          </LinearGradient>
          <LinearGradient
            colors={['#8B5CF620', '#8B5CF605']}
            style={styles.quickStatCard}
          >
            <Text style={styles.quickStatValue}>{joinedChallenges.length}</Text>
            <Text style={styles.quickStatLabel}>Challenges</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      {/* Tab Bar */}
      <Animated.View
        entering={FadeInUp.delay(100).duration(400)}
        style={styles.tabBarContainer}
      >
        <View style={styles.tabBar}>
          {/* Animated indicator */}
          <Animated.View
            style={
              [
                styles.tabIndicator,
                indicatorStyle,
                activeTab === 'challenges' && { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / TABS.length + 6, left: -2 },
                activeTab === 'feed' && { left: 4 },
                activeTab === 'friends' && { width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / TABS.length - 2 },
              ]
            }>
            <LinearGradient
              colors={[colors.accent.success, '#059669']}
              style={styles.tabIndicatorGradient}
            />
          </Animated.View>

          {/* Tabs */}
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabPress(tab.id)}
                style={styles.tab}
              >
                <Feather
                  name={tab.icon as any}
                  size={18}
                  color={
                    isActive
                      ? colors.text.inverse
                      : colors.text.muted
                  }
                />
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
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
        <Animated.View
          key={activeTab}
          entering={FadeIn.duration(300)}
        >
          {renderContent()}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerContent: {
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['3xl'],
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginTop: 4,
  },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  quickStatValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
  },
  quickStatLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },

  // Tab bar
  tabBarContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.xs * 2) / TABS.length,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  tabIndicatorGradient: {
    flex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: 6,
    zIndex: 1,
  },
  tabLabel: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  tabLabelActive: {
    color: colors.text.inverse,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },

  // Empty state
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
});
