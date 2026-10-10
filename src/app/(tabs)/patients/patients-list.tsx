import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccessDeniedView } from '@/components/access-denied-view';
import { AppHeader } from '@/components/app-header';
import { UserCard } from '@/components/users-list/user-card';
import { usePatients } from '@/hooks/user-list/use-patients-list';
import { usePatientFiltering } from '@/hooks/user-list/use-list-filtering';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { isOdontologoUser, isAdminUser, isAsistenteUser } from '@/constants/user-roles';
import { createAccessDeniedStyles } from '@/constants/styles/access-denied.styles';
import { useRouter } from 'expo-router';
import { AdminListLayout } from '@/components/users-list/admin-list-layout';
import { formatVisitDay } from '@/utils/patient-visits';
import { Image } from 'expo-image';
import { exportPatientDirectoryPdf } from '@/services/patient-directory-export';

export default function AdminUserList() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const deniedStyles = useMemo(() => createAccessDeniedStyles(theme), [theme]);
  const { user: authUser, loading: authLoading } = useAuth();

  const isOdontologo = authUser ? isOdontologoUser(authUser) : false;
  const isAdmin = authUser ? isAdminUser(authUser) : false;
  const isAsistente = authUser ? isAsistenteUser(authUser) : false;
  const hasPermission = isOdontologo || isAdmin || isAsistente;

  const canExport = isAdmin || isOdontologo;
  const [isExportingList, setIsExportingList] = useState(false);
  const PdfIcon = require('@/assets/icons/pdf.svg');

  const { patients, isRetrying, handleRetryConnection } = usePatients();
  const filter = usePatientFiltering(patients);

  const handleEditPatient = (patient: any) => {
    router.push({
      pathname: '/(tabs)/patients/register-patient' as any,
      params: { patientId: patient.id, patientData: JSON.stringify(patient) },
    });
  };

  const handleViewPatient = (patient: any) => {
    router.push({
      pathname: '/(tabs)/patient-file' as any,
      params: { patientId: patient.id },
    });
  };

  const handleLongPress = (patient: any) => {
    Alert.alert('Opciones del paciente');
  };

  const handleExportPdf = async () => {
    if (isExportingList) return;
    const dataToExport = filter.filteredData;
    if (!dataToExport || dataToExport.length === 0) {
      Alert.alert(
        t('patients-list.exportPdf'),
        t('patients-list.noPatientsToExport') || 'No hay pacientes para exportar en la lista actual'
      );
      return;
    }
    setIsExportingList(true);
    try {
      await exportPatientDirectoryPdf({
        patients: dataToExport,
        language: (i18n?.language?.startsWith('en') ? 'en' : 'es'),
        generatedBy: authUser?.displayName || authUser?.email || t('navigation.roles.admin'),
        searchQuery: filter.searchQuery,
      });
    } catch (error) {
      console.error('[patients-list] Error exporting PDF:', error);
      Alert.alert(
        t('patients-list.exportPdf'),
        t('patients-list.exportError') || 'Ocurrió un error al exportar la lista de pacientes.'
      );
    } finally {
      setIsExportingList(false);
    }
  };

  if (!authLoading && !hasPermission) {
    return (
      <View style={deniedStyles.screen} testID="list-patients-screen">
        <AppHeader />
        <AccessDeniedView
          title={t('patients-list.accessDeniedTitle')}
          message={t('patients-list.odontologoOnlyView')}
        />
      </View>
    );
  }

  const exportPdfButton = canExport && filter.filteredData.length > 0 ? (
    <TouchableOpacity
      testID="btn-export-patients-pdf"
      style={{
        width: 44,
        height: 40,
        borderRadius: 8,
        backgroundColor: theme.main,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: isExportingList ? 0.6 : 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      }}
      onPress={handleExportPdf}
      disabled={isExportingList}
      activeOpacity={0.7}
      accessibilityLabel={t('patients-list.exportPdf')}
    >
      {isExportingList ? (
        <ActivityIndicator size="small" color={theme.overMain} testID="export-pdf-spinner" />
      ) : (
        <Image source={PdfIcon} style={{ width: 20, height: 20 }} contentFit="contain" />
      )}
    </TouchableOpacity>
  ) : null;

  return (
    <AdminListLayout
      testID="list-patients-screen"
      titleKey="patients-list.title"
      subtitleKey="patients-list.subtitle"
      parentBreadcrumbKey="patients.path"
      currentBreadcrumbKey="patients-list.path"
      accessDeniedTitleKey="patients-list.accessDeniedTitle"
      accessDeniedDescKey="patients-list.odontologoOnlyView"
      authLoading={authLoading}
      hasPermission={hasPermission}
      isRetrying={isRetrying}
      handleRetryConnection={handleRetryConnection}
      filter={filter}
      isGeneralFilter={false}
      footerAction={exportPdfButton}
    >
      {filter.paginatedData.map((user: any) => (
        <UserCard
          key={user.id}
          ID={user.patientCode}
          name={user.fullName}
          email={user.email}
          type="patient"
          lastVisit={formatVisitDay(user.ultima_visita || user.lastVisit || user.ultimaVisita)}
          nextVisit={formatVisitDay(user.proxima_vista || user.proxima_visita || user.nextAppointment || user.proximaCita)}
          onEdit={() => handleEditPatient(user)}
          onPress={() => handleViewPatient(user)}
          onLongPress={() => handleLongPress(user)}
        />
      ))}
    </AdminListLayout>
  );
}