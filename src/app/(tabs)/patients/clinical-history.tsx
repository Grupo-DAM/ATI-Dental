import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AccessDeniedView } from '@/components/access-denied-view';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import { useClinicalRecord } from '@/hooks/use-clinical-record';
import { useFetchOdontogram } from '@/hooks/use-fetch-odontogram';
import { PatientSummaryCard } from '@/components/clinical-history/PatientSummaryCard';
import { ClinicalHistoryTabs } from '@/components/clinical-history/ClinicalHistoryTabs';
import { ConsultationsTimeline } from '@/components/clinical-history/ConsultationsTimeline';
import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';
import { TreatmentsTimeline } from '@/components/clinical-history/TreatmentsTimeline';
import { ConsultationDetailModal } from '@/components/clinical-history/ConsultationDetailModal';
import { NotificationToast } from '@/components/notification-toast';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { deleteTreatment } from '@/services/treatment-service';
import { Consultation, ToothCondition } from '@/types/clinical-record';
import { createClinicalHistoryStyles } from '@/constants/styles/patients.style';
import { ToothConditionModal } from '@/components/clinical-history/ToothConditionModal';

function ageFromBirthDate(birthDate?: string): string {
  if (!birthDate) return '';
  const born = new Date(birthDate);
  if (Number.isNaN(born.getTime())) return '';
  const today = new Date();
  let years = today.getFullYear() - born.getFullYear();
  const hadBirthday =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate());
  if (!hadBirthday) years -= 1;
  return years >= 0 ? String(years) : '';
}

export default function ClinicalHistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createClinicalHistoryStyles(theme), [theme]);
  const { user, loading: authLoading } = useAuth();
  const { patientId } = useLocalSearchParams<{ patientId?: string }>();

  // ── Access Control (Escenario 4: Odontólogo y Admin autorizados) ──
  const isOdontologo = isOdontologoUser(user);
  const isAdmin = isAdminUser(user);
  const hasAccess = isOdontologo || isAdmin;

  const {
    record,
    loading: recordLoading,
    error,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredConsultations,
    filteredTreatments,
    selectedConsultation,
    setSelectedConsultation,
    refetch,
    deleteConsultation,
    updateConsultation,
    updateOdontogram,
  } = useClinicalRecord(hasAccess ? patientId : undefined);

  const skipInitialFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (!hasAccess || !patientId) return;
      if (skipInitialFocus.current) {
        skipInitialFocus.current = false;
        return;
      }
      refetch();
    }, [hasAccess, patientId, refetch]),
  );

  const [isEditingConsultation, setIsEditingConsultation] = useState(false);

  const [editingTooth, setEditingTooth] = useState<ToothCondition | null>(null);

  // Modal de confirmación para eliminar
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    visible: boolean;
    type: 'consultation' | 'treatment';
    id: string | null;
    isDeleting: boolean;
  }>({
    visible: false,
    type: 'consultation',
    id: null,
    isDeleting: false,
  });

  // Notificaciones Toast
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

  // Carga el odontograma 
  const [selectedConsultationDate, ] = useState<string | null>(null);

  const { odontogram, loading } = useFetchOdontogram({
    patientId: patientId ?? '',
    selectedDate: selectedConsultationDate, // Si es null, el hook trae el último odontograma
  });

  const handleEditPatient = () => {
    if (!record?.patient) return;
    router.push({
      pathname: '/(tabs)/patients/register-patient' as any,
      params: { patientId: record.patient.id, patientData: JSON.stringify(record.patient) },
    });
  };

  const handleScheduleAppointment = () => {
    const patient = record?.patient;
    if (!patient) {
      router.push('/(tabs)/patients/schedule-appointment' as any);
      return;
    }
    router.push({
      pathname: '/(tabs)/patients/schedule-appointment' as any,
      params: {
        patientId: patient.id,
        patientName: patient.fullName,
        patientCedula: patient.documentId ?? '',
        patientGender: patient.gender ?? '',
        patientAge: ageFromBirthDate(patient.birthDate),
        patientPhone: patient.phone ?? '',
        patientImageUrl: patient.photoUri ?? '',
      },
    });
  };

  const handleRegisterConsultation = () => {
    const targetPatientId = record?.patient?.id || patientId;
    router.push({
      pathname: '/(tabs)/patients/register-consultation' as any,
      params: { patientId: targetPatientId },
    });
  };

  const handleAddTreatment = () => {
    if (!record?.patient) return;
    router.push({
      pathname: '/(tabs)/patients/register-treatment' as any,
      params: {
        patientId: record.patient.id,
        patientName: record.patient.fullName,
        patientCedula: record.patient.documentId,
        patientPhone: record.patient.phone,
      },
    });
  };

  const handleModifyTreatment = (treatmentId: string) => {
    if (!record?.patient) return;
    router.push({
      pathname: '/(tabs)/patients/register-treatment' as any,
      params: {
        patientId: record.patient.id,
        patientName: record.patient.fullName,
        patientCedula: record.patient.documentId,
        patientPhone: record.patient.phone,
        treatmentId,
      },
    });
  };

  const handleConfirmDelete = async () => {
    const { type, id } = deleteModalConfig;
    if (!id) return;

    setDeleteModalConfig((prev) => ({ ...prev, isDeleting: true }));
    try {
      if (type === 'consultation') {
        await deleteConsultation(id);
      } else {
        await deleteTreatment(id);
        await refetch();
      }
      setDeleteModalConfig({ visible: false, type: 'consultation', id: null, isDeleting: false });
      setToastConfig({
        visible: true,
        type: 'success',
        title: t('clinicalHistory.deleteSuccessTitle', 'Eliminado con éxito'),
        message: t('clinicalHistory.deleteSuccessMessage', 'El registro ha sido eliminado correctamente.'),
      });
    } catch (err: any) {
      setDeleteModalConfig({ visible: false, type: 'consultation', id: null, isDeleting: false });
      setToastConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: err?.message || 'No se pudo eliminar el elemento.',
      });
    }
  };

  const handleSaveConsultation = async (updatedData: Partial<Consultation>) => {
    if (!selectedConsultation) return;
    try {
      await updateConsultation(selectedConsultation.id, updatedData);
      setToastConfig({
        visible: true,
        type: 'success',
        title: t('clinicalHistory.updateSuccessTitle', 'Consulta actualizada'),
        message: t('clinicalHistory.updateSuccessMessage', 'La consulta ha sido actualizada exitosamente.'),
      });
    } catch (err: any) {
      setToastConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: err?.message || 'No se pudo actualizar la consulta.',
      });
    }
  };

  const handleSaveToothCondition = async (updatedTooth: ToothCondition) => {
    try {
      console.log('Datos del diente listos para Firebase:', updatedTooth);
      // Aquí invocarás tu servicio de actualización de Firebase en el futuro.
       const isAdultMode = record?.odontogram?.isAdult ?? true;

      // Invocamos el nuevo callback del hook expuesto
      const success = await updateOdontogram(updatedTooth, isAdultMode);
      if (success) {
        setEditingTooth(null); // Cerramos el modal tras guardar con éxito
        setToastConfig({
          visible: true,
          type: 'success',
          title: t('odontogram.toast.saveSuccessTitle', 'Pieza actualizada'),
          message: t('odontogram.toast.saveSuccessMessage', 'El estado del diente ha sido registrado correctamente.'),
        });
      }
    } catch (err) {
      // We catch this to show the error in the toast modal
      setToastConfig({
        visible: true,
        type: 'error',
        title: 'Error',
        message: 'No se pudieron guardar las modificaciones de la pieza dental.',
      });
    }
  };

  // ── 1. Acceso Denegado (Escenario 4) ──
  if (!authLoading && !hasAccess) {
    return (
      <View style={styles.screen} testID="clinical-history-access-denied">
        <AppHeader />
        <Breadcrumb
          parent={t('patientFile.title', 'Ficha del Paciente')}
          current={t('clinicalHistory.title', 'Historia Clínica')}
        />
        <AccessDeniedView
          title={t('clinicalHistory.accessDenied', 'Acceso Restringido a Odontólogos')}
          message={t(
            'clinicalHistory.accessDeniedMessage',
            'Solo el personal con rol de Odontólogo o Administrador está autorizado para consultar la historia clínica y diagnósticos de los pacientes.'
          )}
        />
      </View>
    );
  }

  // ── 2. Estado de Carga ──
  if (authLoading || recordLoading) {
    return (
      <View style={styles.screen} testID="clinical-history-loading">
        <AppHeader />
        <Breadcrumb
          parent={t('patientFile.title', 'Ficha del Paciente')}
          current={t('clinicalHistory.title', 'Historia Clínica')}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.main} />
          <Text style={styles.stateMessage}>
            {t('clinicalHistory.loading', 'Cargando historia clínica dental...')}
          </Text>
        </View>
      </View>
    );
  }

  // ── 3. Estado de Error y Reintento (Escenario 5) ──
  if (error || !record) {
    return (
      <View style={styles.screen} testID="clinical-history-error">
        <AppHeader />
        <Breadcrumb
          parent={t('patientFile.title', 'Ficha del Paciente')}
          current={t('clinicalHistory.title', 'Historia Clínica')}
        />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={56} color={theme.error} />
          <Text style={styles.stateTitle}>
            {t('clinicalHistory.errorTitle', 'Error al consultar la historia clínica')}
          </Text>
          <Text style={styles.stateMessage}>
            {error || t('clinicalHistory.errorLoad', 'Ocurrió un fallo de conexión. Intente nuevamente.')}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refetch}
            activeOpacity={0.7}
            testID="btn-retry-clinical-history"
          >
            <Ionicons name="refresh" size={18} color={theme.overMain}/>
            <Text style={styles.retryButtonText}>
              {t('clinicalHistory.retry', 'Reintentar')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── 4. Pantalla Principal Exitosa ──
  return (
    <View style={styles.screen} testID="clinical-history-screen">
      <AppHeader />
      <Breadcrumb
        parent={t('patientFile.title', 'Ficha del Paciente')}
        current={t('clinicalHistory.title', 'Historia Clínica')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tarjeta de Resumen del Paciente & Antecedentes (Escenario 1) */}
        <PatientSummaryCard
          patient={record.patient}
          onEditPatient={handleEditPatient}
        />

        {/* Barra de Pestañas: Consultas | Odontograma | Tratamientos */}
        <ClinicalHistoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Pestaña: Consultas (Escenario 3) */}
        {activeTab === 'consultas' && (
          <ConsultationsTimeline
            consultations={filteredConsultations}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onScheduleAppointment={handleScheduleAppointment}
            onRegisterConsultation={handleRegisterConsultation}
            onSelectConsultation={(c: Consultation) => {
              setSelectedConsultation(c);
              setIsEditingConsultation(false);
            }}
            onModifyConsultation={(c: Consultation) => {
              setSelectedConsultation(c);
              setIsEditingConsultation(true);
            }}
            onDeleteConsultation={(id: string) => {
              setDeleteModalConfig({
                visible: true,
                type: 'consultation',
                id,
                isDeleting: false,
              });
            }}
          />
        )}

        {/* Pestaña: Odontograma (Escenario 2 - Contenedor Preparado) */}
        {activeTab === 'odontograma' && (
          loading ? (
            <ActivityIndicator size="large" />
          ) : (
            // Se renderiza el odontograma real de la base de datos.
            // Si viene undefined, el contenedor usará de forma segura su DEFAULT_ODONTOGRAM.
            <OdontogramContainer 
              odontogram={odontogram}
              onToothSelect={(tooth) => setEditingTooth(tooth)}
            />
          )
        )}

        {/* Pestaña: Tratamientos */}
        {activeTab === 'tratamientos' && (
          <TreatmentsTimeline
            treatments={filteredTreatments}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddTreatment={handleAddTreatment}
            onModifyTreatment={handleModifyTreatment}
            onDeleteTreatment={(id: string) => {
              setDeleteModalConfig({
                visible: true,
                type: 'treatment',
                id,
                isDeleting: false,
              });
            }}
          />
        )}
      </ScrollView>

      {/* Modal Detallado de Consulta (Figma Historia Clinica (Consultas)-1) */}
      {selectedConsultation && (
        <ConsultationDetailModal
          key={`${selectedConsultation.id}-${isEditingConsultation}`}
          visible={Boolean(selectedConsultation)}
          consultation={selectedConsultation}
          patient={record.patient}
          initialEditMode={isEditingConsultation}
          onSave={handleSaveConsultation}
          onClose={() => {
            setSelectedConsultation(null);
            setIsEditingConsultation(false);
          }}
          onOpenOdontogram={() => {
            setSelectedConsultation(null);
            setIsEditingConsultation(false);
            setActiveTab('odontograma');
          }}
          onDelete={(id) => {
            setSelectedConsultation(null);
            setIsEditingConsultation(false);
            setDeleteModalConfig({
              visible: true,
              type: 'consultation',
              id,
              isDeleting: false,
            });
          }}
        />
      )}

      {/* Modal de Confirmación para Eliminación */}
      <ConfirmationModal
        visible={deleteModalConfig.visible}
        title={t('clinicalHistory.confirmDeleteTitle', 'Confirmar Eliminación')}
        message={t(
          'clinicalHistory.confirmDeleteMessage',
          '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.'
        )}
        confirmText={t('clinicalHistory.delete', 'Eliminar')}
        cancelText={t('clinicalHistory.cancel', 'Cancelar')}
        icon="trash-outline"
        isDestructive={true}
        isSubmitting={deleteModalConfig.isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() =>
          setDeleteModalConfig({ visible: false, type: 'consultation', id: null, isDeleting: false })
        }
      />

      {/* Notificación Toast */}
      <NotificationToast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        onDismiss={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* Tooth Condition Modal */}
      <ToothConditionModal
        visible={Boolean(editingTooth)}
        tooth={editingTooth ?? undefined}
        isSubmitting={false}
        onConfirm={handleSaveToothCondition}
        onCancel={() => setEditingTooth(null)}
      />
    </View>
  );
}