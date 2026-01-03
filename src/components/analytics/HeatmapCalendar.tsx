/**
 * HeatmapCalendar - GitHub-style contribution heatmap for habits
 * Shows completion rate for each day with cascading animation
 */

import { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { HeatmapMonth, getHeatmapColor } from '../../utils/analytics';

const CELL_SIZE = 10;
const CELL_GAP = 2;
const MONTH_GAP = 6; // Gap between months
const DAYS_IN_WEEK = 7;
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABEL_WIDTH = 24; // Width for day labels column

interface HeatmapCalendarProps {
  data: HeatmapMonth[];
  title?: string;
}

interface HeatmapCellProps {
  color: string;
  index: number;
  isFuture?: boolean;
}

const HeatmapCell = ({ color, index, isFuture }: HeatmapCellProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  const targetOpacity = isFuture ? 0.4 : 1;
  
  useEffect(() => {
    const delay = Math.min(index * 4, 400);
    
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.1, { duration: 80, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 80, easing: Easing.inOut(Easing.ease) })
      )
    );
    
    opacity.value = withDelay(
      delay,
      withTiming(targetOpacity, { duration: 120, easing: Easing.out(Easing.ease) })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  
  return (
    <Animated.View
      style={[
        styles.cell,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

// Type for processed day data
type DayData = { date: string; color: string; isFuture: boolean } | null;

// Process a single month into weeks
const processMonth = (month: HeatmapMonth): { weeks: DayData[][]; startDay: number } => {
  const firstDate = new Date(month.year, month.monthIndex, 1);
  const startDay = firstDate.getDay();
  const weeks: DayData[][] = [];
  let currentWeek: DayData[] = [];
  
  // Fill empty days before first day of month
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }
  
  // Add all days of the month
  month.days.forEach((day) => {
    currentWeek.push({
      date: day.date,
      color: day.color,
      isFuture: day.isFuture,
    });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Push remaining days as partial week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }
  
  return { weeks, startDay };
};

export const HeatmapCalendar = ({ data, title = 'Activity' }: HeatmapCalendarProps) => {
  let cellIndex = 0;
  
  // Process each month separately
  const processedMonths = data.map((month) => ({
    ...processMonth(month),
    name: month.month,
  }));
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.legend}>
          <Text style={styles.legendLabel}>Less</Text>
          {[0, 25, 50, 75, 100].map((val) => (
            <View
              key={val}
              style={[styles.legendCell, { backgroundColor: getHeatmapColor(val) }]}
            />
          ))}
          <Text style={styles.legendLabel}>More</Text>
        </View>
      </View>
      
      {/* Grid with day labels */}
      <View style={styles.gridWrapper}>
        {/* Day labels on left */}
        <View style={styles.dayLabelsColumn}>
          {/* Spacer to align with month label */}
          <View style={styles.dayLabelSpacer} />
          {DAY_LABELS.map((day, i) => (
            <View key={i} style={styles.dayLabelCell}>
              <Text style={styles.dayLabel}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Months grid */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gridScrollContent}
        >
          <View style={styles.monthsRow}>
            {processedMonths.map((month, monthIndex) => {
              // Transpose weeks to day rows for this month
              const dayRows: DayData[][] = Array(DAYS_IN_WEEK).fill(null).map(() => []);
              month.weeks.forEach((week) => {
                week.forEach((day, dayOfWeek) => {
                  dayRows[dayOfWeek].push(day);
                });
              });
              
              return (
                <View 
                  key={month.name} 
                  style={[
                    styles.monthBlock,
                    monthIndex < processedMonths.length - 1 && styles.monthBlockWithGap
                  ]}
                >
                  {/* Month label */}
                  <Text style={styles.monthLabel}>{month.name}</Text>
                  
                  {/* Month grid */}
                  <View style={styles.monthGrid}>
                    {dayRows.map((row, rowIndex) => (
                      <View key={rowIndex} style={styles.gridRow}>
                        {row.map((day, colIndex) => {
                          if (!day) {
                            return (
                              <View 
                                key={`empty-${monthIndex}-${rowIndex}-${colIndex}`} 
                                style={styles.emptyCell} 
                              />
                            );
                          }
                          
                          const currentCellIndex = cellIndex++;
                          return (
                            <HeatmapCell
                              key={day.date}
                              color={day.color}
                              index={currentCellIndex}
                              isFuture={day.isFuture}
                            />
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 9,
    color: colors.text.muted,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  dayLabelsColumn: {
    width: DAY_LABEL_WIDTH,
    marginRight: spacing.xs,
  },
  dayLabelSpacer: {
    height: 17, // Match month label height (fontSize 9 + marginBottom 4 + padding)
  },
  dayLabelCell: {
    height: CELL_SIZE,
    marginBottom: CELL_GAP,
    justifyContent: 'center',
  },
  dayLabel: {
    fontFamily: fontFamily.regular,
    fontSize: 8,
    color: colors.text.muted,
  },
  gridScrollContent: {
    flexGrow: 1,
  },
  monthsRow: {
    flexDirection: 'row',
  },
  monthBlock: {
    alignItems: 'flex-start',
  },
  monthBlockWithGap: {
    marginRight: MONTH_GAP,
  },
  monthLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 9,
    color: colors.text.secondary,
    marginBottom: 4,
    paddingLeft: 2,
  },
  monthGrid: {
    gap: CELL_GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  emptyCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
});
