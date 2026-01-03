/**
 * Analytics utility functions for habit insights
 */

import { Habit, HabitLog } from '../types/habit';
import { colors } from '../theme';
import { isHabitActiveForDate } from './frequency';

// Get local date string helper
const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get heatmap color based on completion percentage
 */
export const getHeatmapColor = (percentage: number): string => {
  if (percentage === 0) return colors.background.elevated; // Empty - visible against card background
  if (percentage <= 20) return '#3D4F3D'; // Pale green
  if (percentage <= 40) return '#4A6B4A'; // Light green
  if (percentage <= 60) return '#5A8F5A'; // Medium green
  if (percentage <= 80) return '#6AB06A'; // Bright green
  return colors.accent.success; // Neon green (100%)
};

/**
 * Get active habits for a specific date (considering creation date AND frequency)
 * This mirrors the logic in habitStore.getHabitsForDate
 */
const getActiveHabitsForDate = (date: string, habits: Habit[]): Habit[] => {
  return habits.filter(habit => {
    // Check 1: Don't include habits created after this date
    const createdAt = habit.createdAt instanceof Date 
      ? habit.createdAt 
      : new Date(habit.createdAt);
    const createdDateString = getDateString(createdAt);
    if (date < createdDateString) {
      return false;
    }

    // Check 2: Respect frequency configuration
    if (!isHabitActiveForDate(habit.frequencyConfig, date)) {
      return false;
    }

    return true;
  });
};

/**
 * Calculate daily completion percentage for a specific date
 */
export const getDailyCompletionPercentage = (
  date: string,
  habits: Habit[],
  logs: HabitLog[]
): number => {
  // Get habits that should be done on this date (creation date + frequency)
  const activeHabits = getActiveHabitsForDate(date, habits);

  if (activeHabits.length === 0) return 0;

  const completedCount = activeHabits.filter(habit => {
    const log = logs.find(l => l.habitId === habit.id && l.date === date);
    return log?.status === 'completed';
  }).length;

  return Math.round((completedCount / activeHabits.length) * 100);
};

/**
 * Generate heatmap data for the last N months
 */
export interface HeatmapDay {
  date: string;
  percentage: number;
  color: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isFuture: boolean;
}

export interface HeatmapMonth {
  month: string;
  year: number;
  monthIndex: number;
  days: HeatmapDay[];
}

export const generateHeatmapData = (
  habits: Habit[],
  logs: HabitLog[],
  monthsBack: number = 1,
  monthsForward: number = 1
): HeatmapMonth[] => {
  const result: HeatmapMonth[] = [];
  const today = new Date();
  const todayString = getDateString(today);
  
  // Generate from (monthsBack) months ago to (monthsForward) months ahead
  // This creates: [past month, current month, future month]
  for (let m = -monthsBack; m <= monthsForward; m++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + m, 1);
    const year = targetDate.getFullYear();
    const monthIndex = targetDate.getMonth();
    const monthName = targetDate.toLocaleDateString('en-US', { month: 'short' });
    
    // Get number of days in month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    const days: HeatmapDay[] = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, monthIndex, d);
      const dateString = getDateString(date);
      
      // Check if this is a future date
      const isFuture = dateString > todayString;
      // Calculate percentage only for past/today, 0 for future
      const percentage = isFuture ? 0 : getDailyCompletionPercentage(dateString, habits, logs);
      
      days.push({
        date: dateString,
        percentage,
        color: isFuture ? colors.background.elevated : getHeatmapColor(percentage),
        dayOfMonth: d,
        isCurrentMonth: monthIndex === today.getMonth() && year === today.getFullYear(),
        isFuture,
      });
    }
    
    result.push({
      month: monthName,
      year,
      monthIndex,
      days,
    });
  }
  
  return result;
};

/**
 * Weekly stats for bar chart
 */
export interface WeekDay {
  day: string;
  shortDay: string;
  date: string;
  completed: number;
  total: number;
  percentage: number;
}

export const getWeeklyStats = (
  habits: Habit[],
  logs: HabitLog[]
): WeekDay[] => {
  const result: WeekDay[] = [];
  const today = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const shortNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Get last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = getDateString(date);
    const dayIndex = date.getDay();
    
    // Only count habits scheduled for this date (creation date + frequency)
    const activeHabits = getActiveHabitsForDate(dateString, habits);
    
    const total = activeHabits.length;
    const completed = activeHabits.filter(habit => {
      const log = logs.find(l => l.habitId === habit.id && l.date === dateString);
      return log?.status === 'completed';
    }).length;
    
    result.push({
      day: dayNames[dayIndex],
      shortDay: shortNames[dayIndex],
      date: dateString,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  }
  
  return result;
};

/**
 * Lagging Habit - habit with lowest completion rate in last 7 days
 */
export interface LaggingHabit {
  habit: Habit;
  completionRate: number;
  completedDays: number;
  totalDays: number;
  suggestion: string;
}

export const getLaggingHabits = (
  habits: Habit[],
  logs: HabitLog[],
  limit: number = 3
): LaggingHabit[] => {
  const today = new Date();
  const todayString = getDateString(today);
  
  const habitStats = habits.map(habit => {
    let completedDays = 0;
    let totalDays = 0;
    
    // Get habit creation date
    const createdAt = habit.createdAt instanceof Date 
      ? habit.createdAt 
      : new Date(habit.createdAt);
    const createdDateString = getDateString(createdAt);
    
    // Check last 7 days, but only count days when habit is scheduled
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = getDateString(date);
      
      // Skip days before habit was created
      if (dateString < createdDateString) {
        continue;
      }
      
      // Skip future dates (shouldn't happen, but just in case)
      if (dateString > todayString) {
        continue;
      }
      
      // Skip days when habit is not scheduled (based on frequency)
      if (!isHabitActiveForDate(habit.frequencyConfig, dateString)) {
        continue;
      }
      
      // Count as active day
      totalDays++;
      
      const log = logs.find(l => l.habitId === habit.id && l.date === dateString);
      if (log?.status === 'completed') {
        completedDays++;
      }
    }
    
    const completionRate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    
    return {
      habit,
      completionRate,
      completedDays,
      totalDays,
      suggestion: getSuggestion(completionRate, habit.title, totalDays),
    };
  });
  
  // Filter out habits with less than 2 active days (too new to judge)
  // Sort by completion rate (lowest first) and return top N
  return habitStats
    .filter(stat => stat.totalDays >= 2) // Need at least 2 days of data
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, limit);
};

/**
 * Get suggestion based on completion rate
 */
const getSuggestion = (rate: number, habitTitle: string, totalDays: number): string => {
  // For very new habits (2-3 days), be encouraging
  if (totalDays <= 3) {
    if (rate === 100) {
      return `Great start with "${habitTitle}"! Keep building the streak`;
    }
    if (rate >= 50) {
      return `Good beginning! "${habitTitle}" is off to a nice start`;
    }
    return `"${habitTitle}" is still new. Every day is a chance to build the habit!`;
  }
  
  // For established habits (4+ days)
  if (rate === 0) {
    return `Haven't started "${habitTitle}" this week. Try setting a reminder!`;
  }
  if (rate < 30) {
    return `"${habitTitle}" needs attention. Start with just 2 days this week?`;
  }
  if (rate < 50) {
    return `You're making progress! Aim for one more day of "${habitTitle}"`;
  }
  if (rate < 70) {
    return `Good effort on "${habitTitle}"! Almost at your goal`;
  }
  return `"${habitTitle}" is going well! Keep the momentum`;
};

/**
 * Overall stats
 */
export interface OverallStats {
  totalHabits: number;
  averageCompletion: number;
  currentStreak: number;
  longestStreak: number;
  perfectDays: number;
  totalCompletions: number;
}

export const getOverallStats = (
  habits: Habit[],
  logs: HabitLog[]
): OverallStats => {
  const today = new Date();
  let totalPercentage = 0;
  let perfectDays = 0;
  let totalCompletions = 0;
  
  // Calculate for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = getDateString(date);
    
    const dailyPercentage = getDailyCompletionPercentage(dateString, habits, logs);
    totalPercentage += dailyPercentage;
    
    if (dailyPercentage === 100) {
      perfectDays++;
    }
    
    // Count completions for this day
    const dayCompletions = logs.filter(
      l => l.date === dateString && l.status === 'completed'
    ).length;
    totalCompletions += dayCompletions;
  }
  
  // Calculate current streak (consecutive perfect days)
  let currentStreak = 0;
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = getDateString(date);
    
    const percentage = getDailyCompletionPercentage(dateString, habits, logs);
    if (percentage === 100) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Get longest streak from habits
  const longestStreak = habits.reduce((max, h) => Math.max(max, h.longestStreak), 0);
  
  return {
    totalHabits: habits.length,
    averageCompletion: Math.round(totalPercentage / 30),
    currentStreak,
    longestStreak,
    perfectDays,
    totalCompletions,
  };
};

