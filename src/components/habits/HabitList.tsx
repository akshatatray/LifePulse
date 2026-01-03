import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Habit, HabitLog } from '../../types/habit';
import { SwipeableHabitCard } from './SwipeableHabitCard';
import { colors, spacing, textStyles } from '../../theme';

interface HabitListProps {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  onComplete: (habitId: string) => void;
  onSkip: (habitId: string) => void;
  onUndo: (habitId: string) => void;
  onHabitPress?: (habit: Habit) => void;
  isEditable?: boolean; // Whether cards can be swiped (only true for today)
  isFutureDate?: boolean; // Whether the selected date is in the future
}

export const HabitList = ({
  habits,
  logs,
  selectedDate,
  onComplete,
  onSkip,
  onUndo,
  onHabitPress,
  isEditable = true,
  isFutureDate = false,
}: HabitListProps) => {
  // For future dates, show all habits as pending (no completion data exists)
  // For past/today, separate pending and completed habits
  const pendingHabits = isFutureDate 
    ? habits 
    : habits.filter(habit => {
        const log = logs.find(l => l.habitId === habit.id && l.date === selectedDate);
        return !log || log.status === 'pending';
      });
  
  const completedHabits = isFutureDate 
    ? [] 
    : habits.filter(habit => {
        const log = logs.find(l => l.habitId === habit.id && l.date === selectedDate);
        return log?.status === 'completed' || log?.status === 'skipped';
      });

  const getLog = (habitId: string): HabitLog | undefined => {
    // For future dates, return undefined (no logs exist)
    if (isFutureDate) return undefined;
    return logs.find(l => l.habitId === habitId && l.date === selectedDate);
  };

  return (
    <View style={styles.container}>
      {/* Pending habits */}
      {pendingHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            To Do · {pendingHabits.length}
          </Text>
          {pendingHabits.map((habit, index) => (
            <Animated.View
              key={habit.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <SwipeableHabitCard
                habit={habit}
                log={getLog(habit.id)}
                onComplete={() => onComplete(habit.id)}
                onSkip={() => onSkip(habit.id)}
                onUndo={() => onUndo(habit.id)}
                onPress={() => onHabitPress?.(habit)}
                isEditable={isEditable}
                isFutureDate={isFutureDate}
              />
            </Animated.View>
          ))}
        </View>
      )}

      {/* Completed habits */}
      {completedHabits.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Done · {completedHabits.length}
          </Text>
          {completedHabits.map((habit, index) => (
            <Animated.View
              key={habit.id}
              entering={FadeInDown.delay(index * 50).duration(300)}
            >
              <SwipeableHabitCard
                habit={habit}
                log={getLog(habit.id)}
                onComplete={() => onComplete(habit.id)}
                onSkip={() => onSkip(habit.id)}
                onUndo={() => onUndo(habit.id)}
                onPress={() => onHabitPress?.(habit)}
                isEditable={isEditable}
                isFutureDate={isFutureDate}
              />
            </Animated.View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.labelMedium,
    color: colors.text.muted,
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
});

