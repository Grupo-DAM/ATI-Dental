import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { UserCard } from '@/components/users-list/user-card';
import { isAdminUser } from '@/constants/user-roles';
import { useAuth } from '@/hooks/use-auth';
import { UserStatusModal } from '@/components/users-list/user-status-modal';
import { useUsers } from '@/hooks/user-list/use-users';
import { useUserFiltering } from '@/hooks/user-list/use-list-filtering';
import { AdminListLayout } from '@/components/users-list/admin-list-layout';

function handleEditUserCard(user: any) {
  Alert.alert('Editar Perfil de Usuario', `Está intentando editar el usuario ${user.nombre}`);
}

export default function AdminUserList() {
  const { t } = useTranslation();
  const { user: authUser, loading: authLoading } = useAuth();
  const isAdmin = authUser ? isAdminUser(authUser) : false;

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      Alert.alert(t('admin-users.accessDeniedTitle'), t('admin-users.adminOnlyViewAlert'));
    }
  }, [authLoading, isAdmin, t]);

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
    <>
      <AdminListLayout
        titleKey="admin-users.title"
        subtitleKey="admin-users.subtitle"
        parentBreadcrumbKey="admin.path"
        currentBreadcrumbKey="admin-users.path"
        accessDeniedTitleKey="admin-users.accessDeniedTitle"
        accessDeniedDescKey="admin-users.adminOnlyView"
        authLoading={authLoading}
        hasPermission={isAdmin}
        isRetrying={isRetrying}
        handleRetryConnection={handleRetryConnection}
        filter={filter}
        isGeneralFilter={true}
      >
        {filter.paginatedData.map((user: any) => (
          <UserCard
            key={user.id}
            ID="#P-0042"
            name={user.nombre}
            email={user.email}
            type="general"
            status={user.estado === 'activo'}
            switchStatus={() => handleInitiateStatusChange(user)}
            role={user.rol}
            onEdit={() => handleEditUserCard(user)}
          />
        ))}
      </AdminListLayout>

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
    </>
  );
}