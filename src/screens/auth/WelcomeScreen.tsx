import { useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { colors, spacing, textStyles, fontFamily, fontSize, borderRadius } from '../../theme';
import { Button } from '../../../components/Button';
import { useAuthStore } from '../../stores/authStore';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  // Animation values
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const titleTranslateY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(50);
  const buttonsOpacity = useSharedValue(0);

  // Smooth easing for mature feel
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1); // Cubic ease-out
  const elegantDuration = 700;

  useEffect(() => {
    // Staggered entrance animations with smooth easing
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 800, easing: smoothEasing }));
    logoScale.value = withDelay(200, withTiming(1, { duration: 800, easing: smoothEasing }));

    titleOpacity.value = withDelay(500, withTiming(1, { duration: elegantDuration, easing: smoothEasing }));
    titleTranslateY.value = withDelay(500, withTiming(0, { duration: elegantDuration, easing: smoothEasing }));

    subtitleOpacity.value = withDelay(700, withTiming(1, { duration: elegantDuration, easing: smoothEasing }));
    subtitleTranslateY.value = withDelay(700, withTiming(0, { duration: elegantDuration, easing: smoothEasing }));

    buttonsOpacity.value = withDelay(900, withTiming(1, { duration: elegantDuration, easing: smoothEasing }));
    buttonsTranslateY.value = withDelay(900, withTiming(0, { duration: elegantDuration, easing: smoothEasing }));

    // Mark onboarding as seen
    setHasSeenOnboarding(true);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  const handleGetStarted = () => {
    navigation.navigate('SignUp');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={[colors.background.primary, colors.background.secondary, colors.background.primary]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />

      <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
        {/* Logo / Animation */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoCircle}>
            <LottieView
              source={require('../../../assets/animations/streak-fire.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.View style={titleAnimatedStyle}>
          <Text style={styles.title}>LifePulse</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleAnimatedStyle}>
          <Text style={styles.subtitle}>
            Build lasting habits with{'\n'}
            <Text style={styles.subtitleHighlight}>compassionate precision</Text>
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View style={[styles.featuresContainer, subtitleAnimatedStyle]}>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🎯</Text>
            <Text style={styles.featureText}>Track daily habits</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🔥</Text>
            <Text style={styles.featureText}>Build streaks</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>See your progress</Text>
          </View>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Buttons */}
        <Animated.View style={[styles.buttonsContainer, buttonsAnimatedStyle, { paddingBottom: insets.bottom + spacing.lg }]}>
          <Button
            title="Get Started"
            onPress={handleGetStarted}
            size="lg"
            style={styles.primaryButton}
          />
          
          <Button
            title="I already have an account"
            onPress={handleLogin}
            variant="ghost"
            size="md"
            style={styles.secondaryButton}
          />
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
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.accent.success,
    opacity: 0.03,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: colors.accent.primary,
    opacity: 0.05,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.accent.success,
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  lottie: {
    width: 100,
    height: 100,
  },
  title: {
    ...textStyles.displayLarge,
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 28,
  },
  subtitleHighlight: {
    color: colors.accent.success,
    fontFamily: fontFamily.semiBold,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing['3xl'],
    paddingHorizontal: spacing.sm,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  featureText: {
    ...textStyles.labelSmall,
    color: colors.text.muted,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
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
  secondaryButton: {
    marginTop: spacing.xs,
  },
});

