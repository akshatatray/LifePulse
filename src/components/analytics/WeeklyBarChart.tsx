/**
 * WeeklyBarChart - Animated bar chart showing last 7 days of completion
 */

import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { WeekDay, getHeatmapColor } from '../../utils/analytics';

interface WeeklyBarChartProps {
  data: WeekDay[];
  title?: string;
}

interface BarProps {
  day: WeekDay;
  index: number;
  maxHeight: number;
  isToday: boolean;
}

const BAR_WIDTH = 32;
const MAX_BAR_HEIGHT = 120;

const Bar = ({ day, index, maxHeight, isToday }: BarProps) => {
  const height = useSharedValue(0);
  const opacity = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  
  const targetHeight = (day.percentage / 100) * maxHeight;
  
  useEffect(() => {
    // Staggered animation for bars growing up
    const delay = index * 100;
    
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 200 })
    );
    
    height.value = withDelay(
      delay + 100,
      withSpring(targetHeight, {
        damping: 12,
        stiffness: 100,
        mass: 0.8,
      })
    );
    
    labelOpacity.value = withDelay(
      delay + 300,
      withTiming(1, { duration: 200 })
    );
  }, [targetHeight]);
  
  const barAnimatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));
  
  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));
  
  const barColor = day.percentage === 100 
    ? colors.accent.success 
    : day.percentage > 0 
      ? getHeatmapColor(day.percentage)
      : colors.background.elevated;
  
  return (
    <View style={styles.barContainer}>
      {/* Percentage label */}
      <Animated.Text style={[styles.percentageLabel, labelAnimatedStyle]}>
        {day.percentage > 0 ? `${day.percentage}%` : '—'}
      </Animated.Text>
      
      {/* Bar track */}
      <View style={[styles.barTrack, { height: maxHeight }]}>
        <Animated.View
          style={[
            styles.bar,
            { backgroundColor: barColor },
            barAnimatedStyle,
          ]}
        />
      </View>
      
      {/* Day label */}
      <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
        {day.shortDay}
      </Text>
      
      {/* Today indicator */}
      {isToday && <View style={styles.todayDot} />}
    </View>
  );
};

export const WeeklyBarChart = ({ data, title = 'This Week' }: WeeklyBarChartProps) => {
  // Get today's date string
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Calculate average
  const average = Math.round(
    data.reduce((sum, d) => sum + d.percentage, 0) / data.length
  );
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.averageContainer}>
          <Text style={styles.averageLabel}>Avg</Text>
          <Text style={styles.averageValue}>{average}%</Text>
        </View>
      </View>
      
      {/* Chart */}
      <View style={styles.chartContainer}>
        {data.map((day, index) => (
          <Bar
            key={day.date}
            day={day}
            index={index}
            maxHeight={MAX_BAR_HEIGHT}
            isToday={day.date === todayString}
          />
        ))}
      </View>
      
      {/* Completion summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {data.filter(d => d.percentage === 100).length}
          </Text>
          <Text style={styles.summaryLabel}>Perfect days</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {data.reduce((sum, d) => sum + d.completed, 0)}
          </Text>
          <Text style={styles.summaryLabel}>Habits done</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {data.filter(d => d.percentage > 0).length}
          </Text>
          <Text style={styles.summaryLabel}>Active days</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  averageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  averageLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  averageValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.accent.success,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.lg,
  },
  barContainer: {
    alignItems: 'center',
    width: BAR_WIDTH,
  },
  percentageLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    height: 14,
  },
  barTrack: {
    width: BAR_WIDTH,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.sm,
  },
  dayLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.sm,
  },
  dayLabelToday: {
    color: colors.accent.success,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.success,
    marginTop: spacing.xs,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.subtle,
  },
});

