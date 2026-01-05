/**
 * EmailVerificationScreen - Beautiful verification pending screen
 * Blocks user access until email is verified
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
  textStyles,
} from '../../theme';

export default function EmailVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const {
    user,
    logout,
    sendVerificationEmail,
    checkEmailVerification,
    isLoading,
    isCheckingVerification,
  } = useAuthStore();

  const [resendCooldown, setResendCooldown] = useState(0);
  const appState = useRef(AppState.currentState);

  // Animation values
  const envelopeRotate = useSharedValue(0);
  const envelopeScale = useSharedValue(1);
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);

  // Start animations
  useEffect(() => {
    // Envelope floating animation
    envelopeScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Subtle rotation
    envelopeRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Sparkle animations
    sparkle1.value = withRepeat(
      withSequence(
        withDelay(0, withTiming(1, { duration: 1500 })),
        withTiming(0, { duration: 1500 })
      ),
      -1
    );
    sparkle2.value = withRepeat(
      withSequence(
        withDelay(500, withTiming(1, { duration: 1500 })),
        withTiming(0, { duration: 1500 })
      ),
      -1
    );
    sparkle3.value = withRepeat(
      withSequence(
        withDelay(1000, withTiming(1, { duration: 1500 })),
        withTiming(0, { duration: 1500 })
      ),
      -1
    );
  }, []);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-check verification when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[EmailVerification] App came to foreground, checking verification...');
        checkEmailVerification();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Animated styles
  const envelopeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: envelopeScale.value },
      { rotate: `${envelopeRotate.value}deg` },
    ],
  }));

  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1.value,
    transform: [{ scale: sparkle1.value }],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2.value,
    transform: [{ scale: sparkle2.value }],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3.value,
    transform: [{ scale: sparkle3.value }],
  }));

  const handleResendEmail = useCallback(async () => {
    if (resendCooldown > 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await sendVerificationEmail();

    if (result.success) {
      setResendCooldown(60); // 60 second cooldown
      showToast({
        type: 'success',
        message: 'Verification email sent! Check your inbox and spam folder.',
      });
    } else {
      showToast({
        type: 'error',
        message: result.error || 'Failed to send email',
      });
    }
  }, [resendCooldown, sendVerificationEmail, showToast]);

  const handleCheckVerification = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const isVerified = await checkEmailVerification();

    if (isVerified) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast({
        type: 'success',
        message: 'Email verified! Welcome to LifePulse! 🎉',
      });
    } else {
      showToast({
        type: 'info',
        message: 'Not verified yet. Please check your email and click the verification link.',
      });
    }
  }, [checkEmailVerification, showToast]);

  const handleLogout = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await logout();
  }, [logout]);

  const maskedEmail = user?.email
    ? user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background.primary, colors.background.card, colors.background.primary]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Envelope illustration */}
        <Animated.View
          entering={FadeIn.delay(200).duration(600)}
          style={styles.illustrationContainer}
        >
          <Animated.View style={[styles.envelopeWrapper, envelopeStyle]}>
            {/* Sparkles */}
            <Animated.View style={[styles.sparkle, styles.sparkle1, sparkle1Style]}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle2, sparkle2Style]}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>
            <Animated.View style={[styles.sparkle, styles.sparkle3, sparkle3Style]}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>

            {/* Envelope icon */}
            <LinearGradient
              colors={[colors.accent.success, '#0EA5E9']}
              style={styles.envelopeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="mail" size={64} color="#fff" />
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Text content */}
        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={styles.textContainer}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to
          </Text>
          <View style={styles.emailContainer}>
            <Feather name="mail" size={16} color={colors.accent.success} />
            <Text style={styles.email}>{maskedEmail}</Text>
          </View>
          <Text style={styles.description}>
            Click the link in the email to verify your account and start your habit journey!
          </Text>
        </Animated.View>

        {/* Action buttons */}
        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.actionsContainer}>
          {/* Check verification button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleCheckVerification}
            disabled={isCheckingVerification}
          >
            <LinearGradient
              colors={[colors.accent.success, '#059669']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isCheckingVerification ? (
                <Animated.View
                  entering={FadeIn.duration(200)}
                  style={styles.buttonContent}
                >
                  <Feather name="loader" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Checking...</Text>
                </Animated.View>
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="check-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>I've verified my email</Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {/* Resend email button */}
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.buttonPressed,
              resendCooldown > 0 && styles.buttonDisabled,
            ]}
            onPress={handleResendEmail}
            disabled={resendCooldown > 0 || isLoading}
          >
            <Feather
              name="refresh-cw"
              size={18}
              color={resendCooldown > 0 ? colors.text.muted : colors.accent.success}
            />
            <Text
              style={[
                styles.secondaryButtonText,
                resendCooldown > 0 && styles.buttonTextDisabled,
              ]}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : 'Resend verification email'}
            </Text>
          </Pressable>

          {/* Help text */}
          <View style={styles.helpContainer}>
            <Feather name="info" size={14} color={colors.text.muted} />
            <Text style={styles.helpText}>
              Can't find the email? Check your spam folder
            </Text>
          </View>
        </Animated.View>

        {/* Sign out link */}
        <Animated.View entering={FadeIn.delay(800).duration(600)} style={styles.footer}>
          <Text style={styles.footerText}>Wrong email? </Text>
          <Pressable onPress={handleLogout}>
            <Text style={styles.signOutLink}>Sign out</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Illustration
  illustrationContainer: {
    marginBottom: spacing['2xl'],
  },
  envelopeWrapper: {
    position: 'relative',
  },
  envelopeGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: -10,
    right: -10,
  },
  sparkle2: {
    top: 20,
    left: -20,
  },
  sparkle3: {
    bottom: 10,
    right: -15,
  },
  sparkleText: {
    fontSize: 24,
  },

  // Text content
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  email: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  description: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  // Actions
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
  },
  primaryButton: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  primaryButtonText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    width: '100%',
    gap: spacing.sm,
  },
  secondaryButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.accent.success,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
    borderColor: colors.border.subtle,
  },
  buttonTextDisabled: {
    color: colors.text.muted,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  helpText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing['2xl'],
  },
  footerText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  signOutLink: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.accent.error,
  },
});

