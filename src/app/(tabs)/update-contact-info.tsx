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
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

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

interface Responsible {
  id: string;
  title?: string;
  name?: string;
  role?: string;
  description?: string;
  email?: string;
  phone?: string;
  imageUrl?: string;
}

interface FormErrors {
  email?: string;
  telefono?: string;
  whatsapp?: string;
}

// ─── Validation ───────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9 ]{7,20}$/;

function validate(form: ContactForm, t: (k: string) => string): FormErrors {
  const errors: FormErrors = {};
  if (!form.email || !EMAIL_REGEX.test(form.email)) {
    errors.email = t('updateContact.validation.invalidEmail');
  }
  if (!form.telefono || !PHONE_REGEX.test(form.telefono)) {
    errors.telefono = t('updateContact.validation.invalidPhone');
  }
  if (!form.whatsapp.trim()) {
    errors.whatsapp = t('updateContact.validation.emptyWhatsapp');
  }
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

/** Inline-error text input row with colored icon */
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
  return (
    <View style={fieldStyles.wrapper}>
      <View style={[fieldStyles.row, !!error && fieldStyles.rowError]}>
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
      {!!error && (
        <Text style={fieldStyles.errorText}>⚠ {error}</Text>
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
  rowError: { borderColor: '#EF4444', borderWidth: 1.5 },
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

/** Editable card for a single responsible */
function ResponsibleCard({
  resp,
  index,
  onChange,
  onClear,
  t,
}: {
  resp: Responsible;
  index: number;
  onChange: (index: number, field: keyof Responsible, value: string) => void;
  onClear: (index: number) => void;
  t: (key: string) => string;
}) {
  return (
    <View style={cardStyles.card}>
      {/* Header: photo + trash */}
      <View style={cardStyles.header}>
        <View style={cardStyles.photoRow}>
          <Image
            source={resp.imageUrl ? { uri: resp.imageUrl } : avatarFallback}
            style={cardStyles.avatar}
            contentFit="cover"
          />
          <View style={cardStyles.photoInfo}>
            <Text style={cardStyles.photoLabel}>{t('updateContact.photoLabel')}</Text>
            <View style={cardStyles.photoActions}>
              <TouchableOpacity style={cardStyles.changeBtn}>
                <Text style={cardStyles.changeTxt}>{t('updateContact.change')}</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={cardStyles.deleteTxt}>{t('updateContact.delete')}</Text>
              </TouchableOpacity>
            </View>
            <Text style={cardStyles.photoHint}>{t('updateContact.photoHint')}</Text>
          </View>
        </View>
        <TouchableOpacity style={cardStyles.trashBtn} onPress={() => onClear(index)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Título + Nombre in same row */}
      <View style={cardStyles.row}>
        <View style={[cardStyles.col, { flex: 0.35 }]}>
          <Text style={cardStyles.label}>{t('updateContact.fieldTitle')}</Text>
          <TextInput
            style={cardStyles.input}
            value={resp.title || ''}
            onChangeText={(v) => onChange(index, 'title', v)}
            placeholder={t('updateContact.placeholderTitle')}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={[cardStyles.col, { flex: 0.65, marginLeft: 10 }]}>
          <Text style={cardStyles.label}>{t('updateContact.fieldName')}</Text>
          <TextInput
            style={cardStyles.input}
            value={resp.name || ''}
            onChangeText={(v) => onChange(index, 'name', v)}
            placeholder={t('updateContact.placeholderName')}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      {/* Cargo */}
      <Text style={cardStyles.label}>{t('updateContact.fieldRole')}</Text>
      <TextInput
        style={[cardStyles.input, { marginBottom: 12 }]}
        value={resp.role || ''}
        onChangeText={(v) => onChange(index, 'role', v)}
        placeholder={t('updateContact.placeholderRole')}
        placeholderTextColor="#9CA3AF"
      />

      {/* Descripción */}
      <Text style={cardStyles.label}>{t('updateContact.fieldDescription')}</Text>
      <TextInput
        style={[cardStyles.input, cardStyles.textarea]}
        value={resp.description || ''}
        onChangeText={(v) => onChange(index, 'description', v)}
        placeholder={t('updateContact.placeholderDescription')}
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
      />

      {/* Email row */}
      <View style={cardStyles.iconRow}>
        <Ionicons name="mail-outline" size={18} color="#6B7280" style={cardStyles.rowIcon} />
        <TextInput
          style={cardStyles.iconInput}
          value={resp.email || ''}
          onChangeText={(v) => onChange(index, 'email', v)}
          placeholder={t('updateContact.placeholderEmail')}
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Phone row */}
      <View style={[cardStyles.iconRow, { marginBottom: 0 }]}>
        <Ionicons name="call-outline" size={18} color="#6B7280" style={cardStyles.rowIcon} />
        <TextInput
          style={cardStyles.iconInput}
          value={resp.phone || ''}
          onChangeText={(v) => onChange(index, 'phone', v)}
          placeholder={t('updateContact.placeholderPhone')}
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.light.main,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
  },
  photoInfo: { flex: 1 },
  photoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginBottom: 4,
  },
  photoActions: { flexDirection: 'row', marginBottom: 4 },
  changeBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 10,
  },
  changeTxt: { fontSize: 11, color: '#4B5563', fontFamily: 'Open Sans' },
  deleteTxt: { fontSize: 11, color: '#EF4444', fontFamily: 'Open Sans', paddingVertical: 3 },
  photoHint: { fontSize: 10, color: '#9CA3AF', fontFamily: 'Open Sans' },
  trashBtn: { padding: 4 },
  row: { flexDirection: 'row', marginBottom: 12 },
  col: {},
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Open Sans',
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: 'Open Sans',
    color: '#1F2937',
    backgroundColor: '#FAFAFA',
  },
  textarea: {
    height: 72,
    paddingTop: 10,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },
  rowIcon: { marginRight: 8 },
  iconInput: { flex: 1, fontSize: 13, color: '#1F2937', fontFamily: 'Open Sans' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UpdateContactInfoScreen() {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const emptyContact: ContactForm = { email: '', telefono: '', whatsapp: '' };
  const originalContactRef = useRef<ContactForm>(emptyContact);
  const originalResponsiblesRef = useRef<Responsible[]>([]);

  const [formData, setFormData] = useState<ContactForm>(emptyContact);
  const [responsibles, setResponsibles] = useState<Responsible[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      Alert.alert(t('updateContact.sessionRequired'), '');
      router.replace('/(tabs)/home');
      return;
    }

    if (!isAdminUser(user)) {
      Alert.alert(t('updateContact.accessDenied'), '');
      router.replace('/(tabs)/home');
      return;
    }

    let contactLoaded = false;
    let responsiblesLoaded = false;
    const checkAllLoaded = () => {
      if (contactLoaded && responsiblesLoaded) setDataLoading(false);
    };

    // Subscribe: configuracion/contacto
    const unsubContact = firestore()
      .collection('configuracion')
      .doc('contacto')
      .onSnapshot(
        (snapshot) => {
          const docExists = typeof snapshot.exists === 'function'
            ? snapshot.exists()
            : snapshot.exists;
          if (docExists) {
            const raw = snapshot.data() as Partial<ContactForm>;
            const loaded: ContactForm = {
              email: raw.email ?? '',
              telefono: raw.telefono ?? '',
              whatsapp: raw.whatsapp ?? '',
            };
            originalContactRef.current = loaded;
            setFormData(loaded);
          }
          contactLoaded = true;
          checkAllLoaded();
        },
        (err) => {
          console.error('[UpdateContactInfo] configuracion error:', err);
          contactLoaded = true;
          checkAllLoaded();
          Alert.alert(t('updateContact.errorLoadTitle'), t('updateContact.errorLoad'));
        }
      );

    // Subscribe: responsibles collection
    const unsubResponsibles = firestore()
      .collection('responsibles')
      .onSnapshot(
        (snapshot) => {
          const data: Responsible[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Responsible, 'id'>),
          }));
          originalResponsiblesRef.current = JSON.parse(JSON.stringify(data));
          setResponsibles(data);
          responsiblesLoaded = true;
          checkAllLoaded();
        },
        (err) => {
          console.error('[UpdateContactInfo] responsibles error:', err);
          responsiblesLoaded = true;
          checkAllLoaded();
        }
      );

    return () => {
      unsubContact();
      unsubResponsibles();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.uid, user?.rol]);

  const handleFieldChange = (field: keyof ContactForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleResponsibleChange = (index: number, field: keyof Responsible, value: string) => {
    setResponsibles((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleResponsibleClear = (index: number) => {
    setResponsibles((prev) => {
      const updated = [...prev];
      const { id, imageUrl } = updated[index];
      // Keep id and imageUrl, clear all text fields
      updated[index] = { id, imageUrl, title: '', name: '', role: '', description: '', email: '', phone: '' };
      return updated;
    });
  };

  // Scenario 2: restore originals without touching Firestore
  const handleCancel = () => {
    setFormData({ ...originalContactRef.current });
    setResponsibles(JSON.parse(JSON.stringify(originalResponsiblesRef.current)));
    setErrors({});
  };

  // Scenario 1 & 4: validate then persist via batch
  const handleSave = async () => {
    const newErrors = validate(formData, t);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      // Use a single db instance — mixing firestore() calls in a batch causes errors
      const db = firestore();
      const batch = db.batch();

      // Update configuracion/contacto
      const contactRef = db.collection('configuracion').doc('contacto');
      batch.set(contactRef, {
        email: formData.email,
        telefono: formData.telefono,
        whatsapp: formData.whatsapp,
      }, { merge: true });

      // Update each responsible
      responsibles.forEach((resp) => {
        if (resp.id) {
          const { id, ...data } = resp;
          const ref = db.collection('responsibles').doc(id);
          batch.set(ref, data, { merge: true });
        }
      });

      await batch.commit();
      originalContactRef.current = { ...formData };
      originalResponsiblesRef.current = JSON.parse(JSON.stringify(responsibles));
      Alert.alert(t('updateContact.successTitle'), t('updateContact.successMessage'));
    } catch (err) {
      console.error('[UpdateContactInfo] Save error:', err);
      Alert.alert(t('updateContact.errorSaveTitle'), t('updateContact.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading || dataLoading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <Breadcrumb parent="Administración" current="Contacto" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.light.main} />
          <Text style={styles.loadingText}>{t('updateContact.loading')}</Text>
        </View>
      </View>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppHeader />
      <Breadcrumb parent={t('navigation.administration')} current={t('navigation.contact')} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{t('updateContact.title')}</Text>
          <Text style={styles.subtitle}>{t('updateContact.subtitle')}</Text>
        </View>

        {/* ── Responsables del Sitio ── */}
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="card" size={20} color={Colors.light.main} />
          <Text style={styles.sectionTitle}>{t('updateContact.responsibles')}</Text>
        </View>

        {responsibles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('updateContact.noResponsibles')}</Text>
          </View>
        ) : (
          responsibles.map((resp, index) => (
            <ResponsibleCard
              key={resp.id}
              resp={resp}
              index={index}
              onChange={handleResponsibleChange}
              onClear={handleResponsibleClear}
              t={t}
            />
          ))
        )}

        {/* ── Contacto Directo header ── outside the card */}
        <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
          <Ionicons name="chatbubbles" size={20} color={Colors.light.main} />
          <Text style={styles.sectionTitle}>{t('updateContact.directContact')}</Text>
        </View>

        <View style={styles.card}>
          <FormField
            testID="input-email"
            iconName="mail"
            iconColor={Colors.light.main}
            value={formData.email}
            onChangeText={(v) => handleFieldChange('email', v)}
            placeholder={t('updateContact.placeholderEmail')}
            keyboardType="email-address"
            error={errors.email}
          />
          <FormField
            testID="input-telefono"
            iconName="call"
            iconColor="#8F6BB3"
            value={formData.telefono}
            onChangeText={(v) => handleFieldChange('telefono', v)}
            placeholder={t('updateContact.placeholderTelefono')}
            keyboardType="phone-pad"
            error={errors.telefono}
          />
          <FormField
            testID="input-whatsapp"
            iconName="logo-whatsapp"
            iconColor="#34C759"
            value={formData.whatsapp}
            onChangeText={(v) => handleFieldChange('whatsapp', v)}
            placeholder={t('updateContact.placeholderWhatsapp')}
            error={errors.whatsapp}
          />
        </View>

        {/* ── Action buttons OUTSIDE the card ── */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            testID="btn-cancel"
            style={[styles.btn, styles.btnCancel]}
            onPress={handleCancel}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.btnCancelText}>{t('updateContact.cancel')}</Text>
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
                <Text style={styles.btnSaveText}>{t('updateContact.saveChanges')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F8' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#6B7280', fontFamily: 'Open Sans', fontSize: 13 },
  scrollContent: { paddingBottom: Platform.OS === 'ios' ? 100 : 80 },
  titleSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  mainTitle: {
    fontSize: 22, fontWeight: '700', color: '#1F2937',
    fontFamily: 'Open Sans', marginBottom: 4,
  },
  subtitle: { fontSize: 13, color: '#6B7280', lineHeight: 18, fontFamily: 'Open Sans' },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: '600', color: '#111827', fontFamily: 'Open Sans',
  },
  emptyBox: {
    marginHorizontal: 16, marginBottom: 16,
    padding: 20, backgroundColor: '#F3F4F6',
    borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  emptyText: { color: '#6B7280', fontFamily: 'Open Sans', textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, marginHorizontal: 16, marginBottom: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  buttonRow: {
    flexDirection: 'row', justifyContent: 'flex-end',
    alignItems: 'center', gap: 10,
    marginTop: 8, marginHorizontal: 16, marginBottom: 24,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 44, borderRadius: 8, paddingHorizontal: 16, minWidth: 110,
  },
  btnCancel: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' },
  btnCancelText: { color: '#4B5563', fontSize: 14, fontWeight: '600', fontFamily: 'Open Sans' },
  btnSave: { backgroundColor: Colors.light.main, minWidth: 160 },
  btnDisabled: { opacity: 0.6 },
  btnSaveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', fontFamily: 'Open Sans' },
});
