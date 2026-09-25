import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import { useClinicalRecord } from '@/hooks/use-clinical-record';
import { PatientSummaryCard } from '@/components/clinical-history/PatientSummaryCard';
import { ClinicalHistoryTabs } from '@/components/clinical-history/ClinicalHistoryTabs';
import { ConsultationsTimeline } from '@/components/clinical-history/ConsultationsTimeline';
import { OdontogramContainer } from '@/components/clinical-history/OdontogramContainer';
import { TreatmentsTimeline } from '@/components/clinical-history/TreatmentsTimeline';
import { ConsultationDetailModal } from '@/components/clinical-history/ConsultationDetailModal';
import { NotificationToast } from '@/components/notification-toast';
import { ConfirmationModal } from '@/components/confirmation-modal';
import { deleteTreatment } from '@/services/treatment-service';
import { Consultation } from '@/types/clinical-record';

export default function ClinicalHistoryScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);
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
  } = useClinicalRecord(hasAccess ? patientId : undefined);

  const [isEditingConsultation, setIsEditingConsultation] = useState(false);

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

  const handleEditPatient = () => {
    if (!record?.patient) return;
    router.push({
      pathname: '/(tabs)/patients/register-patient' as any,
      params: { patientId: record.patient.id, patientData: JSON.stringify(record.patient) },
    });
  };

  const handleScheduleAppointment = () => {
    router.push('/(tabs)/agenda' as any);
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

  // ── 1. Acceso Denegado (Escenario 4) ──
  if (!authLoading && !hasAccess) {
    return (
      <View style={styles.screen} testID="clinical-history-access-denied">
        <AppHeader />
        <Breadcrumb
          parent={t('patientFile.title', 'Ficha del Paciente')}
          current={t('clinicalHistory.title', 'Historia Clínica')}
        />
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={theme.pageSubtitle} />
          <Text style={styles.stateTitle}>
            {t('clinicalHistory.accessDenied', 'Acceso Restringido a Odontólogos')}
          </Text>
          <Text style={styles.stateMessage}>
            {t(
              'clinicalHistory.accessDeniedMessage',
              'Solo el personal con rol de Odontólogo o Administrador está autorizado para consultar la historia clínica y diagnósticos de los pacientes.'
            )}
          </Text>
        </View>
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
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
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
          <OdontogramContainer odontogram={record.odontogram} />
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
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollContent: {
      paddingBottom: Platform.OS === 'ios' ? 100 : 80,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    stateTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.pageTitle,
      fontFamily: 'Open Sans',
      marginTop: 16,
      textAlign: 'center',
    },
    stateMessage: {
      fontSize: 14,
      color: theme.pageSubtitle,
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
      backgroundColor: theme.main,
      paddingHorizontal: 22,
      paddingVertical: 12,
      borderRadius: 10,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
  });
