/**
 * Firestore Service Layer
 * Handles all Firestore operations for habits and logs
 * Uses @react-native-firebase/firestore
 */

import firestore from '@react-native-firebase/firestore';
import { Habit, HabitLog } from '../types/habit';

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  HABITS: 'habits',
  LOGS: 'logs',
} as const;

// Helper to ensure a value is a Date object
// (handles strings from JSON serialization in AsyncStorage)
const ensureDate = (value: Date | string | null | undefined): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

// Helper to convert Date to Timestamp safely
const toTimestamp = (value: Date | string | null | undefined) => {
  const date = ensureDate(value);
  return date ? firestore.Timestamp.fromDate(date) : null;
};

// Helper to get user's habits collection path
const getUserHabitsRef = (userId: string) => 
  firestore().collection(COLLECTIONS.USERS).doc(userId).collection(COLLECTIONS.HABITS);

const getUserLogsRef = (userId: string) => 
  firestore().collection(COLLECTIONS.USERS).doc(userId).collection(COLLECTIONS.LOGS);

/**
 * Habit Operations
 */
export const habitService = {
  /**
   * Fetch all habits for a user
   */
  async getAll(userId: string): Promise<Habit[]> {
    try {
      const snapshot = await getUserHabitsRef(userId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Habit[];
    } catch (error) {
      console.error('Error fetching habits:', error);
      throw error;
    }
  },

  /**
   * Get a single habit by ID
   */
  async getById(userId: string, habitId: string): Promise<Habit | null> {
    try {
      const snapshot = await getUserHabitsRef(userId).doc(habitId).get();
      
      if (!snapshot.exists) return null;
      
      const data = snapshot.data();
      return {
        id: snapshot.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
      } as Habit;
    } catch (error) {
      console.error('Error fetching habit:', error);
      throw error;
    }
  },

  /**
   * Create a new habit
   */
  async create(userId: string, habit: Omit<Habit, 'id'> | Habit): Promise<string> {
    try {
      // Prepare habit data for Firestore
      const habitData = {
        ...habit,
        createdAt: toTimestamp(habit.createdAt) || firestore.Timestamp.now(),
      };
      
      // Remove id if present (for sync operations that pass full habit)
      if ('id' in habitData) {
        const { id, ...rest } = habitData as any;
        // Use the habit's existing ID as the document ID
        await getUserHabitsRef(userId).doc(id).set(rest);
        return id;
      }
      
      const docRef = await getUserHabitsRef(userId).add(habitData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  },

  /**
   * Update an existing habit
   */
  async update(userId: string, habitId: string, updates: Partial<Habit>): Promise<void> {
    try {
      // Convert dates to Timestamps if present
      const firestoreUpdates: any = { ...updates };
      if (updates.createdAt) {
        firestoreUpdates.createdAt = toTimestamp(updates.createdAt);
      }
      
      // Remove id from updates (it's the doc ID, not a field)
      delete firestoreUpdates.id;
      
      await getUserHabitsRef(userId).doc(habitId).update(firestoreUpdates);
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
    }
  },

  /**
   * Delete a habit
   */
  async delete(userId: string, habitId: string): Promise<void> {
    try {
      await getUserHabitsRef(userId).doc(habitId).delete();
      
      // Also delete all logs for this habit
      const snapshot = await getUserLogsRef(userId)
        .where('habitId', '==', habitId)
        .get();
      
      const batch = firestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  },
};

/**
 * Log Operations
 */
export const logService = {
  /**
   * Fetch all logs for a user
   */
  async getAll(userId: string): Promise<HabitLog[]> {
    try {
      const snapshot = await getUserLogsRef(userId).get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as HabitLog[];
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  },

  /**
   * Get logs for a specific date range
   */
  async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    try {
      const snapshot = await getUserLogsRef(userId)
        .where('date', '>=', startDate)
        .where('date', '<=', endDate)
        .get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as HabitLog[];
    } catch (error) {
      console.error('Error fetching logs by date range:', error);
      throw error;
    }
  },

  /**
   * Get logs for a specific habit
   */
  async getByHabitId(userId: string, habitId: string): Promise<HabitLog[]> {
    try {
      const snapshot = await getUserLogsRef(userId)
        .where('habitId', '==', habitId)
        .get();
      
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as HabitLog[];
    } catch (error) {
      console.error('Error fetching logs by habit:', error);
      throw error;
    }
  },

  /**
   * Create or update a log
   */
  async upsert(userId: string, log: HabitLog): Promise<void> {
    try {
      // Prepare log data, converting dates properly
      const logData: any = {
        ...log,
        completedAt: toTimestamp(log.completedAt),
      };
      
      // Remove id from the data (it's the doc ID)
      delete logData.id;
      
      await getUserLogsRef(userId).doc(log.id).set(logData);
    } catch (error) {
      console.error('Error upserting log:', error);
      throw error;
    }
  },

  /**
   * Delete a log
   */
  async delete(userId: string, logId: string): Promise<void> {
    try {
      await getUserLogsRef(userId).doc(logId).delete();
    } catch (error) {
      console.error('Error deleting log:', error);
      throw error;
    }
  },

  /**
   * Batch upsert multiple logs
   */
  async batchUpsert(userId: string, logs: HabitLog[]): Promise<void> {
    try {
      const batch = firestore().batch();
      
      logs.forEach((log) => {
        const logRef = getUserLogsRef(userId).doc(log.id);
        const logData: any = {
          ...log,
          completedAt: toTimestamp(log.completedAt),
        };
        delete logData.id;
        batch.set(logRef, logData);
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch upserting logs:', error);
      throw error;
    }
  },
};
