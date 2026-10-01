import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';

import { AppHeader } from '@/components/app-header';
import { createTreatment, getTreatmentById, updateTreatment, PendingExam } from '@/services/treatment-service';
import { validateTreatmentForm, ValidationErrors } from '@/utils/treatment-validation';
import { NotificationToast } from '@/components/notification-toast';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { 
  createRegisterTreatmentStyles, 
  createInputStyles, 
  createBreadCrumbStyle, 
  createPatientCardStyles,
  createSectionStyles,
} from '@/constants/styles/patients.style';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TreatmentForm {
  category: string;
  treatmentName: string;
  dentalPiece: string;
  treatmentDate: string;
  responsibleDentist: string;
  status: string;
  notes: string;
  estimatedCost: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  cedula: string;
  gender: string;
  age: number;
  phone: string;
  imageUrl: string | null;
}

// ─── Mock / Default Data ──────────────────────────────────────────────────────
const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

export const DEFAULT_PATIENT: PatientInfo = {
  id: 'patient-mariana-lopez-123',
  name: 'Mariana López Rivera',
  cedula: 'V-12.345.678',
  gender: 'Mujer',
  age: 32,
  phone: '+58 422 321 98 74',
  imageUrl: null,
};

export const CATEGORIES = [
  'Odontología General',
  'Ortodoncia',
  'Endodoncia',
  'Periodoncia',
  'Cirugía Oral',
  'Prótesis Dental',
  'Implantología',
  'Odontopediatría',
];

export const DENTAL_PIECES = [
  'Toda la boca',
  'Pieza 11', 'Pieza 12', 'Pieza 13', 'Pieza 14', 'Pieza 15',
  'Pieza 21', 'Pieza 22', 'Pieza 23', 'Pieza 24', 'Pieza 25',
  'Pieza 31', 'Pieza 32', 'Pieza 33', 'Pieza 34', 'Pieza 35',
  'Pieza 41', 'Pieza 42', 'Pieza 43', 'Pieza 44', 'Pieza 45',
];

export const DENTISTS = [
  'Dr. Smith',
  'Dra. García',
  'Dr. Martínez',
  'Dra. López',
];

export const STATUSES = [
  'Completado',
  'En Progreso',
  'Pendiente',
  'Cancelado',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Three-level breadcrumb: Pacientes > Ficha del paciente > pantalla actual */
export function PatientRecordBreadcrumb({
  patientsLabel,
  recordLabel,
  currentLabel,
  patientId,
}: Readonly<{
  patientsLabel: string;
  recordLabel: string;
  currentLabel: string;
  patientId: string;
}>) {
  const theme = useTheme();
  const breadcrumbStyles = useMemo(() => createBreadCrumbStyle(theme), [theme]);
  return (
    <View style={breadcrumbStyles.container}>
      <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.7}>
        <Text style={breadcrumbStyles.parentText}>{patientsLabel}</Text>
      </TouchableOpacity>
      <Text style={breadcrumbStyles.chevron}>   ›   </Text>
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/(tabs)/patient-file' as any, params: { patientId } })}
        activeOpacity={0.7}
      >
        <Text style={breadcrumbStyles.parentText}>{recordLabel}</Text>
      </TouchableOpacity>
      <Text style={breadcrumbStyles.chevron}>   ›   </Text>
      <Text style={breadcrumbStyles.currentText}>{currentLabel}</Text>
    </View>
  );
}

/** Patient info card with gradient-style background */
export function PatientInfoCard({ patient, t }: Readonly<{ patient: PatientInfo; t: (k: string) => string }>) {
  const theme = useTheme();
  const patientCardStyles = useMemo(() => createPatientCardStyles(theme), [theme]);
 
  return (
    <View style={patientCardStyles.card} testID="patient-info-card">
      <Image
        source={patient.imageUrl ? { uri: patient.imageUrl } : avatarFallback}
        style={patientCardStyles.avatar}
        contentFit="cover"
      />
      <View style={patientCardStyles.info}>
        <Text style={patientCardStyles.name}>{patient.name}</Text>
        <Text style={patientCardStyles.details}>
          {patient.cedula}  •  {patient.gender}  •  {patient.age} {t('registerTreatment.years')}
        </Text>
        <View style={patientCardStyles.phoneRow}>
          <Ionicons name="call" size={14} color={theme.overMain} style={patientCardStyles.phoneIcon} />
          <Text style={patientCardStyles.phone}>{patient.phone}</Text>
        </View>
      </View>
    </View>
  );
}

/** Section header with icon */
export function SectionHeader({ icon, title }: Readonly<{ icon: keyof typeof Ionicons.glyphMap; title: string }>) {
  const theme = useTheme();
  const sectionStyles = useMemo(() => createSectionStyles(theme), [theme]);
  return (
    <View style={sectionStyles.header}>
      <Ionicons name={icon} size={20} color={theme.main} />
      <Text style={sectionStyles.title}>{title}</Text>
    </View>
  );
}

/** Dropdown select field */
export function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  error,
  testID,
  disabled = false,
}: Readonly<{
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: string;
  testID?: string;
  disabled?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const inputStyles = useMemo(() => createInputStyles(theme), [theme]);
  let iconName: 'lock-closed' | 'chevron-up' | 'chevron-down' = 'chevron-down';
  if (disabled) {
    iconName = 'lock-closed';
  } else if (open) {
    iconName = 'chevron-up';
  }

  return (
    <View style={inputStyles.fieldGroup}>
      <Text style={inputStyles.label}>{label}</Text>
      <TouchableOpacity
        testID={testID}
        style={[
          inputStyles.selectTrigger,
          disabled ? inputStyles.lockedTrigger : null,
          error ? inputStyles.errorBorder : null,
        ]}
        onPress={() => {
          if (!disabled) setOpen(!open);
        }}
        disabled={disabled}
        accessibilityState={{ disabled }}
        activeOpacity={0.7}
      >
        <Text style={[inputStyles.selectText, !value && inputStyles.placeholder]}>
          {value || placeholder}
        </Text>
        <Ionicons
          name={iconName}
          size={18}
          color={theme.pageSubtitle}
        />
      </TouchableOpacity>
      {error ? (
        <Text style={inputStyles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      ) : null}
      {open && (
        <View style={inputStyles.optionsList}>
          <ScrollView nestedScrollEnabled style={inputStyles.scrollView}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  inputStyles.optionItem,
                  value === opt && inputStyles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text
                  style={[
                    inputStyles.optionText,
                    value === opt && inputStyles.optionTextSelected,
                  ]}
                >
                  {opt}
                </Text>
                {value === opt && (
                  <Ionicons name="checkmark" size={16} color={theme.main} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/** Text input field */
export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  prefix,
  error,
  testID,
}: Readonly<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
  multiline?: boolean;
  numberOfLines?: number;
  prefix?: string;
  error?: string;
  testID?: string;
}>) {
  const theme = useTheme();
  const inputStyles = useMemo(() => createInputStyles(theme), [theme]);

  return (
    <View style={inputStyles.fieldGroup}>
      {label ? <Text style={inputStyles.label}>{label}</Text> : null}
      <View style={[
        inputStyles.inputContainer,
        multiline ? inputStyles.multilineContainer : null,
        error ? inputStyles.errorBorder : null,
      ]}>
        {prefix && <Text style={inputStyles.prefix}>{prefix}</Text>}
        <TextInput
          testID={testID}
          style={[
            inputStyles.input,
            multiline && inputStyles.multiLine,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholderColor}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
      </View>
      {error ? (
        <Text style={inputStyles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Date input field with calendar icon */
export function DateField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  testID,
  iconName = 'calendar-outline',
}: Readonly<{
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  testID?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}>) {
  const theme = useTheme();
  const inputStyles = useMemo(() => createInputStyles(theme), [theme]);
  return (
    <View style={inputStyles.fieldGroup}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[
        inputStyles.inputContainer,
        error ? inputStyles.errorBorder : null,
      ]}>
        <TextInput
          testID={testID}
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.placeholderColor}
        />
        <Ionicons name={iconName} size={20} color={theme.pageSubtitle} style={inputStyles.icon} />
      </View>
      {error ? (
        <Text style={inputStyles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RegisterTreatmentScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createRegisterTreatmentStyles(theme), [theme]);
  const params = useLocalSearchParams<{
    patientId?: string;
    patientName?: string;
    patientCedula?: string;
    patientGender?: string;
    patientAge?: string;
    patientPhone?: string;
    patientImageUrl?: string;
    treatmentId?: string;
  }>();

  // Dynamic or fallback patient
  const patient: PatientInfo = {
    id: params.patientId || DEFAULT_PATIENT.id,
    name: params.patientName || DEFAULT_PATIENT.name,
    cedula: params.patientCedula || DEFAULT_PATIENT.cedula,
    gender: params.patientGender || DEFAULT_PATIENT.gender,
    age: params.patientAge ? Number(params.patientAge) : DEFAULT_PATIENT.age,
    phone: params.patientPhone || DEFAULT_PATIENT.phone,
    imageUrl: params.patientImageUrl || DEFAULT_PATIENT.imageUrl,
  };

  // Form state
  const [form, setForm] = useState<TreatmentForm>({
    category: '',
    treatmentName: '',
    dentalPiece: '',
    treatmentDate: '',
    responsibleDentist: '',
    status: '',
    notes: '',
    estimatedCost: '',
  });

  const [isLoading, setIsLoading] = useState(!!params.treatmentId);

  useEffect(() => {
    async function loadTreatment() {
      if (!params.treatmentId) return;
      try {
        const tr = await getTreatmentById(params.treatmentId);
        if (tr) {
          setForm({
            category: tr.category,
            treatmentName: tr.treatmentName,
            dentalPiece: tr.dentalPiece || '',
            treatmentDate: tr.treatmentDate,
            responsibleDentist: tr.responsibleDentist,
            status: tr.status,
            notes: tr.notes || '',
            estimatedCost: tr.estimatedCost.toString(),
          });
          setPendingExams(tr.pendingExams || []);
        }
      } catch (err) {
        console.error('Failed to load treatment', err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadTreatment();
  }, [params.treatmentId]);

  // Validation errors & submitting guard
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pending exams
  const [pendingExams, setPendingExams] = useState<PendingExam[]>([]);
  const [newExamName, setNewExamName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [examError, setExamError] = useState('');

  // Modal & notification toast
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastConfig, setToastConfig] = useState<{
    visible: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });

  const updateForm = useCallback((field: keyof TreatmentForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (prev[field]) {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      }
      return prev;
    });
  }, []);

  const handleAddExam = useCallback(() => {
    if (!newExamName.trim()) {
      setExamError(t('registerTreatment.errors.examNameRequired'));
      return;
    }
    const exam: PendingExam = {
      id: Date.now().toString(),
      name: newExamName.trim(),
      date: newExamDate.trim(),
    };
    setPendingExams((prev) => [...prev, exam]);
    setNewExamName('');
    setNewExamDate('');
    setExamError('');
  }, [newExamName, newExamDate, t]);

  const handleRemoveExam = useCallback((id: string) => {
    setPendingExams((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleSavePress = () => {
    const result = validateTreatmentForm(form, patient.id);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const treatmentData = {
        patientId: patient.id,
        patientName: patient.name,
        category: form.category,
        treatmentName: form.treatmentName.trim(),
        dentalPiece: form.dentalPiece?.trim() || 'Toda la boca',
        treatmentDate: form.treatmentDate.trim(),
        responsibleDentist: form.responsibleDentist.trim(),
        status: form.status.trim(),
        notes: form.notes?.trim() || '',
        estimatedCost: Number(form.estimatedCost),
        pendingExams,
      };

      if (params.treatmentId) {
        await updateTreatment(params.treatmentId, treatmentData);
      } else {
        await createTreatment(treatmentData);
      }

      setShowConfirmModal(false);
      setToastConfig({
        visible: true,
        type: 'success',
        title: t('registerTreatment.toast.title'),
        message: t('registerTreatment.toast.message'),
      });
      
      // Regresar a la ficha del paciente después de un momento para que se vea el toast
      setTimeout(() => {
        router.push({ pathname: '/(tabs)/patient-file' as any, params: { patientId: patient.id } });
      }, 1500);
    } catch (err: any) {
      console.error('[RegisterTreatment] Error saving treatment:', err);
      // In case of network or Firestore error, preserve form data and permit retry
      setShowConfirmModal(false);
      const detail = err?.message || err?.code || '';
      setToastConfig({
        visible: true,
        type: 'error',
        title: t('registerTreatment.toast.errorTitle'),
        message: detail ? `${t('registerTreatment.toast.errorMessage')} (${detail})` : t('registerTreatment.toast.errorMessage'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push({ pathname: '/(tabs)/patient-file' as any, params: { patientId: patient.id } });
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.main} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      <PatientRecordBreadcrumb
        patientId={patient.id}
        patientsLabel={t('registerTreatment.breadcrumb.patients')}
        recordLabel={t('registerTreatment.breadcrumb.patientRecord')}
        currentLabel={t('registerTreatment.breadcrumb.treatment')}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>{t('registerTreatment.title')}</Text>
            <Text style={styles.subtitle}>{t('registerTreatment.subtitle')}</Text>
          </View>

          {/* Patient Info Card */}
          <PatientInfoCard patient={patient} t={t} />

          {/* ── Section 1: Detalles del Tratamiento ── */}
          <View style={styles.card}>
            <SectionHeader
              icon="add-circle-outline"
              title={t('registerTreatment.sections.treatmentDetails')}
            />

            <SelectField
              testID="category-select"
              label={t('registerTreatment.fields.category')}
              value={form.category}
              placeholder={t('registerTreatment.placeholders.category')}
              options={CATEGORIES}
              onSelect={(val) => updateForm('category', val)}
              error={errors.category ? t(`registerTreatment.${errors.category}`) : undefined}
            />

            <InputField
              testID="treatment-name-input"
              label={t('registerTreatment.fields.treatmentName')}
              value={form.treatmentName}
              onChangeText={(val) => updateForm('treatmentName', val)}
              placeholder={t('registerTreatment.placeholders.treatmentName')}
              error={errors.treatmentName ? t(`registerTreatment.${errors.treatmentName}`) : undefined}
            />

            <SelectField
              testID="dental-piece-select"
              label={t('registerTreatment.fields.dentalPiece')}
              value={form.dentalPiece}
              placeholder={t('registerTreatment.placeholders.dentalPiece')}
              options={DENTAL_PIECES}
              onSelect={(val) => updateForm('dentalPiece', val)}
            />
          </View>

          {/* ── Section 2: Exámenes pendientes ── */}
          <View style={styles.card}>
            <SectionHeader
              icon="flask-outline"
              title={t('registerTreatment.sections.pendingExams')}
            />

            {/* List of added exams */}
            {pendingExams.map((exam) => (
              <View key={exam.id} style={styles.examItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.examName}>{exam.name}</Text>
                  {exam.date ? (
                    <Text style={styles.examDate}>{exam.date}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  testID={`remove-exam-${exam.id}`}
                  onPress={() => handleRemoveExam(exam.id)}
                >
                  <Ionicons name="close-circle" size={20} color={theme.alert} />
                </TouchableOpacity>
              </View>
            ))}

            <InputField
              testID="exam-name-input"
              label={t('registerTreatment.fields.examName')}
              value={newExamName}
              onChangeText={(val) => {
                setNewExamName(val);
                if (examError) setExamError('');
              }}
              placeholder={t('registerTreatment.placeholders.examName')}
              error={examError}
            />

            <DateField
              testID="exam-date-input"
              label={t('registerTreatment.fields.date')}
              value={newExamDate}
              onChangeText={setNewExamDate}
              placeholder="dd/mm/yyyy"
            />

            <View style={styles.addBtnContainer}>
              <TouchableOpacity
                testID="add-exam-btn"
                style={styles.addBtn}
                onPress={handleAddExam}
                activeOpacity={0.7}
              >
                <Text style={styles.addBtnText}>{t('registerTreatment.addExam')}</Text>
                <Ionicons name="add" size={16} color={theme.overMain} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Section 3: Información Clínica ── */}
          <View style={styles.card}>
            <SectionHeader
              icon="document-text-outline"
              title={t('registerTreatment.sections.clinicalInfo')}
            />

            <DateField
              testID="treatment-date-input"
              label={t('registerTreatment.fields.treatmentDate')}
              value={form.treatmentDate}
              onChangeText={(val) => updateForm('treatmentDate', val)}
              placeholder="dd/mm/yyyy"
              error={errors.treatmentDate ? t(`registerTreatment.${errors.treatmentDate}`) : undefined}
            />

            <SelectField
              testID="dentist-select"
              label={t('registerTreatment.fields.responsibleDentist')}
              value={form.responsibleDentist}
              placeholder={t('registerTreatment.placeholders.responsibleDentist')}
              options={DENTISTS}
              onSelect={(val) => updateForm('responsibleDentist', val)}
              error={errors.responsibleDentist ? t(`registerTreatment.${errors.responsibleDentist}`) : undefined}
            />

            <SelectField
              testID="status-select"
              label={t('registerTreatment.fields.status')}
              value={form.status}
              placeholder={t('registerTreatment.placeholders.status')}
              options={STATUSES}
              onSelect={(val) => updateForm('status', val)}
              error={errors.status ? t(`registerTreatment.${errors.status}`) : undefined}
            />
          </View>

          {/* ── Section 4: Observaciones y Costo ── */}
          <View style={styles.card}>
            <SectionHeader
              icon="chatbox-ellipses-outline"
              title={t('registerTreatment.sections.observationsAndCost')}
            />

            <InputField
              testID="treatment-notes-input"
              label={t('registerTreatment.fields.notes')}
              value={form.notes}
              onChangeText={(val) => updateForm('notes', val)}
              placeholder={t('registerTreatment.placeholders.notes')}
              multiline
              numberOfLines={4}
            />

            <InputField
              testID="estimated-cost-input"
              label={t('registerTreatment.fields.estimatedCost')}
              value={form.estimatedCost}
              onChangeText={(val) => updateForm('estimatedCost', val)}
              placeholder="0.00"
              keyboardType="decimal-pad"
              prefix="$"
              error={errors.estimatedCost ? t(`registerTreatment.${errors.estimatedCost}`) : undefined}
            />
          </View>

          {/* ── Action Buttons ── */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              testID="cancel-treatment-btn"
              style={[styles.btn, styles.btnCancel]}
              onPress={handleCancel}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <Text style={styles.btnCancelText}>{t('registerTreatment.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="save-treatment-btn"
              style={[styles.btn, styles.btnSave, isSubmitting && styles.btnSaveSubmitting]}
              onPress={handleSavePress}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={theme.overMain} style={styles.btnSaveIcon} />
              ) : (
                <Ionicons name="save-outline" size={18} color="white" style={styles.btnSaveIcon} />
              )}
              <Text style={styles.btnSaveText}>
                {isSubmitting ? t('registerTreatment.saving') : t('registerTreatment.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title={t('registerTreatment.modal.title')}
        message={t('registerTreatment.modal.message')}
        confirmText={t('registerTreatment.modal.confirm')}
        cancelText={t('registerTreatment.modal.cancel')}
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirmModal(false)}
        isSubmitting={isSubmitting}
      />

      {/* Notification Toast (Success or Error) */}
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