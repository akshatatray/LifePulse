import { useNavigation } from '@react-navigation/native';
import { StyleSheet, View, Text } from 'react-native';
import { Container } from '../components/Container';
import { Button } from '../components/Button';
import { colors, fontFamily, fontSize, spacing, textStyles } from '../src/theme';

export default function Overview() {
  const navigation = useNavigation();

  return (
    <Container>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome to</Text>
        <Text style={styles.title}>LifePulse</Text>
        <Text style={styles.subtitle}>Your journey to better habits starts here</Text>
        
        <View style={styles.buttonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('Details', {
                name: 'Dan',
              })
            }
            title="Get Started"
            size="lg"
          />
          
          <Button
            onPress={() => {}}
            title="Learn More"
            variant="ghost"
            size="md"
            style={styles.secondaryButton}
          />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
  },
  greeting: {
    ...textStyles.bodyLarge,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.displayMedium,
    color: colors.accent.success,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...textStyles.bodyMedium,
    color: colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
    paddingHorizontal: spacing['2xl'],
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
});
