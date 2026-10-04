import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { auth, firestore } from '@/config/firebase';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Image } from 'expo-image';
import { VerificationLinkModal } from '@/components/OTPModal';
import { PageTitleLayout } from '@/components/page-title-layout';
import { PersonalDataSection, SectionCard } from '@/components/form';
import { BirthDatePicker, formatBirthDate } from '@/components/ui/birth-date-picker';
import { FormSelectField } from '@/components/ui/form-field';
import { ModalOptionList } from '@/components/ui/modal-option-list';
import { isSystemDatePickerAvailable } from '@/components/ui/system-date-picker';
import { getPatientGenderLabelKey, isPatientGender, PATIENT_GENDER_VALUES } from '@/constants/patient';
import { parseFlexibleTimestamp } from '@/components/reports/utils/reports-utils';
import { useTheme } from '@/hooks/use-theme';
import { createStyles } from '@/constants/styles/profile.styles';
import { COUNTRIES } from '@/constants/countries';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  const [country, setCountry] = useState('');
  const [originalCountry, setOriginalCountry] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);

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

  const countryOptions = useMemo(
    () =>
      COUNTRIES.map((c) => ({
        name: c.code,
        label: `${c.flag} ${c.name}`,
        testID: `profile-country-option-${c.code}`,
      })),
    [],
  );

  const countryLabel = country
    ? (() => {
        const c = COUNTRIES.find((c) => c.code === country);
        return c ? `${c.flag} ${c.name}` : country;
      })()
    : t('profile.countryPlaceholder');

  const persistProfileFields = async (uid: string) => {
    try {
      const db = firestore();
      const userRef = db.collection('usuarios').doc(uid);
      const metricsRef = db.collection('metricas_geograficas').doc('actual');

      await db.runTransaction(async (transaction) => {
        const metricsDoc = await transaction.get(metricsRef);
        
        let metricsData: any = {};
        if (metricsDoc.exists) {
          metricsData = typeof metricsDoc.data === 'function' ? metricsDoc.data() : metricsDoc.data;
        }

        let countriesData = metricsData?.countries || {};
        let totalUsers = metricsData?.totalUsers || 0;

        if (country !== originalCountry) {
          if (originalCountry) {
            countriesData[originalCountry] = Math.max(0, (countriesData[originalCountry] || 0) - 1);
          } else {
            totalUsers += 1;
          }
          if (country) {
            countriesData[country] = (countriesData[country] || 0) + 1;
          } else if (originalCountry) {
             totalUsers = Math.max(0, totalUsers - 1);
          }
        }

        if (country !== originalCountry) {
          transaction.set(metricsRef, {
            totalUsers,
            countries: countriesData,
            actualizadoEn: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }

        transaction.update(userRef, {
          idiomaPreferencia: language,
          nombre: `${name.trim()} ${lastName.trim()}`,
          genero: gender || null,
          fechaNacimiento: birthDate ? birthDateObj : null,
          pais: country || null,
        });
      });

      setOriginalCountry(country);
    } catch (error) {
      console.error('Error al sincronizar perfil y métricas en Firestore', error);
      throw error;
    }
  };

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
          if (typeof data.pais === 'string') {
            setCountry(data.pais);
            setOriginalCountry(data.pais);
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
    <PageTitleLayout
      titleKey='profile.title'
      subtitleKey='profile.subtitle'
      parentBreadcrumbKey='tabs.explore'
      currentBreadcrumbKey='profile.title'
      modals = {
        <>
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

          <ModalOptionList
            visible={countryModalVisible}
            onRequestClose={() => setCountryModalVisible(false)}
            title={t('profile.country')}
            options={countryOptions}
            selectedOption={country}
            onSelectOption={setCountry}
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
        </>
      }
    >
      <PersonalDataSection
        type="profile"
        name={name}
        onChangeName={(val) => {
          setName(val);
          if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
        }}
        nameError={errors.name}
        lastName={lastName}
        onChangeLastName={(val) => {
          setLastName(val);
          if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: undefined }));
        }}
        lastNameError={errors.lastName}
        birthDate={birthDate}
        onOpenDatePicker={handleOpenDatePicker}
        gender={gender}
        genderLabel={genderLabel}
        onOpenGenderModal={() => setGenderModalVisible(true)}
        country={country}
        countryLabel={countryLabel}
        onOpenCountryModal={() => setCountryModalVisible(true)}
        email={email}
        onChangeEmail={(val) => {
          setEmail(val);
          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        emailError={errors.email}
        phone={phone}
        onChangePhone={setPhone}
        bio={bio}
        onChangeBio={setBio}
      />

      <SectionCard
        title={t('profile.interfaceLanguage')}
        icon={
          <Image
            source={require('@/assets/expo.icon/Assets/language.svg')}
            style={styles.languageIcon}
            contentFit="contain"
            tintColor={theme.main}
          />
        }
        cardSpacing
      >
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
      </SectionCard>

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
    </PageTitleLayout>
  );
}
