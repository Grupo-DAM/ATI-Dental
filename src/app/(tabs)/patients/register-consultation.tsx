import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PageTitleLayout } from '@/components/page-title-layout';
import { PatientSummaryCard } from '@/components/clinical-history/PatientSummaryCard';
import { AppointmentSelector } from '@/components/consultation/AppointmentSelector';
import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';
import { useFetchOdontogram } from '@/hooks/use-fetch-odontogram';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { NotificationToast } from '@/components/notification-toast';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import { getPatientById, Patient } from '@/services/patient-service';
import {
  ConsultationFormData,
  LinkedAppointment,
  getAppointmentsForPatient,
  isAppointmentStatusCompatible,
  registerConsultationRecord,
  validateConsultationForm,
} from '@/services/consultation-service';
import { createConsultationRecordStyles } from '@/constants/styles/patients/consultation-record.styles';

const DEFAULT_PATIENT_ID = 'paciente_cova_123';

export default function RegisterConsultationScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createConsultationRecordStyles(theme);
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ patientId?: string; appointmentId?: string }>();
  const patientId = params.patientId || DEFAULT_PATIENT_ID;

  // ── Access Control (Escenario Odontólogo / Admin) ──
  const isOdontologo = isOdontologoUser(user) || !!(user?.rol && user.rol.toLowerCase().includes('odont'));
  const isAdmin = isAdminUser(user) || !!(user?.rol && user.rol.toLowerCase().includes('admin'));
  const hasPermission = isOdontologo || isAdmin;

  // Estado del Paciente y Citas
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<LinkedAppointment[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [selectedAppointment, setSelectedAppointment] = useState<LinkedAppointment | null>(null);

  // Estados del Formulario de Consulta
  const [motivo, setMotivo] = useState<string>('');
  const [diagnostico, setDiagnostico] = useState<string>('');
  const [tratamientoRecetado, setTratamientoRecetado] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [odontograma, setOdontograma] = useState<string>(
    'Sin anomalías clínicas registradas. Odontograma base completado.'
  );
  const [showInteractiveOdontogram, setShowInteractiveOdontogram] = useState<boolean>(false);
  const { odontogram: fetchedOdontogram, loading: loadingOdontogram } = useFetchOdontogram({
    patientId,
    isAdult: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Modales y Notificaciones
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  // Carga inicial del paciente y citas
  const loadInitialData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [patientData, apptList] = await Promise.all([
        getPatientById(patientId),
        getAppointmentsForPatient(patientId),
      ]);
      setPatient(patientData);
      setAppointments(apptList);

      // Si viene appointmentId por parámetro, asociarlo si existe
      if (params.appointmentId) {
        const found = apptList.find((a) => a.id === params.appointmentId);
        if (found) {
          if (isAppointmentStatusCompatible(found.status)) {
            setSelectedAppointment(found);
            if (found.treatmentName && !motivo) {
              setMotivo(found.treatmentName);
            }
          } else {
            // Incompatible: mostramos error sobre el appointment
            setFormErrors((prev) => ({
              ...prev,
              appointmentId: t(
                'registerConsultation.incompatibleAppointmentWarning',
                'Solo se pueden generar registros de consulta para citas en progreso o completadas, o en su defecto de forma independiente.'
              ),
            }));
          }
        }
      }
    } catch (err) {
      console.warn('[register-consultation] Error loading patient/appointments:', err);
    } finally {
      setLoadingData(false);
    }
  }, [patientId, params.appointmentId, t, motivo]);

  useEffect(() => {
    if (hasPermission) {
      loadInitialData();
    }
  }, [hasPermission, loadInitialData]);

  // Verifica si el formulario tiene datos ingresados (dirty)
  const isFormDirty =
    motivo.trim().length > 0 ||
    diagnostico.trim().length > 0 ||
    tratamientoRecetado.trim().length > 0 ||
    observaciones.trim().length > 0 ||
    selectedAppointment !== null;

  // Cancelar proceso de registro (Escenario 4)
  const handleCancelPress = () => {
    if (isFormDirty) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    router.back();
  };

  // Validar y abrir modal de confirmación de envío (Escenario 1 & 3)
  const handleSubmitPress = () => {
    const formData: ConsultationFormData = {
      patientId,
      motivo,
      diagnostico,
      tratamientoRecetado,
      observaciones,
      odontograma,
      appointmentId: selectedAppointment?.id,
    };

    const validation = validateConsultationForm(formData, selectedAppointment?.status);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    setShowSubmitModal(true);
  };

  // Confirmar y procesar envío definitivo (Escenarios 1 & 5)
  const handleConfirmSubmit = async () => {
    try {
      setIsSubmitting(true);
      const formData: ConsultationFormData = {
        patientId,
        motivo,
        diagnostico,
        tratamientoRecetado,
        observaciones,
        odontograma,
        appointmentId: selectedAppointment?.id,
        doctor: user?.nombre ? `Dr. ${user.nombre}` : 'Dr. Smith',
      };

      const result = await registerConsultationRecord(
        formData,
        selectedAppointment?.status
      );

      if (result.success) {
        setShowSubmitModal(false);
        setToastConfig({
          visible: true,
          type: 'success',
          title: t('registerConsultation.successTitle', 'Consulta registrada con éxito'),
          message: t(
            'registerConsultation.successMessage',
            'La consulta ha sido guardada y la historia clínica se ha actualizado.'
          ),
        });

        // Retornamos a la historia clínica del paciente
        router.replace({
          pathname: '/(tabs)/patients/clinical-history' as any,
          params: { patientId },
        });
      } else {
        // Escenario 5: Error de red o servidor - conservar datos del formulario
        setShowSubmitModal(false);
        setToastConfig({
          visible: true,
          type: 'error',
          title: t('registerConsultation.errorSaveTitle', 'Error al guardar consulta'),
          message:
            result.error ||
            t(
              'registerConsultation.errorSaveMessage',
              'No se pudo registrar la consulta debido a un fallo de red o del servidor. La información se conservó para reintentar.'
            ),
        });
      }
    } catch (error: any) {
      setShowSubmitModal(false);
      setToastConfig({
        visible: true,
        type: 'error',
        title: t('registerConsultation.errorSaveTitle', 'Error al guardar consulta'),
        message:
          error?.message ||
          t(
            'registerConsultation.errorSaveMessage',
            'No se pudo registrar la consulta debido a un fallo de red o del servidor. La información se conservó para reintentar.'
          ),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTitleLayout
      title={t('registerConsultation.title', 'Registrar Consulta')}
      subtitle={t(
        'registerConsultation.subtitle',
        'Registra los resultados de la consulta actual y actualiza la historia clínica del paciente.'
      )}
      parentBreadcrumb={t('registerConsultation.breadcrumbParent', 'Historia Clínica')}
      currentBreadcrumb={t('registerConsultation.breadcrumbCurrent', 'Registrar Consulta')}
      authLoading={authLoading}
      hasPermission={hasPermission}
      accessDeniedTitle={t('registerConsultation.accessDeniedTitle', 'Acceso Denegado')}
      accessDeniedDesc={t(
        'registerConsultation.accessDeniedMessage',
        'Solo el personal con rol de Odontólogo o Administrador puede registrar consultas médicas.'
      )}
      testID="register-consultation-screen"
    >
      <View style={styles.formContainer}>
        {/* Loader de datos preliminares */}
        {loadingData && (
          <ActivityIndicator size="small" color={theme.main} style={{ marginVertical: 8 }} />
        )}

        {/* Resumen del Paciente */}
        {patient && <PatientSummaryCard patient={patient} />}

        {/* Sección: Cita Asociada (Escenario 1 & 2) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              {t('registerConsultation.linkedAppointment', 'Vincular a Cita Agendada')}
            </Text>
            <Text style={styles.optionalBadge}>Opcional</Text>
          </View>
          <AppointmentSelector
            appointments={appointments}
            selectedAppointmentId={selectedAppointment?.id}
            onSelectAppointment={(appt) => {
              setSelectedAppointment(appt);
              if (appt && !motivo && appt.treatmentName) {
                setMotivo(appt.treatmentName);
              }
              if (formErrors.appointmentId) {
                setFormErrors((prev) => ({ ...prev, appointmentId: '' }));
              }
            }}
            error={formErrors.appointmentId}
          />
        </View>

        {/* Campo 1: Motivo de Consulta (Obligatorio) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              {t('registerConsultation.motivoLabel', 'Motivo de Consulta')} *
            </Text>
          </View>
          <TextInput
            testID="input-motivo"
            style={[styles.input, !!formErrors.motivo && styles.inputError]}
            placeholder={t(
              'registerConsultation.motivoPlaceholder',
              'Ej. Control y limpieza general'
            )}
            placeholderTextColor={theme.placeholderColor}
            value={motivo}
            onChangeText={(text) => {
              setMotivo(text);
              if (formErrors.motivo) setFormErrors((prev) => ({ ...prev, motivo: '' }));
            }}
          />
          {formErrors.motivo && (
            <Text style={styles.errorText} testID="error-motivo">
              {formErrors.motivo}
            </Text>
          )}
        </View>

        {/* Campo 2: Diagnóstico (Obligatorio) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              {t('registerConsultation.diagnosticoLabel', 'Diagnóstico')} *
            </Text>
          </View>
          <TextInput
            testID="input-diagnostico"
            style={[styles.input, styles.textArea, !!formErrors.diagnostico && styles.inputError]}
            placeholder={t(
              'registerConsultation.diagnosticoPlaceholder',
              'Describa el diagnóstico clínico observado...'
            )}
            placeholderTextColor={theme.placeholderColor}
            multiline
            numberOfLines={3}
            value={diagnostico}
            onChangeText={(text) => {
              setDiagnostico(text);
              if (formErrors.diagnostico) setFormErrors((prev) => ({ ...prev, diagnostico: '' }));
            }}
          />
          {formErrors.diagnostico && (
            <Text style={styles.errorText} testID="error-diagnostico">
              {formErrors.diagnostico}
            </Text>
          )}
        </View>

        {/* Campo 3: Tratamiento Recetado / Realizado (Obligatorio) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              {t('registerConsultation.tratamientoLabel', 'Tratamiento Recetado / Realizado')} *
            </Text>
          </View>
          <TextInput
            testID="input-tratamiento"
            style={[
              styles.input,
              styles.textArea,
              !!formErrors.tratamientoRecetado && styles.inputError,
            ]}
            placeholder={t(
              'registerConsultation.tratamientoPlaceholder',
              'Detalle los procedimientos realizados o medicamentos recetados...'
            )}
            placeholderTextColor={theme.placeholderColor}
            multiline
            numberOfLines={3}
            value={tratamientoRecetado}
            onChangeText={(text) => {
              setTratamientoRecetado(text);
              if (formErrors.tratamientoRecetado)
                setFormErrors((prev) => ({ ...prev, tratamientoRecetado: '' }));
            }}
          />
          {formErrors.tratamientoRecetado && (
            <Text style={styles.errorText} testID="error-tratamiento">
              {formErrors.tratamientoRecetado}
            </Text>
          )}
        </View>

        {/* Campo 4: Observaciones / Notas Adicionales (Obligatorio) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              {t('registerConsultation.observacionesLabel', 'Observaciones / Notas Adicionales')} *
            </Text>
          </View>
          <TextInput
            testID="input-observaciones"
            style={[
              styles.input,
              styles.textArea,
              !!formErrors.observaciones && styles.inputError,
            ]}
            placeholder={t(
              'registerConsultation.observacionesPlaceholder',
              'Observaciones generales o indicaciones para el paciente...'
            )}
            placeholderTextColor={theme.placeholderColor}
            multiline
            numberOfLines={3}
            value={observaciones}
            onChangeText={(text) => {
              setObservaciones(text);
              if (formErrors.observaciones)
                setFormErrors((prev) => ({ ...prev, observaciones: '' }));
            }}
          />
          {formErrors.observaciones && (
            <Text style={styles.errorText} testID="error-observaciones">
              {formErrors.observaciones}
            </Text>
          )}
        </View>

        {/* Campo 5: Odontograma (Obligatorio / Insumo Figma) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.fieldLabel}>
              {t('registerConsultation.odontogramaLabel', 'Odontograma Dental')} *
            </Text>
          </View>
          <View style={styles.odontogramCard}>
            <View style={styles.odontogramActionsRow}>
              <TouchableOpacity
                style={styles.odontogramButton}
                activeOpacity={0.7}
                testID="btn-update-odontogram"
                onPress={() => {
                  setOdontograma(
                    'Odontograma inspeccionado y actualizado: sin lesiones cariosas activas, restauraciones intactas.'
                  );
                  if (formErrors.odontograma) {
                    setFormErrors((prev) => ({ ...prev, odontograma: '' }));
                  }
                }}
              >
                <Ionicons name="sparkles-outline" size={16} color={theme.main} />
                <Text style={styles.odontogramButtonText}>
                  {t('registerConsultation.updateOdontogram', 'Actualizar Odontograma')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleOdontogramButton}
                activeOpacity={0.7}
                testID="btn-toggle-interactive-odontogram"
                onPress={() => setShowInteractiveOdontogram((prev) => !prev)}
              >
                <Ionicons
                  name={showInteractiveOdontogram ? 'eye-off-outline' : 'color-palette-outline'}
                  size={16}
                  color={theme.main}
                />
                <Text style={styles.toggleOdontogramButtonText}>
                  {showInteractiveOdontogram
                    ? t('registerConsultation.hideInteractiveOdontogram', 'Ocultar Odontograma')
                    : t('registerConsultation.showInteractiveOdontogram', 'Ver Odontograma')}
                </Text>
              </TouchableOpacity>
            </View>

            {showInteractiveOdontogram && (
              <View style={styles.odontogramContainerWrapper} testID="interactive-odontogram-container">
                {loadingOdontogram ? (
                  <ActivityIndicator size="small" color={theme.main} style={{ marginVertical: 12 }} />
                ) : (
                  <OdontogramContainer
                    odontogram={fetchedOdontogram}
                    onToothSelect={(tooth) => {
                      const statesStr =
                        tooth.generalStates && tooth.generalStates.length > 0
                          ? tooth.generalStates.join(', ')
                          : 'revisada/sana';
                      const toothDetail = `Pieza ${tooth.number}: ${statesStr}`;
                      setOdontograma((prev) => {
                        if (prev.includes(`Pieza ${tooth.number}`)) return prev;
                        return prev.trim().length > 0 ? `${prev.trim()}\n${toothDetail}` : toothDetail;
                      });
                      if (formErrors.odontograma) {
                        setFormErrors((prev) => ({ ...prev, odontograma: '' }));
                      }
                    }}
                  />
                )}
              </View>
            )}

            <TextInput
              testID="input-odontograma"
              style={[
                styles.input,
                { minHeight: 60, textAlignVertical: 'top' },
                !!formErrors.odontograma && styles.inputError,
              ]}
              placeholder={t(
                'registerConsultation.odontogramaPlaceholder',
                'Registro de hallazgos en piezas dentales...'
              )}
              placeholderTextColor={theme.placeholderColor}
              multiline
              value={odontograma}
              onChangeText={(text) => {
                setOdontograma(text);
                if (formErrors.odontograma)
                  setFormErrors((prev) => ({ ...prev, odontograma: '' }));
              }}
            />
          </View>
          {formErrors.odontograma && (
            <Text style={styles.errorText} testID="error-odontograma">
              {formErrors.odontograma}
            </Text>
          )}
        </View>

        {/* Barra de Acciones: Cancelar y Guardar Consulta */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.btnCancel}
            onPress={handleCancelPress}
            activeOpacity={0.7}
            testID="btn-cancel-consultation"
          >
            <Text style={styles.btnCancelText}>
              {t('registerConsultation.cancel', 'Cancelar')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSubmit}
            onPress={handleSubmitPress}
            activeOpacity={0.8}
            testID="btn-submit-consultation"
          >
            <Ionicons name="checkmark-done" size={18} color={theme.overMain} />
            <Text style={styles.btnSubmitText}>
              {t('registerConsultation.save', 'Guardar Consulta')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal 1: Confirmar Guardado (Escenario 1) */}
      <ConfirmationModal
        visible={showSubmitModal}
        title={t('registerConsultation.confirmSubmitTitle', '¿Confirmar registro de consulta?')}
        message={t(
          'registerConsultation.confirmSubmitMessage',
          'Se actualizará la historia clínica del paciente con los resultados y diagnósticos ingresados.'
        )}
        confirmText={t('registerConsultation.confirmSubmitBtn', 'Confirmar y Guardar')}
        cancelText={t('registerConsultation.cancel', 'Cancelar')}
        icon="checkmark-circle-outline"
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSubmit}
        onCancel={() => !isSubmitting && setShowSubmitModal(false)}
      />

      {/* Modal 2: Descartar Cambios (Escenario 4) */}
      <ConfirmationModal
        visible={showDiscardModal}
        title={t('registerConsultation.confirmDiscardTitle', '¿Descartar cambios?')}
        message={t(
          'registerConsultation.confirmDiscardMessage',
          '¿Está seguro de que desea cancelar? Toda la información ingresada se perderá.'
        )}
        confirmText={t('registerConsultation.confirmDiscardBtn', 'Descartar cambios')}
        cancelText={t('registerConsultation.continueEditing', 'Continuar editando')}
        icon="alert-circle-outline"
        isDestructive={true}
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardModal(false)}
      />

      {/* Notificación Toast (Escenario 5) */}
      <NotificationToast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        onDismiss={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
    </PageTitleLayout>
  );
}
