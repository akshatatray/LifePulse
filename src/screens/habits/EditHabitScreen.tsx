import { Feather } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { HabitForm } from '../../components/habits/HabitForm';
import { notificationService } from '../../services/notifications';
import { useHabitStore } from '../../stores/habitStore';
import { borderRadius, colors, fontFamily, fontSize, spacing, textStyles } from '../../theme';
import { FrequencyConfig } from '../../types/habit';

interface ReminderConfig {
  enabled: boolean;
  times: string[];
}

interface HabitFormData {
  title: string;
  icon: string;
  color: string;
  frequencyConfig: FrequencyConfig;
  reminders: ReminderConfig;
}

type EditHabitRouteParams = {
  EditHabit: {
    habitId: string;
  };
};

export default function EditHabitScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<EditHabitRouteParams, 'EditHabit'>>();
  const insets = useSafeAreaInsets();

  const { habits, deleteHabit } = useHabitStore();
  const habit = habits.find((h) => h.id === route.params?.habitId);

  const [isDeleting, setIsDeleting] = useState(false);

  if (!habit) {
    return (
      <View style={[styles.container, styles.notFound, { paddingTop: Math.max(insets.top, spacing.xl) }]}>
        <Text style={styles.notFoundText}>Habit not found</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const handleSubmit = async (data: HabitFormData) => {
    const updatedHabit = {
      ...habit,
      title: data.title,
      icon: data.icon,
      color: data.color,
      frequencyConfig: data.frequencyConfig,
      reminders: data.reminders,
    };

    useHabitStore.setState((state) => ({
      habits: state.habits.map((h) =>
        h.id === habit.id ? updatedHabit : h
      ),
    }));

    // Update notifications
    await notificationService.updateHabitReminders(updatedHabit);

    navigation.goBack();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setIsDeleting(true);

            // Cancel any scheduled notifications for this habit
            await notificationService.cancelHabitReminders(habit.id);

            setTimeout(() => {
              deleteHabit(habit.id);
              navigation.goBack();
            }, 300);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, spacing.xl) }]}>
      {/* Drag Handle */}
      <View style={styles.dragHandleContainer}>
        <View style={styles.dragHandle} />
      </View>

      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.header}
      >
        <Pressable onPress={handleCancel} style={styles.closeButton}>
          <Feather name="x" size={24} color={colors.text.secondary} />
        </Pressable>
        <Text style={styles.title}>Edit Habit</Text>
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <Feather name="trash-2" size={20} color={colors.accent.error} />
        </Pressable>
      </Animated.View>

      {/* Form */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.formContainer}
      >
        <HabitForm
          initialData={{
            title: habit.title,
            icon: habit.icon,
            color: habit.color,
            frequencyConfig: habit.frequencyConfig,
            reminders: habit.reminders,
          }}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Save Changes"
          isLoading={isDeleting}
        />
      </Animated.View>

      {/* Stats Section */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={styles.statsSection}
      >
        <Text style={styles.statsTitle}>Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habit.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habit.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{habit.totalCompletions}</Text>
            <Text style={styles.statLabel}>Total Done</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  notFound: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.text.muted,
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent.error + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  statsSection: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.secondary,
  },
  statsTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.default,
  },
});

