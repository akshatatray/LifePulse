/**
 * InsightsScreen - Analytics and habit performance dashboard
 */

import { useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontFamily, fontSize, textStyles, borderRadius } from '../../theme';
import { useHabitStore } from '../../stores/habitStore';
import { HeatmapCalendar, WeeklyBarChart, LaggingHabitCard } from '../../components/analytics';
import {
  generateHeatmapData,
  getWeeklyStats,
  getLaggingHabits,
  getOverallStats,
} from '../../utils/analytics';

// Individual stat item in the stats banner
interface StatItemProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  value: string | number;
  label: string;
  showDivider?: boolean;
}

const StatItem = ({ icon, iconColor, value, label, showDivider = true }: StatItemProps) => (
  <View style={styles.statItemWrapper}>
    <View style={styles.statItem}>
      <View style={[styles.statIconSmall, { backgroundColor: iconColor + '15' }]}>
        <Feather name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    {showDivider && <View style={styles.statDivider} />}
  </View>
);

// Stats banner component
interface StatsBannerProps {
  stats: {
    currentStreak: number;
    averageCompletion: number;
    perfectDays: number;
    totalCompletions: number;
  };
}

const StatsBanner = ({ stats }: StatsBannerProps) => (
  <Animated.View
    entering={FadeInDown.delay(100).duration(400)}
    style={styles.statsBanner}
  >
    <StatItem
      icon="zap"
      iconColor={colors.accent.warning}
      value={stats.currentStreak}
      label="Streak"
    />
    <StatItem
      icon="target"
      iconColor={colors.accent.success}
      value={`${stats.averageCompletion}%`}
      label="Avg Rate"
    />
    <StatItem
      icon="award"
      iconColor={colors.accent.info}
      value={stats.perfectDays}
      label="Perfect"
    />
    <StatItem
      icon="check-circle"
      iconColor="#DDA0DD"
      value={stats.totalCompletions}
      label="Done"
      showDivider={false}
    />
  </Animated.View>
);

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { habits, logs } = useHabitStore();
  
  // Calculate all analytics data
  // Show 2 months back, current month in middle, 2 months forward
  const heatmapData = useMemo(
    () => generateHeatmapData(habits, logs, 2, 2),
    [habits, logs]
  );
  
  const weeklyStats = useMemo(
    () => getWeeklyStats(habits, logs),
    [habits, logs]
  );
  
  const laggingHabits = useMemo(
    () => getLaggingHabits(habits, logs, 3),
    [habits, logs]
  );
  
  const overallStats = useMemo(
    () => getOverallStats(habits, logs),
    [habits, logs]
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(500)}
        style={styles.header}
      >
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </Animated.View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats Banner */}
        <StatsBanner stats={overallStats} />
        
        {/* Weekly Bar Chart */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={styles.section}
        >
          <WeeklyBarChart data={weeklyStats} />
        </Animated.View>
        
        {/* Lagging Habits / Insights */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.section}
        >
          <LaggingHabitCard laggingHabits={laggingHabits} />
        </Animated.View>
        
        {/* Heatmap Calendar */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
          style={styles.section}
        >
          <HeatmapCalendar data={heatmapData} />
        </Animated.View>
        
        {/* Pro Tip */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(400)}
          style={styles.tipCard}
        >
          <View style={styles.tipHeader}>
            <Feather name="info" size={18} color={colors.accent.info} />
            <Text style={styles.tipTitle}>Pro Tip</Text>
          </View>
          <Text style={styles.tipText}>
            Habits are 40% more likely to stick when done at the same time each day. 
            Try linking your habits to existing routines!
          </Text>
        </Animated.View>
        
        {/* Bottom padding for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
  },
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  // Stats Banner styles
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
  },
  statItemWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconSmall: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.default,
  },
  section: {
    marginBottom: spacing.lg,
  },
  tipCard: {
    backgroundColor: colors.accent.info + '10',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent.info + '30',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.accent.info,
  },
  tipText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: fontSize.sm * 1.5,
  },
});
