import { useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, fontFamily, fontSize, borderRadius, cardDimensions } from '../../theme';
import { Habit, HabitLog } from '../../types/habit';
import { getFrequencyDescription } from '../../utils/frequency';
import { useHaptics } from '../../hooks/useHaptics';
import { useSound } from '../../hooks/useSound';
import { useSettingsStore } from '../../stores/settingsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

// Haptic thresholds for progressive feedback
const HAPTIC_LIGHT_THRESHOLD = 30;
const HAPTIC_MEDIUM_THRESHOLD = 60;
const HAPTIC_HEAVY_THRESHOLD = 90;

interface SwipeableHabitCardProps {
  habit: Habit;
  log?: HabitLog;
  onComplete: () => void;
  onSkip: () => void;
  onUndo: () => void;
  onPress?: () => void;
  isEditable?: boolean; // Whether this card can be swiped (only true for today)
  isFutureDate?: boolean; // Whether this is a future date (show as "to do" without completion status)
}

export const SwipeableHabitCard = ({
  habit,
  log,
  onComplete,
  onSkip,
  onUndo,
  onPress,
  isEditable = true,
  isFutureDate = false,
}: SwipeableHabitCardProps) => {
  const translateX = useSharedValue(0);
  const cardHeight = useSharedValue(cardDimensions.habitCard);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const completionGlow = useSharedValue(0);
  
  // Settings-aware haptics and sounds
  const haptics = useHaptics();
  const sound = useSound();
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  
  // Track which haptic levels have been triggered
  const lastHapticLevel = useRef(0);
  const wasCompleted = useRef(false);
  
  const isCompleted = log?.status === 'completed';
  const isSkipped = log?.status === 'skipped';
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  // Completion animation - scale up then settle
  useEffect(() => {
    if (isCompleted && !wasCompleted.current) {
      // Just completed - animate!
      cardScale.value = withSequence(
        withSpring(1.05, { damping: 8, stiffness: 400 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      completionGlow.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      );
    }
    wasCompleted.current = isCompleted;
  }, [isCompleted]);

  // Progressive haptic feedback based on swipe distance
  const triggerProgressiveHaptic = (distance: number) => {
    if (!hapticsEnabled) return;
    
    const absDistance = Math.abs(distance);
    let currentLevel = 0;
    
    if (absDistance >= HAPTIC_HEAVY_THRESHOLD) {
      currentLevel = 3;
    } else if (absDistance >= HAPTIC_MEDIUM_THRESHOLD) {
      currentLevel = 2;
    } else if (absDistance >= HAPTIC_LIGHT_THRESHOLD) {
      currentLevel = 1;
    }
    
    // Only trigger haptic when crossing into a new level
    if (currentLevel > lastHapticLevel.current) {
      if (currentLevel === 1) {
        haptics.light();
      } else if (currentLevel === 2) {
        haptics.medium();
      } else if (currentLevel === 3) {
        haptics.heavy();
      }
      lastHapticLevel.current = currentLevel;
    } else if (currentLevel < lastHapticLevel.current) {
      // User is sliding back - update level without haptic
      lastHapticLevel.current = currentLevel;
    }
  };

  const handleComplete = () => {
    // Success haptic and sound for completion
    haptics.success();
    sound.complete();
    onComplete();
  };

  const handleSkip = () => {
    // Warning haptic and sound for skip
    haptics.warning();
    sound.skip();
    onSkip();
  };

  const handleUndo = () => {
    haptics.light();
    sound.undo();
    onUndo();
  };

  const handleLockedTap = () => {
    // Light haptic to indicate locked
    haptics.light();
  };

  const panGesture = Gesture.Pan()
    .enabled(isEditable) // Disable pan gesture if not editable
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      // Reset haptic level at start of gesture
      lastHapticLevel.current = 0;
    })
    .onUpdate((event) => {
      // Don't allow swipe if already actioned or not editable
      if (isCompleted || isSkipped || !isEditable) return;
      
      translateX.value = event.translationX;
      
      // Trigger progressive haptic feedback
      runOnJS(triggerProgressiveHaptic)(event.translationX);
    })
    .onEnd((event) => {
      if (isCompleted || isSkipped || !isEditable) return;
      
      // Reset haptic level
      lastHapticLevel.current = 0;
      
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - Complete
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 200, easing: smoothEasing });
        runOnJS(handleComplete)();
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - Skip
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200, easing: smoothEasing });
        runOnJS(handleSkip)();
      } else {
        // Snap back
        translateX.value = withTiming(0, { duration: 200, easing: smoothEasing });
      }
    });

  const tapGesture = Gesture.Tap()
    .onEnd(() => {
      if (!isEditable) {
        // Just show locked feedback, allow viewing/editing habit details
        runOnJS(handleLockedTap)();
        if (onPress) {
          runOnJS(onPress)();
        }
        return;
      }
      
      if (isCompleted || isSkipped) {
        runOnJS(handleUndo)();
      } else if (onPress) {
        runOnJS(onPress)();
      }
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: cardScale.value },
    ],
    opacity: cardOpacity.value,
    height: cardHeight.value,
  }));

  // Glow effect for completion
  const glowStyle = useAnimatedStyle(() => ({
    opacity: completionGlow.value,
    transform: [{ scale: 1 + completionGlow.value * 0.1 }],
  }));

  const leftActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.8, 1],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const rightActionStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0.8, 1],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  return (
    <View style={styles.container}>
      {/* Background actions - only show if editable */}
      {isEditable && (
        <View style={styles.actionsContainer}>
          {/* Left action - Complete */}
          <Animated.View style={[styles.leftAction, leftActionStyle]}>
            <Feather name="check" size={24} color={colors.text.inverse} />
            <Text style={styles.actionText}>Done</Text>
          </Animated.View>
          
          {/* Right action - Skip */}
          <Animated.View style={[styles.rightAction, rightActionStyle]}>
            <Feather name="fast-forward" size={24} color={colors.text.primary} />
            <Text style={styles.actionTextSkip}>Skip</Text>
          </Animated.View>
        </View>
      )}

      {/* Card */}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.card,
            isCompleted && styles.cardCompleted,
            isSkipped && styles.cardSkipped,
            // Only show "missed" style for past dates, not future dates
            !isEditable && !isFutureDate && !isCompleted && !isSkipped && styles.cardMissed,
            // Show faded style for future dates
            isFutureDate && styles.cardFuture,
            cardAnimatedStyle,
          ]}
        >
          {/* Completion glow overlay */}
          {isCompleted && (
            <Animated.View 
              style={[styles.completionGlow, glowStyle]} 
              pointerEvents="none"
            />
          )}
          {/* Icon */}
          <View style={[
            styles.iconContainer, 
            { backgroundColor: habit.color + '20' },
            !isEditable && !isFutureDate && !isCompleted && !isSkipped && styles.iconContainerLocked,
            isFutureDate && styles.iconContainerFuture,
          ]}>
            <Text style={[
              styles.icon, 
              !isEditable && !isFutureDate && !isCompleted && !isSkipped && styles.iconLocked,
              isFutureDate && styles.iconFuture,
            ]}>{habit.icon}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                (isCompleted || isSkipped) && styles.titleDone,
                !isEditable && !isFutureDate && !isCompleted && !isSkipped && styles.titleLocked,
                isFutureDate && styles.titleFuture,
              ]}
              numberOfLines={1}
            >
              {habit.title}
            </Text>
            <View style={styles.meta}>
              {/* Frequency badge */}
              <Text style={[
                styles.frequencyText, 
                !isEditable && !isCompleted && styles.frequencyTextLocked,
                isFutureDate && styles.frequencyTextFuture,
              ]}>
                {getFrequencyDescription(habit.frequencyConfig)}
              </Text>
              {habit.currentStreak > 0 && (
                <View style={[
                  styles.streakBadge, 
                  !isEditable && !isCompleted && styles.streakBadgeLocked,
                  isFutureDate && styles.streakBadgeFuture,
                ]}>
                  <Text style={styles.streakIcon}>🔥</Text>
                  <Text style={[
                    styles.streakText, 
                    !isEditable && !isCompleted && styles.streakTextLocked,
                    isFutureDate && styles.streakTextFuture,
                  ]}>
                    {habit.currentStreak}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status indicator */}
          <View style={styles.statusContainer}>
            {isCompleted ? (
              // Completed - green checkmark
              <View style={[styles.completedBadge, !isEditable && styles.completedBadgeLocked]}>
                <Feather name="check" size={16} color={colors.text.inverse} />
              </View>
            ) : isSkipped ? (
              // Skipped - minus icon
              <View style={styles.skippedBadge}>
                <Feather name="minus" size={16} color={colors.text.muted} />
              </View>
            ) : isFutureDate ? (
              // Future date - show clock icon to indicate "scheduled"
              <View style={styles.futureBadge}>
                <Feather name="clock" size={14} color={colors.text.muted} />
              </View>
            ) : !isEditable ? (
              // Not done on a past date - show missed indicator
              <View style={styles.missedBadge}>
                <Feather name="x" size={14} color={colors.accent.error} />
              </View>
            ) : (
              // Pending for today - show color dot
              <View style={[styles.colorDot, { backgroundColor: habit.color }]} />
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    height: cardDimensions.habitCard,
  },
  actionsContainer: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  leftAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  rightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  actionText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.inverse,
  },
  actionTextSkip: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  card: {
    height: cardDimensions.habitCard,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  cardCompleted: {
    backgroundColor: colors.accent.success + '15',
    borderWidth: 1,
    borderColor: colors.accent.success + '30',
    overflow: 'hidden',
  },
  completionGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accent.success,
    borderRadius: borderRadius.lg,
  },
  cardSkipped: {
    backgroundColor: colors.background.elevated,
    opacity: 0.7,
  },
  cardMissed: {
    backgroundColor: colors.accent.error + '08',
    borderWidth: 1,
    borderColor: colors.accent.error + '20',
    opacity: 0.8,
  },
  cardFuture: {
    opacity: 0.6,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerLocked: {
    opacity: 0.7,
  },
  iconContainerFuture: {
    opacity: 0.8,
  },
  icon: {
    fontSize: 24,
  },
  iconLocked: {
    opacity: 0.8,
  },
  iconFuture: {
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  titleDone: {
    color: colors.text.secondary,
  },
  titleLocked: {
    color: colors.text.secondary,
  },
  titleFuture: {
    color: colors.text.muted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  frequencyText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  frequencyTextLocked: {
    color: colors.text.muted,
  },
  frequencyTextFuture: {
    color: colors.text.muted,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent.warning + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  streakBadgeLocked: {
    backgroundColor: colors.background.elevated,
  },
  streakBadgeFuture: {
    backgroundColor: colors.background.elevated,
    opacity: 0.7,
  },
  streakIcon: {
    fontSize: 10,
  },
  streakText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
    color: colors.accent.warning,
  },
  streakTextLocked: {
    color: colors.text.muted,
  },
  streakTextFuture: {
    color: colors.text.muted,
  },
  statusContainer: {
    marginLeft: spacing.sm,
  },
  completedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeLocked: {
    opacity: 0.7,
  },
  skippedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  futureBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
