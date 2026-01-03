import { StyleSheet, Pressable, PressableProps, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, borderRadius, touchTarget } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconButtonSize = 'sm' | 'md' | 'lg';
type IconButtonVariant = 'default' | 'filled' | 'ghost';

type IconButtonProps = {
  icon: keyof typeof Feather.glyphMap;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  color?: string;
} & Omit<PressableProps, 'children'>;

const sizeMap: Record<IconButtonSize, { button: number; icon: number }> = {
  sm: { button: touchTarget.sm, icon: 16 },
  md: { button: touchTarget.md, icon: 24 },
  lg: { button: touchTarget.lg, icon: 28 },
};

export const IconButton = ({
  icon,
  size = 'md',
  variant = 'default',
  color,
  disabled,
  style,
  ...pressableProps
}: IconButtonProps) => {
  const scale = useSharedValue(1);

  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100, easing: smoothEasing });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
  };

  const dimensions = sizeMap[size];
  const iconColor = color || (variant === 'filled' ? colors.text.inverse : colors.text.primary);

  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    {
      width: dimensions.button,
      height: dimensions.button,
    },
    disabled && styles.button_disabled,
    style,
  ];

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[buttonStyles, animatedStyle]}
      {...pressableProps}
    >
      <Feather name={icon} size={dimensions.icon} color={iconColor} />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  button_default: {
    backgroundColor: colors.background.card,
  },
  button_filled: {
    backgroundColor: colors.accent.success,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_disabled: {
    opacity: 0.5,
  },
});

