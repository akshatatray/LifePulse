import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, spacing } from '../src/theme';

type ScreenContentProps = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

export const ScreenContent = ({ title, subtitle, children }: ScreenContentProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={styles.separator} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontFamily: fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.base,
    fontFamily: fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  separator: {
    backgroundColor: colors.border.default,
    height: 1,
    marginVertical: spacing.xl,
    width: '80%',
  },
});
