import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, Pressable, Image, Linking } from 'react-native';

import { Fonts, ThemeColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const EyeIcon = require('@/assets/icons/eye.png');
const EyeSlashedIcon = require('@/assets/icons/eye-slashed.png');

export type ThemedTextInputProps = TextInputProps & {
    fieldName?: string;
    themeColor?: ThemeColor;
    isSecure?: boolean;
    icon?: ImageSourcePropType;
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
  const styles = createStyles(theme);
  const [passwordVisible, setPasswordVisible] = useState(!isSecure);

  const activeTextColor = themeColor ? theme[themeColor] : theme.text;
  const iconColor = '#9E8BAC';
  const showErrorMessage = errorMessage !== "";

  return (
      <ThemedView>
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
            placeholderTextColor="#9E8BAC"
            secureTextEntry={isSecure ? !passwordVisible : false}
            style={[
              styles.input,
              { color: activeTextColor, fontFamily: Fonts.regular || 'System' }
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

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.backgroundColor,
        borderRadius: 8,
        paddingLeft: Spacing.three || 12,
        paddingRight: 4,
        marginBottom: Spacing.four || 16,
        height: 50,
    },
    errorContainer: {
        borderColor: theme.error,
        borderWidth: 2,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        paddingVertical: 0,
    },
    iconButton: {
        padding: Spacing.two || 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        margin: Spacing.two || 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.6,
    },
    label: {
        fontSize: 14,
        fontWeight: 500,
        color: theme.text,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    forgotPassword: {
        fontWeight: '700',
        color: theme.main,
        fontSize: 12
    },
    errorText: {
        color: theme.error,
        fontSize: 12,
        marginBottom: 16,
    }
});