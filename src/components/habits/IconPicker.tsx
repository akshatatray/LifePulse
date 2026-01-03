import { useState } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';

// Organized emoji categories
const EMOJI_CATEGORIES = {
  'Health & Fitness': ['💪', '🏃', '🧘', '🏋️', '🚴', '🏊', '⚽', '🎾', '🥗', '🍎', '💊', '😴', '🛌', '🧠'],
  'Wellness': ['🧘', '🙏', '💆', '🌅', '🌙', '☀️', '🌿', '💧', '🫁', '❤️', '😊', '🧘‍♀️', '🧖', '🌸'],
  'Productivity': ['📚', '✍️', '💻', '📝', '🎯', '⏰', '📅', '✅', '📊', '💡', '🔬', '🎓', '📖', '🖊️'],
  'Creative': ['🎨', '🎵', '🎸', '🎹', '📷', '✏️', '🎬', '🎭', '🎪', '🎤', '🎧', '📺', '🎮', '🎲'],
  'Social': ['👨‍👩‍👧', '🤝', '💬', '📞', '💌', '🎁', '🎉', '👋', '🤗', '😄', '❤️', '💕', '🥰', '🙌'],
  'Finance': ['💰', '💵', '📈', '🏦', '💳', '🪙', '📉', '💹', '🤑', '💸', '🏠', '🚗', '✈️', '🛒'],
  'Nature': ['🌱', '🌳', '🌺', '🌻', '🍀', '🌊', '⛰️', '🏖️', '🌈', '⭐', '🌙', '☁️', '🔥', '💨'],
  'Food & Drink': ['🥤', '☕', '🍵', '🥛', '🍽️', '🥗', '🍎', '🥑', '🥕', '🍳', '🥣', '🍪', '🎂', '🍫'],
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

export const IconPicker = ({ selectedIcon, onSelectIcon }: IconPickerProps) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Health & Fitness');
  const scale = useSharedValue(1);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalVisible(true);
  };

  const handleSelectIcon = (icon: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelectIcon(icon);
    setIsModalVisible(false);
  };

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.label}>Icon</Text>
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={() => {
            scale.value = withTiming(0.95, { duration: 100, easing: smoothEasing });
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
          }}
          style={[styles.selectedContainer, animatedStyle]}
        >
          <Text style={styles.selectedIcon}>{selectedIcon}</Text>
          <Text style={styles.changeText}>Tap to change</Text>
        </AnimatedPressable>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Icon</Text>
            <Pressable
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>

          {/* Category chips */}
          <View style={styles.categoryContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryTabs}
            >
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <Pressable
                  key={category}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory(category);
                  }}
                  style={[
                    styles.categoryChip,
                    activeCategory === category && styles.categoryChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      activeCategory === category && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Emoji grid */}
          <ScrollView
            style={styles.emojiScrollView}
            contentContainerStyle={styles.emojiGrid}
            showsVerticalScrollIndicator={false}
          >
            {EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
              <Pressable
                key={`${emoji}-${index}`}
                onPress={() => handleSelectIcon(emoji)}
                style={[
                  styles.emojiItem,
                  selectedIcon === emoji && styles.emojiItemSelected,
                ]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
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
    marginBottom: spacing.sm,
  },
  selectedContainer: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  selectedIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  changeText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xl,
    color: colors.text.primary,
  },
  closeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  closeButtonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    color: colors.accent.success,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  categoryChipActive: {
    backgroundColor: colors.accent.success,
    borderColor: colors.accent.success,
  },
  categoryChipText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: colors.text.inverse,
    fontFamily: fontFamily.semiBold,
  },
  emojiScrollView: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emojiItem: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.card,
  },
  emojiItemSelected: {
    backgroundColor: colors.accent.success + '30',
    borderWidth: 2,
    borderColor: colors.accent.success,
  },
  emoji: {
    fontSize: 28,
  },
});

