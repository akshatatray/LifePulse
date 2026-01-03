import { forwardRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Text,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, spacing, borderRadius, touchTarget } from '../../theme';

type InputProps = {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
} & TextInputProps;

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      style,
      secureTextEntry,
      ...textInputProps
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = secureTextEntry !== undefined;
    const showPassword = isPassword && isPasswordVisible;

    const containerStyles = [
      styles.inputContainer,
      isFocused && styles.inputContainer_focused,
      error && styles.inputContainer_error,
      textInputProps.editable === false && styles.inputContainer_disabled,
    ];

    return (
      <View style={styles.wrapper}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View style={containerStyles}>
          {leftIcon && (
            <Feather
              name={leftIcon}
              size={20}
              color={colors.text.muted}
              style={styles.leftIcon}
            />
          )}

          <TextInput
            ref={ref}
            style={[styles.input, leftIcon && styles.input_withLeftIcon, style]}
            placeholderTextColor={colors.text.muted}
            selectionColor={colors.accent.success}
            cursorColor={colors.accent.success}
            onFocus={(e) => {
              setIsFocused(true);
              textInputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              textInputProps.onBlur?.(e);
            }}
            secureTextEntry={isPassword ? !showPassword : false}
            {...textInputProps}
          />

          {isPassword && (
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.rightIconButton}
              hitSlop={8}
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.text.muted}
              />
            </Pressable>
          )}

          {rightIcon && !isPassword && (
            <Pressable
              onPress={onRightIconPress}
              style={styles.rightIconButton}
              hitSlop={8}
              disabled={!onRightIconPress}
            >
              <Feather name={rightIcon} size={20} color={colors.text.muted} />
            </Pressable>
          )}
        </View>

        {(error || hint) && (
          <Text style={[styles.helperText, error && styles.helperText_error]}>
            {error || hint}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    minHeight: touchTarget.lg,
  },
  inputContainer_focused: {
    borderColor: colors.accent.success,
  },
  inputContainer_error: {
    borderColor: colors.accent.error,
  },
  inputContainer_disabled: {
    opacity: 0.5,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    color: colors.text.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  input_withLeftIcon: {
    paddingLeft: spacing.sm,
  },
  leftIcon: {
    marginLeft: spacing.lg,
  },
  rightIconButton: {
    padding: spacing.md,
    marginRight: spacing.sm,
  },
  helperText: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.text.muted,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  helperText_error: {
    color: colors.accent.error,
  },
});

