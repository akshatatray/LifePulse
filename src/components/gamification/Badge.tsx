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
 * Beautiful, friendly celebration modal
 */
interface BadgeUnlockModalProps {
  badge: BadgeType;
  visible: boolean;
  onDismiss: () => void;
}

// Confetti particle positions
const CONFETTI_ITEMS = [
  { emoji: '🎊', top: -30, left: -60, rotation: -15, delay: 0 },
  { emoji: '✨', top: -20, right: -50, rotation: 20, delay: 100 },
  { emoji: '🎉', top: 20, left: -70, rotation: -25, delay: 50 },
  { emoji: '⭐', top: 40, right: -60, rotation: 30, delay: 150 },
  { emoji: '🌟', top: 80, left: -55, rotation: 15, delay: 200 },
  { emoji: '💫', top: 100, right: -45, rotation: -20, delay: 100 },
];

const ConfettiParticle = ({ 
  emoji, 
  style, 
  delay,
  visible 
}: { 
  emoji: string; 
  style: any; 
  delay: number;
  visible: boolean;
}) => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 150 }));
      rotate.value = withDelay(delay, withSequence(
        withTiming(15, { duration: 200 }),
        withTiming(-15, { duration: 200 }),
        withTiming(0, { duration: 200 })
      ));
    } else {
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: scale.value,
  }));

  return (
    <Animated.Text style={[styles.confettiParticle, style, animStyle]}>
      {emoji}
    </Animated.Text>
  );
};

export const BadgeUnlockAnimation = ({
  badge,
  visible,
  onDismiss,
}: BadgeUnlockModalProps) => {
  const overlayOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const badgeScale = useSharedValue(0);
  const badgeRotate = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  
  const rarityColor = RARITY_COLORS[badge.rarity];
  const gradientColors = RARITY_GRADIENTS[badge.rarity];

  useEffect(() => {
    if (visible) {
      // Overlay fade in
      overlayOpacity.value = withTiming(1, { duration: 250 });
      
      // Card entrance with spring
      cardScale.value = withDelay(100, withSpring(1, { damping: 12, stiffness: 180 }));
      cardTranslateY.value = withDelay(100, withSpring(0, { damping: 14, stiffness: 150 }));
      
      // Badge pop animation with bounce
      badgeScale.value = withDelay(250, withSequence(
        withSpring(1.15, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      ));
      
      // Badge wiggle
      badgeRotate.value = withDelay(350, withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-5, { duration: 60 }),
        withTiming(5, { duration: 60 }),
        withTiming(0, { duration: 60 })
      ));
      
      // Shimmer effect on badge
      shimmer.value = withDelay(500, withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }));
      
      // Button entrance
      buttonScale.value = withDelay(400, withSpring(1, { damping: 12, stiffness: 200 }));
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200 });
      cardScale.value = withTiming(0.9, { duration: 150 });
      cardTranslateY.value = withTiming(30, { duration: 150 });
      badgeScale.value = withTiming(0, { duration: 150 });
      shimmer.value = 0;
      buttonScale.value = withTiming(0, { duration: 100 });
    }
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { translateY: cardTranslateY.value },
    ],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRotate.value}deg` },
    ],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0, 0.6, 0]),
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
    opacity: buttonScale.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.unlockOverlay, overlayStyle]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      
      <Animated.View style={[styles.unlockCard, cardStyle]}>
        {/* Confetti particles around the card */}
        <View style={styles.confettiContainer}>
          {CONFETTI_ITEMS.map((item, index) => (
            <ConfettiParticle
              key={index}
              emoji={item.emoji}
              style={{
                position: 'absolute',
                top: item.top,
                left: item.left,
                right: item.right,
                transform: [{ rotate: `${item.rotation}deg` }],
              }}
              delay={item.delay}
              visible={visible}
            />
          ))}
        </View>

        {/* Header with celebration text */}
        <View style={styles.unlockHeader}>
          <Text style={styles.celebrationEmoji}>🎊</Text>
          <Text style={styles.unlockTitle}>Achievement Unlocked!</Text>
        </View>
        
        {/* Badge container with glow effect */}
        <View style={styles.badgeContainer}>
          {/* Glow ring */}
          <View style={[styles.glowRing, { borderColor: rarityColor + '40' }]} />
          <View style={[styles.glowRingInner, { borderColor: rarityColor + '60' }]} />
          
          {/* Badge circle */}
          <Animated.View style={[styles.unlockBadge, badgeStyle]}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 60 }]}
            />
            {/* Border glow */}
            <View style={[styles.badgeBorder, { borderColor: rarityColor }]} />
            {/* Emoji */}
            <Text style={styles.unlockEmoji}>{badge.icon}</Text>
            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmerOverlay, shimmerStyle]} />
          </Animated.View>
        </View>
        
        {/* Badge info */}
        <View style={styles.badgeInfo}>
          <Text style={[styles.unlockBadgeName, { color: rarityColor }]}>
            {badge.name}
          </Text>
          <Text style={styles.unlockDescription}>{badge.description}</Text>
          
          {/* Rarity tag */}
          <View style={[styles.rarityTag, { backgroundColor: rarityColor + '20' }]}>
            <Text style={[styles.rarityTagText, { color: rarityColor }]}>
              {badge.rarity.toUpperCase()}
            </Text>
          </View>
        </View>
        
        {/* Points earned */}
        <View style={styles.pointsSection}>
          <LinearGradient
            colors={[colors.accent.success + '15', colors.accent.success + '05']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pointsGradient}
          >
            <Text style={styles.pointsLabel}>XP Earned</Text>
            <View style={styles.pointsRow}>
              <Text style={styles.pointsEmoji}>✨</Text>
              <Text style={styles.unlockPointsText}>+{badge.points}</Text>
            </View>
          </LinearGradient>
        </View>
        
        {/* Dismiss button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <Pressable 
            onPress={onDismiss} 
            style={({ pressed }) => [
              styles.unlockDismiss,
              pressed && styles.unlockDismissPressed,
            ]}
          >
            <LinearGradient
              colors={[colors.accent.success, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.unlockDismissText}>Awesome! 🎉</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  unlockCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    marginHorizontal: spacing.lg,
    alignItems: 'center',
    width: '85%',
    maxWidth: 340,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    // Border accent
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiParticle: {
    fontSize: 28,
  },
  unlockHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  celebrationEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  unlockTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 140,
    height: 140,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  glowRingInner: {
    position: 'absolute',
    width: 125,
    height: 125,
    borderRadius: 62.5,
    borderWidth: 1,
  },
  unlockBadge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  badgeBorder: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
  },
  unlockEmoji: {
    fontSize: 52,
    textAlign: 'center',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 55,
  },
  badgeInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  unlockBadgeName: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  unlockDescription: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  rarityTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  rarityTagText: {
    fontFamily: fontFamily.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  pointsSection: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  pointsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent.success + '30',
  },
  pointsLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pointsEmoji: {
    fontSize: 18,
  },
  unlockPointsText: {
    fontFamily: fontFamily.extraBold,
    fontSize: fontSize.xl,
    color: colors.accent.success,
  },
  buttonContainer: {
    width: '100%',
  },
  unlockDismiss: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  unlockDismissPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockDismissText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

