/**
 * Frequency Utility Functions
 * Handles habit scheduling logic and streak calculations
 */

import { FrequencyConfig } from '../types/habit';

// Day of week type
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// All days constant
export const ALL_DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Day labels for display
export const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'M',
  Tue: 'T',
  Wed: 'W',
  Thu: 'T',
  Fri: 'F',
  Sat: 'S',
  Sun: 'S',
};

// Full day names
export const DAY_NAMES: Record<DayOfWeek, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

/**
 * Get the day of week from a date string (YYYY-MM-DD)
 */
export const getDayOfWeek = (dateString: string): DayOfWeek => {
  const date = new Date(dateString + 'T12:00:00'); // Add time to avoid timezone issues
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayIndex];
};

/**
 * Check if a habit is active for a specific date based on its frequency config
 */
export const isHabitActiveForDate = (
  frequencyConfig: FrequencyConfig,
  dateString: string
): boolean => {
  const dayOfWeek = getDayOfWeek(dateString);

  switch (frequencyConfig.type) {
    case 'daily':
      // Check if this day is in exceptions
      if (frequencyConfig.exceptions?.includes(dayOfWeek)) {
        return false;
      }
      return true;

    case 'specific_days':
      // Check if this day is in the selected days
      return frequencyConfig.days?.includes(dayOfWeek) ?? false;

    case 'x_times_per_period':
      // For X times per week, the habit is technically "available" every day
      // The completion tracking handles whether they've hit their target
      return true;

    case 'interval':
      // For interval-based (every X days), we need a start date to calculate
      // For now, return true and handle in completion logic
      return true;

    default:
      return true;
  }
};

/**
 * Get a human-readable description of the frequency
 */
export const getFrequencyDescription = (frequencyConfig: FrequencyConfig): string => {
  switch (frequencyConfig.type) {
    case 'daily':
      if (frequencyConfig.exceptions && frequencyConfig.exceptions.length > 0) {
        const numExceptions = frequencyConfig.exceptions.length;
        const numActiveDays = 7 - numExceptions;
        
        // If few days are active (3 or less), say "Only on Mon, Tue"
        if (numActiveDays <= 3) {
          const activeDays = ALL_DAYS.filter(d => !frequencyConfig.exceptions!.includes(d));
          
          if (activeDays.length === 1) {
            return `Only on ${activeDays[0]}`;
          }
          if (activeDays.length === 2 && 
              activeDays.includes('Sat') && activeDays.includes('Sun')) {
            return 'Weekends only';
          }
          return `Only on ${activeDays.join(', ')}`;
        }
        
        // If only 1-2 exceptions, say "Daily except Mon"
        if (numExceptions <= 2) {
          const exceptDays = frequencyConfig.exceptions.join(' & ');
          return `Daily except ${exceptDays}`;
        }
        
        // Check for weekdays pattern
        const activeDays = ALL_DAYS.filter(d => !frequencyConfig.exceptions!.includes(d));
        if (activeDays.length === 5 && 
            !activeDays.includes('Sat') && !activeDays.includes('Sun')) {
          return 'Weekdays';
        }
        
        // Otherwise list active days
        return activeDays.join(' · ');
      }
      return 'Every day';

    case 'specific_days':
      if (!frequencyConfig.days || frequencyConfig.days.length === 0) {
        return 'No days selected';
      }
      if (frequencyConfig.days.length === 7) {
        return 'Every day';
      }
      if (frequencyConfig.days.length === 5 && 
          !frequencyConfig.days.includes('Sat') && 
          !frequencyConfig.days.includes('Sun')) {
        return 'Weekdays';
      }
      if (frequencyConfig.days.length === 2 && 
          frequencyConfig.days.includes('Sat') && 
          frequencyConfig.days.includes('Sun')) {
        return 'Weekends';
      }
      // If only 1-3 days, say "Only on Mon, Tue"
      if (frequencyConfig.days.length <= 3) {
        if (frequencyConfig.days.length === 1) {
          return `Only on ${frequencyConfig.days[0]}`;
        }
        return `Only on ${frequencyConfig.days.join(', ')}`;
      }
      // Show abbreviated days
      return frequencyConfig.days.join(' · ');

    case 'x_times_per_period':
      const times = frequencyConfig.timesPerPeriod?.times ?? 1;
      const period = frequencyConfig.timesPerPeriod?.period ?? 'week';
      return `${times}x per ${period}`;

    case 'interval':
      const interval = frequencyConfig.interval ?? 1;
      if (interval === 1) return 'Every day';
      if (interval === 2) return 'Every other day';
      return `Every ${interval} days`;

    default:
      return 'Every day';
  }
};

/**
 * Get the number of times a habit should be completed in a week
 */
export const getWeeklyTarget = (frequencyConfig: FrequencyConfig): number => {
  switch (frequencyConfig.type) {
    case 'daily':
      const exceptions = frequencyConfig.exceptions?.length ?? 0;
      return 7 - exceptions;

    case 'specific_days':
      return frequencyConfig.days?.length ?? 0;

    case 'x_times_per_period':
      if (frequencyConfig.timesPerPeriod?.period === 'week') {
        return frequencyConfig.timesPerPeriod.times;
      }
      // For monthly, approximate to weekly
      return Math.ceil((frequencyConfig.timesPerPeriod?.times ?? 4) / 4);

    case 'interval':
      // Approximate based on interval
      return Math.floor(7 / (frequencyConfig.interval ?? 1));

    default:
      return 7;
  }
};

/**
 * Check if two frequency configs are equal
 */
export const areFrequencyConfigsEqual = (
  a: FrequencyConfig,
  b: FrequencyConfig
): boolean => {
  if (a.type !== b.type) return false;

  switch (a.type) {
    case 'daily':
      const aExceptions = a.exceptions?.sort().join(',') ?? '';
      const bExceptions = b.exceptions?.sort().join(',') ?? '';
      return aExceptions === bExceptions;

    case 'specific_days':
      const aDays = a.days?.sort().join(',') ?? '';
      const bDays = b.days?.sort().join(',') ?? '';
      return aDays === bDays;

    case 'x_times_per_period':
      return (
        a.timesPerPeriod?.times === b.timesPerPeriod?.times &&
        a.timesPerPeriod?.period === b.timesPerPeriod?.period
      );

    case 'interval':
      return a.interval === b.interval;

    default:
      return true;
  }
};

/**
 * Create a default daily frequency config
 */
export const createDailyConfig = (exceptions?: DayOfWeek[]): FrequencyConfig => ({
  type: 'daily',
  exceptions,
});

/**
 * Create a specific days frequency config
 */
export const createSpecificDaysConfig = (days: DayOfWeek[]): FrequencyConfig => ({
  type: 'specific_days',
  days,
});

/**
 * Create an X times per period frequency config
 */
export const createTimesPerPeriodConfig = (
  times: number,
  period: 'week' | 'month'
): FrequencyConfig => ({
  type: 'x_times_per_period',
  timesPerPeriod: { times, period },
});

/**
 * Get weekday preset
 */
export const WEEKDAY_PRESET: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/**
 * Get weekend preset
 */
export const WEEKEND_PRESET: DayOfWeek[] = ['Sat', 'Sun'];

