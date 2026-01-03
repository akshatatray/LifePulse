/**
 * PerfectDayBadge Component
 * Celebratory badge shown when user completes all habits for the day
 */

import { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';

interface PerfectDayBadgeProps {
  visible: boolean;
  streakCount?: number;
}

export const PerfectDayBadge = ({ visible, streakCount = 1 }: PerfectDayBadgeProps) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const badgeScale = useSharedValue(0);
  const starRotation = useSharedValue(0);

  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);
  const bounceEasing = Easing.bezier(0.34, 1.56, 0.64, 1);

  useEffect(() => {
    if (visible) {
      // Trigger celebration haptic
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate in
      opacity.value = withTiming(1, { duration: 400, easing: smoothEasing });
      scale.value = withTiming(1, { duration: 500, easing: bounceEasing });
      badgeScale.value = withDelay(200, withTiming(1, { duration: 400, easing: bounceEasing }));
      starRotation.value = withDelay(300, withTiming(360, { duration: 800, easing: smoothEasing }));
    } else {
      opacity.value = withTiming(0, { duration: 300, easing: smoothEasing });
      scale.value = withTiming(0.8, { duration: 300, easing: smoothEasing });
      badgeScale.value = 0;
      starRotation.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${starRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Confetti animation */}
      <View style={styles.confettiContainer}>
        <LottieView
          source={require('../../../assets/animations/confetti.json')}
          autoPlay
          loop={false}
          style={styles.confetti}
        />
      </View>

      {/* Main card */}
      <View style={styles.card}>
        {/* Badge icon */}
        <Animated.View style={[styles.badgeContainer, badgeStyle]}>
          <View style={styles.badgeOuter}>
            <Animated.View style={[styles.starContainer, starStyle]}>
              <Text style={styles.starEmoji}>⭐</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={styles.title}>Perfect Day!</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          You completed all your habits today
        </Text>

        {/* Streak info */}
        {streakCount > 1 && (
          <View style={styles.streakContainer}>
            <Text style={styles.fireEmoji}>🔥</Text>
            <Text style={styles.streakText}>
              {streakCount} day streak!
            </Text>
          </View>
        )}

        {/* Motivational message */}
        <Text style={styles.motivation}>
          {getMotivationalMessage(streakCount)}
        </Text>
      </View>
    </Animated.View>
  );
};

const getMotivationalMessage = (streak: number): string => {
  if (streak >= 30) return "Legendary! You're unstoppable! 🏆";
  if (streak >= 14) return "Two weeks strong! Amazing discipline! 💪";
  if (streak >= 7) return "One week down! Keep the momentum! 🚀";
  if (streak >= 3) return "You're building a great habit! 🌟";
  return "Great start! Tomorrow awaits! ✨";
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: -50,
    left: -100,
    right: -100,
    height: 300,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent.success + '40',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  badgeContainer: {
    marginBottom: spacing.md,
  },
  badgeOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent.success,
  },
  starContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starEmoji: {
    fontSize: 40,
  },
  title: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize['2xl'],
    color: colors.accent.success,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  fireEmoji: {
    fontSize: 18,
    marginRight: spacing.xs,
  },
  streakText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.sm,
    color: colors.accent.warning,
  },
  motivation: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
