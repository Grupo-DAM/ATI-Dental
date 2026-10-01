import React, { useMemo } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AccessDeniedView } from '@/components/access-denied-view';
import { AppHeader } from '@/components/app-header';
import { UserCard } from '@/components/users-list/user-card';
import { usePatients } from '@/hooks/user-list/use-patients-list';
import { usePatientFiltering } from '@/hooks/user-list/use-list-filtering';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import { createAccessDeniedStyles } from '@/constants/styles/access-denied.styles';
import { useRouter } from 'expo-router';
import { AdminListLayout } from '@/components/users-list/admin-list-layout';

export default function AdminUserList() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useTheme();
  const deniedStyles = useMemo(() => createAccessDeniedStyles(theme), [theme]);
  const { user: authUser, loading: authLoading } = useAuth();

  const isOdontologo = authUser ? isOdontologoUser(authUser) : false;
  const isAdmin = authUser ? isAdminUser(authUser) : false;
  const hasPermission = isOdontologo || isAdmin;

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
    >
      {filter.paginatedData.map((user: any) => (
        <UserCard
          key={user.id}
          ID={user.patientCode}
          name={user.fullName}
          email={user.email}
          type="patient"
          lastVisit={user.ultima_visita}
          nextVisit={user.proxima_vista}
          onEdit={() => handleEditPatient(user)}
          onPress={() => handleViewPatient(user)}
          onLongPress={() => handleLongPress(user)}
        />
      ))}
    </AdminListLayout>
  );
}