import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { colors, spacing, textStyles, fontFamily, fontSize } from '../../theme';
import { ProgressRing } from '../ui';

interface DailyScoreRingProps {
  completed: number;
  total: number;
  percentage: number;
}

export const DailyScoreRing = ({ completed, total, percentage }: DailyScoreRingProps) => {
  // Determine ring color based on percentage
  const getRingColor = () => {
    if (percentage === 100) return colors.accent.success;
    if (percentage >= 75) return colors.accent.success;
    if (percentage >= 50) return colors.accent.warning;
    if (percentage > 0) return colors.accent.warning;
    return colors.background.elevated;
  };

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={styles.container}
    >
      <ProgressRing
        progress={percentage}
        size={130}
        strokeWidth={10}
        color={getRingColor()}
        backgroundColor={colors.background.card}
        showPercentage={false}
      >
        <View style={styles.innerContent}>
          {percentage === 100 ? (
            <>
              <Text style={styles.perfectIcon}>✨</Text>
              <Text style={styles.perfectText}>Perfect!</Text>
            </>
          ) : (
            <>
              <Text style={styles.scoreText}>
                {completed}/{total}
              </Text>
              <Text style={styles.labelText}>completed</Text>
            </>
          )}
        </View>
      </ProgressRing>

      {/* Stats row */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={styles.statsRow}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{percentage}%</Text>
          <Text style={styles.statLabel}>Progress</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{total - completed}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
  },
  labelText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  perfectIcon: {
    fontSize: 28,
  },
  perfectText: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.base,
    color: colors.accent.success,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    backgroundColor: colors.background.card,
    borderRadius: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
    color: colors.text.primary,
  },
  statLabel: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border.default,
  },
});

