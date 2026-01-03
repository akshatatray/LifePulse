import { StyleSheet, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { colors, fontFamily, fontSize, spacing, borderRadius, touchTarget } from '../../theme';

const AnimatedView = Animated.createAnimatedComponent(View);

type CheckboxProps = {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
};

const sizeMap = {
  sm: { box: 20, icon: 14 },
  md: { box: 24, icon: 18 },
};

export const Checkbox = ({
  checked,
  onToggle,
  label,
  disabled = false,
  size = 'md',
}: CheckboxProps) => {
  const scale = useSharedValue(1);
  const progress = useSharedValue(checked ? 1 : 0);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  // Update progress when checked changes
  progress.value = withTiming(checked ? 1 : 0, { duration: 200, easing: smoothEasing });

  const handlePress = () => {
    if (disabled) return;
    scale.value = withTiming(0.92, { duration: 80, easing: smoothEasing });
    setTimeout(() => {
      scale.value = withTiming(1, { duration: 120, easing: smoothEasing });
    }, 80);
    onToggle(!checked);
  };

  const animatedBoxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.accent.success]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.border.default, colors.accent.success]
    ),
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const dimensions = sizeMap[size];

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, disabled && styles.container_disabled]}
    >
      <AnimatedView
        style={[
          styles.checkbox,
          { width: dimensions.box, height: dimensions.box },
          animatedBoxStyle,
        ]}
      >
        <Animated.View style={animatedCheckStyle}>
          <Feather name="check" size={dimensions.icon} color={colors.text.inverse} />
        </Animated.View>
      </AnimatedView>

      {label && <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.md,
  },
  container_disabled: {
    opacity: 0.5,
  },
  checkbox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: 2,
  },
  label: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.primary,
    marginLeft: spacing.md,
    flex: 1,
  },
});

