import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TextInputProps, Pressable, Image, Linking } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Fonts, ThemeColor, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

const EyeIcon = require('@/assets/icons/eye.png');
const EyeSlashedIcon = require('@/assets/icons/eye-slashed.png');

export type ThemedTextInputProps = TextInputProps & {
    fieldName?: String
    themeColor?: ThemeColor;
    isSecure?: boolean;
    icon?: ImageSourcePropType;
};

export function ThemedTextInput({
  style,
  placeholder,
  themeColor,
  isSecure = false,
  icon,
  fieldName,
  ...rest
}: ThemedTextInputProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [passwordVisible, setPasswordVisible] = useState(!isSecure);

  const activeTextColor = themeColor ? theme[themeColor] : theme.text;
  const iconColor = '#9E8BAC' || '#888';
  const main = theme.main;

  return (
      <ThemedView>
        <ThemedView style={styles.labelContainer}>
            <ThemedText style={styles.label}>
                {fieldName}
            </ThemedText>
            {isSecure && (
                <ThemedText
                    style={styles.forgotPassword}
                    onPress={() => Linking.openURL('https://reactnative.dev')}>
                    ¿Olvidaste tu contraseña?
                </ThemedText>
            )}
        </ThemedView>
        <ThemedView type="backgroundElement" style={[styles.container, style]}>
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
                style={[styles.icon, { tintColor: iconColor }]}
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
                      tintColor: iconColor,
                    }
                  ]}
              />
            </Pressable>
          )}
        </ThemedView>
    </ThemedView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingLeft: Spacing.three || 12,
        paddingRight: 4,
        marginBottom: Spacing.four || 16,
        height: 50,
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
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    forgotPassword: {
        fontWeight: '700',
        color: theme.main,
        fontSize: 12
    }
});