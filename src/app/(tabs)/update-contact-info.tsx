import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { isAdminUser } from '@/constants/user-roles';
import { firestore } from '@/config/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContactForm {
  email: string;
  telefono: string;
  whatsapp: string;
}

interface FormErrors {
  email?: string;
  telefono?: string;
  whatsapp?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Allows +, digits and spaces, between 7 and 20 chars total
const PHONE_REGEX = /^\+?[0-9 ]{7,20}$/;

function validate(form: ContactForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.email || !EMAIL_REGEX.test(form.email)) {
    errors.email = 'Ingresa un correo electrónico válido (ej: contacto@clinica.com).';
  }
  if (!form.telefono || !PHONE_REGEX.test(form.telefono)) {
    errors.telefono = 'Ingresa un teléfono válido (ej: +58 424 114 9136).';
  }
  if (!form.whatsapp.trim()) {
    errors.whatsapp = 'El enlace o número de WhatsApp no puede estar vacío.';
  }
  return errors;
}

// ─── Sub-component: Labeled text input with inline error ──────────────────────
function FormField({
  iconName,
  iconColor,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  testID,
}: {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  error?: string;
  testID?: string;
}) {
  const hasError = !!error;
  return (
    <View style={fieldStyles.wrapper}>
      <View style={[fieldStyles.row, hasError && fieldStyles.rowError]}>
        <View style={[fieldStyles.iconBox, { backgroundColor: iconColor }]}>
          <Ionicons name={iconName} size={20} color="white" />
        </View>
        <TextInput
          testID={testID}
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {hasError && (
        <Text style={fieldStyles.errorText}>
          <Ionicons name="alert-circle-outline" size={12} /> {error}
        </Text>
      )}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  rowError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: 'Open Sans',
    color: '#1F2937',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
    fontSize: 11,
    color: '#EF4444',
    fontFamily: 'Open Sans',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UpdateContactInfoScreen() {
  const { user, loading: authLoading } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const emptyForm: ContactForm = { email: '', telefono: '', whatsapp: '' };
  const originalRef = useRef<ContactForm>(emptyForm);

  const [formData, setFormData] = useState<ContactForm>(emptyForm);

  // Guard: only subscribe to Firestore once auth is settled and user is admin
  useEffect(() => {
    // Still loading auth — do nothing
    if (authLoading) return;

    // Auth settled but user is null → not logged in
    if (!user) {
      Alert.alert('Sesión requerida', 'Debes iniciar sesión para continuar.');
      router.replace('/(tabs)/home');
      return;
    }

    // Logged in but not admin
    if (!isAdminUser(user)) {
      Alert.alert('Acceso denegado', 'Esta pantalla es exclusiva para administradores.');
      router.replace('/(tabs)/home');
      return;
    }

    // Subscribe reactively so any external change is reflected
    const unsubscribe = firestore()
      .collection('configuracion')
      .doc('contacto')
      .onSnapshot(
        (snapshot) => {
          // exists() is a method in @react-native-firebase
          const docExists = typeof snapshot.exists === 'function'
            ? snapshot.exists()
            : snapshot.exists; // fallback for older SDK

          if (docExists) {
            const raw = snapshot.data() as Partial<ContactForm>;
            const loaded: ContactForm = {
              email: raw.email ?? '',
              telefono: raw.telefono ?? '',
              whatsapp: raw.whatsapp ?? '',
            };
            originalRef.current = loaded;
            setFormData(loaded);
          } else {
            // Document doesn't exist yet — start with empty form (will be created on first save)
            originalRef.current = emptyForm;
            setFormData(emptyForm);
          }
          setDataLoading(false);
        },
        (err) => {
          console.error('[UpdateContactInfo] Firestore error:', err);
          Alert.alert(
            'Error de conexión',
            'No se pudieron cargar los datos desde el servidor. Verifica tu conexión y los permisos de Firestore.'
          );
          setDataLoading(false);
        }
      );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid, user?.rol]);

  const handleFieldChange = (field: keyof ContactForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change (Scenario 4: keeps form in edit mode)
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Scenario 2: Discard form changes, restore original values
  const handleCancel = () => {
    setFormData(originalRef.current);
    setErrors({});
  };

  // Scenario 1 & 4: Validate then persist
  const handleSave = async () => {
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      // Scenario 4: highlight all invalid fields without saving
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      await firestore()
        .collection('configuracion')
        .doc('contacto')
        .set(
          { email: formData.email, telefono: formData.telefono, whatsapp: formData.whatsapp },
          { merge: true }
        );
      // Update local original so Cancel now shows the newly saved values
      originalRef.current = { ...formData };
      Alert.alert('✓ Datos actualizados correctamente', 'Los cambios ya son visibles para todos los usuarios.');
    } catch (err) {
      console.error('[UpdateContactInfo] Save error:', err);
      Alert.alert('Error al guardar', 'No se pudo guardar la información. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <Breadcrumb parent="Administración" current="Contacto" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.main} />
          <Text style={styles.loadingText}>Cargando información de contacto…</Text>
        </View>
      </View>
    );
  }

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader />
      <Breadcrumb parent="Administración" current="Contacto" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Información de Contacto</Text>
          <Text style={styles.subtitle}>
            Actualiza la información y los canales de comunicación del equipo y el sitio.
          </Text>
        </View>

        {/* ── Contacto Directo Card ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="chatbubbles" size={20} color={Colors.light.main} />
            <Text style={styles.cardTitle}>Contacto Directo</Text>
          </View>

          <FormField
            testID="input-email"
            iconName="mail"
            iconColor={Colors.light.main}
            value={formData.email}
            onChangeText={(v) => handleFieldChange('email', v)}
            placeholder="contacto@clinica.com"
            keyboardType="email-address"
            error={errors.email}
          />

          <FormField
            testID="input-telefono"
            iconName="call"
            iconColor="#8F6BB3"
            value={formData.telefono}
            onChangeText={(v) => handleFieldChange('telefono', v)}
            placeholder="+58 424 114 9136"
            keyboardType="phone-pad"
            error={errors.telefono}
          />

          <FormField
            testID="input-whatsapp"
            iconName="logo-whatsapp"
            iconColor="#34C759"
            value={formData.whatsapp}
            onChangeText={(v) => handleFieldChange('whatsapp', v)}
            placeholder="wa.me/584241149136"
            error={errors.whatsapp}
          />

          {/* ── Actions ── */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              testID="btn-cancel"
              style={[styles.btn, styles.btnCancel]}
              onPress={handleCancel}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-save"
              style={[styles.btn, styles.btnSave, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="white" style={{ marginRight: 8 }} />
                  <Text style={styles.btnSaveText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#6B7280',
    fontFamily: 'Open Sans',
    fontSize: 13,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    fontFamily: 'Open Sans',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Open Sans',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    minWidth: 110,
  },
  btnCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  btnCancelText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
  btnSave: {
    backgroundColor: Colors.light.main,
    minWidth: 160,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
});
