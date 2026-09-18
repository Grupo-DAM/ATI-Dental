import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { getPatientById, getPatientByEmail, Patient } from '@/services/patient-service';
import { getTreatmentsByPatientId, deleteTreatment, Treatment } from '@/services/treatment-service';
import { NotificationToast } from '@/components/notification-toast';
import { ConfirmationModal } from '@/components/confirmation-modal';

// ─── Constants ────────────────────────────────────────────────────────────────
const avatarFallback = require('@/assets/expo.icon/Assets/avatar.png');

const ALLOWED_ROLES = ['odontologo', 'admin', 'asistente', 'medico'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compute age from an ISO date string */
function calculateAge(dateString: string): number | null {
  if (!dateString) return null;
  try {
    const birth = new Date(dateString);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

function parseDateRobustly(dateInput: any): Date | null {
  if (!dateInput) return null;
  
  let date: Date;
  if (typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    date = new Date(dateInput);
    if (isNaN(date.getTime())) {
      const match = dateInput.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      }
    }
  } else {
    date = new Date(dateInput);
  }

  return isNaN(date.getTime()) ? null : date;
}

/** Format an ISO date string to a readable locale date */
function formatDate(dateInput: any): string {
  if (!dateInput) return '—';
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
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Return colour for treatment status badges */
function getStatusColor(status: string): { bg: string; text: string } {
  const s = status.toLowerCase();
  if (s === 'completado') return { bg: '#E8F5E9', text: '#2E7D32' };
  if (s === 'en progreso') return { bg: '#FFF3E0', text: '#E65100' };
  if (s === 'pendiente') return { bg: '#FFF8E1', text: '#F57F17' };
  if (s === 'cancelado') return { bg: '#FFEBEE', text: '#C62828' };
  if (s === 'preventivo') return { bg: '#E8EAF6', text: '#283593' };
  return { bg: '#F3F4F6', text: '#374151' };
}

/** Resolve the category badge colour */
function getCategoryColor(category: string): { bg: string; text: string } {
  if (!category) return { bg: '#F3F4F6', text: '#374151' };
  return { bg: '#F3E8FF', text: '#6B21A8' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Action bar with edit and calendar buttons */
function ActionBar() {
  return (
    <View style={actionBarStyles.container}>
      <View style={actionBarStyles.actions}>
        <TouchableOpacity style={actionBarStyles.iconButton} activeOpacity={0.7}>
          <Ionicons name="create-outline" size={20} color={Colors.light.main} />
        </TouchableOpacity>
        <TouchableOpacity style={actionBarStyles.iconButton} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={20} color={Colors.light.main} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const actionBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/** Patient info card with gradient-style background */
function PatientCard({ patient, t }: { patient: Patient; t: (k: string) => string }) {
  const age = calculateAge(patient.fechaNacimiento);
  const fullName = `${patient.nombre} ${patient.apellido}`.trim();
  const gender = patient.genero || '—';

  return (
    <View style={patientCardStyles.card} testID="patient-info-card">
      <Image
        source={patient.imageUrl ? { uri: patient.imageUrl } : avatarFallback}
        style={patientCardStyles.avatar}
        contentFit="cover"
      />
      <View style={patientCardStyles.info}>
        <Text style={patientCardStyles.name}>{fullName}</Text>
        <Text style={patientCardStyles.details}>
          {patient.dni}  •  {gender}  •  {age !== null ? `${age} ${t('patientFile.years')}` : '—'}
        </Text>
        <View style={patientCardStyles.phoneRow}>
          <Ionicons name="call" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={patientCardStyles.phone}>{patient.telefono || '—'}</Text>
        </View>
      </View>
    </View>
  );
}

const patientCardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.header,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  info: { flex: 1 },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Open Sans',
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  phone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: 'Open Sans',
  },
});

/** Appointment badge pills */
function AppointmentBadges({ patient, t }: { patient: Patient; t: (k: string) => string }) {
  return (
    <View style={badgeStyles.row}>
      <View style={badgeStyles.badge}>
        <Ionicons name="calendar-outline" size={16} color={Colors.light.main} style={{ marginRight: 6 }} />
        <View>
          <Text style={badgeStyles.badgeLabel}>{t('patientFile.nextAppointment')}</Text>
          <Text style={badgeStyles.badgeValue}>
            {patient.proximaCita ? formatDate(patient.proximaCita) : '—'}
          </Text>
        </View>
      </View>
      <View style={badgeStyles.badge}>
        <Ionicons name="time-outline" size={16} color={Colors.light.main} style={{ marginRight: 6 }} />
        <View>
          <Text style={badgeStyles.badgeLabel}>{t('patientFile.lastVisit')}</Text>
          <Text style={badgeStyles.badgeValue}>
            {patient.ultimaVisita ? formatDate(patient.ultimaVisita) : '—'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badgeLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    fontWeight: '500',
  },
  badgeValue: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    fontWeight: '600',
  },
});

/** Collapsible section */
function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={sectionStyles.container}>
      <TouchableOpacity
        style={sectionStyles.header}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <View style={sectionStyles.headerLeft}>
          <Ionicons name={icon} size={20} color={Colors.light.main} />
          <Text style={sectionStyles.headerTitle}>{title}</Text>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#9CA3AF"
        />
      </TouchableOpacity>
      {isOpen && <View style={sectionStyles.content}>{children}</View>}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});

/** Detail row inside a section */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value || '—'}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
});

/** Determine timeline icon styles based on treatment name */
function getTimelineIconProps(treatmentName: string) {
  const name = (treatmentName || '').toLowerCase();
  if (name.includes('limpieza') || name.includes('profilaxis') || name.includes('preventivo')) {
    return { icon: 'beaker' as const, bg: Colors.light.main, color: '#FFF', borderColor: Colors.light.main };
  }
  if (name.includes('obturación') || name.includes('resina') || name.includes('caries')) {
    return { icon: 'bandage' as const, bg: '#FFF', color: Colors.light.main, borderColor: Colors.light.main };
  }
  // Default to consultation style
  return { icon: 'clipboard' as const, bg: '#FFF', color: '#9CA3AF', borderColor: '#D1D5DB' };
}

/** Single treatment card in the history list */
function TreatmentCard({ 
  treatment, 
  t,
  onModify,
  onDelete
}: { 
  treatment: Treatment; 
  t: (k: string) => string;
  onModify: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const statusColor = getStatusColor(treatment.status);
  const categoryColor = getCategoryColor(treatment.category);
  const iconProps = getTimelineIconProps(treatment.treatmentName);

  return (
    <View style={treatmentStyles.card}>
      {/* Timeline dot and vertical line */}
      <View style={treatmentStyles.timelineColumn}>
        <View style={[
          treatmentStyles.iconDot, 
          { backgroundColor: iconProps.bg, borderColor: iconProps.borderColor }
        ]}>
          <Ionicons name={iconProps.icon} size={14} color={iconProps.color} />
        </View>
        <View style={treatmentStyles.line} />
      </View>

      {/* Card content */}
      <View style={treatmentStyles.content}>
        {/* Date and badges */}
        <View style={treatmentStyles.dateRow}>
          <Text style={treatmentStyles.date}>{formatShortDate(treatment.treatmentDate, typeof i18n !== 'undefined' ? i18n?.language : 'es')}</Text>
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
        <Text style={treatmentStyles.name}>{treatment.treatmentName}</Text>

        {/* Notes */}
        {treatment.notes ? (
          <Text style={treatmentStyles.notes} numberOfLines={2}>{treatment.notes}</Text>
        ) : null}

        {/* Doctor, duration and dental piece */}
        <View style={treatmentStyles.metaRow}>
          <Ionicons name="person-outline" size={13} color="#6B7280" />
          <Text style={treatmentStyles.metaText}>{treatment.responsibleDentist}</Text>
          
          {treatment.dentalPiece ? (
            <>
              <Text style={treatmentStyles.metaDot}>  |  </Text>
              <Ionicons name="medkit-outline" size={13} color="#6B7280" />
              <Text style={treatmentStyles.metaText}>{treatment.dentalPiece}</Text>
            </>
          ) : null}

          {treatment.duration ? (
            <>
              <Text style={treatmentStyles.metaDot}>  |  </Text>
              <Ionicons name="time-outline" size={13} color="#6B7280" />
              <Text style={treatmentStyles.metaText}>{treatment.duration}</Text>
            </>
          ) : null}
        </View>

        {/* Actions */}
        <View style={treatmentStyles.actionsRow}>
          <TouchableOpacity style={treatmentStyles.actionButton} activeOpacity={0.7} onPress={() => onModify(treatment.id)}>
            <Ionicons name="create-outline" size={14} color="#6B7280" />
            <Text style={treatmentStyles.actionText}>{t('patientFile.modify')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={treatmentStyles.actionButton} activeOpacity={0.7} onPress={() => onDelete(treatment.id)}>
            <Ionicons name="trash-outline" size={14} color="#6B7280" />
            <Text style={treatmentStyles.actionText}>{t('patientFile.delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const treatmentStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: 12,
  },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#E5E7EB',
    marginTop: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.light.main,
    fontFamily: 'Open Sans',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginBottom: 4,
  },
  notes: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    lineHeight: 17,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
  },
  metaDot: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatientFileScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
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
  const hasAccess = user?.rol ? ALLOWED_ROLES.includes(user.rol) : false;

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

  const handleAddTreatment = () => {
    if (!patient) return;
    router.push({
      pathname: '/(tabs)/register-treatment',
      params: {
        patientId: patient.id,
        patientName: `${patient.nombre} ${patient.apellido}`.trim(),
        patientCedula: patient.dni,
        patientPhone: patient.telefono,
      },
    });
  };

  const handleModifyTreatment = (treatmentId: string) => {
    if (!patient) return;
    router.push({
      pathname: '/(tabs)/register-treatment',
      params: {
        patientId: patient.id,
        patientName: `${patient.nombre} ${patient.apellido}`.trim(),
        patientCedula: patient.dni,
        patientPhone: patient.telefono,
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
      <View style={styles.container}>
        <AppHeader />
        <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={56} color="#D1D5DB" />
          <Text style={styles.stateTitle}>{t('patientFile.accessDenied')}</Text>
          <Text style={styles.stateMessage}>{t('patientFile.accessDeniedMessage')}</Text>
        </View>
      </View>
    );
  }

  // ── Loading state ──
  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.light.main} />
          <Text style={styles.stateMessage}>{t('patientFile.loading')}</Text>
        </View>
      </View>
    );
  }

  // ── Error state ──
  if (error || !patient) {
    return (
      <View style={styles.container}>
        <AppHeader />
        <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={56} color="#F87171" />
          <Text style={styles.stateTitle}>{t('patientFile.errors.title')}</Text>
          <Text style={styles.stateMessage}>{error || t('patientFile.errors.loadFailed')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryText}>{t('patientFile.retry')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Success state ──
  return (
    <View style={styles.container}>
      <AppHeader />
      <Breadcrumb parent={t('tabs.explore')} current={t('patientFile.title')} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Action bar */}
        <ActionBar />

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
          <DetailRow label={t('patientFile.email')} value={patient.email} />
          <DetailRow label={t('patientFile.address')} value={patient.direccion || '—'} />
          <DetailRow label={t('patientFile.birthDate')} value={formatDate(patient.fechaNacimiento)} />
          <DetailRow label={t('patientFile.phone')} value={patient.telefono} />
        </CollapsibleSection>

        {/* Antecedentes Médicos */}
        <CollapsibleSection
          title={t('patientFile.medicalBackground')}
          icon="medical-outline"
          defaultOpen={false}
        >
          {/* Tipo de Sangre */}
          <View style={medicalRowStyles.row}>
            <View style={medicalRowStyles.iconContainer}>
              <Ionicons name="water-outline" size={18} color={Colors.light.main} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={medicalRowStyles.label}>{t('patientFile.bloodType')}</Text>
              <Text style={medicalRowStyles.value}>{patient.tipoSangre || '—'}</Text>
            </View>
          </View>

          {/* Alergias Conocidas */}
          <View style={medicalRowStyles.row}>
            <View style={medicalRowStyles.iconContainer}>
              <Ionicons name="warning-outline" size={18} color={Colors.light.main} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={medicalRowStyles.label}>{t('patientFile.knownAllergies')}</Text>
              <Text style={medicalRowStyles.value}>
                {(patient.alergiasConocidas && patient.alergiasConocidas.length > 0)
                  ? patient.alergiasConocidas.map(formatAntecedente).join(', ')
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Condiciones Médicas Previas */}
          <View style={medicalRowStyles.row}>
            <View style={medicalRowStyles.iconContainer}>
              <Ionicons name="fitness-outline" size={18} color={Colors.light.main} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={medicalRowStyles.label}>{t('patientFile.medicalConditions')}</Text>
              <Text style={medicalRowStyles.value}>
                {patient.antecedentesMedicos.length > 0
                  ? patient.antecedentesMedicos.map(formatAntecedente).join(', ')
                  : '—'}
              </Text>
            </View>
          </View>

          {/* Notas Adicionales */}
          <View style={[medicalRowStyles.row, { borderBottomWidth: 0 }]}>
            <View style={medicalRowStyles.iconContainer}>
              <Ionicons name="document-text-outline" size={18} color={Colors.light.main} />
            </View>
            <View style={medicalRowStyles.textContainer}>
              <Text style={medicalRowStyles.label}>{t('patientFile.additionalNotes')}</Text>
              <Text style={medicalRowStyles.noteText}>
                {patient.notasAdicionales || '—'}
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
                  <View key={`${exam.id}-${idx}`} style={examStyles.row}>
                    <Text style={examStyles.name}>{exam.name}</Text>
                    <Text style={examStyles.date}>{formatShortDate(exam.date, i18n.language)}</Text>
                  </View>
                ))
              ) : (
                <View style={examStyles.emptyState}>
                  <Text style={examStyles.emptyText}>{t('patientFile.noPendingExams')}</Text>
                </View>
              )}
            </CollapsibleSection>
          );
        })()}

        {/* Treatment History */}
        <View style={treatmentSectionStyles.container}>
          <View style={treatmentSectionStyles.header}>
            <Text style={treatmentSectionStyles.title}>
              {t('patientFile.treatmentHistory')}
            </Text>
            <TouchableOpacity
              style={treatmentSectionStyles.addButton}
              onPress={handleAddTreatment}
              activeOpacity={0.7}
              testID="add-treatment-btn"
            >
              <Text style={treatmentSectionStyles.addButtonText}>
                {t('patientFile.addTreatment')}
              </Text>
              <Ionicons name="add" size={16} color={Colors.light.main} />
            </TouchableOpacity>
          </View>

          {treatments.length === 0 ? (
            <View style={treatmentSectionStyles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
              <Text style={treatmentSectionStyles.emptyTitle}>
                {t('patientFile.noTreatments')}
              </Text>
              <Text style={treatmentSectionStyles.emptyMessage}>
                {t('patientFile.noTreatmentsMessage')}
              </Text>
            </View>
          ) : null}

          {treatments.length > 0 ? (
            <View style={treatmentSectionStyles.list}>
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

const treatmentSectionStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Open Sans',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    color: Colors.light.main,
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Open Sans',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Open Sans',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
});

// ─── Medical Row styles ───────────────────────────────────────────────────────

const medicalRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    fontWeight: '600',
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Open Sans',
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    lineHeight: 18,
    marginTop: 2,
  },
});

// ─── Exam styles ──────────────────────────────────────────────────────────────

const examStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  name: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: 'Open Sans',
    fontWeight: '500',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    marginLeft: 12,
  },
  emptyState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Open Sans',
  },
});

// ─── Main styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F8',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Open Sans',
    marginTop: 16,
    textAlign: 'center',
  },
  stateMessage: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Open Sans',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: Colors.light.main,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Open Sans',
  },
});
