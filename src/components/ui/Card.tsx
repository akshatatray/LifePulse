import { StyleSheet, View, ViewProps, Pressable, PressableProps } from 'react-native';
import { colors, borderRadius, spacing, duration } from '../../theme';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type CardVariant = 'default' | 'elevated' | 'outlined';

type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: PressableProps['onPress'];
  disabled?: boolean;
} & Omit<ViewProps, 'onPress'>;

export const Card = ({
  children,
  variant = 'default',
  onPress,
  disabled = false,
  style,
  ...viewProps
}: CardProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const handlePressIn = () => {
    if (onPress && !disabled) {
      scale.value = withTiming(0.98, { duration: duration.fast, easing: smoothEasing });
    }
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: duration.normal, easing: smoothEasing });
  };

  const cardStyles = [
    styles.card,
    styles[`card_${variant}`],
    disabled && styles.card_disabled,
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[cardStyles, animatedStyle]}
        {...viewProps}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={cardStyles} {...viewProps}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  card_default: {
    backgroundColor: colors.background.card,
  },
  card_elevated: {
    backgroundColor: colors.background.elevated,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  card_outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  card_disabled: {
    opacity: 0.5,
  },
});

