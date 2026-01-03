import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { syncManager } from '../services/sync';
import { Habit, HabitLog } from '../types/habit';
import { isHabitActiveForDate } from '../utils/frequency';

// Helper to get date string (local time, not UTC)
const getDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get previous date string
const getPreviousDateString = (dateStr: string): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() - 1);
  return getDateString(date);
};

// Calculate current streak for a habit based on consecutive completed days
// Always calculates from today going backwards for consistency
const calculateCurrentStreak = (
  habitId: string,
  logs: HabitLog[],
  _fromDate?: string // kept for API compatibility but not used
): number => {
  let streak = 0;
  let currentDate = getDateString(new Date()); // Always start from today

  // Count consecutive completed days going backwards from today
  while (true) {
    const log = logs.find(l => l.habitId === habitId && l.date === currentDate);
    if (log?.status === 'completed') {
      streak++;
      currentDate = getPreviousDateString(currentDate);
    } else {
      break;
    }
  }

  return streak;
};

// Calculate total completions for a habit
const calculateTotalCompletions = (habitId: string, logs: HabitLog[]): number => {
  return logs.filter(l => l.habitId === habitId && l.status === 'completed').length;
};

// Calculate longest streak ever achieved for a habit
// Scans all completed logs and finds the maximum consecutive streak
const calculateLongestStreak = (habitId: string, logs: HabitLog[]): number => {
  // Get all completed dates for this habit, sorted
  const completedDates = logs
    .filter(l => l.habitId === habitId && l.status === 'completed')
    .map(l => l.date)
    .sort();

  if (completedDates.length === 0) return 0;
  if (completedDates.length === 1) return 1;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedDates.length; i++) {
    const prevDate = new Date(completedDates[i - 1]);
    const currDate = new Date(completedDates[i]);

    // Check if dates are consecutive (1 day apart)
    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      // Gap in streak, reset
      currentStreak = 1;
    }
    // diffDays === 0 means same day (shouldn't happen with unique dates)
  }

  return longestStreak;
};

// No dummy data - start with empty arrays for production use

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  selectedDate: string;
  isLoading: boolean;
  lastSyncAt: number | null;

  // Actions
  setSelectedDate: (date: string) => void;
  getHabitsForDate: (date: string) => Habit[];
  getLogForHabit: (habitId: string, date: string) => HabitLog | undefined;
  completeHabit: (habitId: string, date: string) => void;
  skipHabit: (habitId: string, date: string) => void;
  undoHabitLog: (habitId: string, date: string) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'currentStreak' | 'longestStreak' | 'totalCompletions'>) => Habit;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  getDailyProgress: (date: string) => { completed: number; total: number; percentage: number };
  getStreakForHabit: (habitId: string) => number;

  // Sync actions
  setHabits: (habits: Habit[]) => void;
  setLogs: (logs: HabitLog[]) => void;
  setLoading: (isLoading: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      selectedDate: getDateString(new Date()),
      isLoading: false,
      lastSyncAt: null,

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      getHabitsForDate: (date: string) => {
        const { habits, logs } = get();

        return habits.filter(habit => {
          // Don't show habit for dates before it was created
          const createdAtDate = habit.createdAt instanceof Date
            ? habit.createdAt
            : new Date(habit.createdAt);
          const habitCreatedDate = getDateString(createdAtDate);

          if (date < habitCreatedDate) {
            return false;
          }

          const { frequencyConfig } = habit;

          // Handle x_times_per_period differently - show habit if weekly target not met
          if (frequencyConfig.type === 'x_times_per_period') {
            // Always show flexible habits - user decides when to do them
            return true;
          }

          // For daily, specific_days, and interval types
          return isHabitActiveForDate(frequencyConfig, date);
        });
      },

      getLogForHabit: (habitId: string, date: string) => {
        const { logs } = get();
        return logs.find(log => log.habitId === habitId && log.date === date);
      },

      completeHabit: (habitId: string, date: string) => {
        const { logs } = get();

        // Check if already completed for this date
        const existingLog = logs.find(
          log => log.habitId === habitId && log.date === date
        );
        const wasAlreadyCompleted = existingLog?.status === 'completed';

        const newLog: HabitLog = {
          id: `${habitId}-${date}`,
          habitId,
          date,
          status: 'completed',
          completedAt: new Date(),
        };

        let updatedHabit: Habit | null = null;

        set((state) => {
          const existingLogIndex = state.logs.findIndex(
            log => log.habitId === habitId && log.date === date
          );

          let newLogs: HabitLog[];
          if (existingLogIndex >= 0) {
            newLogs = [...state.logs];
            newLogs[existingLogIndex] = newLog;
          } else {
            newLogs = [...state.logs, newLog];
          }

          // Only update stats if this is a NEW completion (not already completed)
          const newHabits = !wasAlreadyCompleted
            ? state.habits.map(habit => {
              if (habit.id === habitId) {
                // Calculate proper streak based on consecutive days
                const newStreak = calculateCurrentStreak(habitId, newLogs, date);
                const totalCompletions = calculateTotalCompletions(habitId, newLogs);
                updatedHabit = {
                  ...habit,
                  totalCompletions,
                  currentStreak: newStreak,
                  longestStreak: Math.max(habit.longestStreak, newStreak),
                };
                return updatedHabit;
              }
              return habit;
            })
            : state.habits;

          return { logs: newLogs, habits: newHabits };
        });

        // Queue log for sync
        syncManager.queueOperation('CREATE', 'log', newLog);

        // Also sync updated habit stats to Firebase
        if (updatedHabit) {
          syncManager.queueOperation('UPDATE', 'habit', updatedHabit);
        }
      },

      skipHabit: (habitId: string, date: string) => {
        const { logs } = get();

        // Check if was previously completed
        const existingLog = logs.find(
          log => log.habitId === habitId && log.date === date
        );
        const wasCompleted = existingLog?.status === 'completed';

        const newLog: HabitLog = {
          id: `${habitId}-${date}`,
          habitId,
          date,
          status: 'skipped',
        };

        let updatedHabit: Habit | null = null;

        set((state) => {
          const existingLogIndex = state.logs.findIndex(
            log => log.habitId === habitId && log.date === date
          );

          let newLogs: HabitLog[];
          if (existingLogIndex >= 0) {
            newLogs = [...state.logs];
            newLogs[existingLogIndex] = newLog;
          } else {
            newLogs = [...state.logs, newLog];
          }

          // If was completed before, recalculate stats
          const newHabits = wasCompleted
            ? state.habits.map(habit => {
              if (habit.id === habitId) {
                const newStreak = calculateCurrentStreak(habitId, newLogs);
                const totalCompletions = calculateTotalCompletions(habitId, newLogs);
                const longestStreak = calculateLongestStreak(habitId, newLogs);
                updatedHabit = {
                  ...habit,
                  totalCompletions,
                  currentStreak: newStreak,
                  longestStreak,
                };
                return updatedHabit;
              }
              return habit;
            })
            : state.habits;

          return { logs: newLogs, habits: newHabits };
        });

        // Queue log for sync
        syncManager.queueOperation('CREATE', 'log', newLog);

        // Also sync updated habit stats if changed
        if (updatedHabit) {
          syncManager.queueOperation('UPDATE', 'habit', updatedHabit);
        }
      },

      undoHabitLog: (habitId: string, date: string) => {
        const { logs } = get();
        const log = logs.find(l => l.habitId === habitId && l.date === date);

        if (!log) return;

        const wasCompleted = log.status === 'completed';
        let updatedHabit: Habit | null = null;

        set((state) => {
          const newLogs = state.logs.filter(
            l => !(l.habitId === habitId && l.date === date)
          );

          // Recalculate habit stats if was completed
          const newHabits = wasCompleted
            ? state.habits.map(habit => {
              if (habit.id === habitId) {
                const newStreak = calculateCurrentStreak(habitId, newLogs);
                const totalCompletions = calculateTotalCompletions(habitId, newLogs);
                const longestStreak = calculateLongestStreak(habitId, newLogs);
                updatedHabit = {
                  ...habit,
                  totalCompletions,
                  currentStreak: newStreak,
                  longestStreak,
                };
                return updatedHabit;
              }
              return habit;
            })
            : state.habits;

          return { logs: newLogs, habits: newHabits };
        });

        // Queue log deletion for sync
        syncManager.queueOperation('DELETE', 'log', { id: log.id });

        // Also sync updated habit stats if changed
        if (updatedHabit) {
          syncManager.queueOperation('UPDATE', 'habit', updatedHabit);
        }
      },

      addHabit: (habitData) => {
        const newHabit: Habit = {
          ...habitData,
          id: `habit-${Date.now()}`,
          createdAt: new Date(),
          currentStreak: 0,
          longestStreak: 0,
          totalCompletions: 0,
        };

        set((state) => ({
          habits: [...state.habits, newHabit],
        }));

        // Queue for sync
        syncManager.queueOperation('CREATE', 'habit', newHabit);

        return newHabit;
      },

      updateHabit: (habitId: string, updates: Partial<Habit>) => {
        let updatedHabit: Habit | null = null;

        set((state) => {
          const newHabits = state.habits.map((h) => {
            if (h.id === habitId) {
              updatedHabit = { ...h, ...updates };
              return updatedHabit;
            }
            return h;
          });
          return { habits: newHabits };
        });

        // Queue for sync
        if (updatedHabit) {
          syncManager.queueOperation('UPDATE', 'habit', updatedHabit);
        }
      },

      deleteHabit: (habitId: string) => {
        set((state) => ({
          habits: state.habits.filter(h => h.id !== habitId),
          logs: state.logs.filter(l => l.habitId !== habitId),
        }));

        // Queue for sync
        syncManager.queueOperation('DELETE', 'habit', { id: habitId });
      },

      getDailyProgress: (date: string) => {
        const { getHabitsForDate, logs } = get();
        const habitsForDate = getHabitsForDate(date);
        const total = habitsForDate.length;

        if (total === 0) {
          return { completed: 0, total: 0, percentage: 0 };
        }

        // For future dates, always return 0 completed (no logs exist yet)
        const todayString = getDateString(new Date());
        if (date > todayString) {
          return { completed: 0, total, percentage: 0 };
        }

        const completed = habitsForDate.filter(habit => {
          const log = logs.find(l => l.habitId === habit.id && l.date === date);
          return log?.status === 'completed';
        }).length;

        return {
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
        };
      },

      getStreakForHabit: (habitId: string) => {
        const { habits } = get();
        const habit = habits.find(h => h.id === habitId);
        return habit?.currentStreak ?? 0;
      },

      // Sync actions
      setHabits: (habits: Habit[]) => set({ habits }),
      setLogs: (logs: HabitLog[]) => set({ logs }),
      setLoading: (isLoading: boolean) => set({ isLoading }),
      setLastSyncAt: (timestamp: number) => set({ lastSyncAt: timestamp }),
    }),
    {
      name: 'lifepulse-habits',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        habits: state.habits,
        logs: state.logs,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
