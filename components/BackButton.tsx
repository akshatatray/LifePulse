import { Feather } from '@expo/vector-icons';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontFamily, fontSize, spacing, touchTarget } from '../src/theme';

export const BackButton = ({ onPress }: { onPress: () => void }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.touchArea} activeOpacity={0.7}>
      <View style={styles.backButton}>
        <Feather name="chevron-left" size={20} color={colors.accent.success} />
        <Text style={styles.backButtonText}>Back</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchArea: {
    minHeight: touchTarget.md,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.lg,
  },
  backButtonText: {
    color: colors.accent.success,
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.base,
    marginLeft: spacing.xs,
  },
});
