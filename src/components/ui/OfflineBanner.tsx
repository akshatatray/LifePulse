/**
 * Offline Banner Component
 * Shows when the app is offline or has pending sync operations
 */

import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useEffect } from 'react';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';
import { useNetwork } from '../../hooks/useNetwork';

interface OfflineBannerProps {
  pendingCount?: number;
}

export const OfflineBanner = ({ pendingCount = 0 }: OfflineBannerProps) => {
  const { isOffline } = useNetwork();
  const rotation = useSharedValue(0);

  // Rotate sync icon when we have pending changes
  useEffect(() => {
    if (pendingCount > 0 && !isOffline) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [pendingCount, isOffline]);

  const syncIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Don't show if online and no pending changes
  if (!isOffline && pendingCount === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
      style={[
        styles.container,
        isOffline ? styles.offlineContainer : styles.syncingContainer,
      ]}
    >
      {isOffline ? (
        <>
          <Feather name="wifi-off" size={14} color={colors.text.primary} />
          <Text style={styles.text}>
            You're offline. Changes will sync when you're back online.
          </Text>
        </>
      ) : (
        <>
          <Animated.View style={syncIconStyle}>
            <Feather name="refresh-cw" size={14} color={colors.text.primary} />
          </Animated.View>
          <Text style={styles.text}>
            Syncing {pendingCount} change{pendingCount !== 1 ? 's' : ''}...
          </Text>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
  },
  offlineContainer: {
    backgroundColor: colors.accent.warning + '20',
  },
  syncingContainer: {
    backgroundColor: colors.accent.info + '20',
  },
  text: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.primary,
    flex: 1,
  },
});

