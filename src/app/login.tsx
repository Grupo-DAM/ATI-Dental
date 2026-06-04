import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): FormErrors {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'El formato del correo electrónico no es válido.';
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    return newErrors;
  }

  function handleLogin() {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      setSubmitted(true);
    } else {
      setSubmitted(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <ThemedView style={styles.headerSection}>
              <ThemedText type="title" style={styles.title}>
                ATI Dental
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Inicia sesión para continuar
              </ThemedText>
            </ThemedView>

            {/* Form Card */}
            <ThemedView type="backgroundElement" style={styles.formCard}>
              {/* Email Field */}
              <ThemedView style={styles.fieldContainer}>
                <ThemedText type="smallBold" style={styles.label}>
                  Correo electrónico
                </ThemedText>
                <TextInput
                  testID="email-input"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: errors.email ? '#E53935' : theme.backgroundSelected,
                    },
                  ]}
                  placeholder="ejemplo@correo.com"
                  placeholderTextColor={theme.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: undefined }));
                    }
                    setSubmitted(false);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
                {errors.email && (
                  <ThemedText testID="email-error" style={styles.errorText}>
                    {errors.email}
                  </ThemedText>
                )}
              </ThemedView>

              {/* Password Field */}
              <ThemedView style={styles.fieldContainer}>
                <ThemedText type="smallBold" style={styles.label}>
                  Contraseña
                </ThemedText>
                <TextInput
                  testID="password-input"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.background,
                      borderColor: errors.password ? '#E53935' : theme.backgroundSelected,
                    },
                  ]}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor={theme.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                    setSubmitted(false);
                  }}
                  secureTextEntry
                  textContentType="password"
                />
                {errors.password && (
                  <ThemedText testID="password-error" style={styles.errorText}>
                    {errors.password}
                  </ThemedText>
                )}
              </ThemedView>

              {/* Submit Button */}
              <Pressable
                testID="login-button"
                style={({ pressed }) => [
                  styles.button,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleLogin}>
                <ThemedText style={styles.buttonText}>
                  Iniciar Sesión
                </ThemedText>
              </Pressable>

              {/* Success Message */}
              {submitted && (
                <ThemedView style={styles.successContainer}>
                  <ThemedText testID="success-message" style={styles.successText}>
                    ✓ Formulario válido — inicio de sesión exitoso.
                  </ThemedText>
                </ThemedView>
              )}
            </ThemedView>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  headerSection: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    fontSize: 36,
    textAlign: 'center',
  },
  formCard: {
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    borderRadius: Spacing.four,
    gap: Spacing.four,
  },
  fieldContainer: {
    gap: Spacing.one,
  },
  label: {
    marginBottom: Spacing.half,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  errorText: {
    color: '#E53935',
    fontSize: 13,
    marginTop: Spacing.half,
  },
  button: {
    backgroundColor: '#3c87f7',
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: Spacing.three,
    borderRadius: 12,
    alignItems: 'center',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
  },
});
