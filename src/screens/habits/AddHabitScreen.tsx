import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HabitForm } from '../../components/habits/HabitForm';
import { notificationService } from '../../services/notifications';
import { useHabitStore } from '../../stores/habitStore';
import { borderRadius, colors, spacing, textStyles } from '../../theme';
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

export default function AddHabitScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const addHabit = useHabitStore((state) => state.addHabit);

  const handleSubmit = async (data: HabitFormData) => {
    // Create the habit
    const newHabit = addHabit({
      title: data.title,
      icon: data.icon,
      color: data.color,
      frequencyConfig: data.frequencyConfig,
      reminders: data.reminders,
    });

    // Schedule notifications if reminders are enabled
    if (data.reminders.enabled && data.reminders.times.length > 0 && newHabit) {
      await notificationService.scheduleHabitReminders(newHabit);
    }

    navigation.goBack();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
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
        <Text style={styles.title}>New Habit</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      {/* Form */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.formContainer}
      >
        <HabitForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Create Habit"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
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
  title: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 32,
  },
  formContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
});
