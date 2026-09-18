import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert } from 'react-native';
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
import { firestore } from '@/config/firebase';
import { USER_ROLES, LEGACY_ADMIN_ROLE, isAdminUser } from '@/constants/user-roles';
import { useAuth } from '@/hooks/use-auth';
import { UserStatusModal } from '@/components/users-list/user-status-modal';
import { createListStyles } from '@/components/users-list/styles/users-list.styles'
import { useUsers } from '@/hooks/user-list/use-users';
import { useUserFiltering } from '@/hooks/user-list/use-list-filtering';


function GoToEditUserCard(user: any) {
    // add here the route to 'create patient card' but the information must be filled in
    Alert.alert("Editar Perfil de Usuario", `Está intentando editar el usuario ${user.nombre}`);
    console.log('go to edit');
}

export default function AdminUserList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createListStyles(theme);
    const netInfo = useNetInfo();
    const { user: authUser } = useAuth();

    const {
        users,
        isRetrying,
        handleRetryConnection,
        selectedUserForModal,
        isModalVisible,
        isStatusLoading,
        handleInitiateStatusChange,
        handleCancelStatusChange,
        handleConfirmStatusChange,
    } = useUsers(authUser, t);

    const filter = useUserFiltering(users);

    return (
        <ThemedView style={styles.container}>
            <AppHeader />
            <Breadcrumb parent={t('admin.path')} current={t('admin-users.path')} />
            <ScrollView contentContainerStyle={styles.scrollContent}>


              {/* Title Section */}
              <View style={styles.titleSection}>
                <ThemedText style={styles.mainTitle}>{t('admin-users.title')}</ThemedText>
                <ThemedText style={styles.subtitle}>
                  {t('admin-users.subtitle')}
                </ThemedText>
              </View>

              {!netInfo.isConnected && (
                <OfflineBanner isRetrying={isRetrying} onRetry={handleRetryConnection} />
              )}


              {/* Filter section */}
              <SearchFilter
                general={true}
                value={filter.searchQuery}
                onChangeText={(text) => {
                    filter.setSearchQuery(text);
                    filter.setCurrentPage(1);
                }}
                onChangeOrder = {filter.setOrderBy}
                activeRoles={filter.selectedRoles}
                activeStatus={filter.selectedStatus}
                onToggleFilter={filter.handleToggleFilter}
              />
              {/* List of users*/}
              {filter.filteredData.length == 0 ? (
                  <NoResultSearch general = {true} />
              ) : (
                  filter.paginatedData.map((user: any) => (
                        <UserCard key = {user.id}
                          ID="#P-0042"
                          name={user.nombre}
                          email= {user.email}
                          type='general'
                          status={user.estado === 'activo'}
                          switchStatus = {()=>handleInitiateStatusChange(user)}
                          role= {user.rol}
                          onEdit={() => GoToEditUserCard(user)}
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

            {selectedUserForModal && (
                <UserStatusModal
                    visible={isModalVisible}
                    userName={selectedUserForModal.name}
                    targetStatus={selectedUserForModal.targetStatus}
                    loading={isStatusLoading}
                    onConfirm={handleConfirmStatusChange}
                    onCancel={handleCancelStatusChange}
                />
            )}
        </ThemedView>
    );
}