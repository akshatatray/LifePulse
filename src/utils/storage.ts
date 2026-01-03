/**
 * AsyncStorage Utilities
 * Helpers for local storage operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
export const STORAGE_KEYS = {
  AUTH: 'lifepulse-auth',
  HABITS: 'lifepulse-habits',
  SYNC_QUEUE: 'lifepulse-sync-queue',
  LAST_SYNC: 'lifepulse-last-sync',
  SETTINGS: 'lifepulse-settings',
} as const;

/**
 * Generic storage operations
 */
export const storage = {
  /**
   * Get a value from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading from storage [${key}]:`, error);
      return null;
    }
  },

  /**
   * Set a value in storage
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to storage [${key}]:`, error);
      return false;
    }
  },

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from storage [${key}]:`, error);
      return false;
    }
  },

  /**
   * Clear all app storage
   */
  async clearAll(): Promise<boolean> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  /**
   * Get multiple values
   */
  async getMultiple<T extends Record<string, any>>(keys: string[]): Promise<T> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};
      
      pairs.forEach(([key, value]) => {
        result[key] = value ? JSON.parse(value) : null;
      });
      
      return result as T;
    } catch (error) {
      console.error('Error reading multiple from storage:', error);
      return {} as T;
    }
  },

  /**
   * Set multiple values
   */
  async setMultiple(items: Record<string, any>): Promise<boolean> {
    try {
      const pairs: [string, string][] = Object.entries(items).map(([key, value]) => [
        key,
        JSON.stringify(value),
      ]);
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (error) {
      console.error('Error writing multiple to storage:', error);
      return false;
    }
  },
};

/**
 * Date utilities for storage
 */
export const dateUtils = {
  /**
   * Get date string in YYYY-MM-DD format
   */
  toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  },

  /**
   * Get today's date string
   */
  today(): string {
    return this.toDateString(new Date());
  },

  /**
   * Parse date string to Date object
   */
  fromDateString(dateString: string): Date {
    return new Date(dateString + 'T00:00:00');
  },

  /**
   * Get date range (for fetching logs)
   */
  getDateRange(daysBack: number, daysForward: number = 0): { start: string; end: string } {
    const today = new Date();
    
    const start = new Date(today);
    start.setDate(start.getDate() - daysBack);
    
    const end = new Date(today);
    end.setDate(end.getDate() + daysForward);
    
    return {
      start: this.toDateString(start),
      end: this.toDateString(end),
    };
  },
};

