import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeUnlockAnimation } from '../../components/gamification/Badge';
import {
  DailyScoreRing,
  DateStrip,
  EmptyState,
  HabitList,
  PerfectDayBadge,
} from '../../components/habits';
import { OfflineBanner } from '../../components/ui';
import { useAchievements } from '../../hooks/useAchievements';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useHabitStore } from '../../stores/habitStore';
import { useNotificationBadge } from '../../stores/notificationStore';
import { useSocialStore } from '../../stores/socialStore';
import { borderRadius, colors, fontFamily, fontSize, spacing, textStyles } from '../../theme';
import { Habit } from '../../types/habit';

// Get greeting based on time of day
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Format date for header
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<StackNavigationProp<HomeStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const { incrementPerfectDays } = useGamificationStore();
  const { checkAchievements, checkForPerfectDay, newlyUnlockedBadge, dismissBadgeNotification } = useAchievements();

  // Notification state
  const pendingRequests = useSocialStore((state) => state.pendingRequests);
  const sentRequests = useSocialStore((state) => state.sentRequests);
  const fetchPendingRequests = useSocialStore((state) => state.fetchPendingRequests);
  const fetchSentRequests = useSocialStore((state) => state.fetchSentRequests);
  const { isNewSince, lastViewedFriendRequests } = useNotificationBadge();

  // Calculate total notification count (incoming + sent)
  const totalNotificationCount = pendingRequests.length + sentRequests.length;

  // Fetch pending and sent requests on mount
  useEffect(() => {
    if (user?.uid) {
      fetchPendingRequests(user.uid);
      fetchSentRequests(user.uid);
    }
  }, [user?.uid]);

  const {
    selectedDate,
    setSelectedDate,
    getHabitsForDate,
    habits: allHabits,
    logs,
    completeHabit,
    skipHabit,
    undoHabitLog,
    getDailyProgress,
  } = useHabitStore();

  const handleAddHabit = () => {
    navigation.navigate('AddHabit');
  };

  const handleEditHabit = (habit: Habit) => {
    navigation.navigate('EditHabit', { habitId: habit.id });
  };

  const handleNotifications = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('NotificationCenter' as any);
  };

  // Handle habit completion with achievement check
  const handleComplete = useCallback((habitId: string) => {
    completeHabit(habitId, selectedDate);
    // Check achievements after a small delay to ensure state is updated
    setTimeout(() => {
      checkAchievements();
      checkForPerfectDay(selectedDate);
    }, 100);
  }, [selectedDate, completeHabit, checkAchievements, checkForPerfectDay]);

  // Get habits for selected date - include allHabits in deps so it updates when streaks change
  const habits = useMemo(() => getHabitsForDate(selectedDate), [selectedDate, getHabitsForDate, allHabits]);

  // Get daily progress - include allHabits so it recalculates when habits are added/removed
  const progress = useMemo(() => getDailyProgress(selectedDate), [selectedDate, getDailyProgress, logs, allHabits]);

  // Check if today, past, or future (use local date, not UTC)
  const getTodayString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayString = getTodayString();
  const isToday = selectedDate === todayString;
  const isFutureDate = selectedDate > todayString;
  const isPastDate = selectedDate < todayString;

  // Determine empty state type
  const getEmptyStateType = () => {
    if (habits.length === 0) return 'rest_day';
    if (progress.completed === progress.total && progress.total > 0) return 'all_done';
    return 'no_habits';
  };

  // Get completion rate for date strip
  const getCompletionRate = (date: string): number => {
    const dayProgress = getDailyProgress(date);
    return dayProgress.percentage;
  };

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text style={styles.date}>{formatDate(selectedDate)}</Text>
        </View>

        {/* Notification Bell */}
        <Pressable onPress={handleNotifications} style={styles.notificationButton}>
          <Feather name="bell" size={24} color={colors.text.primary} />
          {(totalNotificationCount > 0) && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {totalNotificationCount > 9 ? '9+' : totalNotificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </Animated.View>

      {/* Offline Banner */}
      <OfflineBanner />

      {/* Date Strip */}
      <DateStrip
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        getCompletionRate={getCompletionRate}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {habits.length === 0 ? (
          <EmptyState
            type={
              isPastDate ? 'no_habits_past' :
                isFutureDate ? 'no_habits_future' :
                  allHabits.length === 0 ? 'no_habits' : 'rest_day'
            }
            onAddHabit={isToday ? handleAddHabit : undefined}
          />
        ) : progress.completed === progress.total && progress.total > 0 ? (
          <>
            {/* Score Ring */}
            <DailyScoreRing
              completed={progress.completed}
              total={progress.total}
              percentage={progress.percentage}
            />

            {/* Perfect Day Badge */}
            <PerfectDayBadge
              visible={true}
              streakCount={1} // TODO: Calculate actual streak
            />

            {/* Show completed habits */}
            <View style={styles.habitsContainer}>
              <Text style={styles.sectionHeader}>Completed</Text>
              <HabitList
                habits={habits}
                logs={logs}
                selectedDate={selectedDate}
                onComplete={handleComplete}
                onSkip={(habitId) => skipHabit(habitId, selectedDate)}
                onUndo={(habitId) => undoHabitLog(habitId, selectedDate)}
                onHabitPress={handleEditHabit}
                isEditable={isToday}
                isFutureDate={isFutureDate}
              />
            </View>
          </>
        ) : (
          <>
            {/* Score Ring */}
            <DailyScoreRing
              completed={progress.completed}
              total={progress.total}
              percentage={progress.percentage}
            />

            {/* Habit List */}
            <View style={styles.habitsContainer}>
              <Text style={styles.sectionHeader}>
                {isToday ? "Today's Habits" : 'Habits'}
              </Text>

              {/* Swipe hint for new users - only show for today */}
              {isToday && progress.completed === 0 && (
                <Animated.View
                  entering={FadeInDown.delay(500).duration(400)}
                  style={styles.swipeHint}
                >
                  <Text style={styles.swipeHintText}>
                    👉 Swipe right to complete · Swipe left to skip
                  </Text>
                </Animated.View>
              )}

              {/* Past date notice */}
              {isPastDate && (
                <Animated.View
                  entering={FadeInDown.delay(200).duration(400)}
                  style={styles.dateNotice}
                >
                  <Feather name="lock" size={14} color={colors.text.muted} />
                  <Text style={styles.dateNoticeText}>
                    Past dates are view-only
                  </Text>
                </Animated.View>
              )}

              {/* Future date notice */}
              {isFutureDate && (
                <Animated.View
                  entering={FadeInDown.delay(200).duration(400)}
                  style={styles.dateNotice}
                >
                  <Feather name="clock" size={14} color={colors.text.muted} />
                  <Text style={styles.dateNoticeText}>
                    Future dates are view-only
                  </Text>
                </Animated.View>
              )}

              <HabitList
                habits={habits}
                logs={logs}
                selectedDate={selectedDate}
                onComplete={handleComplete}
                onSkip={(habitId) => skipHabit(habitId, selectedDate)}
                onUndo={(habitId) => undoHabitLog(habitId, selectedDate)}
                onHabitPress={handleEditHabit}
                isEditable={isToday}
                isFutureDate={isFutureDate}
              />
            </View>
          </>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Badge Unlock Animation */}
      {newlyUnlockedBadge && (
        <BadgeUnlockAnimation
          badge={newlyUnlockedBadge}
          visible={!!newlyUnlockedBadge}
          onDismiss={dismissBadgeNotification}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...textStyles.headlineMedium,
    color: colors.text.primary,
  },
  date: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  notificationBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  habitsContainer: {
    flex: 1,
    marginTop: spacing.lg,
  },
  sectionHeader: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  swipeHint: {
    backgroundColor: colors.background.card,
    borderRadius: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  swipeHintText: {
    ...textStyles.labelSmall,
    color: colors.text.muted,
    textAlign: 'center',
  },
  dateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    alignSelf: 'center',
  },
  dateNoticeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
});
