import LottieView from 'lottie-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../../components/Button';
import { colors, spacing, textStyles } from '../../theme';

interface EmptyStateProps {
  type: 'no_habits' | 'all_done' | 'rest_day' | 'no_habits_past' | 'no_habits_future';
  onAddHabit?: () => void;
}

export const EmptyState = ({ type, onAddHabit }: EmptyStateProps) => {
  const content = {
    no_habits: {
      icon: '🌱',
      title: 'Start Your Journey',
      description: 'Add your first habit and begin building a better you, one day at a time.',
      showButton: true,
    },
    all_done: {
      icon: '🎉',
      title: 'Perfect Day!',
      description: "You've completed all your habits for today. Amazing work!",
      showButton: false,
    },
    rest_day: {
      icon: '😴',
      title: 'Rest Day',
      description: 'No habits scheduled for today. Take it easy and recharge!',
      showButton: true,
    },
    no_habits_past: {
      icon: '🌱',
      title: 'No Habits Yet',
      description: 'No habits were created for this date. Your journey starts from when you added your first habit.',
      showButton: false,
    },
    no_habits_future: {
      icon: '🔮',
      title: 'Coming Soon',
      description: 'Check back on this day to track your habits.',
      showButton: false,
    },
  };

  const { icon, title, description, showButton } = content[type];

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(500)}
        style={styles.iconContainer}
      >
        {type === 'all_done' ? (
          <LottieView
            source={require('../../../assets/animations/confetti.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        ) : null}
        <Text style={styles.icon}>{icon}</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.textContainer}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>

      {showButton && onAddHabit && (
        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={styles.buttonContainer}
        >
          <Button
            title="Add Your First Habit"
            onPress={onAddHabit}
            size="lg"
            style={styles.button}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  lottie: {
    position: 'absolute',
    width: 200,
    height: 200,
  },
  icon: {
    fontSize: 64,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    ...textStyles.headlineLarge,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    shadowColor: colors.accent.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

