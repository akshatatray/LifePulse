import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  TextInput as RNTextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, textStyles, fontFamily, borderRadius } from '../../theme';
import { Button } from '../../../components/Button';
import { Input, Checkbox } from '../../components/ui';
import { IconButton } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { signUp, loginWithGoogle, loginWithApple, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmPasswordRef = useRef<RNTextInput>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(30);
  const socialOpacity = useSharedValue(0);
  const shakeX = useSharedValue(0);

  // Smooth easing for mature feel
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
  const elegantDuration = 600;

  useEffect(() => {
    headerOpacity.value = withDelay(100, withTiming(1, { duration: elegantDuration, easing: smoothEasing }));
    headerTranslateY.value = withDelay(100, withTiming(0, { duration: elegantDuration, easing: smoothEasing }));
    formOpacity.value = withDelay(250, withTiming(1, { duration: elegantDuration, easing: smoothEasing }));
    formTranslateY.value = withDelay(250, withTiming(0, { duration: elegantDuration, easing: smoothEasing }));
    socialOpacity.value = withDelay(400, withTiming(1, { duration: elegantDuration, easing: smoothEasing }));
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }, { translateX: shakeX.value }],
  }));

  const socialAnimatedStyle = useAnimatedStyle(() => ({
    opacity: socialOpacity.value,
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      shake();
      return;
    }

    const result = await signUp(email.trim(), password, displayName.trim());

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      shake();
      setErrors({ email: result.error });
    }
  };

  const handleGoogleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await loginWithGoogle();
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAppleSignUp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await loginWithApple();
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <IconButton
            icon="arrow-left"
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />

          {/* Header */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start your habit journey today</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.form, formAnimatedStyle]}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                setErrors((prev) => ({ ...prev, displayName: undefined }));
              }}
              error={errors.displayName}
              leftIcon="user"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />

            <Input
              ref={emailRef}
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              error={errors.email}
              leftIcon="mail"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <Input
              ref={passwordRef}
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              hint="At least 6 characters"
              leftIcon="lock"
              secureTextEntry
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />

            <Input
              ref={confirmPasswordRef}
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              error={errors.confirmPassword}
              leftIcon="lock"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignUp}
            />

            {/* Terms checkbox */}
            <View style={styles.termsContainer}>
              <Checkbox
                checked={agreeToTerms}
                onToggle={(checked) => {
                  setAgreeToTerms(checked);
                  setErrors((prev) => ({ ...prev, terms: undefined }));
                }}
                size="sm"
              />
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>
                  I agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>
            </View>
            {errors.terms && <Text style={styles.termsError}>{errors.terms}</Text>}

            <Button
              title="Create Account"
              onPress={handleSignUp}
              loading={isLoading}
              size="lg"
              style={styles.signUpButton}
            />
          </Animated.View>

          {/* Divider */}
          <Animated.View style={[styles.divider, socialAnimatedStyle]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign up with</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Social sign up */}
          <Animated.View style={[styles.socialContainer, socialAnimatedStyle]}>
            <Pressable
              style={styles.socialButton}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
            >
              <View style={styles.socialIconContainer}>
                <Text style={styles.socialIcon}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Google</Text>
            </Pressable>

            {Platform.OS === 'ios' && (
              <Pressable
                style={styles.socialButton}
                onPress={handleAppleSignUp}
                disabled={isLoading}
              >
                <View style={styles.socialIconContainer}>
                  <Ionicons name="logo-apple" size={22} color={colors.text.primary} />
                </View>
                <Text style={styles.socialButtonText}>Apple</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Login link */}
          <Animated.View style={[styles.loginContainer, socialAnimatedStyle]}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
  },
  form: {
    marginBottom: spacing.xl,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  termsText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.accent.success,
    fontFamily: fontFamily.semiBold,
  },
  termsError: {
    ...textStyles.bodySmall,
    color: colors.accent.error,
    marginBottom: spacing.md,
    marginLeft: spacing['2xl'],
  },
  signUpButton: {
    marginTop: spacing.lg,
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  dividerText: {
    ...textStyles.labelSmall,
    color: colors.text.muted,
    marginHorizontal: spacing.md,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  socialIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: '#4285F4',
  },
  socialButtonText: {
    ...textStyles.labelMedium,
    color: colors.text.primary,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  loginLink: {
    ...textStyles.labelMedium,
    color: colors.accent.success,
  },
});

