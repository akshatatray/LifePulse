/**
 * Notification Service
 * Local notification scheduling and management for habit reminders
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DayOfWeek, Habit } from '../types/habit';

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

        // Get push token for future use (Phase 3)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('habit-reminders', {
                name: 'Habit Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#00FF9D',
                sound: 'default',
            });
        }

        return true;
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
     */
    async scheduleHabitReminders(habit: Habit): Promise<string[]> {
        if (!habit.reminders.enabled || habit.reminders.times.length === 0) {
            return [];
        }

        const identifiers: string[] = [];
        const activeDays = this.getActiveDays(habit);

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
                };

                const identifier = await this.scheduleNotification(
                    habit.id,
                    `Time for: ${habit.icon} ${habit.title}`,
                    'Tap to mark as complete',
                    trigger
                );

                if (identifier) {
                    identifiers.push(identifier);
                }
            }
        }

        return identifiers;
    }

    /**
     * Cancel all notifications for a habit
     */
    async cancelHabitReminders(habitId: string): Promise<void> {
        try {
            const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

            const toCancel = scheduledNotifications.filter(
                (notification) => notification.content.data?.habitId === habitId
            );

            for (const notification of toCancel) {
                await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            }
        } catch (error) {
            console.error('Error canceling notifications:', error);
        }
    }

    /**
     * Update reminders for a habit (cancel old, schedule new)
     */
    async updateHabitReminders(habit: Habit): Promise<string[]> {
        await this.cancelHabitReminders(habit.id);
        return this.scheduleHabitReminders(habit);
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
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
     * Set up notification response listeners
     */
    setupListeners(
        onNotificationReceived?: (notification: Notifications.Notification) => void,
        onNotificationResponse?: (response: Notifications.NotificationResponse) => void
    ): () => void {
        const receivedSubscription = Notifications.addNotificationReceivedListener(
            (notification) => {
                console.log('Notification received:', notification);
                onNotificationReceived?.(notification);
            }
        );

        const responseSubscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                console.log('Notification response:', response);
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

