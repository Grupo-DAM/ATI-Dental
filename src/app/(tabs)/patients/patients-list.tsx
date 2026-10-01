import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserCard } from '@/components/users-list/user-card';
import { usePatients } from '@/hooks/user-list/use-patients-list';
import { usePatientFiltering } from '@/hooks/user-list/use-list-filtering';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import { useRouter } from 'expo-router';
import { AdminListLayout } from '@/components/users-list/admin-list-layout';
import { formatVisitDay } from '@/utils/patient-visits';

export default function AdminUserList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuth();

  const isOdontologo = authUser ? isOdontologoUser(authUser) : false;
  const isAdmin = authUser ? isAdminUser(authUser) : false;
  const hasPermission = isOdontologo || isAdmin;

  useEffect(() => {
    if (!authLoading && !hasPermission) {
      Alert.alert(t('patients-list.accessDeniedTitle'), t('patients-list.odontologoOnlyViewAlert'));
    }
  }, [authLoading, hasPermission, t]);

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