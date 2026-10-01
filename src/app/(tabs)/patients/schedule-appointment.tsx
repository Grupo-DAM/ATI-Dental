import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { NotificationToast } from '@/components/notification-toast';
import {
  DateField,
  DENTISTS,
  InputField,
  PatientInfo,
  PatientInfoCard,
  PatientRecordBreadcrumb,
  SectionHeader,
  SelectField,
} from '@/app/(tabs)/patients/register-treatment';
import { createScheduleAppointmentStyles } from '@/constants/styles/patients.style';
import { useTheme } from '@/hooks/use-theme';
import { getPatients } from '@/services/patient-service';
import {
  AppointmentConflictError,
  createAppointment,
  listAppointmentsOnDate,
} from '@/services/agenda-service';
import { AppointmentFormData, validateAppointmentForm } from '@/utils/appointment-validation';
import {
  findAppointmentConflict,
  parseAppointmentDateKey,
  parseAppointmentMinutes,
  parseDurationMinutes,
} from '@/utils/appointment-schedule';

const APPOINTMENT_TYPES = [
  'Consulta general',
  'Limpieza dental',
  'Control',
  'Urgencia',
  'Ortodoncia',
];

const DURATIONS = ['30 minutos', '45 minutos', '60 minutos', '90 minutos'];

function ageFromBirthDate(birthDate?: string): number {
  if (!birthDate) return 0;
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return 0;
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  const hadBirthday =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) years -= 1;
  return years >= 0 ? years : 0;
}

const EMPTY_PATIENT: PatientInfo = {
  id: '',
  name: '',
  cedula: '',
  gender: '',
  age: 0,
  phone: '',
  imageUrl: null,
};

const EMPTY_FORM: AppointmentFormData = {
  dentist: 'Dr. Smith',
  appointmentType: '',
  date: '',
  time: '09:30 AM',
  reason: '',
  duration: '45 minutos',
  notes: '',
  nextDate: '',
  nextTime: '09:30 AM',
};

export default function ScheduleAppointmentScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createScheduleAppointmentStyles(theme), [theme]);
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
    patientCedula?: string;
    patientGender?: string;
    patientAge?: string;
    patientPhone?: string;
    patientImageUrl?: string;
  }>();

  const patientLocked = Boolean(params.patientId);
  const lockedPatient: PatientInfo = {
    id: params.patientId || '',
    name: params.patientName || '',
    cedula: params.patientCedula || '',
    gender: params.patientGender || '',
    age: params.patientAge ? Number(params.patientAge) : 0,
    phone: params.patientPhone || '',
    imageUrl: params.patientImageUrl || null,
  };
  const [patientOptions, setPatientOptions] = useState<PatientInfo[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState(params.patientId || '');
  const patient = patientLocked
    ? lockedPatient
    : patientOptions.find((item) => item.id === selectedPatientId) || EMPTY_PATIENT;

  const [form, setForm] = useState<AppointmentFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  useEffect(() => {
    if (patientLocked) return undefined;
    let active = true;
    getPatients()
      .then((list) => {
        if (!active) return;
        setPatientOptions(list.map((item) => ({
          id: item.id,
          name: item.fullName,
          cedula: item.documentId || '',
          gender: item.gender || '',
          age: ageFromBirthDate(item.birthDate),
          phone: item.phone || '',
          imageUrl: item.photoUri || null,
        })));
      })
      .catch(() => {
        if (active) setPatientOptions([]);
      });
    return () => {
      active = false;
    };
  }, [patientLocked]);

  const updateForm = useCallback((field: keyof AppointmentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const fieldError = (key: string) => (errors[key] ? t(errors[key]) : undefined);

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSavePress = () => {
    const result = validateAppointmentForm(form, patient.id);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    const dateKey = parseAppointmentDateKey(form.date);
    const start = parseAppointmentMinutes(form.time);
    const durationMinutes = parseDurationMinutes(form.duration);
    if (!dateKey || start == null || durationMinutes <= 0) {
      setErrors({
        date: 'scheduleAppointment.errors.dateRequired',
        time: 'scheduleAppointment.errors.timeRequired',
      });
      return;
    }
    const conflict = findAppointmentConflict(
      {
        patientId: patient.id,
        patientName: patient.name,
        dentistName: form.dentist,
        date: dateKey,
        start,
        end: start + durationMinutes,
      },
      listAppointmentsOnDate(dateKey),
    );
    if (conflict) {
      const key = conflict.party === 'patient'
        ? 'scheduleAppointment.errors.conflictPatient'
        : 'scheduleAppointment.errors.conflictDentist';
      setErrors({ date: key, time: key });
      return;
    }
    setErrors({});
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const saved = await createAppointment({
        patientId: patient.id,
        patientName: patient.name,
        dentistName: form.dentist,
        appointmentType: form.appointmentType,
        date: form.date,
        time: form.time,
        duration: form.duration,
        reason: form.reason,
        notes: form.notes,
      });
      setShowConfirmModal(false);
      setToastConfig({
        visible: true,
        type: 'success',
        title: t('scheduleAppointment.toast.title'),
        message: t('scheduleAppointment.toast.message'),
      });
      setTimeout(() => {
        router.push({
          pathname: '/(tabs)/agenda' as any,
          params: { date: saved.date, refresh: String(Date.now()) },
        });
      }, 1500);
    } catch (error) {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      if (error instanceof AppointmentConflictError) {
        const key = error.party === 'patient'
          ? 'scheduleAppointment.errors.conflictPatient'
          : 'scheduleAppointment.errors.conflictDentist';
        setErrors({ date: key, time: key });
        return;
      }
      setToastConfig({
        visible: true,
        type: 'error',
        title: t('scheduleAppointment.toast.errorTitle'),
        message: t('scheduleAppointment.toast.errorMessage'),
      });
    }
  };

  const handleCancel = () => {
    if (patientLocked) {
      router.push({ pathname: '/(tabs)/patient-file' as any, params: { patientId: patient.id } });
      return;
    }
    router.push('/(tabs)/agenda' as any);
  };

  return (
    <View style={styles.container} testID="schedule-appointment-screen">
      <AppHeader />
      {patientLocked ? (
        <PatientRecordBreadcrumb
          patientId={patient.id}
          patientsLabel={t('scheduleAppointment.breadcrumb.patients')}
          recordLabel={t('scheduleAppointment.breadcrumb.patientRecord')}
          currentLabel={t('scheduleAppointment.breadcrumb.current')}
        />
      ) : null}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t('scheduleAppointment.title')}</Text>
            <Text style={styles.subtitle}>{t('scheduleAppointment.subtitle')}</Text>
          </View>

          {patient.name ? <PatientInfoCard patient={patient} t={t} /> : null}

          <View style={styles.card}>
            <SectionHeader icon="calendar-outline" title={t('scheduleAppointment.sections.details')} />
            <SelectField
              testID="appointment-patient"
              label={t('scheduleAppointment.fields.patient')}
              value={patient.name}
              placeholder={t('scheduleAppointment.placeholders.patient')}
              options={patientLocked ? [patient.name] : patientOptions.map((item) => item.name)}
              disabled={patientLocked}
              onSelect={(name) => {
                const match = patientOptions.find((item) => item.name === name);
                if (!match) return;
                setSelectedPatientId(match.id);
                clearError('patientId');
              }}
              error={fieldError('patientId')}
            />
            <SelectField
              testID="appointment-dentist"
              label={t('scheduleAppointment.fields.dentist')}
              value={form.dentist}
              placeholder={t('scheduleAppointment.placeholders.dentist')}
              options={DENTISTS}
              onSelect={(value) => updateForm('dentist', value)}
              error={fieldError('dentist')}
            />
            <SelectField
              testID="appointment-type"
              label={t('scheduleAppointment.fields.type')}
              value={form.appointmentType}
              placeholder={t('scheduleAppointment.placeholders.type')}
              options={APPOINTMENT_TYPES}
              onSelect={(value) => updateForm('appointmentType', value)}
              error={fieldError('appointmentType')}
            />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DateField
                  testID="appointment-date"
                  label={t('scheduleAppointment.fields.date')}
                  value={form.date}
                  onChangeText={(value) => updateForm('date', value)}
                  placeholder="dd/mm/yyyy"
                  error={fieldError('date')}
                />
              </View>
              <View style={styles.fieldHalf}>
                <DateField
                  testID="appointment-time"
                  label={t('scheduleAppointment.fields.time')}
                  value={form.time}
                  onChangeText={(value) => updateForm('time', value)}
                  placeholder="09:30 AM"
                  iconName="time-outline"
                  error={fieldError('time')}
                />
              </View>
            </View>
            <InputField
              testID="appointment-reason"
              label={t('scheduleAppointment.fields.reason')}
              value={form.reason}
              onChangeText={(value) => updateForm('reason', value)}
              placeholder={t('scheduleAppointment.placeholders.reason')}
              error={fieldError('reason')}
            />
            <SelectField
              testID="appointment-duration"
              label={t('scheduleAppointment.fields.duration')}
              value={form.duration}
              placeholder={t('scheduleAppointment.placeholders.duration')}
              options={DURATIONS}
              onSelect={(value) => updateForm('duration', value)}
              error={fieldError('duration')}
            />
            <View style={styles.outlineWrap}>
              <TouchableOpacity
                testID="update-odontogram-btn"
                style={styles.outlineButton}
                activeOpacity={0.7}
                onPress={() => Alert.alert(t('scheduleAppointment.odontogramTitle'), t('scheduleAppointment.odontogramMessage'))}
              >
                <Ionicons name="refresh-outline" size={18} color={theme.main} />
                <Text style={styles.outlineButtonText}>{t('scheduleAppointment.updateOdontogram')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <SectionHeader icon="document-text-outline" title={t('scheduleAppointment.sections.notes')} />
            <InputField
              testID="appointment-notes"
              label=""
              value={form.notes}
              onChangeText={(value) => updateForm('notes', value)}
              placeholder={t('scheduleAppointment.placeholders.notes')}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.card}>
            <SectionHeader icon="calendar-number-outline" title={t('scheduleAppointment.sections.next')} />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <DateField
                  testID="next-appointment-date"
                  label={t('scheduleAppointment.fields.date')}
                  value={form.nextDate}
                  onChangeText={(value) => updateForm('nextDate', value)}
                  placeholder="dd/mm/yyyy"
                />
              </View>
              <View style={styles.fieldHalf}>
                <DateField
                  testID="next-appointment-time"
                  label={t('scheduleAppointment.fields.time')}
                  value={form.nextTime}
                  onChangeText={(value) => updateForm('nextTime', value)}
                  placeholder="09:30 AM"
                  iconName="time-outline"
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              testID="cancel-appointment-btn"
              style={[styles.btn, styles.btnCancel]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>{t('scheduleAppointment.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="save-appointment-btn"
              style={[styles.btn, styles.btnSave, isSubmitting && styles.btnSaveSubmitting]}
              onPress={handleSavePress}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.overMain} style={styles.btnSaveIcon} />
              <Text style={styles.btnSaveText}>{t('scheduleAppointment.save')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmationModal
        visible={showConfirmModal}
        title={t('scheduleAppointment.modal.title')}
        message={t('scheduleAppointment.modal.message')}
        confirmText={t('scheduleAppointment.modal.confirm')}
        cancelText={t('scheduleAppointment.modal.cancel')}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
        isSubmitting={isSubmitting}
      />
      <NotificationToast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        onDismiss={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}
