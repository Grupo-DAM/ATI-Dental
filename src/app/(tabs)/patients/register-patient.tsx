import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { BirthDatePicker, formatBirthDate } from '@/components/ui/birth-date-picker';
import { FormActionButton, FormSelectField, FormTextField } from '@/components/ui/form-field';
import { ModalOptionList } from '@/components/ui/modal-option-list';
import { isSystemDatePickerAvailable } from '@/components/ui/system-date-picker';
import {
  getPatientGenderLabelKey,
  isPatientGender,
  PATIENT_BLOOD_TYPES,
  PATIENT_GENDER_VALUES,
} from '@/constants/patient';
import { useTheme } from '@/hooks/use-theme';

import { createPatient, getPatientById } from '@/services/patient-service';
import { validatePatientForm } from '@/utils/patient-validation';

const AVATAR_FALLBACK = require('@/assets/expo.icon/Assets/avatar.png');
const MAX_PHOTO_BYTES = 1024 * 1024;

function isValidPatientEmail(value: string): boolean {
  const trimmed = value.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return false;
  }

  const domain = trimmed.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === domain.length - 1) {
    return false;
  }

  return !trimmed.includes(' ');
}

function loadImagePicker() {
  try {
    return require('expo-image-picker');
  } catch {
    return null;
  }
}

export default function RegisterPatientScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateObj, setBirthDateObj] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [bloodModalVisible, setBloodModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});

    // Recibimos parámetros de la navegación (puede ser el ID o el objeto completo)
    const params = useLocalSearchParams<{ patientId?: string; patientData?: string }>();

    // Función que toma los datos del paciente y rellena los campos del formulario
    const populateFormWithPatient = (data: any) => {
      if (!data) return;
      setFullName(data.fullName ?? data.nombre ?? '');
      setDocumentId(data.documentId ?? data.cedula ?? '');
      setBirthDate(data.birthDate ?? data.fechaNacimiento ?? '');
      setGender(data.gender ?? data.genero ?? '');
      setPhone(data.phone ?? data.telefono ?? '');
      setEmail(data.email ?? '');
      setAddress(data.address ?? data.direccion ?? '');
      setBloodType(data.bloodType ?? data.tipoSangre ?? '');
      setAllergies(data.allergies ?? data.alergias ?? '');
      setConditions(data.conditions ?? data.condiciones ?? '');
      setNotes(data.notes ?? data.notas ?? '');
      if (data.photoUri) setPhotoUri(data.photoUri);
    };

    useEffect(() => {
      // se pasó el objeto completo como string
      if (params.patientData) {
        try {
          const parsed = JSON.parse(params.patientData);
          populateFormWithPatient(parsed);
        } catch (err) {
          console.error('[RegisterPatient] Error parseando patientData:', err);
        }
        return;
      }

      // Opción B: solo el patientId de Firebase
      if (params.patientId) {
        getPatientById(params.patientId).then((patient) => {
          if (patient) {
            populateFormWithPatient(patient);
          }
        }).catch((err) => {
          console.error('[RegisterPatient] Error consultando paciente:', err);
        });
      }
    }, [params.patientId, params.patientData]);

  const genderOptions = useMemo(
    () =>
      PATIENT_GENDER_VALUES.map((value) => ({
        name: value,
        label: t(getPatientGenderLabelKey(value)),
        testID: `gender-option-${value}`,
      })),
    [t],
  );

  const bloodOptions = useMemo(
    () =>
      PATIENT_BLOOD_TYPES.map((value) => ({
        name: value,
        label: value,
        testID: `blood-option-${value}`,
      })),
    [],
  );

  const genderLabel = isPatientGender(gender)
    ? t(getPatientGenderLabelKey(gender))
    : t('registerPatient.selectPlaceholder');

  const handlePickPhoto = async () => {
    const ImagePicker = loadImagePicker();
    if (!ImagePicker?.requestMediaLibraryPermissionsAsync) {
      Alert.alert(
        t('registerPatient.alerts.errorTitle'),
        t('registerPatient.alerts.photoPickerUnavailable'),
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        t('registerPatient.alerts.errorTitle'),
        t('registerPatient.alerts.photoPermission'),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_PHOTO_BYTES) {
      Alert.alert(
        t('registerPatient.alerts.errorTitle'),
        t('registerPatient.alerts.photoTooLarge'),
      );
      return;
    }

    setPhotoUri(asset.uri);
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const handleOpenDatePicker = () => {
    if (!isSystemDatePickerAvailable()) {
      Alert.alert(
        t('registerPatient.alerts.errorTitle'),
        t('registerPatient.alerts.datePickerUnavailable'),
      );
      return;
    }
    setShowDatePicker(true);
  };

  const handleCancel = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/explore');
  };

    const handleSubmit = async () => {
      if (isSubmitting) {
        return;
      }

      const validation = validatePatientForm({
        fullName,
        email,
        phone,
        documentId,
        birthDate,
        gender,
        address,
        bloodType,
        allergies,
        conditions,
        notes,
        photoUri,
      });

      if (!validation.isValid) {
        const translatedErrors: { fullName?: string; email?: string } = {};
        if (validation.errors.fullName) {
          translatedErrors.fullName = t(validation.errors.fullName);
        }
        if (validation.errors.email) {
          translatedErrors.email = t(validation.errors.email);
        }
        setErrors(translatedErrors);
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      try {
        await createPatient({
          fullName,
          documentId,
          birthDate,
          gender,
          phone,
          email,
          address,
          bloodType,
          allergies,
          conditions,
          notes,
          photoUri,
        });

        Alert.alert(
          t('registerPatient.alerts.successTitle'),
          t('registerPatient.alerts.successMessage'),
          [
            {
              text: t('registerPatient.confirmDate'),
              onPress: () => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/explore');
                }
              },
            },
          ]
        );
      } catch (error: any) {
        console.error('[RegisterPatientScreen] Error registering patient:', error);
        const detail = error?.message ? `\n${error.message}` : '';
        Alert.alert(
          t('registerPatient.alerts.errorTitle'),
          `${t('registerPatient.alerts.saveError')}${detail}`
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  return (
    <View testID="register-patient-screen" style={styles.container}>
      <AppHeader />
      <ScrollView style={styles.scroll}>
        <Breadcrumb parent={t('tabs.explore')} current={t('registerPatient.breadcrumb')} />

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{t('registerPatient.title')}</Text>
          <Text style={styles.subtitle}>{t('registerPatient.subtitle')}</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={theme.main} style={styles.cardHeaderIcon} />
            <Text style={styles.cardHeaderTitle}>{t('registerPatient.personalData')}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.avatarRow}>
              <Image
                source={photoUri ? { uri: photoUri } : AVATAR_FALLBACK}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.avatarActions}>
                <Text style={styles.avatarLabel}>{t('registerPatient.profilePicture')}</Text>
                <View style={styles.avatarButtonsRow}>
                  <TouchableOpacity
                    testID="btn-change-photo"
                    activeOpacity={0.7}
                    style={styles.btnChange}
                    onPress={handlePickPhoto}>
                    <Text style={styles.btnChangeText}>{t('registerPatient.changePhoto')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID="btn-remove-photo"
                    activeOpacity={0.7}
                    onPress={handleRemovePhoto}
                    disabled={!photoUri}>
                    <Text style={[styles.btnRemoveText, !photoUri && styles.btnRemoveDisabled]}>
                      {t('registerPatient.removePhoto')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.avatarHelpText}>{t('registerPatient.photoHelp')}</Text>
              </View>
            </View>

            <FormTextField
              testID="input-full-name"
              label={t('registerPatient.fullName')}
              required
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                if (errors.fullName) {
                  setErrors((current) => ({ ...current, fullName: undefined }));
                }
              }}
              placeholder={t('registerPatient.fullNamePlaceholder')}
              errorMessage={errors.fullName}
            />

            <FormTextField
              testID="input-document"
              label={t('registerPatient.documentId')}
              value={documentId}
              onChangeText={setDocumentId}
              placeholder={t('registerPatient.documentPlaceholder')}
            />

            <View style={styles.row}>
              <View style={styles.rowItemWide}>
                <FormSelectField
                  testID="select-birth-date"
                  label={t('registerPatient.birthDate')}
                  valueLabel={birthDate || t('registerPatient.birthDatePlaceholder')}
                  isPlaceholder={!birthDate}
                  onPress={handleOpenDatePicker}
                  iconName="calendar-outline"
                />
              </View>
              <View style={styles.rowItem}>
                <FormSelectField
                  testID="select-gender"
                  label={t('registerPatient.gender')}
                  valueLabel={genderLabel}
                  isPlaceholder={!gender}
                  onPress={() => setGenderModalVisible(true)}
                  iconName="chevron-down"
                />
              </View>
            </View>

            <FormTextField
              testID="input-phone"
              label={t('registerPatient.phone')}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('registerPatient.phonePlaceholder')}
              keyboardType="phone-pad"
              leadingIcon={
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={theme.placeholderColor}
                  style={styles.leadingIcon}
                />
              }
            />

            <FormTextField
              testID="input-email"
              label={t('registerPatient.email')}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) {
                  setErrors((current) => ({ ...current, email: undefined }));
                }
              }}
              placeholder={t('registerPatient.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              errorMessage={errors.email}
              leadingIcon={
                <Image
                  source={require('@/assets/expo.icon/Assets/email.svg')}
                  style={styles.emailIcon}
                  contentFit="contain"
                  tintColor={theme.placeholderColor}
                />
              }
            />

            <FormTextField
              testID="input-address"
              label={t('registerPatient.address')}
              value={address}
              onChangeText={setAddress}
              placeholder={t('registerPatient.addressPlaceholder')}
            />
          </View>
        </View>

        <View style={[styles.cardContainer, styles.cardSpacing]}>
          <View style={styles.cardHeader}>
            <Ionicons name="medkit" size={24} color={theme.main} style={styles.cardHeaderIcon} />
            <Text style={styles.cardHeaderTitle}>{t('registerPatient.clinicalInfo')}</Text>
          </View>
          <View style={styles.cardBody}>
            <FormSelectField
              testID="select-blood-type"
              label={t('registerPatient.bloodType')}
              valueLabel={bloodType || t('registerPatient.selectPlaceholder')}
              isPlaceholder={!bloodType}
              onPress={() => setBloodModalVisible(true)}
              iconName="chevron-down"
            />

            <FormTextField
              testID="input-allergies"
              label={t('registerPatient.allergies')}
              value={allergies}
              onChangeText={setAllergies}
              placeholder={t('registerPatient.allergiesPlaceholder')}
              multiline
              textAlignVertical="top"
            />

            <FormTextField
              testID="input-conditions"
              label={t('registerPatient.conditions')}
              value={conditions}
              onChangeText={setConditions}
              placeholder={t('registerPatient.conditionsPlaceholder')}
              multiline
              textAlignVertical="top"
            />

            <FormTextField
              testID="input-notes"
              label={t('registerPatient.notes')}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('registerPatient.notesPlaceholder')}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <FormActionButton
            testID="btn-cancel-patient"
            variant="secondary"
            label={t('registerPatient.cancel')}
            onPress={handleCancel}
            disabled={isSubmitting}
          />
          <FormActionButton
            testID="btn-submit-patient"
            label={t('registerPatient.submit')}
            onPress={handleSubmit}
            loading={isSubmitting}
            iconName="person-add-outline"
          />
        </View>
      </ScrollView>

      <ModalOptionList
        visible={genderModalVisible}
        onRequestClose={() => setGenderModalVisible(false)}
        title={t('registerPatient.gender')}
        options={genderOptions}
        selectedOption={gender}
        onSelectOption={setGender}
      />
      <ModalOptionList
        visible={bloodModalVisible}
        onRequestClose={() => setBloodModalVisible(false)}
        title={t('registerPatient.bloodType')}
        options={bloodOptions}
        selectedOption={bloodType}
        onSelectOption={setBloodType}
      />

      <BirthDatePicker
        visible={showDatePicker}
        value={birthDateObj}
        title={t('registerPatient.birthDate')}
        confirmLabel={t('registerPatient.confirmDate')}
        pickerTestID="birth-date-picker"
        modalTestID="birth-date-modal"
        locale={i18n.language === 'en' ? 'en-US' : 'es-ES'}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => {
          setBirthDateObj(date);
          setBirthDate(formatBirthDate(date));
        }}
      />
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: theme.backgroundSecondary,
  },
    scroll: {
    flex: 1,
    },
    titleSection: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    mainTitle: {
      fontSize: 26,
    fontWeight: '700',
      color: theme.pageTitle,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
      color: theme.pageSubtitle,
      lineHeight: 20,
    },
    cardContainer: {
      backgroundColor: theme.backgroundElement,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: theme.pageSeparator,
    },
    cardSpacing: {
      marginTop: 20,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.pageSeparator,
      backgroundColor: theme.backgroundSecondary,
    },
    cardHeaderIcon: {
      marginRight: 10,
    },
    cardHeaderTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.pageTitle,
    },
    cardBody: {
      padding: 20,
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.backgroundSelected,
    },
    avatarActions: {
      flex: 1,
      marginLeft: 16,
    },
    avatarLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textNames,
      marginBottom: 8,
    },
    avatarButtonsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    btnChange: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 6,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    btnChangeText: {
      color: theme.textNames,
      fontSize: 14,
    },
    btnRemoveText: {
      color: theme.error,
      fontSize: 14,
    },
    btnRemoveDisabled: {
      opacity: 0.4,
    },
    avatarHelpText: {
      fontSize: 12,
      color: theme.placeholderColor,
    },
    emailIcon: {
      width: 18,
      height: 18,
      marginRight: 10,
    },
    leadingIcon: {
      marginRight: 10,
    },
    row: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    rowItem: {
      flexGrow: 1,
      flexBasis: 140,
      minWidth: 140,
    },
    rowItemWide: {
      flexGrow: 1.35,
      flexBasis: 160,
      minWidth: 160,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      marginTop: 30,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
});
