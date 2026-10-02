import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { createFormFieldStyles } from '@/constants/styles/global.styles';

type FormFieldLabelProps = {
  label: string;
  required?: boolean;
};

export function FormFieldLabel({ label, required = false }: Readonly<FormFieldLabelProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createFormFieldStyles(theme), [theme]);

  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.requiredMark}> *</Text> : null}
    </Text>
  );
}

type FormTextFieldProps = TextInputProps & {
  label: string;
  required?: boolean;
  errorMessage?: string;
  leadingIcon?: React.ReactNode;
};

export function FormTextField({
  label,
  required = false,
  errorMessage,
  leadingIcon,
  style,
  testID,
  ...inputProps
}: Readonly<FormTextFieldProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createFormFieldStyles(theme), [theme]);
  const hasError = Boolean(errorMessage);

  return (
    <View>
      <FormFieldLabel label={label} required={required} />
      <View
        style={[
          styles.inputShell,
          inputProps.multiline && styles.textAreaShell,
          leadingIcon ? styles.inputWithIcon : null,
          hasError && styles.inputError,
        ]}>
        {leadingIcon}
        <TextInput
          testID={testID}
          style={[styles.input, inputProps.multiline && styles.textAreaInput, style]}
          placeholderTextColor={theme.placeholderColor}
          {...inputProps}
        />
      </View>
      {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

type FormSelectFieldProps = {
  label: string;
  required?: boolean;
  errorMessage?: string;
  testID?: string;
  valueLabel: string;
  isPlaceholder?: boolean;
  onPress: () => void;
  iconName: React.ComponentProps<typeof Ionicons>['name'];
};

export function FormSelectField({
  label,
  required = false,
  errorMessage,
  testID,
  valueLabel,
  isPlaceholder = false,
  onPress,
  iconName,
}: Readonly<FormSelectFieldProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createFormFieldStyles(theme), [theme]);
  const hasError = Boolean(errorMessage);

  return (
    <View>
      <FormFieldLabel label={label} required={required} />
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.7}
        onPress={onPress}
        style={[styles.inputShell, styles.inputWithIcon, hasError && styles.inputError]}>
        <Text
          style={[styles.selectText, isPlaceholder && styles.selectPlaceholder]}
          numberOfLines={1}>
          {valueLabel}
        </Text>
        <Ionicons name={iconName} size={18} color={theme.placeholderColor} />
      </TouchableOpacity>
      {hasError ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

type FormActionButtonProps = {
  label: string;
  onPress: () => void;
  testID?: string;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
};

export function FormActionButton({
  label,
  onPress,
  testID,
  variant = 'primary',
  disabled = false,
  loading = false,
  iconName,
}: Readonly<FormActionButtonProps>) {
  const theme = useTheme();
  const styles = useMemo(() => createFormFieldStyles(theme), [theme]);
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        isPrimary ? styles.primaryButton : styles.secondaryButton,
        (disabled || loading) && styles.buttonDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator
          testID={`${testID ?? 'form-action'}-loading`}
          size="small"
          color={isPrimary ? theme.overMain : theme.textNames}
          style={styles.submitIcon}
        />
      ) : null}
      {!loading && iconName ? (
        <Ionicons
          name={iconName}
          size={18}
          color={isPrimary ? theme.overMain : theme.textNames}
          style={styles.submitIcon}
        />
      ) : null}
      <Text style={isPrimary ? styles.primaryButtonText : styles.secondaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}