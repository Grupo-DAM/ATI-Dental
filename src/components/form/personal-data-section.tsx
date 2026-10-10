import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleProp, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

import { SectionCard } from './section-card';
import { FormSelectField, FormTextField } from '@/components/ui/form-field';
import { createPersonalDataStyles } from '@/constants/styles/global.styles';
import { useTheme } from '@/hooks/use-theme';
import { DocumentInput } from '@/components/ui/document-input';
import { DocumentType } from '@/constants/patient';

const DEFAULT_AVATAR = require('@/assets/expo.icon/Assets/avatar.png');

export type PersonalDataFormType = 'patient' | 'profile' | 'admin-user';

export interface PhotoLabels {
  label?: string;
  change?: string;
  remove?: string;
  help?: string;
}

export interface PersonalDataSectionProps {
  /** Mode defining which fields are rendered */
  type: PersonalDataFormType;
  /** Custom section title (defaults according to type) */
  title?: string;
  /** Custom section icon (defaults to person icon) */
  icon?: React.ReactNode;
  /** Whether to add top spacing */
  cardSpacing?: boolean;
  /** Optional container style */
  style?: StyleProp<ViewStyle>;
  /** Optional testID */
  testID?: string;

  // --- Photo Section ---
  photoUri?: string | null;
  onPickPhoto?: () => void;
  onRemovePhoto?: () => void;
  photoLabels?: PhotoLabels;
  avatarFallback?: any;

  // --- Common Fields ---
  birthDate: string;
  onOpenDatePicker: () => void;
  gender: string;
  genderLabel: string;
  onOpenGenderModal: () => void;
  email: string;
  onChangeEmail: (value: string) => void;
  emailError?: string;
  phone: string;
  onChangePhone: (value: string) => void;

  // --- Patient Specific Fields (type === 'patient') ---
  fullName?: string;
  onChangeFullName?: (value: string) => void;
  fullNameError?: string;
  documentId?: string;
  onChangeDocumentId?: (value: string) => void;
  documentType?: DocumentType | '';
  onChangeDocumentType?: (type: DocumentType) => void;
  documentNumber?: string;
  onChangeDocumentNumber?: (value: string) => void;
  documentError?: string;
  address?: string;
  onChangeAddress?: (value: string) => void;

  // --- Profile / Admin Specific Fields (type === 'profile' || type === 'admin-user') ---
  name?: string;
  onChangeName?: (value: string) => void;
  nameError?: string;
  lastName?: string;
  onChangeLastName?: (value: string) => void;
  lastNameError?: string;
  country?: string;
  countryLabel?: string;
  onOpenCountryModal?: () => void;
  bio?: string;
  onChangeBio?: (value: string) => void;

  // --- Admin Specific Fields (type === 'admin-user') ---
  role?: string;
  roleLabel?: string;
  onOpenRoleModal?: () => void;
  userStatus?: string | boolean;
  userStatusLabel?: string;
  onOpenStatusModal?: () => void;
}

export function PersonalDataSection({
  type,
  title,
  icon,
  cardSpacing = false,
  style,
  testID,

  photoUri,
  onPickPhoto,
  onRemovePhoto,
  photoLabels,
  avatarFallback = DEFAULT_AVATAR,

  birthDate,
  onOpenDatePicker,
  gender,
  genderLabel,
  onOpenGenderModal,
  email,
  onChangeEmail,
  emailError,
  phone,
  onChangePhone,

  fullName = '',
  onChangeFullName,
  fullNameError,
  documentId = '',
  onChangeDocumentId,
  documentType = '',
  onChangeDocumentType,
  documentNumber = '',
  onChangeDocumentNumber,
  documentError,
  address = '',
  onChangeAddress,

  name = '',
  onChangeName,
  nameError,
  lastName = '',
  onChangeLastName,
  lastNameError,
  country = '',
  countryLabel,
  onOpenCountryModal,
  bio = '',
  onChangeBio,

  role = '',
  roleLabel,
  onOpenRoleModal,
  userStatus,
  userStatusLabel,
  onOpenStatusModal,
}: Readonly<PersonalDataSectionProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createPersonalDataStyles(theme), [theme]);

  const defaultTitle = useMemo(() => {
    if (title) return title;
    if (type === 'patient') return t('registerPatient.personalData');
    if (type === 'profile') return t('profile.personalInfo');
    return t('admin-users.title') || 'Datos del Usuario';
  }, [title, type, t]);

  const resolvedPhotoLabels = useMemo(() => {
    const isPatient = type === 'patient';
    return {
      label: photoLabels?.label ?? (isPatient ? t('registerPatient.profilePicture') : t('profile.profilePicture')),
      change: photoLabels?.change ?? (isPatient ? t('registerPatient.changePhoto') : t('profile.change')),
      remove: photoLabels?.remove ?? (isPatient ? t('registerPatient.removePhoto') : t('profile.remove')),
      help: photoLabels?.help ?? (isPatient ? t('registerPatient.photoHelp') : t('profile.avatarHelp')),
    };
  }, [photoLabels, type, t]);

  const resolvedUserStatusLabel = useMemo(() => {
    if (userStatusLabel) return userStatusLabel;
    if (typeof userStatus === 'string') return userStatus;
    if (userStatus) return t('admin-users.activeStatus') || 'Activo';
    return t('admin-users.inactiveStatus') || 'Inactivo';
  }, [userStatusLabel, userStatus, t]);

  const sectionIcon = icon ?? <Ionicons name="person" size={24} color={theme.main} />;

  return (
    <SectionCard
      title={defaultTitle}
      icon={sectionIcon}
      cardSpacing={cardSpacing}
      style={style}
      testID={testID}
    >
      {/* ─── Foto de Perfil ─────────────────────────────────────────────────── */}
      <View style={styles.avatarRow}>
        <Image
          source={photoUri ? { uri: photoUri } : avatarFallback}
          style={styles.avatar}
          contentFit="cover"
        />
        <View style={styles.avatarActions}>
          <Text style={styles.avatarLabel}>{resolvedPhotoLabels.label}</Text>
          <View style={styles.avatarButtonsRow}>
            <TouchableOpacity
              testID="btn-change-photo"
              activeOpacity={0.7}
              style={styles.btnChange}
              onPress={onPickPhoto}
            >
              <Text style={styles.btnChangeText}>{resolvedPhotoLabels.change}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-remove-photo"
              activeOpacity={0.7}
              onPress={onRemovePhoto}
              disabled={!photoUri}
            >
              <Text style={[styles.btnRemoveText, !photoUri && styles.btnRemoveDisabled]}>
                {resolvedPhotoLabels.remove}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHelpText}>{resolvedPhotoLabels.help}</Text>
        </View>
      </View>

      {/* ─── Campos Específicos: Paciente ────────────────────────────────────── */}
      {type === 'patient' && (
        <>
          <FormTextField
            testID="input-full-name"
            label={t('registerPatient.fullName')}
            required
            value={fullName}
            onChangeText={onChangeFullName}
            placeholder={t('registerPatient.fullNamePlaceholder')}
            errorMessage={fullNameError}
          />

          <DocumentInput
            testID="input-document"
            label={t('registerPatient.documentId')}
            documentType={documentType}
            documentNumber={documentNumber || documentId}
            onChangeType={onChangeDocumentType ?? (() => {})}
            onChangeNumber={(val) => {
              if (onChangeDocumentNumber) onChangeDocumentNumber(val);
              if (onChangeDocumentId) onChangeDocumentId(val);
            }}
            errorMessage={documentError}
          />
        </>
      )}

      {/* ─── Campos Específicos: Perfil y Admin ──────────────────────────────── */}
      {(type === 'profile' || type === 'admin-user') && (
        <>
          <FormTextField
            testID="input-name"
            label={t('profile.firstName')}
            value={name}
            onChangeText={onChangeName}
            placeholder={t('profile.firstName')}
            errorMessage={nameError}
          />

          <FormTextField
            testID="input-lastname"
            label={t('profile.lastName')}
            value={lastName}
            onChangeText={onChangeLastName}
            placeholder={t('profile.lastName')}
            errorMessage={lastNameError}
          />
        </>
      )}

      {/* ─── Campos Comunes: Fecha de Nacimiento y Género ────────────────────── */}
      <View style={styles.row}>
        <View style={styles.rowItemWide}>
          <FormSelectField
            testID="select-birth-date"
            label={type === 'patient' ? t('registerPatient.birthDate') : t('profile.birthDate')}
            valueLabel={birthDate || (type === 'patient' ? t('registerPatient.birthDatePlaceholder') : t('profile.birthDatePlaceholder'))}
            isPlaceholder={!birthDate}
            onPress={onOpenDatePicker}
            iconName="calendar-outline"
          />
        </View>
        <View style={styles.rowItem}>
          <FormSelectField
            testID="select-gender"
            label={type === 'patient' ? t('registerPatient.gender') : t('profile.gender')}
            valueLabel={genderLabel}
            isPlaceholder={!gender}
            onPress={onOpenGenderModal}
            iconName="chevron-down"
          />
        </View>
      </View>

      {/* ─── Campos Específicos: País (Perfil y Admin) ───────────────────────── */}
      {(type === 'profile' || type === 'admin-user') && (
        <View style={styles.row}>
          <View style={styles.rowItemWide}>
            <FormSelectField
              testID="select-country"
              label={t('profile.country')}
              valueLabel={countryLabel ?? t('profile.countryPlaceholder')}
              isPlaceholder={!country}
              onPress={onOpenCountryModal ?? (() => {})}
              iconName="chevron-down"
            />
          </View>
        </View>
      )}

      {/* ─── Campos Comunes: Teléfono y Correo Electrónico ───────────────────── */}
      <FormTextField
        testID="input-phone"
        label={type === 'patient' ? t('registerPatient.phone') : t('profile.phone')}
        value={phone}
        onChangeText={onChangePhone}
        placeholder={type === 'patient' ? t('registerPatient.phonePlaceholder') : ''}
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
        label={type === 'patient' ? t('registerPatient.email') : t('profile.email')}
        value={email}
        onChangeText={onChangeEmail}
        placeholder={type === 'patient' ? t('registerPatient.emailPlaceholder') : ''}
        keyboardType="email-address"
        autoCapitalize="none"
        errorMessage={emailError}
        leadingIcon={
          <Image
            source={require('@/assets/expo.icon/Assets/email.svg')}
            style={styles.emailIcon}
            contentFit="contain"
            tintColor={theme.placeholderColor}
          />
        }
      />

      {/* ─── Campos Específicos: Dirección (Paciente) ────────────────────────── */}
      {type === 'patient' && (
        <FormTextField
          testID="input-address"
          label={t('registerPatient.address')}
          value={address}
          onChangeText={onChangeAddress}
          placeholder={t('registerPatient.addressPlaceholder')}
        />
      )}

      {/* ─── Campos Específicos: Bio (Perfil y Admin) ────────────────────────── */}
      {(type === 'profile' || type === 'admin-user') && (
        <FormTextField
          testID="input-bio"
          label={t('profile.bio')}
          value={bio}
          onChangeText={onChangeBio}
          placeholder={t('profile.bioPlaceholder')}
          multiline
          textAlignVertical="top"
        />
      )}

      {/* ─── Campos Específicos: Rol y Estado (Admin-User) ──────────────────── */}
      {type === 'admin-user' && (
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormSelectField
              testID="select-user-role"
              label={t('admin-users.roleLabel') || 'Rol de usuario'}
              valueLabel={roleLabel || role || t('registerPatient.selectPlaceholder')}
              isPlaceholder={!role}
              onPress={onOpenRoleModal ?? (() => {})}
              iconName="chevron-down"
            />
          </View>
          <View style={styles.rowItem}>
            <FormSelectField
              testID="select-user-status"
              label={t('admin-users.statusLabel') || 'Estado del usuario'}
              valueLabel={resolvedUserStatusLabel}
              isPlaceholder={userStatus === undefined || userStatus === ''}
              onPress={onOpenStatusModal ?? (() => {})}
              iconName="chevron-down"
            />
          </View>
        </View>
      )}
    </SectionCard>
  );
}
