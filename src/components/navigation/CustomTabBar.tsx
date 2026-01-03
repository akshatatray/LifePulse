/**
 * Custom Tab Bar Component
 * A polished, animated tab bar with the floating Add button
 */

import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing, fontFamily, fontSize, borderRadius } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab icon mapping
const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  TodayTab: 'sun',
  Insights: 'bar-chart-2',
  AddHabitPlaceholder: 'plus',
  Social: 'users',
  Profile: 'user',
};

// Tab labels
const TAB_LABELS: Record<string, string> = {
  TodayTab: 'Today',
  Insights: 'Insights',
  AddHabitPlaceholder: '',
  Social: 'Social',
  Profile: 'Profile',
};

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const TabItem = ({ routeName, isFocused, onPress, onLongPress }: TabItemProps) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, -2], [1, 0.8]),
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100, easing: smoothEasing });
    translateY.value = withTiming(-2, { duration: 100, easing: smoothEasing });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
    translateY.value = withTiming(0, { duration: 150, easing: smoothEasing });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const iconName = TAB_ICONS[routeName];
  const label = TAB_LABELS[routeName];

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Feather
          name={iconName}
          size={24}
          color={isFocused ? colors.accent.success : colors.text.muted}
        />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          { color: isFocused ? colors.accent.success : colors.text.muted },
          animatedLabelStyle,
        ]}
      >
        {label}
      </Animated.Text>
      
      {/* Active indicator */}
      {isFocused && <View style={styles.activeIndicator} />}
    </Pressable>
  );
};

interface AddButtonProps {
  onPress: () => void;
}

const AddButton = ({ onPress }: AddButtonProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const smoothEasing = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100, easing: smoothEasing });
    rotation.value = withTiming(90, { duration: 200, easing: smoothEasing });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150, easing: smoothEasing });
    rotation.value = withTiming(0, { duration: 200, easing: smoothEasing });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.addButtonContainer}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.addButton, animatedStyle]}
      >
        <Feather name="plus" size={28} color={colors.text.inverse} />
      </AnimatedPressable>
    </View>
  );
};

export const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md }]}>
      {/* Background blur effect simulation */}
      <View style={styles.background} />
      
      {/* Tab items */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Render Add button in the middle
          if (route.name === 'AddHabitPlaceholder') {
            return (
              <AddButton
                key={route.key}
                onPress={() => {
                  navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  // Navigate to AddHabit modal (at root level)
                  (navigation as any).navigate('AddHabit');
                }}
              />
            );
          }

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    // Subtle top shadow
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent.success,
  },
  addButtonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -spacing.xl,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
    // Glow effect
    ...Platform.select({
      ios: {
        shadowColor: colors.accent.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

