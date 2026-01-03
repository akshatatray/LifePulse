import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';
import { FrequencyConfig } from '../../types/habit';
import { getFrequencyDescription } from '../../utils/frequency';
import { Input } from '../ui';
import { ColorPicker } from './ColorPicker';
import { FrequencySelector } from './FrequencySelector';
import { IconPicker } from './IconPicker';
import { ReminderSelector } from './ReminderSelector';

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

interface HabitFormProps {
  initialData?: Partial<HabitFormData>;
  onSubmit: (data: HabitFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export const HabitForm = ({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Create Habit',
  isLoading = false,
}: HabitFormProps) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState(initialData?.title || '');
  const [icon, setIcon] = useState(initialData?.icon || '🎯');
  const [color, setColor] = useState(initialData?.color || colors.habitColors[0]);
  const [frequencyConfig, setFrequencyConfig] = useState<FrequencyConfig>(
    initialData?.frequencyConfig || { type: 'daily' }
  );
  const [reminders, setReminders] = useState<ReminderConfig>(
    initialData?.reminders || { enabled: false, times: [] }
  );
  const [errors, setErrors] = useState<{ title?: string }>({});

  const titleInputRef = useRef<RNTextInput>(null);
  const shakeX = useSharedValue(0);

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const validate = (): boolean => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Please enter a habit name';
    } else if (title.trim().length < 2) {
      newErrors.title = 'Habit name must be at least 2 characters';
    } else if (title.trim().length > 50) {
      newErrors.title = 'Habit name must be less than 50 characters';
    }

    // Validate frequency config
    if (frequencyConfig.type === 'specific_days') {
      if (!frequencyConfig.days || frequencyConfig.days.length === 0) {
        newErrors.title = 'Please select at least one day';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      shake();
      titleInputRef.current?.focus();
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    onSubmit({
      title: title.trim(),
      icon,
      color,
      frequencyConfig,
      reminders,
    });
  };

  // Get frequency description for preview
  const frequencyText = getFrequencyDescription(frequencyConfig);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={formAnimatedStyle}>
          {/* Preview Card */}
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={[styles.previewIcon, { backgroundColor: color + '20' }]}>
                <Text style={styles.previewIconText}>{icon}</Text>
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle} numberOfLines={1}>
                  {title || 'Your habit name'}
                </Text>
                <Text style={styles.previewMeta}>
                  {frequencyText} · 0 day streak
                </Text>
              </View>
              <View style={[styles.previewDot, { backgroundColor: color }]} />
            </View>
          </View>

          {/* Habit Name */}
          <Input
            ref={titleInputRef}
            label="Habit Name"
            placeholder="e.g., Morning meditation, Read 30 min..."
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setErrors({});
            }}
            error={errors.title}
            maxLength={50}
            autoFocus
          />

          {/* Character count */}
          <Text style={styles.charCount}>{title.length}/50</Text>

          {/* Icon Picker */}
          <IconPicker selectedIcon={icon} onSelectIcon={setIcon} />

          {/* Color Picker */}
          <ColorPicker selectedColor={color} onSelectColor={setColor} />

          {/* Frequency Selector */}
          <FrequencySelector
            value={frequencyConfig}
            onChange={setFrequencyConfig}
            accentColor={color}
          />

          {/* Reminder Selector */}
          <ReminderSelector
            value={reminders}
            onChange={setReminders}
            accentColor={color}
          />
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <Button
          title="Cancel"
          variant="ghost"
          onPress={onCancel}
          style={styles.cancelButton}
        />
        <Button
          title={submitLabel}
          onPress={handleSubmit}
          loading={isLoading}
          style={styles.submitButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  previewSection: {
    marginBottom: spacing.xl,
  },
  previewLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  previewCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  previewIconText: {
    fontSize: 24,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  previewMeta: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  charCount: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'right',
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.primary,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
