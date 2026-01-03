/**
 * Toast - Beautiful, reusable toast notification system
 * Matches the app's friendly UI/UX theme with smooth animations
 */

import { Feather } from '@expo/vector-icons';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useState,
} from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    runOnJS,
    SlideInUp,
    SlideOutUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHaptics } from '../../hooks/useHaptics';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

// Toast types with their configurations
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    type: ToastType;
    message: string;
    title?: string;
    duration?: number; // in ms, default 3000
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ToastData extends ToastConfig {
    id: string;
}

// Icon and color configs for each toast type
const toastStyles: Record<
    ToastType,
    { icon: keyof typeof Feather.glyphMap; color: string; bgColor: string; emoji: string }
> = {
    success: {
        icon: 'check-circle',
        color: colors.accent.success,
        bgColor: colors.accent.success + '15',
        emoji: '✨',
    },
    error: {
        icon: 'x-circle',
        color: colors.accent.error,
        bgColor: colors.accent.error + '15',
        emoji: '😕',
    },
    warning: {
        icon: 'alert-triangle',
        color: colors.accent.warning,
        bgColor: colors.accent.warning + '15',
        emoji: '⚠️',
    },
    info: {
        icon: 'info',
        color: colors.accent.info,
        bgColor: colors.accent.info + '15',
        emoji: '💡',
    },
};

// Toast Context
interface ToastContextType {
    showToast: (config: ToastConfig) => void;
    hideToast: (id: string) => void;
    hideAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Individual Toast Component
const ToastItem = ({
    toast,
    onHide,
}: {
    toast: ToastData;
    onHide: (id: string) => void;
}) => {
    const style = toastStyles[toast.type];
    const scale = useSharedValue(1);
    const progress = useSharedValue(100);
    const haptics = useHaptics();

    // Auto-dismiss progress bar animation
    React.useEffect(() => {
        const duration = toast.duration || 3000;
        progress.value = withTiming(0, { duration }, (finished) => {
            if (finished) {
                runOnJS(onHide)(toast.id);
            }
        });
    }, [toast.id, toast.duration]);

    // Trigger haptics on mount based on toast type
    React.useEffect(() => {
        if (toast.type === 'success') {
            haptics.success();
        } else if (toast.type === 'error') {
            haptics.error();
        } else if (toast.type === 'warning') {
            haptics.warning();
        } else {
            haptics.light();
        }
    }, []);

    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    const handleDismiss = () => {
        haptics.light();
        onHide(toast.id);
    };

    return (
        <Animated.View
            entering={SlideInUp.springify().damping(18).stiffness(120)}
            exiting={SlideOutUp.duration(200)}
            style={styles.toastWrapper}
        >
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={handleDismiss}
            >
                <Animated.View style={[styles.toastContainer, containerStyle]}>
                    {/* Glow effect */}
                    <View style={[styles.glowEffect, { backgroundColor: style.color + '08' }]} />

                    {/* Main content */}
                    <View style={styles.toastContent}>
                        {/* Icon with background */}
                        <View style={[styles.iconContainer, { backgroundColor: style.bgColor }]}>
                            <Text style={styles.emoji}>{style.emoji}</Text>
                        </View>

                        {/* Text content */}
                        <View style={styles.textContainer}>
                            {toast.title && (
                                <Text style={styles.toastTitle}>{toast.title}</Text>
                            )}
                            <Text
                                style={[
                                    styles.toastMessage,
                                    !toast.title && styles.toastMessageOnly,
                                ]}
                                numberOfLines={2}
                            >
                                {toast.message}
                            </Text>
                        </View>

                        {/* Action button or dismiss icon */}
                        {toast.action ? (
                            <Pressable
                                onPress={() => {
                                    haptics.medium();
                                    toast.action?.onPress();
                                    onHide(toast.id);
                                }}
                                style={[styles.actionButton, { backgroundColor: style.bgColor }]}
                            >
                                <Text style={[styles.actionText, { color: style.color }]}>
                                    {toast.action.label}
                                </Text>
                            </Pressable>
                        ) : (
                            <Pressable onPress={handleDismiss} style={styles.dismissButton}>
                                <Feather name="x" size={18} color={colors.text.muted} />
                            </Pressable>
                        )}
                    </View>

                    {/* Progress bar */}
                    <View style={styles.progressContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                { backgroundColor: style.color },
                                progressStyle,
                            ]}
                        />
                    </View>
                </Animated.View>
            </Pressable>
        </Animated.View>
    );
};

// Toast Provider Component
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const insets = useSafeAreaInsets();

    const showToast = useCallback((config: ToastConfig) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: ToastData = {
            ...config,
            id,
            duration: config.duration || 3000,
        };

        setToasts((prev) => {
            // Limit to 3 toasts max
            const limited = prev.slice(-2);
            return [...limited, newToast];
        });
    }, []);

    const hideToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const hideAll = useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, hideAll }}>
            {children}

            {/* Toast container - positioned at top */}
            <View
                style={[styles.toastListContainer, { top: insets.top + spacing.sm }]}
                pointerEvents="box-none"
            >
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onHide={hideToast} />
                ))}
            </View>
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = () => {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    // Convenience methods
    return {
        ...context,
        success: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) =>
            context.showToast({ type: 'success', message, ...options }),
        error: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) =>
            context.showToast({ type: 'error', message, ...options }),
        warning: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) =>
            context.showToast({ type: 'warning', message, ...options }),
        info: (message: string, options?: Partial<Omit<ToastConfig, 'type' | 'message'>>) =>
            context.showToast({ type: 'info', message, ...options }),
    };
};

const styles = StyleSheet.create({
    toastListContainer: {
        position: 'absolute',
        left: spacing.md,
        right: spacing.md,
        zIndex: 9999,
        gap: spacing.sm,
    },
    toastWrapper: {
        width: '100%',
    },
    toastContainer: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        // Elevation for Android
        elevation: 12,
        borderWidth: 1,
        borderColor: colors.border.subtle,
    },
    glowEffect: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        borderRadius: borderRadius.xl,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        paddingBottom: spacing.md + 3, // Account for progress bar
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    emoji: {
        fontSize: 20,
    },
    textContainer: {
        flex: 1,
        marginRight: spacing.sm,
    },
    toastTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.primary,
        marginBottom: 2,
    },
    toastMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        lineHeight: fontSize.sm * 1.4,
    },
    toastMessageOnly: {
        fontSize: fontSize.base,
        color: colors.text.primary,
    },
    actionButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
    },
    actionText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
    },
    dismissButton: {
        padding: spacing.xs,
    },
    progressContainer: {
        height: 3,
        backgroundColor: colors.background.elevated,
        borderBottomLeftRadius: borderRadius.xl,
        borderBottomRightRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
});

