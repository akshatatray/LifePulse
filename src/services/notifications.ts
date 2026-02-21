/**
 * Notification Service
 * Local notification scheduling and management for habit reminders
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DayOfWeek, Habit } from '../types/habit';
import { storage, STORAGE_KEYS } from '../utils/storage';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Notification category and action identifiers
export const NOTIFICATION_CATEGORY_HABIT_REMINDER = 'habit-reminder';
export const NOTIFICATION_ACTION_DONE = 'done';
export const NOTIFICATION_ACTION_SKIP = 'skip';

// Day name to weekday number (1 = Sunday in Expo)
const DAY_TO_WEEKDAY: Record<DayOfWeek, number> = {
    Sun: 1,
    Mon: 2,
    Tue: 3,
    Wed: 4,
    Thu: 5,
    Fri: 6,
    Sat: 7,
};

// Weekday number to day name
const WEEKDAY_TO_DAY: Record<number, DayOfWeek> = {
    0: 'Sun',
    1: 'Mon',
    2: 'Tue',
    3: 'Wed',
    4: 'Thu',
    5: 'Fri',
    6: 'Sat',
};

class NotificationService {
    private hasPermission: boolean = false;
    private expoPushToken: string | null = null;

    /**
     * Persisted mapping of habitId -> scheduled notification identifiers
     * This makes reminder updates reliable (cancel by ID), instead of relying only on scanning.
     */
    private async getHabitReminderIds(): Promise<Record<string, string[]>> {
        return (await storage.get<Record<string, string[]>>(STORAGE_KEYS.HABIT_REMINDER_NOTIFICATION_IDS)) ?? {};
    }

    private async setHabitReminderIds(map: Record<string, string[]>): Promise<void> {
        await storage.set(STORAGE_KEYS.HABIT_REMINDER_NOTIFICATION_IDS, map);
    }

    private async saveHabitReminderIds(habitId: string, ids: string[]): Promise<void> {
        const map = await this.getHabitReminderIds();
        map[habitId] = ids;
        await this.setHabitReminderIds(map);
    }

    private async removeHabitReminderIds(habitId: string): Promise<void> {
        const map = await this.getHabitReminderIds();
        if (map[habitId]) {
            delete map[habitId];
            await this.setHabitReminderIds(map);
        }
    }

    /**
     * Get the current Expo push token
     */
    getExpoPushToken(): string | null {
        return this.expoPushToken;
    }

    /**
     * Request notification permissions
     */
    async requestPermissions(): Promise<boolean> {
        if (!Device.isDevice) {
            console.warn('Notifications only work on physical devices');
            return false;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Notification permissions not granted');
            this.hasPermission = false;
            return false;
        }

        this.hasPermission = true;

        // Set up Android notification channels
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('habit-reminders', {
                name: 'Habit Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#00FF9D',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('social', {
                name: 'Social Notifications',
                description: 'Friend requests and social activity',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#3B82F6',
                sound: 'default',
            });
        }

        // Set up notification categories with action buttons
        await this.setupNotificationCategories();

        return true;
    }

    /**
     * Set up notification categories with action buttons (Done/Skip)
     */
    async setupNotificationCategories(): Promise<void> {
        try {
            await Notifications.setNotificationCategoryAsync(NOTIFICATION_CATEGORY_HABIT_REMINDER, [
                {
                    identifier: NOTIFICATION_ACTION_DONE,
                    buttonTitle: '✓ Done',
                    options: {
                        opensAppToForeground: false,
                    },
                },
                {
                    identifier: NOTIFICATION_ACTION_SKIP,
                    buttonTitle: 'Skip',
                    options: {
                        opensAppToForeground: false,
                    },
                },
            ]);
            console.log('[NotificationService] Notification categories set up successfully');
        } catch (error) {
            console.error('[NotificationService] Error setting up notification categories:', error);
        }
    }

    /**
     * Register for push notifications and get the Expo push token
     */
    async registerForPushNotifications(): Promise<string | null> {
        if (!Device.isDevice) {
            console.warn('Push notifications only work on physical devices');
            return null;
        }

        const granted = await this.requestPermissions();
        if (!granted) {
            return null;
        }

        try {
            // Get the project ID from Constants
            const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

            if (!projectId) {
                console.warn('No Expo project ID found. Push notifications may not work.');
                // Fallback for development
                const tokenData = await Notifications.getExpoPushTokenAsync();
                this.expoPushToken = tokenData.data;
            } else {
                const tokenData = await Notifications.getExpoPushTokenAsync({
                    projectId,
                });
                this.expoPushToken = tokenData.data;
            }

            console.log('[NotificationService] Expo push token:', this.expoPushToken);
            return this.expoPushToken;
        } catch (error) {
            console.error('[NotificationService] Error getting push token:', error);
            return null;
        }
    }

    /**
     * Check if notifications are enabled
     */
    async checkPermissions(): Promise<boolean> {
        const { status } = await Notifications.getPermissionsAsync();
        this.hasPermission = status === 'granted';
        return this.hasPermission;
    }

    /**
     * Schedule a notification for a specific time
     */
    async scheduleNotification(
        habitId: string,
        title: string,
        body: string,
        trigger: Notifications.NotificationTriggerInput
    ): Promise<string | null> {
        if (!this.hasPermission) {
            const granted = await this.requestPermissions();
            if (!granted) return null;
        }

        try {
            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    sound: 'default',
                    data: { habitId, type: 'reminder' },
                    categoryIdentifier: 'habit-reminder',
                    ...(Platform.OS === 'android' && {
                        priority: Notifications.AndroidNotificationPriority.MAX,
                    }),
                },
                trigger,
            });

            return identifier;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return null;
        }
    }

    /**
     * Get active days for a habit based on frequency config
     */
    private getActiveDays(habit: Habit): DayOfWeek[] {
        const { frequencyConfig } = habit;

        if (frequencyConfig.type === 'daily') {
            // All days minus exceptions
            const allDays: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            if (frequencyConfig.exceptions && frequencyConfig.exceptions.length > 0) {
                return allDays.filter((day) => !frequencyConfig.exceptions!.includes(day));
            }
            return allDays;
        }

        if (frequencyConfig.type === 'specific_days' && frequencyConfig.days) {
            return frequencyConfig.days;
        }

        // For x_times_per_period, schedule on all days (user decides when to complete)
        return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    }

    /**
     * Schedule all reminders for a habit
     * This method always cancels existing notifications first to prevent duplicates
     */
    async scheduleHabitReminders(habit: Habit): Promise<string[]> {
        // ALWAYS cancel existing notifications first to prevent duplicates/stale reminders
        // This is defensive: even if updateHabitReminders was supposed to cancel,
        // we ensure cleanup happens here as well
        await this.cancelHabitRemindersInternal(habit.id);

        if (!habit.reminders.enabled || habit.reminders.times.length === 0) {
            return [];
        }

        const identifiers: string[] = [];
        const activeDays = this.getActiveDays(habit);

        console.log(`[NotificationService] Scheduling reminders for habit ${habit.id}: ${habit.reminders.times.join(', ')} on days: ${activeDays.join(', ')}`);

        for (const time of habit.reminders.times) {
            const [hourStr, minuteStr] = time.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            // Schedule for each active day
            for (const day of activeDays) {
                const weekday = DAY_TO_WEEKDAY[day];

                const trigger: Notifications.WeeklyTriggerInput = {
                    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                    weekday,
                    hour,
                    minute,
                    ...(Platform.OS === 'android' && { channelId: 'habit-reminders' }),
                };

                const identifier = await this.scheduleNotification(
                    habit.id,
                    `Time for: ${habit.icon} ${habit.title}`,
                    `Ready to check this off? Use the buttons below to mark it done or skip for today.`,
                    trigger
                );

                if (identifier) {
                    identifiers.push(identifier);
                }
            }
        }

        // Persist identifiers so we can cancel reliably later
        await this.saveHabitReminderIds(habit.id, identifiers);
        console.log(`[NotificationService] Scheduled ${identifiers.length} notifications for habit ${habit.id}`);
        return identifiers;
    }

    /**
     * Internal method to cancel all notifications for a habit
     * Used by both cancelHabitReminders (public) and scheduleHabitReminders
     */
    private async cancelHabitRemindersInternal(habitId: string): Promise<number> {
        let cancelledCount = 0;

        try {
            // 1) Cancel by persisted identifiers (most reliable)
            const map = await this.getHabitReminderIds();
            const storedIds = map[habitId] ?? [];

            console.log(`[NotificationService] Cancelling notifications for habit ${habitId}. Found ${storedIds.length} stored IDs.`);

            for (const id of storedIds) {
                try {
                    await Notifications.cancelScheduledNotificationAsync(id);
                    cancelledCount++;
                } catch (e) {
                    // ID might already be cancelled or expired - that's okay
                    console.log(`[NotificationService] Could not cancel notification ${id}:`, e);
                }
            }
            await this.removeHabitReminderIds(habitId);

            // 2) Fallback: scan ALL scheduled notifications and cancel anything tagged with this habitId
            // This catches any notifications that weren't properly tracked
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

            const toCancel = scheduledNotifications.filter((notification) => {
                const notifHabitId = notification.content.data?.habitId;
                // Handle both string and potential other types
                return notifHabitId === habitId || String(notifHabitId) === habitId;
            });

            if (toCancel.length > 0) {
                console.log(`[NotificationService] Found ${toCancel.length} additional notifications to cancel via scan`);
            }

            for (const notification of toCancel) {
                try {
                    await Notifications.cancelScheduledNotificationAsync(notification.identifier);
                    cancelledCount++;
                } catch (e) {
                    console.log(`[NotificationService] Could not cancel scanned notification ${notification.identifier}:`, e);
                }
            }
        } catch (error) {
            console.error('[NotificationService] Error canceling notifications:', error);
        }

        console.log(`[NotificationService] Cancelled ${cancelledCount} total notifications for habit ${habitId}`);
        return cancelledCount;
    }

    /**
     * Cancel all notifications for a habit (public API)
     */
    async cancelHabitReminders(habitId: string): Promise<void> {
        await this.cancelHabitRemindersInternal(habitId);
    }

    /**
     * Update reminders for a habit (cancel old, schedule new)
     */
    async updateHabitReminders(habit: Habit): Promise<string[]> {
        console.log(`[NotificationService] updateHabitReminders called for habit ${habit.id} with times: ${habit.reminders.times.join(', ')}`);
        // Note: scheduleHabitReminders already cancels existing notifications internally,
        // but we call cancel explicitly here for clarity and to ensure cleanup happens
        // even if there's an error during scheduling
        await this.cancelHabitReminders(habit.id);
        return this.scheduleHabitReminders(habit);
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
        // Clear persisted mapping too
        await storage.remove(STORAGE_KEYS.HABIT_REMINDER_NOTIFICATION_IDS);
    }

    /**
     * Get all scheduled notifications
     */
    async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        return Notifications.getAllScheduledNotificationsAsync();
    }

    /**
     * Schedule an immediate test notification
     */
    async sendTestNotification(title: string, body: string): Promise<void> {
        await this.scheduleNotification('test', title, body, {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
        });
    }

    /**
     * Parse notification response to extract action and habit data
     */
    parseNotificationResponse(response: Notifications.NotificationResponse): {
        actionIdentifier: string;
        habitId: string | null;
        type: string | null;
    } {
        const actionIdentifier = response.actionIdentifier;
        const data = response.notification.request.content.data;

        return {
            actionIdentifier,
            habitId: data?.habitId as string | null,
            type: data?.type as string | null,
        };
    }

    /**
     * Check if the response is from a Done action button
     */
    isDoneAction(response: Notifications.NotificationResponse): boolean {
        return response.actionIdentifier === NOTIFICATION_ACTION_DONE;
    }

    /**
     * Check if the response is from a Skip action button
     */
    isSkipAction(response: Notifications.NotificationResponse): boolean {
        return response.actionIdentifier === NOTIFICATION_ACTION_SKIP;
    }

    /**
     * Check if the response is from tapping the notification itself (not an action button)
     */
    isTapAction(response: Notifications.NotificationResponse): boolean {
        return response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;
    }

    /**
     * Set up notification response listeners
     */
    setupListeners(
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationResponse?: (response: Notifications.NotificationResponse) => void
    ): () => void {
        const receivedSubscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('[NotificationService] Notification received:', notification);
                onNotificationReceived?.(notification);
            }
        );

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                const parsed = this.parseNotificationResponse(response);
                console.log('[NotificationService] Notification response:', {
                    actionIdentifier: parsed.actionIdentifier,
                    habitId: parsed.habitId,
                    type: parsed.type,
                });
                onNotificationResponse?.(response);
            }
        );

        // Return cleanup function
        return () => {
            receivedSubscription.remove();
            responseSubscription.remove();
        };
    }

    /**
     * Get badge count
     */
    async getBadgeCount(): Promise<number> {
        return Notifications.getBadgeCountAsync();
    }

    /**
     * Set badge count
     */
    async setBadgeCount(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    }
}

export const notificationService = new NotificationService();

