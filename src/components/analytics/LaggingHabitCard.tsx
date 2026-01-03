/**
 * LaggingHabitCard - Shows habits that need attention with suggestions
 */

import { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { LaggingHabit } from '../../utils/analytics';

interface LaggingHabitCardProps {
  laggingHabits: LaggingHabit[];
  title?: string;
  onHabitPress?: (habitId: string) => void;
}

interface HabitRowProps {
  item: LaggingHabit;
  index: number;
  onPress?: () => void;
}

const HabitRow = ({ item, index, onPress }: HabitRowProps) => {
  const progressWidth = useSharedValue(0);
  
  useEffect(() => {
    progressWidth.value = withDelay(
      index * 150 + 300,
      withSpring(item.completionRate, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, [item.completionRate]);
  
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));
  
  // Determine color based on completion rate
  const getProgressColor = (rate: number) => {
    if (rate < 30) return colors.accent.error;
    if (rate < 60) return colors.accent.warning;
    return colors.accent.success;
  };
  
  const progressColor = getProgressColor(item.completionRate);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };
  
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400)}
    >
      <Pressable
        style={styles.habitRow}
        onPress={handlePress}
      >
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: item.habit.color + '20' }]}>
          <Text style={styles.icon}>{item.habit.icon}</Text>
        </View>
        
        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowHeader}>
            <Text style={styles.habitTitle} numberOfLines={1}>
              {item.habit.title}
            </Text>
            <Text style={[styles.rateText, { color: progressColor }]}>
              {item.completionRate}%
            </Text>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: progressColor },
                progressAnimatedStyle,
              ]}
            />
          </View>
          
          {/* Stats */}
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>
              {item.completedDays}/{item.totalDays} days this week
            </Text>
          </View>
        </View>
        
        {/* Arrow */}
        <Feather name="chevron-right" size={20} color={colors.text.muted} />
      </Pressable>
      
      {/* Suggestion */}
      <View style={styles.suggestionContainer}>
        <Feather name="zap" size={14} color={colors.accent.warning} />
        <Text style={styles.suggestionText}>{item.suggestion}</Text>
      </View>
    </Animated.View>
  );
};

export const LaggingHabitCard = ({
  laggingHabits,
  title = 'Needs Attention',
  onHabitPress,
}: LaggingHabitCardProps) => {
  if (laggingHabits.length === 0) {
    return null;
  }
  
  // Filter to show habits that actually need attention (< 70%)
  const habitsThatNeedAttention = laggingHabits.filter(h => h.completionRate < 70);
  
  if (habitsThatNeedAttention.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Feather name="trending-up" size={20} color={colors.accent.success} />
            <Text style={styles.title}>All Habits On Track!</Text>
          </View>
        </View>
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successText}>
            All your habits are above 70% this week. Keep it up!
          </Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Feather name="alert-circle" size={20} color={colors.accent.warning} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.subtitle}>
          {habitsThatNeedAttention.length} habit{habitsThatNeedAttention.length > 1 ? 's' : ''} below target
        </Text>
      </View>
      
      {/* Habits list */}
      <View style={styles.habitsList}>
        {habitsThatNeedAttention.map((item, index) => (
          <HabitRow
            key={item.habit.id}
            item={item}
            index={index}
            onPress={() => onHabitPress?.(item.habit.id)}
          />
        ))}
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
  },
  habitsList: {
    gap: spacing.md,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 22,
  },
  rowContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  habitTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  rateText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.background.elevated,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  suggestionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.accent.warning + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    marginLeft: 44 + spacing.md, // Align with content
  },
  suggestionText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: fontSize.xs * 1.4,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  successText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

