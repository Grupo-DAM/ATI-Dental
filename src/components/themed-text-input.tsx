import React, { useState, useMemo } from 'react';
import { Image } from 'expo-image';
import { TextInput, TextInputProps, Pressable, Linking } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { createInputFieldStyles } from '@/constants/styles/global.styles';

const EyeIcon = require('@/assets/icons/view.svg');
const EyeSlashedIcon = require('@/assets/icons/eye-slashed.svg');

export type ThemedTextInputProps = TextInputProps & {
    fieldName?: string;
    themeColor?: ThemeColor;
    isSecure?: boolean;
    login?: boolean;
    icon?: any;
    error?: boolean;
    errorMessage?: string;
};

export function ThemedTextInput({
  style,
  placeholder,
  themeColor,
  isSecure = false,
  login = false,
  icon,
  fieldName,
  error = false,
  errorMessage = '',
  ...rest
}: ThemedTextInputProps) {
  const theme = useTheme();
  const styles = useMemo(() => createInputFieldStyles(theme), [theme]);
  const [passwordVisible, setPasswordVisible] = useState(!isSecure);

  const activeTextColor = themeColor ? theme[themeColor] : theme.text;
  const iconColor = theme.placeholderColor;
  const showErrorMessage = errorMessage !== "";

  return (
      <ThemedView style={styles.mainContainer}>
        <ThemedView style={styles.labelContainer}>
            <ThemedText style={styles.label}>
                {fieldName}
            </ThemedText>
            {login && (
                <ThemedText
                    style={styles.forgotPassword}
                    onPress={() => Linking.openURL('https://reactnative.dev')}>
                    ¿Olvidaste tu contraseña?
                </ThemedText>
            )}
        </ThemedView>
        <ThemedView type="backgroundElement" style={[styles.container, style,
            error && styles.errorContainer]}>
          <TextInput
            placeholder={placeholder}
            placeholderTextColor= {theme.placeholderColor}
            secureTextEntry={isSecure ? !passwordVisible : false}
            style={[
              styles.input,
              {color: activeTextColor}
            ]}
            {...rest}
          />

          {icon && (
              <Image
                source={icon}
                style={[styles.icon, { tintColor: error? theme.error: iconColor }]}
              />
          )}

          {isSecure && (
            <Pressable
              onPress={() => setPasswordVisible(!passwordVisible)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Image
                  source={passwordVisible ? EyeIcon : EyeSlashedIcon}
                  style={[
                    styles.icon,
                    {
                      tintColor: error? theme.error: iconColor,
                    }
                  ]}
              />
            </Pressable>
          )}
        </ThemedView>
        { showErrorMessage && (
            <ThemedText style={styles.errorText}>
                {errorMessage}
            </ThemedText>
        )}
    </ThemedView>
  );
}