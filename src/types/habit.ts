/**
 * LifePulse - Habit Types
 */

export interface Habit {
  id: string;
  title: string;
  icon: string; // Emoji
  color: string; // Hex color
  createdAt: Date;
  
  // Frequency configuration
  frequencyConfig: FrequencyConfig;
  
  // Reminders
  reminders: {
    enabled: boolean;
    times: string[]; // ['08:00', '20:00']
  };
  
  // Stats (denormalized for quick access)
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
}

export interface FrequencyConfig {
  type: 'daily' | 'specific_days' | 'interval' | 'x_times_per_period';
  days?: DayOfWeek[]; // For specific_days
  exceptions?: DayOfWeek[]; // Days to skip
  interval?: number; // Every X days
  timesPerPeriod?: {
    times: number;
    period: 'week' | 'month';
  };
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // 'YYYY-MM-DD'
  status: 'completed' | 'skipped' | 'pending';
  completedAt?: Date;
  value?: number; // For numeric habits
}

export interface DayData {
  date: Date;
  dateString: string; // 'YYYY-MM-DD'
  dayName: string; // 'Mon', 'Tue', etc.
  dayNumber: number; // 1-31
  isToday: boolean;
  isSelected: boolean;
  completionRate: number; // 0-100
}

