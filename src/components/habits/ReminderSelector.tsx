/**
 * ReminderSelector Component
 * Interface to set/edit reminder times for habits
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    Layout
} from 'react-native-reanimated';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';
import { TimePicker } from './TimePicker';

interface ReminderConfig {
    enabled: boolean;
    times: string[]; // ['08:00', '20:00']
}

interface ReminderSelectorProps {
    value: ReminderConfig;
    onChange: (config: ReminderConfig) => void;
    accentColor?: string;
}

// Format time for display
const formatDisplayTime = (time: string): string => {
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const period = hour >= 12 ? 'PM' : 'AM';

    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
};

export const ReminderSelector = ({
    value,
    onChange,
    accentColor = colors.accent.success,
}: ReminderSelectorProps) => {
    const [isExpanded, setIsExpanded] = useState(value.enabled);
    const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

    const handleToggle = (enabled: boolean) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsExpanded(enabled);

        if (enabled && value.times.length === 0) {
            // Add default time when enabling
            onChange({ enabled, times: ['09:00'] });
        } else {
            onChange({ ...value, enabled });
        }
    };

    const handleAddTime = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Find next reasonable time (2 hours after last time)
        let newTime = '12:00';
        if (value.times.length > 0) {
            const lastTime = value.times[value.times.length - 1];
            const [hourStr] = lastTime.split(':');
            let newHour = (parseInt(hourStr, 10) + 4) % 24;
            newTime = `${newHour.toString().padStart(2, '0')}:00`;
        }

        onChange({
            ...value,
            times: [...value.times, newTime],
        });
    };

    const handleUpdateTime = (index: number, newTime: string) => {
        const newTimes = [...value.times];
        newTimes[index] = newTime;
        onChange({ ...value, times: newTimes });
    };

    const handleRemoveTime = (index: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const newTimes = value.times.filter((_, i) => i !== index);

        // Disable reminders if no times left
        if (newTimes.length === 0) {
            onChange({ enabled: false, times: [] });
            setIsExpanded(false);
        } else {
            onChange({ ...value, times: newTimes });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with toggle */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={[styles.headerIcon, { backgroundColor: accentColor + '20' }]}>
                        <Feather name="bell" size={18} color={accentColor} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Reminders</Text>
                        <Text style={styles.headerSubtitle}>
                            {value.enabled && value.times.length > 0
                                ? `${value.times.length} reminder${value.times.length > 1 ? 's' : ''} set`
                                : 'Get notified to complete'}
                        </Text>
                    </View>
                </View>
                <Switch
                    value={value.enabled}
                    onValueChange={handleToggle}
                    trackColor={{
                        false: colors.background.elevated,
                        true: accentColor + '60',
                    }}
                    thumbColor={value.enabled ? accentColor : colors.text.muted}
                />
            </View>

            {/* Expanded content */}
            {isExpanded && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    layout={Layout.springify().damping(20)}
                    style={styles.expandedContent}
                >
                    {/* Time list */}
                    {value.times.map((time, index) => (
                        <Animated.View
                            key={`${time}-${index}`}
                            entering={FadeIn.delay(index * 50)}
                            exiting={FadeOut.duration(150)}
                            layout={Layout.springify().damping(20)}
                            style={styles.timeRow}
                        >
                            <View style={styles.timeInfo}>
                                <View style={[styles.timeIcon, { backgroundColor: accentColor + '15' }]}>
                                    <Feather name="clock" size={14} color={accentColor} />
                                </View>
                                <View style={styles.timeDetails}>
                                    <Text style={styles.timeLabel}>Reminder {index + 1}</Text>
                                    <TimePicker
                                        value={time}
                                        onChange={(newTime) => handleUpdateTime(index, newTime)}
                                        accentColor={accentColor}
                                    />
                                </View>
                            </View>

                            {/* Remove button - only show if more than 1 time */}
                            {value.times.length > 1 && (
                                <Pressable
                                    onPress={() => handleRemoveTime(index)}
                                    style={styles.removeButton}
                                >
                                    <Feather name="x" size={16} color={colors.accent.error} />
                                </Pressable>
                            )}
                        </Animated.View>
                    ))}

                    {/* Add time button */}
                    {value.times.length < 3 && (
                        <Pressable onPress={handleAddTime} style={styles.addButton}>
                            <Feather name="plus" size={18} color={accentColor} />
                            <Text style={[styles.addButtonText, { color: accentColor }]}>
                                Add another reminder
                            </Text>
                        </Pressable>
                    )}

                    {/* Info note */}
                    <View style={styles.infoNote}>
                        <Feather name="info" size={14} color={colors.text.muted} />
                        <Text style={styles.infoNoteText}>
                            You'll receive a notification at these times on days the habit is scheduled.
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    headerTitle: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    headerSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: 2,
    },
    expandedContent: {
        marginTop: spacing.md,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
        overflow: 'hidden',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    timeInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    timeIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.sm,
        marginTop: spacing.xs,
    },
    timeDetails: {
        flex: 1,
    },
    timeLabel: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.xs,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    removeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.accent.error + '15',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: spacing.sm,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border.subtle,
        borderStyle: 'dashed',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    addButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
    },
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        padding: spacing.sm,
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.md,
    },
    infoNoteText: {
        flex: 1,
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        lineHeight: 16,
    },
});

