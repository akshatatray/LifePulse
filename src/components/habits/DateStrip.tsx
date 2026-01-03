import { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { DayData } from '../../types/habit';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 52;
const ITEM_MARGIN = 6;
const TOTAL_ITEM_WIDTH = ITEM_WIDTH + ITEM_MARGIN * 2;

interface DateStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  getCompletionRate?: (date: string) => number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Get local date string (YYYY-MM-DD) without timezone issues
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate days for the strip (5 days back, 2 days forward)
// Note: Full month history is a premium feature
const generateDays = (selectedDate: string): DayData[] => {
  const days: DayData[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Start from 5 days ago, only show 2 days into future
  for (let i = -5; i <= 2; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const dateString = getLocalDateString(date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
    
    days.push({
      date,
      dateString,
      dayName,
      dayNumber: date.getDate(),
      isToday: i === 0,
      isSelected: dateString === selectedDate,
      completionRate: 0,
    });
  }
  
  return days;
};

const DateItem = ({
  day,
  isSelected,
  completionRate,
  isFuture,
  onPress,
}: {
  day: DayData;
  isSelected: boolean;
  completionRate: number;
  isFuture: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100, easing: smoothEasing });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.dateItem, animatedStyle, isFuture && styles.dateItemFuture]}
    >
      <View
        style={[
          styles.dateItemInner,
          isSelected && styles.dateItemSelected,
          day.isToday && !isSelected && styles.dateItemToday,
          isFuture && !isSelected && styles.dateItemInnerFuture,
        ]}
      >
        <Text
          style={[
            styles.dayName,
            isSelected && styles.dayNameSelected,
            isFuture && !isSelected && styles.dayNameFuture,
          ]}
        >
          {day.dayName}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            isSelected && styles.dayNumberSelected,
            isFuture && !isSelected && styles.dayNumberFuture,
          ]}
        >
          {day.dayNumber}
        </Text>
        
        {/* Completion indicator - hide for future dates */}
        <View style={styles.indicatorContainer}>
          {isFuture ? (
            <View style={styles.futureDot} />
          ) : completionRate === 100 ? (
            <View style={styles.completedDot} />
          ) : completionRate > 0 ? (
            <View style={styles.partialDot} />
          ) : (
            <View style={styles.emptyDot} />
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
};

export const DateStrip = ({
  selectedDate,
  onSelectDate,
  getCompletionRate,
}: DateStripProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const days = generateDays(selectedDate);
  
  // Get today's date string for comparison (local time)
  const todayString = getLocalDateString(new Date());

  // Scroll to selected date on mount
  useEffect(() => {
    const selectedIndex = days.findIndex(d => d.dateString === selectedDate);
    if (selectedIndex >= 0 && scrollViewRef.current) {
      const scrollX = selectedIndex * TOTAL_ITEM_WIDTH - SCREEN_WIDTH / 2 + TOTAL_ITEM_WIDTH / 2;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: false });
      }, 100);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={TOTAL_ITEM_WIDTH}
      >
        {days.map((day) => (
          <DateItem
            key={day.dateString}
            day={day}
            isSelected={day.dateString === selectedDate}
            completionRate={getCompletionRate?.(day.dateString) ?? 0}
            isFuture={day.dateString > todayString}
            onPress={() => onSelectDate(day.dateString)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg - ITEM_MARGIN,
  },
  dateItem: {
    marginHorizontal: ITEM_MARGIN,
  },
  dateItemFuture: {
    opacity: 0.5,
  },
  dateItemInner: {
    width: ITEM_WIDTH,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.background.card,
  },
  dateItemInnerFuture: {
    backgroundColor: colors.background.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
  },
  dateItemSelected: {
    backgroundColor: colors.accent.success,
  },
  dateItemToday: {
    borderWidth: 1,
    borderColor: colors.accent.success,
  },
  dayName: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  dayNameSelected: {
    color: colors.text.inverse,
  },
  dayNameFuture: {
    color: colors.text.muted,
  },
  dayNumber: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  dayNumberSelected: {
    color: colors.text.inverse,
  },
  dayNumberFuture: {
    color: colors.text.muted,
  },
  indicatorContainer: {
    marginTop: spacing.sm,
    height: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.success,
  },
  partialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent.warning,
  },
  emptyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background.elevated,
  },
  futureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'transparent',
  },
});

