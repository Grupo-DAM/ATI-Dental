import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useEffect } from 'react';
import { View, ScrollView, Alert, ActivityIndicator} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SearchFilter } from '@/components/users-list/search-filter-selector';
import { ListPages } from '@/components/users-list/list-pages-viewer';
import { NoResultSearch } from '@/components/users-list/no-results';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { OfflineBanner } from '@/components/offline-banner';
import { useTheme } from '@/hooks/use-theme';
import { UserCard } from '@/components/users-list/user-card';
import { usePatients } from '@/hooks/user-list/use-patients-list';
import { usePatientFiltering } from '@/hooks/user-list/use-list-filtering';
import { createListStyles } from '@/components/users-list/styles/users-list.styles';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import { useRouter } from 'expo-router';

export default function AdminUserList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createListStyles(theme);
    const netInfo = useNetInfo();
    const { user: authUser, loading: authLoading } = useAuth();

    const isOdontologo = authUser ? isOdontologoUser(authUser) : false;
    const isAdmin = authUser ? isAdminUser(authUser) : false;

    useEffect(() => {
        if (!authLoading && !(isOdontologo || isAdmin)) {
            Alert.alert(
                t('patients-list.accessDeniedTitle'),
                t('patients-list.odontologoOnlyViewAlert')
            );
        }
    }, [authLoading, isOdontologo, t]);

    const { patients, isRetrying, handleRetryConnection } = usePatients();
    const filter = usePatientFiltering(patients);

    const router = useRouter();

    const handleEditPatient = (patient: any) => {
        router.push({
            pathname: '/(tabs)/patients/register-patient', 
            params: {
            patientId: patient.id,
            patientData: JSON.stringify(patient),
            },
        });
    };

    function handleViewPatient(patient: any) {
        // add here the rout to 'patient card' of the given patient
        Alert.alert("Ver ficha de paciente", `Está intentando ver la ficha del paciente ${patient.nombre}`);
        console.log('go to patient card')
    }
    
    function LongPress(patient: any) {
        Alert.alert("Opciones del paciente")
        console.log('open patient option')
        // add here the options Modal code
    }

    // 1. Loader visual mientras se valida la sesión con Firebase/Firestore
    if (authLoading) {
        return (
            <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.main} />
            </ThemedView>
        );
    }

    // 2. Pantalla de bloqueo si el usuario no tiene el rol 'odontologo'
    if (!isOdontologo && !isAdmin) {
        return (
            <ThemedView style={styles.container}>
                <AppHeader />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <ThemedText type="subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>
                        {t('patients-list.accessDeniedTitle')}
                    </ThemedText>
                    <ThemedText style={{ textAlign: 'center' }}>
                        {t('patients-list.odontologoOnlyView')}
                    </ThemedText>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView testID = "list-patients-screen" style={styles.container}>
            <AppHeader />
            <Breadcrumb parent={t('patients.path')} current={t('patients-list.path')} />
            <ScrollView contentContainerStyle={styles.scrollContent}>


              {/* Title Section */}
              <View style={styles.titleSection}>
                <ThemedText style={styles.mainTitle}>{t('patients-list.title')}</ThemedText>
                <ThemedText style={styles.subtitle}>
                  {t('patients-list.subtitle')}
                </ThemedText>
              </View>

              
                {!netInfo.isConnected && (
                    <OfflineBanner isRetrying={isRetrying} onRetry={handleRetryConnection} />
                )}


              {/* Filter section */}
              <SearchFilter
                general={false}
                value={filter.searchQuery}
                onChangeText={(text) => {
                    filter.setSearchQuery(text);
                    filter.setCurrentPage(1);
                }}
                onChangeOrder = {filter.setOrderBy}
              />

              {/* List of users*/}
              {filter.filteredData.length == 0 ? (
                  <NoResultSearch general = {false} />
              ) : (
                  filter.paginatedData.map((user: any) => (
                        <UserCard key = {user.id}
                          ID={user.patientCode}
                          name={user.fullName}
                          email= {user.email}
                          type='patient'
                          lastVisit={user.ultima_visita}
                          nextVisit= {user.proxima_vista}
                          onEdit = {() => handleEditPatient(user)}
                          onPress = {() => handleViewPatient(user)}
                          onLongPress={() => LongPress(user)}
                        />
                  ))
              )}

              {/*Selection of result pages*/}
              <ListPages
                total= {filter.filteredData.length}
                maxRange= {filter.maxRange}
                minRange= {filter.minRange}
                currentPage= {filter.currentPage}
                totalPages= {filter.totalPages}
                onPageChange = {filter.setCurrentPage}
              />
            </ScrollView>
        </ThemedView>
    );
}