import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import React from 'react';
import { View, ScrollView, Alert} from 'react-native';
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
import { createListStyles } from '@/components/users-list/styles/users-list.styles'

function GoToEditPatientCard(patient: any) {
    // add here the route to 'create patient card' but the information must be filled in
    Alert.alert("Editar ficha de paciente", `Está intentando editar la ficha del paciente ${patient.nombre}`);
    console.log('go to edit');
}

function GoToPatientCard(patient: any) {
    // add here the rout to 'patient card' of the given patient
    Alert.alert("Ver ficha de paciente", `Está intentando ver la ficha del paciente ${patient.nombre}`);
    console.log('go to patient card')
}

export default function AdminUserList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createListStyles(theme);
    const netInfo = useNetInfo();

    const { patients, isRetrying, handleRetryConnection } = usePatients();
    const filter = usePatientFiltering(patients);
    
    function LongPress(patient: any) {
        Alert.alert("Opciones del paciente")
        console.log('open patient option')
        // add here the options Modal code
    }

    return (
        <ThemedView style={styles.container}>
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
                          onEdit = {() => GoToEditPatientCard(user)}
                          onPress = {() => GoToPatientCard(user)}
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