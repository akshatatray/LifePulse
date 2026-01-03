import { StyleSheet, View, Text } from 'react-native';
import { Container } from '../components/Container';
import { colors, spacing, textStyles } from '../src/theme';
import type { DetailsScreenProps } from '../navigation';

export default function Details({ route }: DetailsScreenProps) {
  return (
    <Container edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.label}>User Details</Text>
        <Text style={styles.title}>{route.params?.name}</Text>
        <Text style={styles.description}>
          This is a placeholder detail screen. It will be replaced with actual content in Phase 1.
        </Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    ...textStyles.labelMedium,
    color: colors.text.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.displaySmall,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  description: {
    ...textStyles.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
