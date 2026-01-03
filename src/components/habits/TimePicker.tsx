/**
 * TimePicker Component
 * Beautiful time picker with hour/minute selection and AM/PM toggle
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    SlideInDown,
    SlideOutDown
} from 'react-native-reanimated';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface TimePickerProps {
    value?: string; // '08:00' or '20:30'
    onChange: (time: string) => void;
    accentColor?: string;
}

type Period = 'AM' | 'PM';

// Parse time string to components
const parseTime = (timeStr?: string): { hour: number; minute: number; period: Period } => {
    if (!timeStr) {
        return { hour: 9, minute: 0, period: 'AM' };
    }

    const [hourStr, minuteStr] = timeStr.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const period: Period = hour >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    return { hour, minute, period };
};

// Convert components back to 24-hour string
const formatTime = (hour: number, minute: number, period: Period): string => {
    let hour24 = hour;

    if (period === 'AM') {
        if (hour === 12) hour24 = 0;
    } else {
        if (hour !== 12) hour24 = hour + 12;
    }

    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Format for display
const formatDisplayTime = (hour: number, minute: number, period: Period): string => {
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
};

export const TimePicker = ({
    value,
    onChange,
    accentColor = colors.accent.success,
}: TimePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const { hour: initialHour, minute: initialMinute, period: initialPeriod } = parseTime(value);

    const [selectedHour, setSelectedHour] = useState(initialHour);
    const [selectedMinute, setSelectedMinute] = useState(initialMinute);
    const [selectedPeriod, setSelectedPeriod] = useState<Period>(initialPeriod);

    const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

    // Update internal state when value prop changes
    useEffect(() => {
        const { hour, minute, period } = parseTime(value);
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setSelectedPeriod(period);
    }, [value]);

    const handleOpen = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleConfirm = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const timeString = formatTime(selectedHour, selectedMinute, selectedPeriod);
        onChange(timeString);
        setIsOpen(false);
    };

    const adjustHour = (delta: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedHour((prev) => {
            let newHour = prev + delta;
            if (newHour > 12) newHour = 1;
            if (newHour < 1) newHour = 12;
            return newHour;
        });
    };

    const adjustMinute = (delta: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedMinute((prev) => {
            let newMinute = prev + delta;
            if (newMinute >= 60) newMinute = 0;
            if (newMinute < 0) newMinute = 55;
            return newMinute;
        });
    };

    const togglePeriod = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedPeriod((prev) => (prev === 'AM' ? 'PM' : 'AM'));
    };

    const displayTime = value
        ? formatDisplayTime(
            parseTime(value).hour,
            parseTime(value).minute,
            parseTime(value).period
        )
        : 'Set time';

    return (
        <>
            {/* Trigger Button */}
            <Pressable
                onPress={handleOpen}
                style={[styles.trigger, { borderColor: accentColor + '40' }]}
            >
                <View style={[styles.triggerIcon, { backgroundColor: accentColor + '20' }]}>
                    <Feather name="clock" size={18} color={accentColor} />
                </View>
                <Text style={[styles.triggerText, value && { color: accentColor }]}>
                    {displayTime}
                </Text>
                <Feather name="chevron-right" size={18} color={colors.text.muted} />
            </Pressable>

            {/* Modal */}
            <Modal
                visible={isOpen}
                transparent
                animationType="none"
                onRequestClose={handleClose}
            >
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    style={styles.overlay}
                >
                    <Pressable style={styles.overlayPressable} onPress={handleClose} />

                    <Animated.View
                        entering={SlideInDown.springify().damping(20).stiffness(200)}
                        exiting={SlideOutDown.duration(200)}
                        style={styles.modalContent}
                    >
                        {/* Handle */}
                        <View style={styles.handle} />

                        {/* Title */}
                        <Text style={styles.modalTitle}>Set Reminder Time</Text>

                        {/* Time Display */}
                        <View style={styles.timeDisplay}>
                            <Text style={[styles.timeDisplayText, { color: accentColor }]}>
                                {formatDisplayTime(selectedHour, selectedMinute, selectedPeriod)}
                            </Text>
                        </View>

                        {/* Picker */}
                        <View style={styles.pickerContainer}>
                            {/* Hour */}
                            <View style={styles.pickerColumn}>
                                <Pressable
                                    onPress={() => adjustHour(1)}
                                    style={styles.pickerButton}
                                >
                                    <Feather name="chevron-up" size={24} color={colors.text.secondary} />
                                </Pressable>
                                <View style={[styles.pickerValue, { backgroundColor: accentColor + '15' }]}>
                                    <Text style={styles.pickerValueText}>{selectedHour}</Text>
                                </View>
                                <Pressable
                                    onPress={() => adjustHour(-1)}
                                    style={styles.pickerButton}
                                >
                                    <Feather name="chevron-down" size={24} color={colors.text.secondary} />
                                </Pressable>
                                <Text style={styles.pickerLabel}>Hour</Text>
                            </View>

                            {/* Separator */}
                            <Text style={styles.pickerSeparator}>:</Text>

                            {/* Minute */}
                            <View style={styles.pickerColumn}>
                                <Pressable
                                    onPress={() => adjustMinute(5)}
                                    style={styles.pickerButton}
                                >
                                    <Feather name="chevron-up" size={24} color={colors.text.secondary} />
                                </Pressable>
                                <View style={[styles.pickerValue, { backgroundColor: accentColor + '15' }]}>
                                    <Text style={styles.pickerValueText}>
                                        {selectedMinute.toString().padStart(2, '0')}
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => adjustMinute(-5)}
                                    style={styles.pickerButton}
                                >
                                    <Feather name="chevron-down" size={24} color={colors.text.secondary} />
                                </Pressable>
                                <Text style={styles.pickerLabel}>Min</Text>
                            </View>

                            {/* Period */}
                            <View style={styles.pickerColumn}>
                                <View style={{ height: 44 }} />
                                <Pressable
                                    onPress={togglePeriod}
                                    style={[
                                        styles.periodToggle,
                                        { backgroundColor: accentColor + '15', borderColor: accentColor },
                                    ]}
                                >
                                    <Text style={[styles.periodText, { color: accentColor }]}>
                                        {selectedPeriod}
                                    </Text>
                                </Pressable>
                                <View style={{ height: 44 }} />
                                <Text style={styles.pickerLabel}>Period</Text>
                            </View>
                        </View>

                        {/* Quick Select */}
                        <View style={styles.quickSelect}>
                            <Text style={styles.quickSelectLabel}>Quick Select</Text>
                            <View style={styles.quickSelectRow}>
                                {[
                                    { label: 'Morning', hour: 8, minute: 0, period: 'AM' as Period },
                                    { label: 'Noon', hour: 12, minute: 0, period: 'PM' as Period },
                                    { label: 'Evening', hour: 6, minute: 0, period: 'PM' as Period },
                                    { label: 'Night', hour: 9, minute: 0, period: 'PM' as Period },
                                ].map((preset) => (
                                    <Pressable
                                        key={preset.label}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setSelectedHour(preset.hour);
                                            setSelectedMinute(preset.minute);
                                            setSelectedPeriod(preset.period);
                                        }}
                                        style={[
                                            styles.quickSelectButton,
                                            selectedHour === preset.hour &&
                                            selectedMinute === preset.minute &&
                                            selectedPeriod === preset.period && {
                                                backgroundColor: accentColor + '20',
                                                borderColor: accentColor,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.quickSelectButtonText,
                                                selectedHour === preset.hour &&
                                                selectedMinute === preset.minute &&
                                                selectedPeriod === preset.period && { color: accentColor },
                                            ]}
                                        >
                                            {preset.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <Pressable onPress={handleClose} style={styles.cancelButton}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                onPress={handleConfirm}
                                style={[styles.confirmButton, { backgroundColor: accentColor }]}
                            >
                                <Text style={styles.confirmButtonText}>Set Time</Text>
                            </Pressable>
                        </View>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        borderWidth: 1,
    },
    triggerIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    triggerText: {
        flex: 1,
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.muted,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    overlayPressable: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: colors.background.secondary,
        borderTopLeftRadius: borderRadius['2xl'],
        borderTopRightRadius: borderRadius['2xl'],
        paddingHorizontal: spacing.xl,
        paddingBottom: spacing['3xl'],
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.text.muted,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.lg,
        opacity: 0.4,
    },
    modalTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    timeDisplay: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    timeDisplayText: {
        fontFamily: fontFamily.bold,
        fontSize: 42,
        letterSpacing: 2,
    },
    pickerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    pickerColumn: {
        alignItems: 'center',
    },
    pickerButton: {
        padding: spacing.sm,
    },
    pickerValue: {
        width: 70,
        height: 60,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerValueText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['2xl'],
        color: colors.text.primary,
    },
    pickerLabel: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        marginTop: spacing.xs,
    },
    pickerSeparator: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['2xl'],
        color: colors.text.muted,
        marginHorizontal: spacing.sm,
        marginBottom: spacing.xl,
    },
    periodToggle: {
        width: 70,
        height: 60,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    periodText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.lg,
    },
    quickSelect: {
        marginBottom: spacing.xl,
    },
    quickSelectLabel: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.sm,
    },
    quickSelectRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    quickSelectButton: {
        flex: 1,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    quickSelectButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.xs,
        color: colors.text.secondary,
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
    },
    cancelButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.secondary,
    },
    confirmButton: {
        flex: 2,
        paddingVertical: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: borderRadius.lg,
    },
    confirmButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
});

