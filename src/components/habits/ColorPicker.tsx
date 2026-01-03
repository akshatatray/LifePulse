import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
}

const ColorItem = ({
  color,
  isSelected,
  onPress,
}: {
  color: string;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withTiming(0.9, { duration: 100, easing: smoothEasing });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
      }}
      style={[styles.colorItem, animatedStyle]}
    >
      <View
        style={[
          styles.colorCircle,
          { backgroundColor: color },
          isSelected && styles.colorCircleSelected,
        ]}
      >
        {isSelected && (
          <Feather name="check" size={18} color={colors.text.inverse} />
        )}
      </View>
    </AnimatedPressable>
  );
};

export const ColorPicker = ({ selectedColor, onSelectColor }: ColorPickerProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Color</Text>
      <View style={styles.colorGrid}>
        {colors.habitColors.map((color, index) => (
          <ColorItem
            key={`${color}-${index}`}
            color={color}
            isSelected={selectedColor === color}
            onPress={() => onSelectColor(color)}
          />
        ))}
      </View>
      
      {/* Preview with selected color */}
      <View style={styles.preview}>
        <View style={[styles.previewDot, { backgroundColor: selectedColor }]} />
        <Text style={styles.previewText}>
          This color will appear on your habit card
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorItem: {
    padding: spacing.xs,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: colors.text.primary,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  previewDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  previewText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    flex: 1,
  },
});

