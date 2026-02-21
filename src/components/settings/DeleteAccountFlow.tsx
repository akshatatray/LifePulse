/**
 * Delete Account Flow Component
 * Multi-step process for account deletion with safety measures
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOut,
    SlideInRight,
    SlideOutLeft,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { accountDeletionService, DeletionProgress } from '../../services/accountDeletion';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useHabitStore } from '../../stores/habitStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSocialStore } from '../../stores/socialStore';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

type FlowStep = 'info' | 'confirm' | 'password' | 'deleting' | 'success' | 'error';

interface DeleteAccountFlowProps {
    visible: boolean;
    onClose: () => void;
}

const CONFIRMATION_TEXT = 'DELETE';

// Data that will be deleted
const DELETION_ITEMS = [
    { icon: '📋', label: 'All your habits and tracking history' },
    { icon: '🔥', label: 'Streak data and statistics' },
    { icon: '🏆', label: 'Achievements and badges earned' },
    { icon: '✨', label: 'XP points and level progress' },
    { icon: '👥', label: 'Friend connections' },
    { icon: '🏅', label: 'Leaderboard rankings' },
    { icon: '🎯', label: 'Challenge participation' },
    { icon: '⚙️', label: 'Settings and preferences' },
];

export const DeleteAccountFlow = ({ visible, onClose }: DeleteAccountFlowProps) => {
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    
    // Flow state
    const [step, setStep] = useState<FlowStep>('info');
    const [confirmText, setConfirmText] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<DeletionProgress | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Reset state when modal closes
    const handleClose = useCallback(() => {
        if (step === 'deleting') return; // Don't allow closing during deletion
        
        setStep('info');
        setConfirmText('');
        setPassword('');
        setError(null);
        setProgress(null);
        setIsLoading(false);
        onClose();
    }, [step, onClose]);

    // Handle step transitions
    const goToConfirm = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStep('confirm');
    };

    const goToPassword = () => {
        if (confirmText.toUpperCase() !== CONFIRMATION_TEXT) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(`Please type "${CONFIRMATION_TEXT}" to continue`);
            return;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setError(null);
        setStep('password');
    };

    const goBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setError(null);
        if (step === 'confirm') setStep('info');
        else if (step === 'password') setStep('confirm');
        else if (step === 'error') setStep('password');
    };

    // Clear all local stores
    const clearLocalData = async () => {
        try {
            // Reset all stores to their initial state
            useHabitStore.getState().setHabits([]);
            useHabitStore.getState().setLogs([]);
            useGamificationStore.getState().clearData();
            usePremiumStore.getState().clearData();
            useSocialStore.getState().clearSocialData();
            useSettingsStore.getState().resetSettings();
            console.log('[DeleteAccountFlow] Local stores cleared');
        } catch (e) {
            console.error('[DeleteAccountFlow] Error clearing local data:', e);
        }
    };

    // Perform account deletion
    const performDeletion = async () => {
        if (!user?.uid) {
            setError('No user found');
            setStep('error');
            return;
        }

        Keyboard.dismiss();
        setIsLoading(true);
        setError(null);

        // First, re-authenticate
        const reauthResult = await accountDeletionService.reauthenticateWithPassword(password);
        if (!reauthResult.success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(reauthResult.error || 'Authentication failed');
            setIsLoading(false);
            return;
        }

        // Move to deleting step
        setStep('deleting');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        // Perform deletion with progress updates
        const result = await accountDeletionService.deleteAccount(
            user.uid,
            (progressUpdate) => {
                setProgress(progressUpdate);
            }
        );

        if (result.success) {
            // Clear local data
            await clearLocalData();
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setStep('success');
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setError(result.error || 'Deletion failed');
            setStep('error');
        }

        setIsLoading(false);
    };

    // Render current step
    const renderStep = () => {
        switch (step) {
            case 'info':
                return renderInfoStep();
            case 'confirm':
                return renderConfirmStep();
            case 'password':
                return renderPasswordStep();
            case 'deleting':
                return renderDeletingStep();
            case 'success':
                return renderSuccessStep();
            case 'error':
                return renderErrorStep();
        }
    };

    // Step 1: Information about what will be deleted
    const renderInfoStep = () => (
        <Animated.View 
            entering={FadeIn.duration(300)} 
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
        >
            <View style={styles.warningHeader}>
                <View style={styles.warningIcon}>
                    <Feather name="alert-triangle" size={32} color={colors.accent.error} />
                </View>
                <Text style={styles.warningTitle}>Delete Your Account?</Text>
                <Text style={styles.warningSubtitle}>
                    This action is permanent and cannot be undone.
                </Text>
            </View>

            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>What will be deleted:</Text>
                <View style={styles.itemList}>
                    {DELETION_ITEMS.map((item, index) => (
                        <Animated.View
                            key={index}
                            entering={FadeInDown.delay(100 + index * 50).duration(300)}
                            style={styles.deletionItem}
                        >
                            <Text style={styles.itemIcon}>{item.icon}</Text>
                            <Text style={styles.itemLabel}>{item.label}</Text>
                        </Animated.View>
                    ))}
                </View>
            </View>

            <View style={styles.noteBox}>
                <Feather name="info" size={16} color={colors.text.muted} />
                <Text style={styles.noteText}>
                    Your email address can be used to create a new account later, but your data cannot be recovered.
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.continueButton} onPress={goToConfirm}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Feather name="chevron-right" size={18} color={colors.accent.error} />
                </Pressable>
            </View>
        </Animated.View>
    );

    // Step 2: Type DELETE to confirm
    const renderConfirmStep = () => (
        <Animated.View 
            entering={SlideInRight.duration(300)} 
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
        >
            <Pressable style={styles.backButton} onPress={goBack}>
                <Feather name="arrow-left" size={20} color={colors.text.secondary} />
                <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <View style={styles.confirmHeader}>
                <Text style={styles.stepIndicator}>Step 1 of 2</Text>
                <Text style={styles.confirmTitle}>Confirm Deletion</Text>
                <Text style={styles.confirmSubtitle}>
                    To confirm you want to delete your account, please type{' '}
                    <Text style={styles.highlightText}>{CONFIRMATION_TEXT}</Text> below.
                </Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.textInput,
                        confirmText.toUpperCase() === CONFIRMATION_TEXT && styles.textInputValid,
                    ]}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    placeholder={`Type ${CONFIRMATION_TEXT}`}
                    placeholderTextColor={colors.text.muted}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />
                {confirmText.toUpperCase() === CONFIRMATION_TEXT && (
                    <View style={styles.inputCheckmark}>
                        <Feather name="check" size={20} color={colors.accent.success} />
                    </View>
                )}
            </View>

            {error && (
                <Animated.View entering={FadeIn} style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color={colors.accent.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
            )}

            <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                    style={[
                        styles.continueButton,
                        confirmText.toUpperCase() !== CONFIRMATION_TEXT && styles.buttonDisabled,
                    ]} 
                    onPress={goToPassword}
                    disabled={confirmText.toUpperCase() !== CONFIRMATION_TEXT}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Feather name="chevron-right" size={18} color={colors.accent.error} />
                </Pressable>
            </View>
        </Animated.View>
    );

    // Step 3: Password confirmation
    const renderPasswordStep = () => (
        <Animated.View 
            entering={SlideInRight.duration(300)} 
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
        >
            <Pressable style={styles.backButton} onPress={goBack}>
                <Feather name="arrow-left" size={20} color={colors.text.secondary} />
                <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            <View style={styles.confirmHeader}>
                <Text style={styles.stepIndicator}>Step 2 of 2</Text>
                <Text style={styles.confirmTitle}>Verify Identity</Text>
                <Text style={styles.confirmSubtitle}>
                    Enter your password to confirm account deletion.
                </Text>
            </View>

            <View style={styles.emailDisplay}>
                <Feather name="mail" size={16} color={colors.text.muted} />
                <Text style={styles.emailText}>{user?.email}</Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.text.muted}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {error && (
                <Animated.View entering={FadeIn} style={styles.errorBox}>
                    <Feather name="alert-circle" size={16} color={colors.accent.error} />
                    <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
            )}

            <View style={styles.finalWarning}>
                <Feather name="alert-octagon" size={20} color={colors.accent.error} />
                <Text style={styles.finalWarningText}>
                    This is your final chance to cancel. Once you proceed, your account and all data will be permanently deleted.
                </Text>
            </View>

            <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable 
                    style={[
                        styles.deleteButton,
                        (!password || isLoading) && styles.buttonDisabled,
                    ]} 
                    onPress={performDeletion}
                    disabled={!password || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                        <>
                            <Feather name="trash-2" size={18} color={colors.text.inverse} />
                            <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </>
                    )}
                </Pressable>
            </View>
        </Animated.View>
    );

    // Step 4: Deletion in progress
    const renderDeletingStep = () => (
        <Animated.View 
            entering={FadeIn.duration(300)} 
            style={styles.stepContentCentered}
        >
            <ActivityIndicator size="large" color={colors.accent.error} />
            <Text style={styles.deletingTitle}>Deleting Account</Text>
            <Text style={styles.deletingMessage}>
                {progress?.message || 'Please wait...'}
            </Text>
            
            {progress && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View 
                            style={[
                                styles.progressFill,
                                { width: `${(progress.currentStep / progress.totalSteps) * 100}%` }
                            ]} 
                        />
                    </View>
                    <Text style={styles.progressText}>
                        {progress.currentStep} of {progress.totalSteps}
                    </Text>
                </View>
            )}

            <Text style={styles.deletingNote}>
                Please don't close the app during this process.
            </Text>
        </Animated.View>
    );

    // Step 5: Success
    const renderSuccessStep = () => (
        <Animated.View 
            entering={FadeIn.duration(300)} 
            style={styles.stepContentCentered}
        >
            <View style={styles.successIcon}>
                <Feather name="check" size={48} color={colors.accent.success} />
            </View>
            <Text style={styles.successTitle}>Account Deleted</Text>
            <Text style={styles.successMessage}>
                Your account and all associated data have been permanently deleted.
            </Text>
            <Text style={styles.successNote}>
                Thank you for using LifePulse. We hope to see you again!
            </Text>
        </Animated.View>
    );

    // Step 6: Error
    const renderErrorStep = () => (
        <Animated.View 
            entering={FadeIn.duration(300)} 
            style={styles.stepContentCentered}
        >
            <View style={styles.errorIcon}>
                <Feather name="x" size={48} color={colors.accent.error} />
            </View>
            <Text style={styles.errorTitle}>Deletion Failed</Text>
            <Text style={styles.errorMessage}>
                {error || 'An error occurred while deleting your account.'}
            </Text>

            <View style={styles.buttonRow}>
                <Pressable style={styles.cancelButton} onPress={handleClose}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.retryButton} onPress={goBack}>
                    <Feather name="refresh-cw" size={18} color={colors.text.inverse} />
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
            </View>
        </Animated.View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={step === 'deleting' ? undefined : handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={[styles.content, { paddingBottom: insets.bottom + spacing.lg }]}>
                    {/* Header */}
                    {step !== 'deleting' && step !== 'success' && (
                        <View style={styles.header}>
                            <View style={styles.dragHandle} />
                            {step === 'info' && (
                                <Pressable 
                                    style={styles.closeButton} 
                                    onPress={handleClose}
                                >
                                    <Feather name="x" size={24} color={colors.text.secondary} />
                                </Pressable>
                            )}
                        </View>
                    )}

                    {/* Step Content */}
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {renderStep()}
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    content: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingTop: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    dragHandle: {
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: colors.text.muted,
        opacity: 0.4,
    },
    closeButton: {
        position: 'absolute',
        right: spacing.lg,
        top: spacing.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.background.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
    },
    stepContent: {
        flex: 1,
    },
    stepContentCentered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },

    // Warning header
    warningHeader: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    warningIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.accent.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    warningTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['2xl'],
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    warningSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.muted,
        textAlign: 'center',
    },

    // Info section
    infoSection: {
        marginBottom: spacing.lg,
    },
    sectionTitle: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    itemList: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.xl,
        padding: spacing.md,
    },
    deletionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    itemIcon: {
        fontSize: 18,
        marginRight: spacing.md,
    },
    itemLabel: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.primary,
        flex: 1,
    },

    // Note box
    noteBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
        gap: spacing.sm,
    },
    noteText: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.xs,
        color: colors.text.muted,
        flex: 1,
        lineHeight: 18,
    },

    // Buttons
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: 'auto',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.secondary,
    },
    continueButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        backgroundColor: colors.accent.error + '15',
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
    },
    continueButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.accent.error,
    },
    deleteButton: {
        flex: 1.5,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        backgroundColor: colors.accent.error,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    deleteButtonText: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    retryButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        backgroundColor: colors.accent.success,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    retryButtonText: {
        fontFamily: fontFamily.semiBold,
        fontSize: fontSize.base,
        color: colors.text.inverse,
    },

    // Back button
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
        gap: spacing.xs,
    },
    backButtonText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },

    // Confirm step
    confirmHeader: {
        marginBottom: spacing.xl,
    },
    stepIndicator: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.accent.error,
        marginBottom: spacing.sm,
    },
    confirmTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    confirmSubtitle: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        lineHeight: 24,
    },
    highlightText: {
        fontFamily: fontFamily.bold,
        color: colors.accent.error,
    },

    // Input
    inputContainer: {
        marginBottom: spacing.lg,
        position: 'relative',
    },
    textInput: {
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        fontFamily: fontFamily.medium,
        fontSize: fontSize.lg,
        color: colors.text.primary,
        borderWidth: 2,
        borderColor: colors.border.default,
        textAlign: 'center',
    },
    textInputValid: {
        borderColor: colors.accent.success,
    },
    inputCheckmark: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        marginTop: -10,
    },

    // Email display
    emailDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background.card,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    emailText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },

    // Error
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent.error + '15',
        borderRadius: borderRadius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    errorText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.accent.error,
        flex: 1,
    },

    // Final warning
    finalWarning: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: colors.accent.error + '10',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.accent.error + '30',
    },
    finalWarningText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.sm,
        color: colors.accent.error,
        flex: 1,
        lineHeight: 20,
    },

    // Deleting step
    deletingTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize.xl,
        color: colors.text.primary,
        marginTop: spacing.xl,
        marginBottom: spacing.sm,
    },
    deletingMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    progressBar: {
        width: '80%',
        height: 6,
        backgroundColor: colors.background.card,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.accent.error,
        borderRadius: 3,
    },
    progressText: {
        fontFamily: fontFamily.medium,
        fontSize: fontSize.xs,
        color: colors.text.muted,
    },
    deletingNote: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        textAlign: 'center',
    },

    // Success step
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.accent.success + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    successTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['2xl'],
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    successMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },
    successNote: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.sm,
        color: colors.text.muted,
        textAlign: 'center',
    },

    // Error step
    errorIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.accent.error + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    errorTitle: {
        fontFamily: fontFamily.bold,
        fontSize: fontSize['2xl'],
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    errorMessage: {
        fontFamily: fontFamily.regular,
        fontSize: fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
});
