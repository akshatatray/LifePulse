/**
 * Hook to handle notification action button responses (Done/Skip)
 * Connects notification actions to the habit store.
 *
 * Works alongside the background task handler (backgroundNotificationHandler.ts):
 * - Background handler: writes directly to Firestore when app is killed/suspended
 * - This hook: updates local Zustand store for immediate UI refresh when app is alive,
 *   and handles cold-start launches from notification actions.
 *
 * Both paths are idempotent -- Firestore .set() and store deduplication prevent conflicts.
 */

import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { notificationService } from '../services/notifications';
import { useHabitStore } from '../stores/habitStore';

const getTodayString = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface UseNotificationActionsOptions {
    onHabitCompleted?: (habitId: string) => void;
    onHabitSkipped?: (habitId: string) => void;
    onNotificationTapped?: (habitId: string) => void;
}

export function useNotificationActions(options: UseNotificationActionsOptions = {}) {
    const { onHabitCompleted, onHabitSkipped, onNotificationTapped } = options;

    const onHabitCompletedRef = useRef(onHabitCompleted);
    const onHabitSkippedRef = useRef(onHabitSkipped);
    const onNotificationTappedRef = useRef(onNotificationTapped);
    const handledResponseIds = useRef(new Set<string>());

    const completeHabit = useHabitStore((state) => state.completeHabit);
    const skipHabit = useHabitStore((state) => state.skipHabit);
    const habits = useHabitStore((state) => state.habits);

    useEffect(() => {
        onHabitCompletedRef.current = onHabitCompleted;
        onHabitSkippedRef.current = onHabitSkipped;
        onNotificationTappedRef.current = onNotificationTapped;
    }, [onHabitCompleted, onHabitSkipped, onNotificationTapped]);

    useEffect(() => {
        console.log('[useNotificationActions] Setting up notification action listeners');

        const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
            const responseId = response.notification.request.identifier + response.actionIdentifier;
            if (handledResponseIds.current.has(responseId)) {
                return;
            }
            handledResponseIds.current.add(responseId);

            const { habitId } = notificationService.parseNotificationResponse(response);

            if (!habitId) {
                console.log('[useNotificationActions] No habitId in notification data');
                return;
            }

            const habit = habits.find((h) => h.id === habitId);
            if (!habit) {
                console.log(`[useNotificationActions] Habit ${habitId} not found`);
                return;
            }

            const today = getTodayString();

            if (notificationService.isDoneAction(response)) {
                console.log(`[useNotificationActions] Done action for habit: ${habitId}`);
                completeHabit(habitId, today);
                onHabitCompletedRef.current?.(habitId);
            } else if (notificationService.isSkipAction(response)) {
                console.log(`[useNotificationActions] Skip action for habit: ${habitId}`);
                skipHabit(habitId, today);
                onHabitSkippedRef.current?.(habitId);
            } else if (notificationService.isTapAction(response)) {
                console.log(`[useNotificationActions] Notification tapped for habit: ${habitId}`);
                onNotificationTappedRef.current?.(habitId);
            }
        };

        // Handle cold-start: check if the app was launched from a notification action
        Notifications.getLastNotificationResponseAsync().then((response) => {
            if (response) {
                console.log('[useNotificationActions] Processing cold-start notification response');
                handleNotificationResponse(response);
            }
        });

        const cleanup = notificationService.setupListeners(
            undefined,
            handleNotificationResponse
        );

        return () => {
            console.log('[useNotificationActions] Cleaning up notification action listeners');
            cleanup();
        };
    }, [completeHabit, skipHabit, habits]);

    return null;
}
