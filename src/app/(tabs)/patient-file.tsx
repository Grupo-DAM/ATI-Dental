import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AccessDeniedView } from '@/components/access-denied-view';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { getPatientById, getPatientByEmail, Patient } from '@/services/patient-service';
import { getStoredPatientVisitDates } from '@/services/clinical-record-service';
import { formatVisitDay } from '@/utils/patient-visits';
import { getTreatmentsByPatientId, deleteTreatment, Treatment } from '@/services/treatment-service';
import { NotificationToast } from '@/components/notification-toast';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { calculateAge, parseDateRobustly } from '@/utils/date-utils';
import { 
  createActionBarStyles, 
  createBadgeStyles, 
  createDetailStyles, 
  createPatientCardStyles, 
  createPatientFileSectionStyles, 
  createPatientFileStyles, 
  createTreatmentStyles,
  createTreatmentSectionStyles,
  createMedicalRowStyles,
  createExamStyles
} from '@/constants/styles/patients.style';

// ─── Constants ────────────────────────────────────────────────────────────────
const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

const ALLOWED_ROLES = new Set(['odontologo', 'admin', 'asistente', 'medico']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format an ISO date string to a readable locale date */
function formatDate(dateInput: any): string {
  if (!dateInput) return '—';
  if (typeof dateInput === 'string') return formatVisitDay(dateInput);
  try {
    const date = parseDateRobustly(dateInput);
    if (!date) return typeof dateInput === 'string' ? dateInput : '—';

    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return typeof dateInput === 'string' ? dateInput : '—';
  }
}

/** Format date strictly to "DD MMM YYYY" for treatments and exams */
function formatShortDate(dateInput: any, language: string = 'es'): string {
  if (!dateInput) return '—';
  try {
    const date = parseDateRobustly(dateInput);
    if (!date) return typeof dateInput === 'string' ? dateInput : '—';
    
    const monthsEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language.startsWith('en') ? monthsEn : monthsEs;
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return typeof dateInput === 'string' ? dateInput : '—';
  }
}

/** Format medical-history items for display */
function formatAntecedente(raw: string): string {
  return raw
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Return colour for treatment status badges */
function getStatusColor(status: string, theme: any): { bg: string; text: string } {
  const s = status.toLowerCase();
  if (s === 'completado') return { bg: theme.completeBg, text: theme.completeText };
  if (s === 'en progreso') return { bg: theme.inProgressBg, text: theme.inProgressText };
  if (s === 'pendiente') return { bg: theme.pendingBg, text: theme.pendingText };
  if (s === 'cancelado') return { bg: theme.canceledBg, text: theme.canceledText };
  if (s === 'preventivo') return { bg: theme.preventitiveBg, text: theme.preventitiveText };
  return { bg: theme.defaultBg, text: theme.defaultText };
}

/** Resolve the category badge colour */
function getCategoryColor(category: string, theme: any): { bg: string; text: string } {
  if (!category) return { bg: theme.defaultBg, text: theme.defaultText };
  return { bg: theme.categoryBg, text: theme.categoryText };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Action bar with edit, calendar and clinical history buttons */
function ActionBar({ onOpenClinicalHistory }: Readonly<{ onOpenClinicalHistory?: () => void }>) {
  const theme = useTheme();
  const actionBarStyles = useMemo(() => createActionBarStyles(theme), [theme]);
  const iconColor = theme.logo;

  return (
    <View style={actionBarStyles.container}>
      <View style={actionBarStyles.actions}>
        {onOpenClinicalHistory && (
          <TouchableOpacity
            style={[actionBarStyles.clinicalHistoryButton, { backgroundColor: theme.accentBackground }]}
            onPress={onOpenClinicalHistory}
            activeOpacity={0.7}
            testID="btn-open-clinical-history"
          >
            <Ionicons name="medical-outline" size={18} color={iconColor} />
            <Text style={[actionBarStyles.clinicalHistoryText, { color: iconColor }]}>Historia Clínica</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[actionBarStyles.iconButton, { backgroundColor: theme.accentBackground }]} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color={iconColor} />
        </TouchableOpacity>
        <TouchableOpacity style={[actionBarStyles.iconButton, { backgroundColor: theme.accentBackground }]} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={20} color={iconColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Patient info card with gradient-style background */
function PatientCard({ patient, t }: Readonly<{ patient: Patient; t: (k: string) => string }>) {
  const age = calculateAge(patient.birthDate);
  const gender = patient.gender || '—';
  const theme = useTheme();
  const patientCardStyles = useMemo(() => createPatientCardStyles(theme), [theme]);

  return (
    <View style={patientCardStyles.card} testID="patient-info-card">
      <Image
        source={patient.photoUri ? { uri: patient.photoUri } : avatarFallback}
        style={patientCardStyles.avatar}
        contentFit="cover"
      />
      <View style={patientCardStyles.info}>
        <Text style={patientCardStyles.name}>{patient.fullName}</Text>
        <Text style={patientCardStyles.details}>
          {patient.documentId}  •  {gender}  •  {age !== null ? `${age} ${t('patientFile.years')}` : '—'}
        </Text>
        <View style={patientCardStyles.phoneRow}>
          <Ionicons name="call" size={14} color={theme.overMain} style={patientCardStyles.phoneIcon} />
          <Text style={patientCardStyles.phone}>{patient.phone || '—'}</Text>
        </View>
      </View>
    </View>
  );
}

/** Appointment badge pills */
function AppointmentBadges({ patient, t }: Readonly<{ patient: Patient; t: (k: string) => string }>) {
  const theme = useTheme();
  const badgeStyles = useMemo(() => createBadgeStyles(theme), [theme]);
  const iconColor = theme.logo;

  return (
    <View style={badgeStyles.row}>
      <View style={[badgeStyles.badge, { backgroundColor: theme.backgroundElement, borderColor: theme.cardSeparator }]}>
        <Ionicons name="calendar-outline" size={16} color={iconColor} style={{ marginRight: 6 }} />
        <View>
          <Text style={[badgeStyles.badgeLabel, { color: theme.pageSubtitle }]}>{t('patientFile.nextAppointment')}</Text>
          <Text style={[badgeStyles.badgeValue, { color: theme.pageTitle }]}>
            {patient.nextAppointment ? formatDate(patient.nextAppointment) : '—'}
          </Text>
        </View>
      </View>
      <View style={[badgeStyles.badge, { backgroundColor: theme.backgroundElement, borderColor: theme.cardSeparator }]}>
        <Ionicons name="time-outline" size={16} color={iconColor} style={{ marginRight: 6 }} />
        <View>
          <Text style={[badgeStyles.badgeLabel, { color: theme.pageSubtitle }]}>{t('patientFile.lastVisit')}</Text>
          <Text style={[badgeStyles.badgeValue, { color: theme.pageTitle }]}>
            {patient.lastVisit ? formatDate(patient.lastVisit) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

/** Collapsible section */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: Readonly<{
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultOpen?: boolean;
}>) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const theme = useTheme();
  const sectionStyles = useMemo(() => createPatientFileSectionStyles(theme), [theme]);

  return (
    <View style={[sectionStyles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.cardSeparator }]}>
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.headerLeft}>
          <Ionicons name={icon} size={20} color={theme.logo} />
          <Text style={[sectionStyles.headerTitle, { color: theme.pageTitle }]}>{title}</Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.pageSubtitle}
        />
      </TouchableOpacity>
      {isOpen && <View style={sectionStyles.content}>{children}</View>}
    </View>
  );
}

/** Detail row inside a section */
function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  const theme = useTheme();
  const detailStyles = useMemo(() => createDetailStyles(theme), [theme]);

  return (
    <View style={[detailStyles.row, { borderBottomColor: theme.pageSeparator }]}>
      <Text style={[detailStyles.label, { color: theme.pageSubtitle }]}>{label}</Text>
      <Text style={[detailStyles.value, { color: theme.pageTitle }]}>{value || '—'}</Text>
    </View>
  );
}

/** Determine timeline icon styles based on treatment name */
function getTimelineIconProps(treatmentName: string, theme: any) {
  const name = (treatmentName || '').toLowerCase();
  if (name.includes('limpieza') || name.includes('profilaxis') || name.includes('preventivo')) {
    return { icon: 'beaker' as const, bg: theme.main, color: theme.overMain, borderColor: theme.main };
  }
  if (name.includes('obturación') || name.includes('resina') || name.includes('caries')) {
    return { icon: 'bandage' as const, bg: theme.backgroundElement, color: theme.main, borderColor: theme.main };
  }
  // Default to consultation style
  return { icon: 'clipboard' as const, bg: theme.backgroundElement, color: theme.breadcrumbSeparator, borderColor: theme.cardSeparator};
}

/** Single treatment card in the history list */
function TreatmentCard({ 
  treatment, 
  t,
  onModify,
  onDelete
}: Readonly<{ 
  treatment: Treatment; 
  t: (k: string) => string;
  onModify: (id: string) => void;
  onDelete: (id: string) => void;
}>) {
  const theme = useTheme(); 
  const treatmentStyles = useMemo(() => createTreatmentStyles(theme), [theme]);
  const statusColor = getStatusColor(treatment.status, theme);
  const categoryColor = getCategoryColor(treatment.category, theme);
  const iconProps = getTimelineIconProps(treatment.treatmentName, theme);

  return (
    <View style={treatmentStyles.card}>
      {/* Timeline dot and vertical line */}
      <View style={treatmentStyles.timelineColumn}>
        <View style={[
          treatmentStyles.iconDot, 
          { 
            backgroundColor: iconProps.bg, 
            borderColor: iconProps.borderColor
          }
        ]}>
          <Ionicons 
            name={iconProps.icon} 
            size={14} 
            color={iconProps.color} 
          />
        </View>
        <View style={[treatmentStyles.line, { backgroundColor: theme.cardSeparator }]} />
      </View>

      {/* Card content */}
      <View style={[treatmentStyles.content, { backgroundColor: theme.backgroundElement, borderColor: theme.cardSeparator }]}>
        {/* Date and badges */}
        <View style={treatmentStyles.dateRow}>
          <Text style={[treatmentStyles.date, { color: theme.logo}]}>{formatShortDate(treatment.treatmentDate)}</Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={[treatmentStyles.statusBadge, { backgroundColor: statusColor.bg }]}>
              <Text style={[treatmentStyles.statusText, { color: statusColor.text }]}>
                {treatment.status}
              </Text>
            </View>
            {treatment.category ? (
              <View style={[treatmentStyles.statusBadge, { backgroundColor: categoryColor.bg }]}>
                <Text style={[treatmentStyles.statusText, { color: categoryColor.text }]}>
                  {treatment.category}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Treatment name */}
        <Text style={[treatmentStyles.name, { color: theme.pageTitle }]}>{treatment.treatmentName}</Text>

        {/* Notes */}
        {treatment.notes ? (
          <Text style={[treatmentStyles.notes, { color: theme.pageSubtitle }]} numberOfLines={2}>{treatment.notes}</Text>
        ) : null}

        {/* Doctor, duration and dental piece */}
        <View style={treatmentStyles.metaRow}>
          <Ionicons name="person-outline" size={13} color={theme.pageSubtitle} />
          <Text style={[treatmentStyles.metaText, { color: theme.pageSubtitle }]}>{treatment.responsibleDentist}</Text>
          
          {treatment.dentalPiece ? (
            <>
              <Text style={[treatmentStyles.metaDot, { color: theme.cardSeparator }]}>  |  </Text>
              <Ionicons name="medkit-outline" size={13} color={theme.pageSubtitle} />
              <Text style={[treatmentStyles.metaText, { color: theme.pageSubtitle }]}>{treatment.dentalPiece}</Text>
            </>
          ) : null}

          {treatment.duration ? (
            <>
              <Text style={[treatmentStyles.metaDot, { color: theme.cardSeparator }]}>  |  </Text>
              <Ionicons name="time-outline" size={13} color={theme.pageSubtitle} />
              <Text style={[treatmentStyles.metaText, { color: theme.pageSubtitle }]}>{treatment.duration}</Text>
            </>
          ) : null}
        </View>

        {/* Actions */}
        <View style={[treatmentStyles.actionsRow, { borderTopColor: theme.pageSeparator }]}>
          <TouchableOpacity style={treatmentStyles.actionButton} activeOpacity={0.7} onPress={() => onModify(treatment.id)}>
            <Ionicons name="create-outline" size={14} color={theme.pageSubtitle} />
            <Text style={[treatmentStyles.actionText, { color: theme.pageSubtitle }]}>{t('patientFile.modify')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={treatmentStyles.actionButton} activeOpacity={0.7} onPress={() => onDelete(treatment.id)}>
            <Ionicons name="trash-outline" size={14} color={theme.pageSubtitle} />
            <Text style={[treatmentStyles.actionText, { color: theme.pageSubtitle }]}>{t('patientFile.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatientFileScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const styles = useMemo(() => createPatientFileStyles(theme), [theme]);
  const treatmentSectionStyles = useMemo(() => createTreatmentSectionStyles(theme), [theme]);
  const medicalRowStyles = useMemo(() => createMedicalRowStyles(theme), [theme]);
  const examStyles = useMemo(() => createExamStyles(theme), [theme]);
  const accentIconColor = theme.logo;
  const { patientId, email } = useLocalSearchParams<{ patientId?: string; email?: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    visible: boolean;
    treatmentId: string | null;
    isDeleting: boolean;
  }>({
    visible: false,
    treatmentId: null,
    isDeleting: false,
  });

  // ── Access control ──
  const hasAccess = user?.rol ? ALLOWED_ROLES.has(user.rol) : false;

  const loadData = useCallback(async () => {
    if (!patientId && !email) {
      setError(t('patientFile.errors.noPatientId'));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let patientData;
      if (patientId) {
        patientData = await getPatientById(patientId);
      } else if (email) {
        patientData = await getPatientByEmail(email);
      }

      if (!patientData) throw new Error('PATIENT_NOT_FOUND');

      const visits = await getStoredPatientVisitDates(patientData.id);
      patientData = {
        ...patientData,
        lastVisit: visits.lastVisit ?? patientData.lastVisit,
        nextAppointment: visits.nextAppointment ?? patientData.nextAppointment,
      };

      const treatmentData = await getTreatmentsByPatientId(patientData.id);
      
      // Sort treatments by treatmentDate descending (newest first)
      treatmentData.sort((a, b) => {
        const dateA = parseDateRobustly(a.treatmentDate);
        const dateB = parseDateRobustly(b.treatmentDate);
        const timeA = dateA ? dateA.getTime() : 0;
        const timeB = dateB ? dateB.getTime() : 0;
        return timeB - timeA;
      });

      setPatient(patientData);
      setTreatments(treatmentData);
    } catch (err: any) {
      console.error('[PatientFileScreen] loadData failed:', err);
      if (err?.message === 'PATIENT_NOT_FOUND') {
        setError(t('patientFile.errors.patientNotFound'));
      } else {
        setError(t('patientFile.errors.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [patientId, email, t]);

  useFocusEffect(
    useCallback(() => {
      if (hasAccess) {
        loadData();
      } else {
        setLoading(false);
      }
    }, [hasAccess, loadData])
  );

  const handleOpenClinicalHistory = () => {
    if (!patient) return;
    router.push({
      pathname: '/(tabs)/patients/clinical-history' as any,
      params: { patientId: patient.id },
    });
  };

  const handleAddTreatment = () => {
    if (!patient) return;
    router.push({
      pathname: '/(tabs)/patients/register-treatment' as any,
      params: {
        patientId: patient.id,
        patientName: patient.fullName,
        patientCedula: patient.documentId,
        patientPhone: patient.phone,
      },
    });
  };

  const handleModifyTreatment = (treatmentId: string) => {
    if (!patient) return;
    router.push({
      pathname: '/(tabs)/patients/register-treatment' as any,
      params: {
        patientId: patient.id,
        patientName: patient.fullName,
        patientCedula: patient.documentId,
        patientPhone: patient.phone,
        treatmentId,
      },
    });
  };

  const handleDeleteTreatment = (treatmentId: string) => {
    setDeleteModalConfig({
      visible: true,
      treatmentId,
      isDeleting: false,
    });
  };

  const confirmDeleteTreatment = async () => {
    const { treatmentId } = deleteModalConfig;
    if (!treatmentId) return;

    setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteTreatment(treatmentId);
      await loadData();
      setDeleteModalConfig({ visible: false, treatmentId: null, isDeleting: false });
      setToastConfig({
        visible: true,
        type: 'success',
        title: 'Tratamiento eliminado',
        message: 'El tratamiento ha sido eliminado exitosamente.',
      });
    } catch (err) {
      console.error('[PatientFileScreen] failed to delete treatment', err);
      setDeleteModalConfig({ visible: false, treatmentId: null, isDeleting: false });
      setToastConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudo eliminar el tratamiento. Inténtalo de nuevo.',
      });
    }
  };

  // ── Access denied state ──
  if (!hasAccess && !loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader />
        <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
        <AccessDeniedView
          title={t('patientFile.accessDenied')}
          message={t('patientFile.accessDeniedMessage')}
        />
      </View>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader />
        <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.main} />
          <Text style={[styles.stateMessage, { color: theme.pageSubtitle }]}>{t('patientFile.loading')}</Text>
        </View>
      </View>
    );
  }

  // ── Error state ──
  if (error || !patient) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <AppHeader />
        <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={56} color={theme.error} />
          <Text style={[styles.stateTitle, { color: theme.pageTitle }]}>{t('patientFile.errors.title')}</Text>
          <Text style={[styles.stateMessage, { color: theme.pageSubtitle }]}>{error || t('patientFile.errors.loadFailed')}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: theme.main }]} onPress={loadData} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color={theme.overMain} />
            <Text style={styles.retryText}>{t('patientFile.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Success state ──
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]} testID="patient-file-container">
      <AppHeader />
      <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Action bar */}
        <ActionBar onOpenClinicalHistory={handleOpenClinicalHistory} />

        {/* Patient card */}
        <PatientCard patient={patient} t={t} />

        {/* Appointment badges */}
        <AppointmentBadges patient={patient} t={t} />

        {/* Personal Information */}
        <CollapsibleSection
          title={t('patientFile.personalInfo')}
          icon="person-outline"
          defaultOpen={false}
        >
          <DetailRow label={t('patientFile.email')} value={patient.email || '—'} />
          <DetailRow label={t('patientFile.address')} value={patient.address || '—'} />
          <DetailRow label={t('patientFile.birthDate')} value={formatDate(patient.birthDate)} />
          <DetailRow label={t('patientFile.phone')} value={patient.phone || '—'} />
        </CollapsibleSection>

        {/* Antecedentes Médicos */}
        <CollapsibleSection
          title={t('patientFile.medicalBackground')}
          icon="medical-outline"
          defaultOpen={false}
        >
          {/* Tipo de Sangre */}
          <View style={[medicalRowStyles.row, { borderBottomColor: theme.pageSeparator }]}>
            <View style={[medicalRowStyles.iconContainer, { backgroundColor: theme.accentBackground }]}>
              <Ionicons name="water-outline" size={18} color={accentIconColor} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={[medicalRowStyles.label, { color: theme.pageTitle }]}>{t('patientFile.bloodType')}</Text>
              <Text style={[medicalRowStyles.value, { color: theme.pageSubtitle }]}>{patient.bloodType || '—'}</Text>
            </View>
          </View>

          {/* Alergias Conocidas */}
          <View style={[medicalRowStyles.row, { borderBottomColor: theme.pageSeparator }]}>
            <View style={[medicalRowStyles.iconContainer, { backgroundColor: theme.accentBackground }]}>
              <Ionicons name="warning-outline" size={18} color={accentIconColor} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={[medicalRowStyles.label, { color: theme.pageTitle }]}>{t('patientFile.knownAllergies')}</Text>
              <Text style={[medicalRowStyles.value, { color: theme.pageSubtitle }]}>
                {(patient.knownAllergies && patient.knownAllergies.length > 0)
                  ? patient.knownAllergies.map(formatAntecedente).join(', ')
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Condiciones Médicas Previas */}
          <View style={[medicalRowStyles.row, { borderBottomColor: theme.pageSeparator }]}>
            <View style={[medicalRowStyles.iconContainer, { backgroundColor: theme.accentBackground }]}>
              <Ionicons name="fitness-outline" size={18} color={accentIconColor} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={[medicalRowStyles.label, { color: theme.pageTitle }]}>{t('patientFile.medicalConditions')}</Text>
              <Text style={[medicalRowStyles.value, { color: theme.pageSubtitle }]}>
                {(patient.medicalHistory && patient.medicalHistory.length > 0)
                  ? patient.medicalHistory.map(formatAntecedente).join(', ')
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Notas Adicionales */}
          <View style={[medicalRowStyles.row, { borderBottomWidth: 0 }]}>
            <View style={[medicalRowStyles.iconContainer, { backgroundColor: theme.accentBackground }]}>
              <Ionicons name="document-text-outline" size={18} color={accentIconColor} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={[medicalRowStyles.label, { color: theme.pageTitle }]}>{t('patientFile.additionalNotes')}</Text>
              <Text style={[medicalRowStyles.noteText, { color: theme.pageSubtitle }]}>
                {patient.notes || '—'}
              </Text>
            </View>
          </View>
        </CollapsibleSection>

        {/* Exámenes pendientes */}
        {(() => {
          const pendingExams = treatments
            .flatMap((tr) =>
              (tr.pendingExams || []).map((exam) => ({
                ...exam,
                treatmentName: tr.treatmentName,
              }))
            )
            .sort((a, b) => {
              const dateA = parseDateRobustly(a.date);
              const dateB = parseDateRobustly(b.date);
              const timeA = dateA ? dateA.getTime() : 0;
              const timeB = dateB ? dateB.getTime() : 0;
              return timeB - timeA;
            });
          return (
            <CollapsibleSection
              title={`${t('patientFile.pendingExams')} (${pendingExams.length})`}
              icon="flask-outline"
              defaultOpen={false}
            >
              {pendingExams.length > 0 ? (
                pendingExams.map((exam, idx) => (
                  <View key={`${exam.id}-${idx}`} style={[examStyles.row, { borderBottomColor: theme.pageSeparator }]}>
                    <Text style={[examStyles.name, { color: theme.pageTitle }]}>{exam.name}</Text>
                    <Text style={[examStyles.date, { color: theme.pageSubtitle }]}>{formatShortDate(exam.date, i18n.language)}</Text>
                  </View>
                ))
              ) : (
                <View style={examStyles.emptyState}>
                  <Text style={[examStyles.emptyText, { color: theme.pageSubtitle }]}>{t('patientFile.noPendingExams')}</Text>
                </View>
              )}
            </CollapsibleSection>
          );
        })()}

        {/* Treatment History */}
        <View style={[treatmentSectionStyles.container, { backgroundColor: theme.backgroundElement, borderColor: theme.cardSeparator }]}>
          <View style={treatmentSectionStyles.header}>
            <Text style={[treatmentSectionStyles.title, { color: theme.pageTitle }]}>
              {t('patientFile.treatmentHistory')}
            </Text>
            <TouchableOpacity
              style={[treatmentSectionStyles.addButton, { backgroundColor: theme.accentBackground }]}
              onPress={handleAddTreatment}
              activeOpacity={0.7}
              testID="add-treatment-btn"
            >
              <Text style={[treatmentSectionStyles.addButtonText, { color: accentIconColor }]}>
                {t('patientFile.addTreatment')}
              </Text>
              <Ionicons name="add" size={16} color={accentIconColor} />
            </TouchableOpacity>
          </View>

          {treatments.length === 0 ? (
            <View style={treatmentSectionStyles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color={theme.pageSubtitle} />
              <Text style={[treatmentSectionStyles.emptyTitle, { color: theme.pageSubtitle }]}>
                {t('patientFile.noTreatments')}
              </Text>
              <Text style={[treatmentSectionStyles.emptyMessage, { color: theme.pageSubtitle }]}>
                {t('patientFile.noTreatmentsMessage')}
              </Text>
            </View>
          ) : null}

          {treatments.length > 0 ? (
            <View>
              {treatments.map((tr) => (
                <TreatmentCard 
                  key={tr.id} 
                  treatment={tr} 
                  t={t} 
                  onModify={handleModifyTreatment}
                  onDelete={handleDeleteTreatment}
                />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <NotificationToast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        onDismiss={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />

      <ConfirmationModal
        visible={deleteModalConfig.visible}
        title="Eliminar Tratamiento"
        message="¿Estás seguro de que deseas eliminar este tratamiento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        icon="trash-outline"
        isDestructive={true}
        isSubmitting={deleteModalConfig.isDeleting}
        onConfirm={confirmDeleteTreatment}
        onCancel={() => setDeleteModalConfig({ visible: false, treatmentId: null, isDeleting: false })}
      />
    </View>
  );
}