/**
 * Badge Component
 * Displays a badge with locked/unlocked states and beautiful animations
 */

import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { BadgeRarity, Badge as BadgeType, RARITY_COLORS } from '../../data/badges';
import { borderRadius, colors, fontFamily, fontSize, spacing } from '../../theme';

interface BadgeProps {
  badge: BadgeType;
  isUnlocked: boolean;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  onPress?: () => void;
  animateOnMount?: boolean;
  index?: number; // For staggered animations
}

const SIZES = {
  small: { badge: 48, icon: 20, font: 10 },
  medium: { badge: 64, icon: 28, font: 12 },
  large: { badge: 80, icon: 36, font: 14 },
};

// Rarity gradient colors
const RARITY_GRADIENTS: Record<BadgeRarity, [string, string]> = {
  common: ['#6B7280', '#4B5563'],
  uncommon: ['#10B981', '#059669'],
  rare: ['#3B82F6', '#2563EB'],
  epic: ['#8B5CF6', '#7C3AED'],
  legendary: ['#F59E0B', '#D97706'],
};

export const Badge = ({
  badge,
  isUnlocked,
  size = 'medium',
  showDetails = false,
  onPress,
  animateOnMount = true,
  index = 0,
}: BadgeProps) => {
  const scale = useSharedValue(animateOnMount ? 0 : 1);
  const opacity = useSharedValue(animateOnMount ? 0 : 1);
  const glow = useSharedValue(0);
  const shine = useSharedValue(0);
  
  const dimensions = SIZES[size];
  const rarityColor = RARITY_COLORS[badge.rarity];
  const gradientColors = RARITY_GRADIENTS[badge.rarity];

  useEffect(() => {
    if (animateOnMount) {
      const delay = index * 50;
      scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 200 }));
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    }
    
    // Glow animation for unlocked badges
    if (isUnlocked && badge.rarity !== 'common') {
      glow.value = withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0, { duration: 1500 })
      );
      // Repeat glow
      const interval = setInterval(() => {
        glow.value = withSequence(
          withTiming(0.5, { duration: 1500 }),
          withTiming(0, { duration: 1500 })
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isUnlocked, animateOnMount, index, badge.rarity]);

  // Shine animation on press
  const handlePress = () => {
    if (isUnlocked) {
      shine.value = withSequence(
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 300 })
      );
    }
    onPress?.();
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.2 }],
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shine.value, [0, 0.5, 1], [0, 0.8, 0]),
    transform: [
      { translateX: interpolate(shine.value, [0, 1], [-dimensions.badge, dimensions.badge]) },
    ],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Pressable onPress={handlePress} style={showDetails && styles.withDetails}>
        {/* Glow effect for rare+ badges */}
        {isUnlocked && badge.rarity !== 'common' && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                width: dimensions.badge + 16,
                height: dimensions.badge + 16,
                borderRadius: (dimensions.badge + 16) / 2,
                backgroundColor: rarityColor,
              },
              glowStyle,
            ]}
          />
        )}
        
        {/* Badge circle */}
        <View
          style={[
            styles.badgeCircle,
            {
              width: dimensions.badge,
              height: dimensions.badge,
              borderRadius: dimensions.badge / 2,
            },
            isUnlocked
              ? { borderColor: rarityColor, borderWidth: 2 }
              : styles.lockedBadge,
          ]}
        >
          {isUnlocked ? (
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: dimensions.badge / 2 },
              ]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.lockedBackground,
                { borderRadius: dimensions.badge / 2 },
              ]}
            />
          )}
          
          {/* Icon/Emoji */}
          {isUnlocked ? (
            <Text style={[styles.emoji, { fontSize: dimensions.icon }]}>
              {badge.icon}
            </Text>
          ) : (
            <Feather
              name="lock"
              size={dimensions.icon * 0.7}
              color={colors.text.muted}
            />
          )}
          
          {/* Shine effect */}
          {isUnlocked && (
            <Animated.View
              style={[
                styles.shine,
                { borderRadius: dimensions.badge / 2 },
                shineStyle,
              ]}
            />
          )}
        </View>
        
        {/* Details section */}
        {showDetails && (
          <View style={styles.details}>
            <Text
              style={[
                styles.badgeName,
                { fontSize: dimensions.font },
                !isUnlocked && styles.lockedText,
              ]}
              numberOfLines={1}
            >
              {badge.name}
            </Text>
            
            {size === 'large' && (
              <>
                <Text
                  style={[
                    styles.badgeDescription,
                    !isUnlocked && styles.lockedText,
                  ]}
                  numberOfLines={2}
                >
                  {badge.description}
                </Text>
                
                {/* Points */}
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsIcon}>✨</Text>
                  <Text style={[styles.pointsText, { color: rarityColor }]}>
                    {badge.points} pts
                  </Text>
                </View>
              </>
            )}
            
            {/* Rarity indicator */}
            <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
              <Text style={[styles.rarityText, { color: rarityColor }]}>
                {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

/**
 * BadgeUnlockModal - Shows when a badge is newly unlocked
 */
interface BadgeUnlockModalProps {
  badge: BadgeType;
  visible: boolean;
  onDismiss: () => void;
}

export const BadgeUnlockAnimation = ({
  badge,
  visible,
  onDismiss,
}: BadgeUnlockModalProps) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const confettiScale = useSharedValue(0);
  
  const rarityColor = RARITY_COLORS[badge.rarity];

  useEffect(() => {
    if (visible) {
      // Entrance animation
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      confettiScale.value = withDelay(200, withSpring(1, { damping: 10 }));
    } else {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      confettiScale.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const confettiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confettiScale.value }],
    opacity: confettiScale.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.unlockOverlay, containerStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      
      <Animated.View style={[styles.unlockContent, badgeStyle]}>
        {/* Confetti background */}
        <Animated.Text style={[styles.confettiText, confettiStyle]}>
          🎉
        </Animated.Text>
        
        {/* Badge */}
        <View
          style={[
            styles.unlockBadge,
            { borderColor: rarityColor },
          ]}
        >
          <LinearGradient
            colors={RARITY_GRADIENTS[badge.rarity]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 50 }]}
          />
          <Text style={styles.unlockEmoji}>{badge.icon}</Text>
        </View>
        
        <Text style={styles.unlockTitle}>Badge Unlocked!</Text>
        <Text style={[styles.unlockBadgeName, { color: rarityColor }]}>
          {badge.name}
        </Text>
        <Text style={styles.unlockDescription}>{badge.description}</Text>
        
        <View style={styles.unlockPoints}>
          <Text style={styles.unlockPointsText}>+{badge.points} points</Text>
        </View>
        
        <Pressable onPress={onDismiss} style={styles.unlockDismiss}>
          <Text style={styles.unlockDismissText}>Awesome!</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  withDetails: {
    alignItems: 'center',
  },
  badgeCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  lockedBadge: {
    borderWidth: 2,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
  },
  lockedBackground: {
    backgroundColor: colors.background.elevated,
  },
  emoji: {
    textAlign: 'center',
  },
  glowEffect: {
    position: 'absolute',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  details: {
    alignItems: 'center',
    marginTop: spacing.sm,
    maxWidth: 100,
  },
  badgeName: {
    fontFamily: fontFamily.semiBold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  badgeDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  lockedText: {
    color: colors.text.muted,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pointsIcon: {
    fontSize: 12,
    marginRight: 2,
  },
  pointsText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.xs,
  },
  rarityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  rarityText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 9,
    textTransform: 'uppercase',
  },
  
  // Unlock animation styles
  unlockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  unlockContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  confettiText: {
    fontSize: 60,
    position: 'absolute',
    top: -40,
  },
  unlockBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: spacing.lg,
  },
  unlockEmoji: {
    fontSize: 48,
  },
  unlockTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  unlockBadgeName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    marginBottom: spacing.xs,
  },
  unlockDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  unlockPoints: {
    backgroundColor: colors.accent.success + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
  },
  unlockPointsText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.accent.success,
  },
  unlockDismiss: {
    backgroundColor: colors.accent.success,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  unlockDismissText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.text.inverse,
  },
});

