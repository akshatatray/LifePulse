/**
 * TimesPerWeekPicker Component
 * Slider/stepper to select how many times per week/month
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TimesPerWeekPickerProps {
  times: number;
  period: 'week' | 'month';
  onTimesChange: (times: number) => void;
  onPeriodChange: (period: 'week' | 'month') => void;
  accentColor?: string;
  minTimes?: number;
  maxTimes?: number;
}

export const TimesPerWeekPicker = ({
  times,
  period,
  onTimesChange,
  onPeriodChange,
  accentColor = colors.accent.success,
  minTimes = 1,
  maxTimes = 7,
}: TimesPerWeekPickerProps) => {
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  // Button animations
  const minusScale = useSharedValue(1);
  const plusScale = useSharedValue(1);

  const minusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: minusScale.value }],
  }));

  const plusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plusScale.value }],
  }));

  const handleDecrement = () => {
    if (times > minTimes) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTimesChange(times - 1);
    }
  };

  const handleIncrement = () => {
    const max = period === 'week' ? Math.min(maxTimes, 7) : Math.min(maxTimes, 30);
    if (times < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onTimesChange(times + 1);
    }
  };

  const handlePeriodToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newPeriod = period === 'week' ? 'month' : 'week';
    onPeriodChange(newPeriod);
    // Adjust times if switching to week and times > 7
    if (newPeriod === 'week' && times > 7) {
      onTimesChange(7);
    }
  };

  const maxForPeriod = period === 'week' ? 7 : 30;

  return (
    <View style={styles.container}>
      {/* Counter section */}
      <View style={styles.counterSection}>
        {/* Minus button */}
        <AnimatedPressable
          onPress={handleDecrement}
          onPressIn={() => {
            minusScale.value = withTiming(0.9, { duration: 100, easing: smoothEasing });
          }}
          onPressOut={() => {
            minusScale.value = withTiming(1, { duration: 150, easing: smoothEasing });
          }}
          style={[
            styles.counterButton,
            minusStyle,
            times <= minTimes && styles.counterButtonDisabled,
          ]}
          disabled={times <= minTimes}
        >
          <Feather
            name="minus"
            size={20}
            color={times <= minTimes ? colors.text.muted : colors.text.primary}
          />
        </AnimatedPressable>

        {/* Counter display */}
        <View style={styles.counterDisplay}>
          <Text style={[styles.counterNumber, { color: accentColor }]}>
            {times}
          </Text>
          <Text style={styles.counterLabel}>
            {times === 1 ? 'time' : 'times'}
          </Text>
        </View>

        {/* Plus button */}
        <AnimatedPressable
          onPress={handleIncrement}
          onPressIn={() => {
            plusScale.value = withTiming(0.9, { duration: 100, easing: smoothEasing });
          }}
          onPressOut={() => {
            plusScale.value = withTiming(1, { duration: 150, easing: smoothEasing });
          }}
          style={[
            styles.counterButton,
            plusStyle,
            times >= maxForPeriod && styles.counterButtonDisabled,
          ]}
          disabled={times >= maxForPeriod}
        >
          <Feather
            name="plus"
            size={20}
            color={times >= maxForPeriod ? colors.text.muted : colors.text.primary}
          />
        </AnimatedPressable>
      </View>

      {/* Period toggle */}
      <View style={styles.periodSection}>
        <Text style={styles.perLabel}>per</Text>
        
        <View style={styles.periodToggle}>
          <Pressable
            onPress={() => {
              if (period !== 'week') handlePeriodToggle();
            }}
            style={[
              styles.periodOption,
              period === 'week' && { backgroundColor: accentColor },
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === 'week' && { color: colors.text.inverse },
              ]}
            >
              Week
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => {
              if (period !== 'month') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPeriodChange('month');
              }
            }}
            style={[
              styles.periodOption,
              period === 'month' && { backgroundColor: accentColor },
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === 'month' && { color: colors.text.inverse },
              ]}
            >
              Month
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Hint text */}
      <Text style={styles.hintText}>
        Complete this habit {times} {times === 1 ? 'time' : 'times'} per {period}.
        {'\n'}Any day you choose counts!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  counterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  counterButtonDisabled: {
    opacity: 0.5,
  },
  counterDisplay: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  counterNumber: {
    fontFamily: fontFamily.extraBold,
    fontSize: 48,
    lineHeight: 56,
  },
  counterLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: -spacing.xs,
  },
  periodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  perLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.secondary,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.full,
    padding: 4,
  },
  periodOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  periodText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  hintText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});

