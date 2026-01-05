/**
 * WelcomeScreen - Professional, elegant onboarding experience
 * Modern design with sophisticated animations
 */

import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { useAuthStore } from '../../stores/authStore';
import {
  borderRadius,
  colors,
  fontFamily,
  fontSize,
  spacing,
} from '../../theme';

const { width, height } = Dimensions.get('window');

// Feature data
const FEATURES = [
  {
    icon: 'target',
    title: 'Smart Tracking',
    description: 'Build habits that stick',
    gradient: ['#10B981', '#059669'],
  },
  {
    icon: 'trending-up',
    title: 'Analytics',
    description: 'Visualize your growth',
    gradient: ['#3B82F6', '#2563EB'],
  },
  {
    icon: 'users',
    title: 'Community',
    description: 'Grow together',
    gradient: ['#8B5CF6', '#7C3AED'],
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const featuresOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(30);
  
  // Floating orbs animation
  const orb1Y = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb3Y = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  useEffect(() => {
    // Logo entrance
    logoOpacity.value = withDelay(100, withTiming(1, { duration: 800, easing: smoothEasing }));
    logoScale.value = withDelay(100, withTiming(1, { duration: 1000, easing: smoothEasing }));

    // Title entrance
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 700, easing: smoothEasing }));
    titleTranslateY.value = withDelay(400, withTiming(0, { duration: 700, easing: smoothEasing }));

    // Subtitle entrance
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 700, easing: smoothEasing }));

    // Features entrance
    featuresOpacity.value = withDelay(800, withTiming(1, { duration: 700, easing: smoothEasing }));

    // Buttons entrance
    buttonsOpacity.value = withDelay(1000, withTiming(1, { duration: 700, easing: smoothEasing }));
    buttonsTranslateY.value = withDelay(1000, withTiming(0, { duration: 700, easing: smoothEasing }));

    // Floating orbs animation
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2Y.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(12, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    orb3Y.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(-10, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Logo pulse
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Mark onboarding as seen
    setHasSeenOnboarding(true);
  }, []);

  // Animated styles
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * pulseScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const featuresStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb3Y.value }],
  }));

  const handleGetStarted = () => {
    navigation.navigate('SignUp');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Multi-layered gradient background */}
      <LinearGradient
        colors={['#0A0A0F', '#0F1419', '#0A0A0F']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Accent gradient overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(16, 185, 129, 0.03)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating orbs */}
      <Animated.View style={[styles.orb1, orb1Style]}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.02)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.orb2, orb2Style]}>
        <LinearGradient
          colors={['rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.02)']}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.orb3, orb3Style]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.1)', 'rgba(139, 92, 246, 0.02)']}
          style={styles.orbGradient}
        />
      </Animated.View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
        {/* Logo with Lottie Animation */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoCircle}>
            <LottieView
              source={require('../../../assets/animations/streak-fire.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
          {/* Glow effect */}
          <View style={styles.logoGlow} />
        </Animated.View>

        {/* Title */}
        <Animated.View style={titleStyle}>
          <Text style={styles.title}>LifePulse</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>
            Transform your daily routine into{'\n'}
            <Text style={styles.subtitleGradient}>meaningful progress</Text>
          </Text>
        </Animated.View>

        {/* Feature cards */}
        <Animated.View style={[styles.featuresContainer, featuresStyle]}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeIn.delay(900 + index * 150).duration(500)}
              style={styles.featureCard}
            >
              <LinearGradient
                colors={feature.gradient as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureIconBg}
              >
                <Feather name={feature.icon as any} size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonsContainer,
            buttonsStyle,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
        >
          {/* Primary CTA */}
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            size="lg"
            style={styles.primaryButton}
          />

          {/* Secondary CTA */}
          <Button
            title="I already have an account"
            onPress={handleLogin}
            variant="ghost"
            size="md"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },

  // Floating orbs
  orb1: {
    position: 'absolute',
    top: height * 0.1,
    right: -80,
    width: 250,
    height: 250,
  },
  orb2: {
    position: 'absolute',
    top: height * 0.4,
    left: -100,
    width: 200,
    height: 200,
  },
  orb3: {
    position: 'absolute',
    bottom: height * 0.15,
    right: -60,
    width: 180,
    height: 180,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 200,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },

  // Logo
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 15,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#10B981',
    opacity: 0.12,
    top: -25,
    zIndex: -1,
  },

  // Title
  title: {
    fontFamily: fontFamily.bold,
    fontSize: 44,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -2,
  },

  // Subtitle
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 28,
  },
  subtitleGradient: {
    color: '#10B981',
    fontFamily: fontFamily.semiBold,
  },

  // Features
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing['3xl'],
    gap: spacing.sm,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
  },

  // Spacer
  spacer: {
    flex: 1,
    minHeight: spacing['2xl'],
  },

  // Buttons
  buttonsContainer: {
    gap: spacing.md,
  },
  primaryButton: {
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
