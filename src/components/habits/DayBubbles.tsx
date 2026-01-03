/**
 * DayBubbles Component
 * Interactive day of week selector with animated bubbles (M T W T F S S)
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { DayOfWeek } from '../../types/habit';

// Define days in correct order - this is the canonical order
const DAYS_IN_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Day labels for display - single letter
const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'M',
  Tue: 'T',
  Wed: 'W',
  Thu: 'T',
  Fri: 'F',
  Sat: 'S',
  Sun: 'S',
};

interface DayBubbleProps {
  day: DayOfWeek;
  isSelected: boolean;
  onToggle: (day: DayOfWeek) => void;
  accentColor: string;
}

const DayBubble = ({ day, isSelected, onToggle, accentColor }: DayBubbleProps) => {
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isSelected ? accentColor : 'transparent',
      { duration: 200, easing: smoothEasing }
    ),
    borderColor: withTiming(
      isSelected ? accentColor : colors.border.default,
      { duration: 200, easing: smoothEasing }
    ),
    opacity: withTiming(
      isSelected ? 1 : 0.4,
      { duration: 200, easing: smoothEasing }
    ),
  }), [isSelected, accentColor]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    color: withTiming(
      isSelected ? colors.text.inverse : colors.text.muted,
      { duration: 200, easing: smoothEasing }
    ),
  }), [isSelected]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(day);
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.bubble, animatedContainerStyle]}>
        <Animated.Text style={[styles.bubbleText, animatedTextStyle]}>
          {DAY_LABELS[day]}
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

interface DayBubblesProps {
  selectedDays: DayOfWeek[];
  onDaysChange: (days: DayOfWeek[]) => void;
  accentColor?: string;
  label?: string;
  showPresets?: boolean;
}

export const DayBubbles = ({
  selectedDays,
  onDaysChange,
  accentColor = colors.accent.success,
  label,
  showPresets = true,
}: DayBubblesProps) => {
  
  const handleToggle = (day: DayOfWeek) => {
    if (selectedDays.includes(day)) {
      // Remove day - maintain order by filtering
      const newDays = DAYS_IN_ORDER.filter(d => 
        selectedDays.includes(d) && d !== day
      );
      onDaysChange(newDays);
    } else {
      // Add day - maintain order by rebuilding from DAYS_IN_ORDER
      const newDays = DAYS_IN_ORDER.filter(d => 
        selectedDays.includes(d) || d === day
      );
      onDaysChange(newDays);
    }
  };

  const handlePreset = (preset: 'all' | 'weekdays' | 'weekends') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (preset) {
      case 'all':
        onDaysChange([...DAYS_IN_ORDER]);
        break;
      case 'weekdays':
        onDaysChange(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
        break;
      case 'weekends':
        onDaysChange(['Sat', 'Sun']);
        break;
    }
  };

  const isPresetActive = (preset: 'all' | 'weekdays' | 'weekends'): boolean => {
    const selected = new Set(selectedDays);
    switch (preset) {
      case 'all':
        return selected.size === 7;
      case 'weekdays':
        return selected.size === 5 && 
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].every(d => selected.has(d as DayOfWeek));
      case 'weekends':
        return selected.size === 2 && 
          selected.has('Sat') && selected.has('Sun');
      default:
        return false;
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      {/* Day bubbles - always in M T W T F S S order */}
      <View style={styles.bubblesRow}>
        {DAYS_IN_ORDER.map((day) => (
          <DayBubble
            key={day}
            day={day}
            isSelected={selectedDays.includes(day)}
            onToggle={handleToggle}
            accentColor={accentColor}
          />
        ))}
      </View>

      {/* Presets */}
      {showPresets && (
        <View style={styles.presetsRow}>
          <Pressable
            onPress={() => handlePreset('all')}
            style={[
              styles.presetButton,
              isPresetActive('all') && { backgroundColor: accentColor + '20' },
            ]}
          >
            <Text
              style={[
                styles.presetText,
                isPresetActive('all') && { color: accentColor },
              ]}
            >
              Every day
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => handlePreset('weekdays')}
            style={[
              styles.presetButton,
              isPresetActive('weekdays') && { backgroundColor: accentColor + '20' },
            ]}
          >
            <Text
              style={[
                styles.presetText,
                isPresetActive('weekdays') && { color: accentColor },
              ]}
            >
              Weekdays
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => handlePreset('weekends')}
            style={[
              styles.presetButton,
              isPresetActive('weekends') && { backgroundColor: accentColor + '20' },
            ]}
          >
            <Text
              style={[
                styles.presetText,
                isPresetActive('weekends') && { color: accentColor },
              ]}
            >
              Weekends
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  bubblesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  bubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.elevated,
  },
  presetText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
});
