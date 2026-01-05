import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
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
import { colors, spacing, textStyles, fontFamily, fontSize, borderRadius } from '../../theme';
import { Button } from '../../../components/Button';
import { Input } from '../../components/ui';
import { IconButton } from '../../components/ui';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { login, loginWithGoogle, loginWithApple, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const passwordRef = useRef<RNTextInput>(null);

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
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      shake();
      return;
    }

    const result = await login(email.trim(), password);

    if (!result.success) {
      shake();
      setErrors({ password: result.error });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGoogleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await loginWithGoogle();
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleAppleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await loginWithApple();
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Reset Password',
      'Password reset functionality will be available when Firebase is integrated.',
      [{ text: 'OK' }]
    );
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
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.form, formAnimatedStyle]}>
            <Input
              label="Email or Username"
              placeholder="Enter your email or username"
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
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              leftIcon="lock"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <Pressable onPress={handleForgotPassword} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </Pressable>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={styles.loginButton}
            />

            {/* Demo credentials hint */}
            {/* <View style={styles.demoHint}>
              <Feather name="info" size={14} color={colors.text.muted} />
              <Text style={styles.demoHintText}>
                Demo: akshatatray / 123456
              </Text>
            </View> */}
          </Animated.View>

          {/* Divider */}
          <Animated.View style={[styles.divider, socialAnimatedStyle]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Social login */}
          <Animated.View style={[styles.socialContainer, socialAnimatedStyle]}>
            <Pressable
              style={styles.socialButton}
              onPress={handleGoogleLogin}
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
                onPress={handleAppleLogin}
                disabled={isLoading}
              >
                <View style={styles.socialIconContainer}>
                  <Ionicons name="logo-apple" size={22} color={colors.text.primary} />
                </View>
                <Text style={styles.socialButtonText}>Apple</Text>
              </Pressable>
            )}
          </Animated.View>

          {/* Sign up link */}
          <Animated.View style={[styles.signUpContainer, socialAnimatedStyle]}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
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
    marginBottom: spacing['2xl'],
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.xl,
    paddingVertical: spacing.xs,
  },
  forgotPasswordText: {
    ...textStyles.labelMedium,
    color: colors.accent.success,
  },
  loginButton: {
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  demoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  demoHintText: {
    ...textStyles.bodySmall,
    color: colors.text.muted,
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
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
  },
  signUpLink: {
    ...textStyles.labelMedium,
    color: colors.accent.success,
  },
});

