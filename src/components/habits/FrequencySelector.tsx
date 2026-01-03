/**
 * FrequencySelector Component
 * Main component for selecting habit frequency with multiple modes
 */

import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { FrequencyConfig, DayOfWeek } from '../../types/habit';
import { DayBubbles } from './DayBubbles';
import { TimesPerWeekPicker } from './TimesPerWeekPicker';
import { getFrequencyDescription, ALL_DAYS } from '../../utils/frequency';

// Frequency type options
type FrequencyType = 'daily' | 'specific_days' | 'x_times_per_period';

interface FrequencyOption {
  type: FrequencyType;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    type: 'daily',
    label: 'Every Day',
    description: 'Build a daily habit',
    icon: 'sun',
  },
  {
    type: 'specific_days',
    label: 'Specific Days',
    description: 'Choose which days',
    icon: 'calendar',
  },
  {
    type: 'x_times_per_period',
    label: 'Flexible',
    description: 'X times per week',
    icon: 'target',
  },
];

interface FrequencySelectorProps {
  value: FrequencyConfig;
  onChange: (config: FrequencyConfig) => void;
  accentColor?: string;
}

export const FrequencySelector = ({
  value,
  onChange,
  accentColor = colors.accent.success,
}: FrequencySelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  // Determine active type from value
  const activeType: FrequencyType = value.type === 'interval' ? 'daily' : value.type;

  // Handle type change
  const handleTypeChange = (type: FrequencyType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (type) {
      case 'daily':
        onChange({ type: 'daily' });
        break;
      case 'specific_days':
        onChange({ type: 'specific_days', days: [...ALL_DAYS] });
        break;
      case 'x_times_per_period':
        onChange({ type: 'x_times_per_period', timesPerPeriod: { times: 3, period: 'week' } });
        break;
    }
  };

  // Handle day changes for specific_days
  const handleDaysChange = (days: DayOfWeek[]) => {
    onChange({ type: 'specific_days', days });
  };

  // Handle exception days for daily
  const handleExceptionsChange = (exceptions: DayOfWeek[]) => {
    onChange({ type: 'daily', exceptions: exceptions.length > 0 ? exceptions : undefined });
  };

  // Handle times per period changes
  const handleTimesChange = (times: number) => {
    onChange({
      type: 'x_times_per_period',
      timesPerPeriod: { times, period: value.timesPerPeriod?.period ?? 'week' },
    });
  };

  const handlePeriodChange = (period: 'week' | 'month') => {
    onChange({
      type: 'x_times_per_period',
      timesPerPeriod: { times: value.timesPerPeriod?.times ?? 3, period },
    });
  };

  // Get currently selected exceptions (inverse of ALL_DAYS minus exceptions)
  const getExceptionDays = (): DayOfWeek[] => {
    return value.exceptions ?? [];
  };

  // For daily mode, show days to EXCLUDE
  const getDailySelectedDays = (): DayOfWeek[] => {
    const exceptions = value.exceptions ?? [];
    return ALL_DAYS.filter((day) => !exceptions.includes(day));
  };

  const handleDailyDaysChange = (selectedDays: DayOfWeek[]) => {
    const exceptions = ALL_DAYS.filter((day) => !selectedDays.includes(day));
    onChange({ type: 'daily', exceptions: exceptions.length > 0 ? exceptions : undefined });
  };

  return (
    <View style={styles.container}>
      {/* Current selection summary */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setIsExpanded(!isExpanded);
        }}
        style={[styles.summaryButton, { borderColor: accentColor + '40' }]}
      >
        <View style={styles.summaryContent}>
          <View style={[styles.summaryIcon, { backgroundColor: accentColor + '20' }]}>
            <Feather
              name={FREQUENCY_OPTIONS.find((o) => o.type === activeType)?.icon ?? 'calendar'}
              size={20}
              color={accentColor}
            />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Frequency</Text>
            <Text style={[styles.summaryValue, { color: accentColor }]}>
              {getFrequencyDescription(value)}
            </Text>
          </View>
        </View>
        <Feather
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </Pressable>

      {/* Expanded options */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.expandedSection}
        >
          {/* Type selector tabs */}
          <View style={styles.typeSelector}>
            {FREQUENCY_OPTIONS.map((option) => (
              <TypeTab
                key={option.type}
                option={option}
                isActive={activeType === option.type}
                onPress={() => handleTypeChange(option.type)}
                accentColor={accentColor}
              />
            ))}
          </View>

          {/* Type-specific content */}
          <View style={styles.typeContent}>
            {activeType === 'daily' && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text style={styles.sectionTitle}>Active Days</Text>
                <Text style={styles.sectionHint}>
                  Tap days to exclude them from your streak
                </Text>
                <DayBubbles
                  selectedDays={getDailySelectedDays()}
                  onDaysChange={handleDailyDaysChange}
                  accentColor={accentColor}
                  showPresets={true}
                />
              </Animated.View>
            )}

            {activeType === 'specific_days' && (
              <Animated.View entering={FadeIn.duration(200)}>
                <Text style={styles.sectionTitle}>Choose Days</Text>
                <Text style={styles.sectionHint}>
                  Select which days you want to do this habit
                </Text>
                <DayBubbles
                  selectedDays={value.days ?? []}
                  onDaysChange={handleDaysChange}
                  accentColor={accentColor}
                  showPresets={true}
                />
              </Animated.View>
            )}

            {activeType === 'x_times_per_period' && (
              <Animated.View entering={FadeIn.duration(200)}>
                <TimesPerWeekPicker
                  times={value.timesPerPeriod?.times ?? 3}
                  period={value.timesPerPeriod?.period ?? 'week'}
                  onTimesChange={handleTimesChange}
                  onPeriodChange={handlePeriodChange}
                  accentColor={accentColor}
                />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
};

// Type tab component
interface TypeTabProps {
  option: FrequencyOption;
  isActive: boolean;
  onPress: () => void;
  accentColor: string;
}

const TypeTab = ({ option, isActive, onPress, accentColor }: TypeTabProps) => {
  const scale = useSharedValue(1);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.typeTabWrapper, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.95, { duration: 100, easing: smoothEasing });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
        }}
        style={[
          styles.typeTab,
          isActive && { backgroundColor: accentColor + '15', borderColor: accentColor },
        ]}
      >
        <Feather
          name={option.icon}
          size={18}
          color={isActive ? accentColor : colors.text.muted}
        />
        <Text
          style={[
            styles.typeTabLabel,
            isActive && { color: accentColor },
          ]}
        >
          {option.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  summaryValue: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
  },
  expandedSection: {
    marginTop: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeTabWrapper: {
    flex: 1,
  },
  typeTab: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeTabLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  typeContent: {
    minHeight: 120,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
});

