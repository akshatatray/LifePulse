/**
 * LifePulse - Notification Store
 * Manages notification state, read/unread status, and badge counts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationState {
  // Read notification IDs
  readNotificationIds: Set<string>;
  
  // Last viewed timestamp for different notification types
  lastViewedFriendRequests: Date | null;
  
  // Actions
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  isRead: (notificationId: string) => boolean;
  getUnreadCount: (totalCount: number) => number;
  setLastViewedFriendRequests: () => void;
  clearNotificationData: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      readNotificationIds: new Set(),
      lastViewedFriendRequests: null,

      markAsRead: (notificationId: string) => {
        set((state) => ({
          readNotificationIds: new Set([...state.readNotificationIds, notificationId]),
        }));
      },

      markAllAsRead: () => {
        set({
          lastViewedFriendRequests: new Date(),
        });
      },

      isRead: (notificationId: string) => {
        return get().readNotificationIds.has(notificationId);
      },

      getUnreadCount: (totalCount: number) => {
        const { readNotificationIds, lastViewedFriendRequests } = get();
        // For simplicity, we count based on read IDs
        // In a real app, you'd compare with actual notification timestamps
        return Math.max(0, totalCount - readNotificationIds.size);
      },

      setLastViewedFriendRequests: () => {
        set({ lastViewedFriendRequests: new Date() });
      },

      clearNotificationData: () => {
        set({
          readNotificationIds: new Set(),
          lastViewedFriendRequests: null,
        });
      },
    }),
    {
      name: 'lifepulse-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Convert Set to Array for JSON serialization
        readNotificationIds: [...state.readNotificationIds],
        lastViewedFriendRequests: state.lastViewedFriendRequests,
      }),
      // Custom merge to handle Set conversion
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        ...persistedState,
        readNotificationIds: new Set(persistedState?.readNotificationIds || []),
        lastViewedFriendRequests: persistedState?.lastViewedFriendRequests
          ? new Date(persistedState.lastViewedFriendRequests)
          : null,
      }),
    }
  )
);

// Helper hook for notification badge
export const useNotificationBadge = () => {
  const { lastViewedFriendRequests } = useNotificationStore();
  
  return {
    lastViewedFriendRequests,
    // Helper to check if a notification is new (added after last view)
    isNewSince: (timestamp: Date) => {
      if (!lastViewedFriendRequests) return true;
      return new Date(timestamp) > new Date(lastViewedFriendRequests);
    },
  };
};
