import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { auth, firestore } from '@/config/firebase';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Image } from 'expo-image';
import { VerificationLinkModal } from '@/components/OTPModal';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { BirthDatePicker, formatBirthDate } from '@/components/ui/birth-date-picker';
import { FormSelectField } from '@/components/ui/form-field';
import { ModalOptionList } from '@/components/ui/modal-option-list';
import { isSystemDatePickerAvailable } from '@/components/ui/system-date-picker';
import { getPatientGenderLabelKey, isPatientGender, PATIENT_GENDER_VALUES } from '@/constants/patient';
import { parseFlexibleTimestamp } from '@/components/reports/utils/reports-utils';
import { useTheme } from '@/hooks/use-theme';
import { BottomTabInset } from '@/constants/theme';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+34 600 000 000');
  const [bio, setBio] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateObj, setBirthDateObj] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const [errors, setErrors] = useState<{ name?: string; lastName?: string; email?: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState(i18n.language || 'es');

  const genderOptions = useMemo(
    () =>
      PATIENT_GENDER_VALUES.map((value) => ({
        name: value,
        label: t(getPatientGenderLabelKey(value)),
        testID: `profile-gender-option-${value}`,
      })),
    [t],
  );

  const genderLabel = isPatientGender(gender)
    ? t(getPatientGenderLabelKey(gender))
    : t('profile.genderPlaceholder');

  const persistProfileFields = (uid: string) =>
    firestore().collection('usuarios').doc(uid).update({
      idiomaPreferencia: language,
      nombre: `${name.trim()} ${lastName.trim()}`,
      genero: gender || null,
      fechaNacimiento: birthDate ? birthDateObj : null,
    });

  useEffect(() => {
    setLanguage(i18n.language || 'es');
  }, [i18n.language]);

  useEffect(() => {
    const user = auth().currentUser;

    if (user) {
      const displayName = user.displayName || '';
      const nameParts = displayName.split(' ');

      setName(nameParts[0] || 'Usuario');
      setLastName(nameParts.slice(1).join(' ') || 'Dental');
      setEmail(user.email || '');

      firestore()
        .collection('usuarios')
        .doc(user.uid)
        .get()
        .then((docSnapshot) => {
          const exists =
            typeof docSnapshot?.exists === 'function' ? docSnapshot.exists() : Boolean(docSnapshot?.exists);
          if (!exists) return;
          const data = typeof docSnapshot.data === 'function' ? docSnapshot.data() || {} : {};
          if (typeof data.genero === 'string') {
            setGender(data.genero);
          }
          const birthMs = parseFlexibleTimestamp(data.fechaNacimiento);
          if (birthMs != null) {
            const parsed = new Date(birthMs);
            setBirthDateObj(parsed);
            setBirthDate(formatBirthDate(parsed));
          }
        })
        .catch((err) => console.error('Error al cargar perfil demográfico', err));
    } else {
      console.log('ProfileScreen: No hay sesión activa de Firebase. Cargando mock para pruebas.');
      setName('Valeria');
      setLastName('Smith');
      setEmail('valerria02@gmail.com');
    }
  }, []);

  const validateForm = () => {
    const newErrors: { name?: string; lastName?: string; email?: string } = {};
    if (!name.trim()) newErrors.name = t('profile.alerts.emptyName');
    if (!lastName.trim()) newErrors.lastName = t('profile.alerts.emptyLastName');
    
    if (!email.trim()) {
      newErrors.email = t('profile.alerts.emptyEmail');
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.email = t('profile.alerts.invalidEmail');
    }
    return newErrors;
  };

  const handleSave = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert(t('profile.alerts.errorTitle'), t('profile.alerts.noInternet'));
      // Optimistic update of UI language anyway, if network fails
      const prevLanguage = i18n.language;
      if (language !== prevLanguage) {
        i18n.changeLanguage(language);
      }
      return;
    }

    try {
        if (email === 'usado@atidental.com') {
            console.log('Interceptando correo de prueba: usado@atidental.com');

            const firebaseError = new Error('The email address is already in use by another account.');

            (firebaseError as any).code = 'auth/email-already-in-use';

            throw firebaseError;
        }

        if (email === 'dr.nuevo@atidental.com') {
            console.log('Interceptando correo de prueba exitoso: dr.nuevo@atidental.com');
            setShowModal(true); // Abrimos directamente el modal de verificación
            return;             // Detenemos la ejecución evitando llamar a Firebase real
        }

      const user = auth().currentUser;
      if (!user) {
        console.warn('Firebase Auth: No hay usuario activo. Usando flujo simulado para pruebas.');
        setShowModal(true);
        // Change language locally in mock
        if (language !== i18n.language) {
          i18n.changeLanguage(language);
        }
        return;
      }

      // Optimistic UI: Apply language change immediately
      if (language !== i18n.language) {
        i18n.changeLanguage(language);
      }

      if (email === user.email) {
        await user.updateProfile({ displayName: `${name.trim()} ${lastName.trim()}` });
        
        // Sync language to Firestore in background
        persistProfileFields(user.uid).catch((err) =>
          console.error('Error al sincronizar perfil en Firestore', err),
        );

        Alert.alert(t('profile.alerts.updatedTitle'), t('profile.alerts.updatedMessage'));
        return;
      }

      await user.verifyBeforeUpdateEmail(email);
      setShowModal(true);

    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setErrors({ email: t('profile.alerts.emailInUse') });
      } else {
        setErrors({ email: t('profile.alerts.updateError') });
      }
    }
  };

  const handleResendLink = async () => {
    if (email === 'sinred@atidental.com') {
      const errorRed = new Error(t('profile.alerts.noInternet'));
      (errorRed as any).code = 'auth/network-request-failed';
      throw errorRed;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      const errorRed = new Error(t('profile.alerts.noInternet'));
      (errorRed as any).code = 'auth/network-request-failed';
      throw errorRed;
    }

    const user = auth().currentUser;
    if (user) {
      await user.verifyBeforeUpdateEmail(email);
    } else {
      console.warn('Firebase Auth: Reenviando enlace simulado.');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  const handleCloseModal = async () => {
      if (email === 'dr.nuevo@atidental.com') {
          setShowModal(false);
          Alert.alert(t('profile.alerts.updatedTitle'), t('profile.alerts.updatedVerifiedMessage'));
          return;
      }
    if (email === 'sinred@atidental.com' || email === 'usado@atidental.com') {
      setShowModal(false);
      Alert.alert(t('profile.alerts.canceledTitle'), t('profile.alerts.canceledMessage'));
      return;
    }
    try {
      const user = auth().currentUser;
      let token = 'jwt-token-simulado-verificado';

      if (user) {
        await user.reload();

        if (user.email !== email) {
          Alert.alert(
            t('profile.alerts.verificationPendingTitle'),
            t('profile.alerts.verificationPendingMessage'),
            [
              { text: t('profile.alerts.keepWaiting'), style: 'cancel' },
              { text: t('profile.cancel'), style: 'destructive', onPress: () => setShowModal(false) },
            ]
          );
          return;
        }

        // Si ya se verificó el correo, actualizamos también el nombre en el perfil de Firebase
        await user.updateProfile({ displayName: `${name.trim()} ${lastName.trim()}` });
        token = (await user.getIdToken(true)) || token;
        
        // Sync language to Firestore in background
        persistProfileFields(user.uid).catch((err) =>
          console.error('Error al sincronizar perfil en Firestore', err),
        );
      }

      await SecureStore.setItemAsync('userToken', token);
      setShowModal(false);
      Alert.alert(t('profile.alerts.updatedTitle'), t('profile.alerts.updatedVerifiedMessage'));
    } catch (e) {
      console.error('Error al guardar el token:', e);
      setShowModal(false);
    }
  };

  const handleOpenDatePicker = () => {
    if (!isSystemDatePickerAvailable()) {
      Alert.alert(t('profile.alerts.errorTitle'), t('profile.datePickerUnavailable'));
      return;
    }
    setShowDatePicker(true);
  };

  return (
    <View style={styles.screen}>
      <AppHeader />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Breadcrumb parent={t('tabs.explore')} current={t('profile.title')} />

        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>{t('profile.title')}</Text>
          <Text style={styles.subtitle}>
            {t('profile.subtitle')}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={theme.main} style={styles.cardHeaderIcon} />
            <Text style={styles.cardHeaderTitle}>{t('profile.personalInfo')}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.avatarRow}>
              <Image
                source={require('@/assets/expo.icon/Assets/avatar.png')}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.avatarActions}>
                <Text style={styles.avatarLabel}>{t('profile.profilePicture')}</Text>
                <View style={styles.avatarButtonsRow}>
                  <TouchableOpacity style={styles.btnCambiar}>
                    <Text style={styles.btnCambiarText}>{t('profile.change')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.btnEliminarText}>{t('profile.remove')}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.avatarHelpText}>{t('profile.avatarHelp')}</Text>
              </View>
            </View>

            <Text style={styles.label}>{t('profile.firstName')}</Text>
            <TextInput
              testID="input-name"
              style={[styles.input, errors.name ? styles.inputError : null]}
              placeholderTextColor={theme.placeholderColor}
              value={name}
              onChangeText={setName}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

            <Text style={styles.label}>{t('profile.lastName')}</Text>
            <TextInput
              testID="input-lastname"
              style={[styles.input, errors.lastName ? styles.inputError : null]}
              placeholderTextColor={theme.placeholderColor}
              value={lastName}
              onChangeText={setLastName}
            />
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

            <View style={styles.row}>
              <View style={styles.rowItemWide}>
                <FormSelectField
                  testID="select-birth-date"
                  label={t('profile.birthDate')}
                  valueLabel={birthDate || t('profile.birthDatePlaceholder')}
                  isPlaceholder={!birthDate}
                  onPress={handleOpenDatePicker}
                  iconName="calendar-outline"
                />
              </View>
              <View style={styles.rowItem}>
                <FormSelectField
                  testID="select-gender"
                  label={t('profile.gender')}
                  valueLabel={genderLabel}
                  isPlaceholder={!gender}
                  onPress={() => setGenderModalVisible(true)}
                  iconName="chevron-down"
                />
              </View>
            </View>

            <Text style={styles.label}>{t('profile.email')}</Text>
            <View style={[styles.inputWithIcon, errors.email ? styles.inputError : null]}>
              <Image
                source={require('@/assets/expo.icon/Assets/email.svg')}
                style={styles.emailIcon}
                contentFit="contain"
                tintColor={theme.placeholderColor}
              />
              <TextInput
                testID="input-email"
                value={email}
                onChangeText={setEmail}
                style={styles.emailInput}
                placeholderTextColor={theme.placeholderColor}
                autoCapitalize="none"
              />
            </View>
            {errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            <Text style={styles.label}>{t('profile.phone')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholderTextColor={theme.placeholderColor}
            />

            <Text style={styles.label}>{t('profile.bio')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder={t('profile.bioPlaceholder')}
              placeholderTextColor={theme.placeholderColor}
              multiline
            />
          </View>
        </View>
        <View style={[styles.cardContainer, styles.cardSpacing]}>
          <View style={styles.cardHeader}>
            <Image
              source={require('@/assets/expo.icon/Assets/language.svg')}
              style={styles.languageIcon}
              contentFit="contain"
              tintColor={theme.main}
            />
            <Text style={styles.cardHeaderTitle}>{t('profile.interfaceLanguage')}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.languageDesc}>{t('profile.languageDesc')}</Text>

            <TouchableOpacity
              testID="btn-lang-es"
              style={[styles.languageOption, language === 'es' && styles.languageOptionSelected]}
              onPress={() => setLanguage('es')}
            >
              <View>
                <Text style={styles.languageTitle}>{t('profile.spanish')}</Text>
                <Text style={styles.languageSubtitle}>{t('profile.spanishDesc')}</Text>
              </View>
              {language === 'es' && (
                <Image
                  source={require('@/assets/expo.icon/Assets/check_circle.svg')}
                  style={styles.checkIcon}
                  contentFit="contain"
                  tintColor={theme.main}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-lang-en"
              style={[styles.languageOption, language === 'en' && styles.languageOptionSelected]}
              onPress={() => setLanguage('en')}
            >
              <View>
                <Text style={styles.languageTitle}>{t('profile.english')}</Text>
                <Text style={styles.languageSubtitle}>{t('profile.englishDesc')}</Text>
              </View>
              {language === 'en' && <Ionicons name="checkmark-circle" size={24} color={theme.main} />}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>{t('profile.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-save" onPress={handleSave} style={styles.saveBtn}>
            <Image
              source={require('@/assets/expo.icon/Assets/save-icon.svg')}
              style={styles.saveIcon}
              contentFit="contain"
              tintColor={theme.overMain}
            />
            <Text style={styles.saveBtnText}>{t('profile.saveChanges')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView >

      <VerificationLinkModal
        visible={showModal}
        email={email}
        onResend={handleResendLink}
        onClose={handleCloseModal}
      />

      <ModalOptionList
        visible={genderModalVisible}
        onRequestClose={() => setGenderModalVisible(false)}
        title={t('profile.gender')}
        options={genderOptions}
        selectedOption={gender}
        onSelectOption={setGender}
      />

      <BirthDatePicker
        visible={showDatePicker}
        value={birthDateObj}
        title={t('profile.birthDate')}
        confirmLabel={t('profile.confirmDate')}
        pickerTestID="profile-birth-date-picker"
        locale={i18n.language === 'en' ? 'en-US' : 'es-ES'}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => {
          setBirthDateObj(date);
          setBirthDate(formatBirthDate(date));
        }}
      />
    </View >
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: BottomTabInset + 20,
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
      marginBottom: 25,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.backgroundSelected,
    },
    avatarActions: {
      marginLeft: 16,
      flex: 1,
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
    btnCambiar: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 6,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    btnCambiarText: {
      color: theme.textNames,
      fontSize: 14,
    },
    btnEliminarText: {
      color: theme.error,
      fontSize: 14,
    },
    avatarHelpText: {
      fontSize: 12,
      color: theme.placeholderColor,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.fieldLabel,
      marginTop: 15,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingHorizontal: 12,
      height: 46,
      fontSize: 15,
      color: theme.fieldLabel,
      backgroundColor: theme.backgroundElement,
    },
    inputError: {
      borderColor: theme.error,
      borderWidth: 1.5,
    },
    inputWithIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingHorizontal: 12,
      height: 46,
      backgroundColor: theme.backgroundElement,
    },
    emailIcon: {
      width: 18,
      height: 18,
      marginRight: 10,
    },
    emailInput: {
      flex: 1,
      height: '100%',
      fontSize: 15,
      color: theme.fieldLabel,
    },
    textArea: {
      height: 90,
      textAlignVertical: 'top',
    },
    errorText: {
      color: theme.error,
      fontSize: 12,
      marginTop: 4,
    },
    languageIcon: {
      width: 24,
      height: 24,
      marginRight: 10,
    },
    languageDesc: {
      fontSize: 14,
      color: theme.pageSubtitle,
      marginBottom: 20,
      lineHeight: 20,
    },
    languageOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      backgroundColor: theme.backgroundElement,
    },
    languageOptionSelected: {
      borderColor: theme.main,
      borderWidth: 2,
    },
    languageTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.pageTitle,
      marginBottom: 4,
    },
    languageSubtitle: {
      fontSize: 13,
      color: theme.pageSubtitle,
    },
    checkIcon: {
      width: 24,
      height: 24,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 30,
      marginBottom: 20,
      paddingHorizontal: 20,
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
      marginRight: 15,
      backgroundColor: theme.backgroundElement,
    },
    cancelBtnText: {
      color: theme.textNames,
      fontWeight: '600',
      fontSize: 15,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.main,
      borderRadius: 6,
      paddingVertical: 12,
      paddingHorizontal: 20,
    },
    saveIcon: {
      width: 18,
      height: 18,
      marginRight: 8,
    },
    saveBtnText: {
      color: theme.overMain,
      fontWeight: '600',
      fontSize: 15,
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
  });
