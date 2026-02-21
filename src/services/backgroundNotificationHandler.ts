/**
 * Background Notification Handler
 *
 * Handles Done/Skip notification actions when the app is killed or in the background.
 * Uses expo-task-manager to register a headless task that runs outside the React lifecycle.
 *
 * This handler writes directly to Firestore (bypassing the Zustand store and syncManager)
 * because those are unavailable in a headless JS context. The local store reconciles
 * on next app open via fullSync.
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import {
    NOTIFICATION_ACTION_DONE,
    NOTIFICATION_ACTION_SKIP,
} from './notifications';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_ACTION';

function getTodayString(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

TaskManager.defineTask(
    BACKGROUND_NOTIFICATION_TASK,
    async ({ data, error }: TaskManager.TaskManagerTaskBody<{ notification: Notifications.NotificationResponse }>) => {
        if (error) {
            console.error('[BackgroundNotification] Task error:', error);
            return;
        }

        const response = data?.notification;
        if (!response) {
            console.log('[BackgroundNotification] No notification response in task data');
            return;
        }

        const actionIdentifier = response.actionIdentifier;
        const habitId = response.notification?.request?.content?.data?.habitId as string | undefined;

        if (!habitId) {
            console.log('[BackgroundNotification] No habitId in notification data');
            return;
        }

        const isDone = actionIdentifier === NOTIFICATION_ACTION_DONE;
        const isSkip = actionIdentifier === NOTIFICATION_ACTION_SKIP;

        if (!isDone && !isSkip) {
            return;
        }

        const currentUser = auth().currentUser;
        if (!currentUser) {
            console.log('[BackgroundNotification] No authenticated user, cannot sync to Firebase');
            return;
        }

        const userId = currentUser.uid;
        const today = getTodayString();
        const logId = `${habitId}-${today}`;

        try {
            const logRef = firestore()
                .collection('users')
                .doc(userId)
                .collection('logs')
                .doc(logId);

            if (isDone) {
                await logRef.set({
                    habitId,
                    date: today,
                    status: 'completed',
                    completedAt: firestore.Timestamp.now(),
                });
                console.log(`[BackgroundNotification] Habit ${habitId} marked done for ${today}`);
            } else {
                await logRef.set({
                    habitId,
                    date: today,
                    status: 'skipped',
                    completedAt: null,
                });
                console.log(`[BackgroundNotification] Habit ${habitId} marked skipped for ${today}`);
            }
        } catch (err) {
            console.error('[BackgroundNotification] Firestore write failed:', err);
        }
    }
);
