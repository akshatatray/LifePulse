import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ActivityIndicator,
} from 'react-native';
import { colors, fontFamily, fontSize, spacing, borderRadius, touchTarget } from '../src/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
  ({ title, variant = 'primary', size = 'md', loading = false, icon, disabled, ...touchableProps }, ref) => {
    const buttonStyles = [
      styles.button,
      styles[`button_${variant}`],
      styles[`button_${size}`],
      disabled && styles.button_disabled,
      touchableProps.style,
    ];

    const textStyles = [
      styles.buttonText,
      styles[`buttonText_${variant}`],
      styles[`buttonText_${size}`],
      disabled && styles.buttonText_disabled,
    ];

    return (
      <TouchableOpacity
        ref={ref}
        {...touchableProps}
        disabled={disabled || loading}
        style={buttonStyles}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.text.inverse : colors.text.primary}
            size="small"
          />
        ) : (
          <>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            {title && <Text style={textStyles}>{title}</Text>}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
  },

  // Variants
  button_primary: {
    backgroundColor: colors.accent.success,
  },
  button_secondary: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_danger: {
    backgroundColor: colors.accent.error,
  },
  button_disabled: {
    opacity: 0.5,
  },

  // Sizes
  button_sm: {
    height: touchTarget.sm,
    paddingHorizontal: spacing.lg,
  },
  button_md: {
    height: touchTarget.md,
    paddingHorizontal: spacing.xl,
  },
  button_lg: {
    height: touchTarget.xl,
    paddingHorizontal: spacing['2xl'],
  },

  // Text styles
  buttonText: {
    fontFamily: fontFamily.semiBold,
    textAlign: 'center',
  },
  buttonText_primary: {
    color: colors.text.inverse,
  },
  buttonText_secondary: {
    color: colors.text.primary,
  },
  buttonText_ghost: {
    color: colors.accent.success,
  },
  buttonText_danger: {
    color: colors.text.primary,
  },
  buttonText_disabled: {
    color: colors.text.muted,
  },
  buttonText_sm: {
    fontSize: fontSize.sm,
  },
  buttonText_md: {
    fontSize: fontSize.base,
  },
  buttonText_lg: {
    fontSize: fontSize.lg,
  },

  iconContainer: {
    marginRight: spacing.sm,
  },
});
