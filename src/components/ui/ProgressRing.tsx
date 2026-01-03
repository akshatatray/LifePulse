import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { colors, fontFamily, fontSize, duration } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProgressRingProps = {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
};

export const ProgressRing = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = colors.accent.success,
  backgroundColor = colors.background.card,
  showPercentage = true,
  children,
}: ProgressRingProps) => {
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    animatedProgress.value = withTiming(clampedProgress, {
      duration: duration.slower,
    });
  }, [clampedProgress]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (animatedProgress.value / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  const displayProgress = useDerivedValue(() => {
    return Math.round(animatedProgress.value);
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>

      <View style={styles.content}>
        {children || (showPercentage && (
          <Text style={styles.percentage}>{Math.round(clampedProgress)}%</Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['2xl'],
    color: colors.text.primary,
  },
});

