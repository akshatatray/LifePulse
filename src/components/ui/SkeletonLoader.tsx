/**
 * Skeleton Loader Components
 * Beautiful shimmer loading states for various content types
 */

import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base Skeleton with shimmer animation
 */
export const Skeleton = ({
  width = '100%',
  height = 20,
  borderRadius: radius = borderRadius.md,
  style,
}: SkeletonProps) => {
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerPosition.value,
          [0, 1],
          [-200, 200]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: radius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            'rgba(255, 255, 255, 0.05)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.05)',
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

/**
 * Skeleton for Habit Card
 */
export const HabitCardSkeleton = () => {
  return (
    <View style={styles.habitCard}>
      {/* Icon */}
      <Skeleton width={48} height={48} borderRadius={borderRadius.lg} />
      
      {/* Content */}
      <View style={styles.habitCardContent}>
        <Skeleton width="70%" height={18} style={{ marginBottom: spacing.xs }} />
        <Skeleton width="40%" height={14} />
      </View>
      
      {/* Checkbox */}
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
};

/**
 * Skeleton for Habit List
 */
export const HabitListSkeleton = ({ count = 4 }: { count?: number }) => {
  return (
    <View style={styles.habitList}>
      {/* Section header */}
      <Skeleton width={120} height={16} style={{ marginBottom: spacing.md }} />
      
      {/* Habit cards */}
      {Array.from({ length: count }).map((_, index) => (
        <HabitCardSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton for Daily Score Ring
 */
export const ScoreRingSkeleton = () => {
  return (
    <View style={styles.scoreRing}>
      <Skeleton width={120} height={120} borderRadius={60} />
    </View>
  );
};

/**
 * Skeleton for Stats Card
 */
export const StatsCardSkeleton = () => {
  return (
    <View style={styles.statsCard}>
      <Skeleton width={40} height={40} borderRadius={borderRadius.md} />
      <Skeleton width="60%" height={24} style={{ marginTop: spacing.sm }} />
      <Skeleton width="80%" height={14} style={{ marginTop: spacing.xs }} />
    </View>
  );
};

/**
 * Skeleton for Insights Screen
 */
export const InsightsSkeleton = () => {
  return (
    <View style={styles.insights}>
      {/* Stats banner */}
      <View style={styles.statsBanner}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.statItem}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={30} height={20} style={{ marginTop: spacing.xs }} />
            <Skeleton width={50} height={12} style={{ marginTop: 2 }} />
          </View>
        ))}
      </View>
      
      {/* Section header */}
      <Skeleton width={150} height={20} style={{ marginTop: spacing.xl, marginBottom: spacing.md }} />
      
      {/* Heatmap placeholder */}
      <View style={styles.heatmapPlaceholder}>
        <Skeleton width="100%" height={100} borderRadius={borderRadius.lg} />
      </View>
      
      {/* Lagging habits section */}
      <Skeleton width={180} height={20} style={{ marginTop: spacing.xl, marginBottom: spacing.md }} />
      <Skeleton width="100%" height={80} borderRadius={borderRadius.lg} />
    </View>
  );
};

/**
 * Skeleton for Profile Screen
 */
export const ProfileSkeleton = () => {
  return (
    <View style={styles.profile}>
      {/* Avatar */}
      <View style={styles.profileHeader}>
        <Skeleton width={80} height={80} borderRadius={40} />
        <Skeleton width={150} height={24} style={{ marginTop: spacing.md }} />
        <Skeleton width={200} height={14} style={{ marginTop: spacing.xs }} />
      </View>
      
      {/* Stats */}
      <View style={styles.profileStats}>
        {Array.from({ length: 3 }).map((_, i) => (
          <View key={i} style={styles.profileStat}>
            <Skeleton width={50} height={28} />
            <Skeleton width={60} height={14} style={{ marginTop: spacing.xs }} />
          </View>
        ))}
      </View>
      
      {/* Settings items */}
      <View style={styles.settingsList}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={styles.settingsItem}>
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width="60%" height={18} style={{ marginLeft: spacing.md }} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.elevated,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 200,
  },
  gradient: {
    flex: 1,
  },
  
  // Habit Card
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  habitCardContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  
  // Habit List
  habitList: {
    marginTop: spacing.lg,
  },
  
  // Score Ring
  scoreRing: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  
  // Stats Card
  statsCard: {
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  
  // Insights
  insights: {
    padding: spacing.lg,
  },
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  heatmapPlaceholder: {
    marginTop: spacing.sm,
  },
  
  // Profile
  profile: {
    padding: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  profileStat: {
    alignItems: 'center',
  },
  settingsList: {
    gap: spacing.md,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
  },
});

