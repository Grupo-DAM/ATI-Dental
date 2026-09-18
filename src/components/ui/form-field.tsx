import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type FormFieldLabelProps = {
  label: string;
  required?: boolean;
};

export function FormFieldLabel({ label, required = false }: Readonly<FormFieldLabelProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);

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
  const styles = createStyles(theme);
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
  const styles = createStyles(theme);
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
  const styles = createStyles(theme);
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

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textNames,
      marginTop: 15,
      marginBottom: 8,
    },
    requiredMark: {
      color: theme.error,
      fontWeight: '700',
    },
    inputShell: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingHorizontal: 12,
      minHeight: 46,
      justifyContent: 'center',
      backgroundColor: theme.backgroundElement,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    textAreaShell: {
      minHeight: 90,
      alignItems: 'flex-start',
    },
    inputError: {
      borderColor: theme.error,
      borderWidth: 1.5,
    },
    input: {
      flex: 1,
      height: 46,
      fontSize: 15,
      color: theme.fieldLabel,
      padding: 0,
    },
    textAreaInput: {
      height: 90,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    selectText: {
      flex: 1,
      fontSize: 15,
      color: theme.fieldLabel,
    },
    selectPlaceholder: {
      color: theme.placeholderColor,
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 6,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    submitIcon: {
      marginRight: 8,
    },
    primaryButtonText: {
      color: theme.overMain,
      fontWeight: '600',
      fontSize: 15,
    },
    secondaryButtonText: {
      color: theme.textNames,
      fontWeight: '600',
      fontSize: 15,
    },
  });
