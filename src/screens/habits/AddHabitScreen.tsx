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

interface HabitFormData {
  title: string;
  icon: string;
  color: string;
  frequencyConfig: FrequencyConfig;
  reminders: { enabled: boolean; times: string[] };
}

export default function AddHabitScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const addHabit = useHabitStore((state) => state.addHabit);

  const handleSubmit = async (data: HabitFormData) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Create the habit with all required fields
    const newHabit = addHabit({
      title: data.title.trim(),
      icon: data.icon,
      color: data.color,
      frequencyConfig: data.frequencyConfig,
      reminders: data.reminders,
    });
    
    // Schedule notifications if reminders are enabled
    if (data.reminders.enabled && data.reminders.times.length > 0) {
      await notificationService.scheduleHabitReminders(newHabit);
    }
    
    navigation.goBack();
  };

  const handleCancel = () => {
    Haptics.selectionAsync();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with drag indicator */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <View style={styles.dragIndicator} />
        <View style={styles.headerRow}>
          <Pressable onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New Habit</Text>
          <View style={styles.cancelButton} />
        </View>
      </Animated.View>

      {/* Form */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.content}>
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
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  header: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border.subtle,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...textStyles.titleLarge,
    color: colors.text.primary,
  },
  cancelButton: {
    minWidth: 60,
    alignItems: 'flex-start',
  },
  cancelText: {
    ...textStyles.bodyLarge,
    color: colors.accent.success,
  },
  content: {
    flex: 1,
  },
});
