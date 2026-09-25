import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Consultation } from '@/types/clinical-record';
import { Patient } from '@/services/patient-service';

function formatConsultationDate(dateStr?: string): { day: string; monthYear: string; time: string } {
  if (!dateStr) return { day: '—', monthYear: '—', time: '—' };
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) {
      return { day: '—', monthYear: dateStr, time: '' };
    }
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return {
      day,
      monthYear: `${month} ${year}`,
      time: `${hours}:${minutes}`,
    };
  } catch {
    return { day: '—', monthYear: dateStr || '—', time: '' };
  }
}

interface Props {
  readonly visible: boolean;
  readonly consultation: Consultation | null;
  readonly patient: Patient;
  readonly onClose: () => void;
  readonly onDelete?: (consultationId: string) => void;
  readonly onOpenOdontogram?: () => void;
  readonly initialEditMode?: boolean;
  readonly onSave?: (updatedConsultation: Partial<Consultation>) => Promise<void> | void;
}

export function ConsultationDetailModal({
  visible,
  consultation,
  patient,
  onClose,
  onDelete,
  onOpenOdontogram,
  initialEditMode = false,
  onSave,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const isDark = theme.background === '#000000';

  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formMotivo, setFormMotivo] = useState('');
  const [formDiagnostico, setFormDiagnostico] = useState('');
  const [formTratamientos, setFormTratamientos] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [formProximaCita, setFormProximaCita] = useState('');

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    motivo: true,
    diagnostico: true,
    tratamientos: true,
    notas: true,
    proximaCita: true,
  });

  useEffect(() => {
    if (consultation) {
      setFormTitle(consultation.title || '');
      setFormMotivo(consultation.motivo || '');
      setFormDiagnostico(consultation.diagnostico || '');
      setFormTratamientos(consultation.tratamientosRealizados || '');
      setFormNotas(consultation.notas || '');
      setFormProximaCita(consultation.proximaCita || '');
    }
    setIsEditing(initialEditMode);
  }, [consultation, initialEditMode]);

  if (!consultation) return null;

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave({
        title: formTitle.trim() || consultation.title,
        motivo: formMotivo.trim(),
        diagnostico: formDiagnostico.trim(),
        tratamientosRealizados: formTratamientos.trim(),
        notas: formNotas.trim(),
        proximaCita: formProximaCita.trim(),
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const { day, monthYear, time } = formatConsultationDate(consultation.consultationDate);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color={theme.main} />
            <Text style={styles.breadcrumbText}>
              {t('clinicalHistory.title', 'Historia Clínica')} &gt; {isEditing ? t('clinicalHistory.edit', 'Modificar') : t('clinicalHistory.consultation', 'Consulta')}
            </Text>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            {!isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.editHeaderButton}
                  activeOpacity={0.7}
                  testID="btn-modal-edit-consultation"
                >
                  <Ionicons name="create-outline" size={17} color={isDark ? '#FFFFFF' : theme.main} />
                  <Text style={[styles.editHeaderText, { color: isDark ? '#FFFFFF' : theme.main }]}>
                    {t('clinicalHistory.edit', 'Modificar')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color={theme.pageSubtitle} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(false)}
                  style={styles.cancelHeaderButton}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelHeaderText}>
                    {t('clinicalHistory.cancel', 'Cancelar')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={styles.saveHeaderButton}
                  activeOpacity={0.7}
                  disabled={isSaving}
                  testID="btn-modal-save-consultation"
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveHeaderText}>
                      {t('clinicalHistory.save', 'Guardar')}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Main Card with Date & Doctor */}
          <View style={styles.mainCard}>
            <View style={styles.dateBlock}>
              <Text style={styles.dayNumber}>{day}</Text>
              <Text style={styles.monthText}>{monthYear}</Text>
              {time ? <Text style={styles.timeText}>{time}</Text> : null}
            </View>
            <View style={styles.titleBlock}>
              {isEditing ? (
                <View>
                  <Text style={styles.inputFieldLabel}>Título / Procedimiento:</Text>
                  <TextInput
                    style={styles.editInput}
                    value={formTitle}
                    onChangeText={setFormTitle}
                    placeholder="Título de la consulta"
                    placeholderTextColor={theme.placeholderColor}
                    testID="input-edit-consultation-title"
                  />
                </View>
              ) : (
                <Text style={styles.cardTitle}>{consultation.title}</Text>
              )}
              <Text style={styles.doctorText}>
                {consultation.doctor} • {consultation.duration || '45 minutos'}
              </Text>
            </View>
          </View>

          {/* Ver Odontograma Button (Dark Mode high contrast) */}
          {onOpenOdontogram && !isEditing && (
            <View style={styles.actionButtonRow}>
              <TouchableOpacity
                style={styles.odontogramButton}
                onPress={() => {
                  onClose();
                  onOpenOdontogram();
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="medkit-outline" size={16} color={isDark ? '#FFFFFF' : theme.main} />
                <Text style={[styles.odontogramButtonText, { color: isDark ? '#FFFFFF' : theme.main }]}>
                  {t('clinicalHistory.viewOdontogram', 'Ver Odontograma')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Section: Motivo de Consulta */}
          <View style={styles.accordionSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('motivo')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                {t('clinicalHistory.consultationReason', 'Motivo de Consulta')}
              </Text>
              <Ionicons
                name={openSections.motivo ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.pageSubtitle}
              />
            </TouchableOpacity>
            {openSections.motivo && (
              <View style={styles.sectionBody}>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={formMotivo}
                    onChangeText={setFormMotivo}
                    placeholder="Motivo de la consulta"
                    placeholderTextColor={theme.placeholderColor}
                    testID="input-edit-consultation-motivo"
                  />
                ) : (
                  <Text style={styles.bodyText}>{consultation.motivo}</Text>
                )}
              </View>
            )}
          </View>

          {/* Section: Diagnóstico */}
          <View style={styles.accordionSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('diagnostico')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                {t('clinicalHistory.diagnosis', 'Diagnóstico')}
              </Text>
              <Ionicons
                name={openSections.diagnostico ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.pageSubtitle}
              />
            </TouchableOpacity>
            {openSections.diagnostico && (
              <View style={styles.sectionBody}>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, { minHeight: 70, textAlignVertical: 'top' }]}
                    multiline
                    value={formDiagnostico}
                    onChangeText={setFormDiagnostico}
                    placeholder="Diagnóstico clínico"
                    placeholderTextColor={theme.placeholderColor}
                    testID="input-edit-consultation-diagnostico"
                  />
                ) : (
                  <>
                    <Text style={[styles.bodyText, { marginBottom: 8 }]}>
                      {consultation.diagnostico}
                    </Text>
                    {consultation.diagnosticoDetallado && consultation.diagnosticoDetallado.length > 0 && (
                      <View style={styles.bulletsList}>
                        {consultation.diagnosticoDetallado.map((item, idx) => (
                          <View key={idx} style={styles.bulletRow}>
                            <Text style={[styles.bulletDot, { color: theme.main }]}>•</Text>
                            <Text style={styles.bulletText}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </View>

          {/* Section: Tratamientos Realizados */}
          <View style={styles.accordionSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('tratamientos')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                {t('clinicalHistory.performedTreatments', 'Tratamientos realizados')}
              </Text>
              <Ionicons
                name={openSections.tratamientos ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.pageSubtitle}
              />
            </TouchableOpacity>
            {openSections.tratamientos && (
              <View style={styles.sectionBody}>
                {isEditing ? (
                  <TextInput
                    style={styles.editInput}
                    value={formTratamientos}
                    onChangeText={setFormTratamientos}
                    placeholder="Procedimiento o tratamientos realizados"
                    placeholderTextColor={theme.placeholderColor}
                    testID="input-edit-consultation-tratamientos"
                  />
                ) : (
                  <>
                    <View style={styles.treatmentRow}>
                      <Text style={styles.treatmentName}>
                        {consultation.tratamientosRealizados || consultation.title}
                      </Text>
                      <View style={styles.statusCompletedBadge}>
                        <Text style={styles.statusCompletedText}>Completado</Text>
                      </View>
                    </View>
                    <Text style={styles.treatmentDoctor}>
                      {consultation.doctor} | {consultation.duration || '45 mins'}
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Section: Próxima Cita */}
          {isEditing ? (
            <View style={styles.accordionSection}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('proximaCita')}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>Próxima Cita</Text>
                <Ionicons
                  name={openSections.proximaCita ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={theme.pageSubtitle}
                />
              </TouchableOpacity>
              {openSections.proximaCita && (
                <View style={styles.sectionBody}>
                  <TextInput
                    style={styles.editInput}
                    value={formProximaCita}
                    onChangeText={setFormProximaCita}
                    placeholder="Ej. 25 Oct 2023 o No programada"
                    placeholderTextColor={theme.placeholderColor}
                    testID="input-edit-consultation-proxima-cita"
                  />
                </View>
              )}
            </View>
          ) : (
            consultation.proximaCita ? (
              <View style={styles.nextAppointmentCard}>
                <View style={styles.calendarIconCircle}>
                  <Ionicons name="calendar" size={18} color={isDark ? '#FFFFFF' : theme.main} />
                </View>
                <View>
                  <Text style={styles.nextAppointmentLabel}>PRÓXIMA CITA</Text>
                  <Text style={styles.nextAppointmentDate}>{consultation.proximaCita}</Text>
                </View>
              </View>
            ) : null
          )}

          {/* Section: Notas Adicionales */}
          <View style={styles.accordionSection}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('notas')}
              activeOpacity={0.7}
            >
              <Text style={styles.sectionTitle}>
                {t('clinicalHistory.additionalNotes', 'Notas adicionales')}
              </Text>
              <Ionicons
                name={openSections.notas ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={theme.pageSubtitle}
              />
            </TouchableOpacity>
            {openSections.notas && (
              <View style={styles.sectionBody}>
                {isEditing ? (
                  <TextInput
                    style={[styles.editInput, { minHeight: 60, textAlignVertical: 'top' }]}
                    multiline
                    value={formNotas}
                    onChangeText={setFormNotas}
                    placeholder="Notas u observaciones adicionales"
                    placeholderTextColor={theme.placeholderColor}
                    testID="input-edit-consultation-notas"
                  />
                ) : (
                  <Text style={styles.bodyText}>
                    {consultation.notas || 'Sin notas adicionales.'}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Bottom Save Button in Edit Mode */}
          {isEditing && (
            <View style={styles.saveBottomRow}>
              <TouchableOpacity
                style={styles.saveBigButton}
                onPress={handleSave}
                activeOpacity={0.7}
                disabled={isSaving}
                testID="btn-modal-save-bottom"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBigButtonText}>
                      {t('clinicalHistory.saveChanges', 'Guardar Cambios')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Delete Action (only in view mode) */}
          {onDelete && !isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDelete(consultation.id)}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={16} color={theme.error} />
              <Text style={styles.deleteText}>
                {t('clinicalHistory.deleteConsultation', 'Eliminar')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    navHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.cardSeparator,
      backgroundColor: theme.backgroundElement,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    breadcrumbText: {
      fontSize: 14,
      color: theme.fieldLabel,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    headerRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editHeaderButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.accentBackground,
    },
    editHeaderText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    cancelHeaderButton: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    cancelHeaderText: {
      fontSize: 13,
      color: theme.pageSubtitle,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    saveHeaderButton: {
      backgroundColor: theme.main,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    saveHeaderText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    inputFieldLabel: {
      fontSize: 11,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      marginBottom: 4,
    },
    editInput: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      color: theme.text,
      fontFamily: 'Open Sans',
    },
    saveBottomRow: {
      marginTop: 8,
      marginBottom: 20,
    },
    saveBigButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.main,
      paddingVertical: 14,
      borderRadius: 10,
      gap: 8,
    },
    saveBigButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      fontFamily: 'Open Sans',
    },
    closeButton: {
      padding: 6,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    mainCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      marginBottom: 12,
    },
    dateBlock: {
      alignItems: 'center',
      paddingRight: 16,
      borderRightWidth: 1,
      borderRightColor: theme.cardSeparator,
      minWidth: 70,
    },
    dayNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    monthText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    timeText: {
      fontSize: 10,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      marginTop: 2,
    },
    titleBlock: {
      flex: 1,
      paddingLeft: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.main,
      fontFamily: 'Open Sans',
      marginBottom: 4,
    },
    doctorText: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    actionButtonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 12,
    },
    odontogramButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.accentBackground,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    odontogramButtonText: {
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
    accordionSection: {
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      marginBottom: 10,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 14,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    sectionBody: {
      paddingHorizontal: 14,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: theme.pageSeparator,
    },
    bodyText: {
      fontSize: 13,
      color: theme.text,
      lineHeight: 19,
      fontFamily: 'Open Sans',
      marginTop: 8,
    },
    bulletsList: {
      gap: 4,
      paddingLeft: 4,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    bulletDot: {
      fontSize: 14,
      color: theme.main,
    },
    bulletText: {
      fontSize: 13,
      color: theme.text,
      fontFamily: 'Open Sans',
      flex: 1,
    },
    treatmentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 4,
    },
    treatmentName: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
    },
    statusCompletedBadge: {
      backgroundColor: '#E8F5E9',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    statusCompletedText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#2E7D32',
      fontFamily: 'Open Sans',
    },
    treatmentDoctor: {
      fontSize: 12,
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
    },
    nextAppointmentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundElement,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.cardSeparator,
      gap: 12,
      marginBottom: 16,
    },
    calendarIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.accentBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    nextAppointmentLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.pageSubtitle,
      fontFamily: 'Open Sans',
      letterSpacing: 0.5,
    },
    nextAppointmentDate: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginTop: 2,
    },
    deleteButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 12,
    },
    deleteText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.error,
      fontFamily: 'Open Sans',
    },
  });
