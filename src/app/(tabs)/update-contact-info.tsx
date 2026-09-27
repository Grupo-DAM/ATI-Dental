import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { PageTitleLayout } from '@/components/page-title-layout';
import { EditResponsibleCard, Responsible } from '@/components/contact/responsible-card';
import { FormField } from '@/components/contact/form-field'
import { CardContainer } from '@/components/ui/card-container';
import { useAuth } from '@/hooks/use-auth';
import { isAdminUser } from '@/constants/user-roles';
import { firestore } from '@/config/firebase';
import { useTheme } from '@/hooks/use-theme';
import { createUpdateContactInfoStyles } from '@/constants/styles/contact.styles';

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
export const EMAIL_REGEX = /^[^\s@]+@[^.\s@]+(?:\.[^.\s@]+)+$/;
export const PHONE_REGEX = /^\+?[0-9 ]{7,20}$/;

export function validate(form: ContactForm, t: (k: string) => string): FormErrors {
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

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function UpdateContactInfoScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createUpdateContactInfoStyles(theme), [theme]);
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
          <ActivityIndicator size="large" color={theme.main} />
          <Text style={styles.loadingText}>{t('updateContact.loading')}</Text>
        </View>
      </View>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    
    <PageTitleLayout
      titleKey='updateContact.title'
      subtitleKey='updateContact.subtitle'
      parentBreadcrumbKey='navigation.administration'
      currentBreadcrumbKey='navigation.contact'
    >

      {/* ── Responsables del Sitio ── */}
      <View style={styles.sectionHeaderRow}>
        <Ionicons name="card" size={20} color={theme.main} />
        <Text style={styles.sectionTitle}>{t('updateContact.responsibles')}</Text>
      </View>
      
      <View style={styles.sectionContainer}>
        {responsibles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>{t('updateContact.noResponsibles')}</Text>
          </View>
        ) : (
          responsibles.map((resp, index) => (
            <EditResponsibleCard
              key={resp.id}
              resp={resp}
              index={index}
              onChange={handleResponsibleChange}
              onClear={handleResponsibleClear}
              t={t}
            />
          ))
        )}
      </View>

      {/* ── Contacto Directo header ── outside the card */}
      <View style={[styles.sectionHeaderRow, { marginTop: 8 }]}>
        <Ionicons name="chatbubbles" size={20} color={theme.main} />
        <Text style={styles.sectionTitle}>{t('updateContact.directContact')}</Text>
      </View>

      <CardContainer style={styles.sectionContainer} cardStyle={styles.card}>
        <FormField
          testID="input-email"
          iconName="mail"
          iconColor={theme.emailContactColor}
          value={formData.email}
          onChangeText={(v) => handleFieldChange('email', v)}
          placeholder={t('updateContact.placeholderEmail')}
          keyboardType="email-address"
          error={errors.email}
        />
        <FormField
          testID="input-telefono"
          iconName="call"
          iconColor={theme.phoneContactColor}
          value={formData.telefono}
          onChangeText={(v) => handleFieldChange('telefono', v)}
          placeholder={t('updateContact.placeholderTelefono')}
          keyboardType="phone-pad"
          error={errors.telefono}
        />
        <FormField
          testID="input-whatsapp"
          iconName="logo-whatsapp"
          iconColor={theme.whatsAppContactColor}
          value={formData.whatsapp}
          onChangeText={(v) => handleFieldChange('whatsapp', v)}
          placeholder={t('updateContact.placeholderWhatsapp')}
          error={errors.whatsapp}
        />
      </CardContainer>

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
    </PageTitleLayout>
  );
}