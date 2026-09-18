// hooks/use-users.ts
import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import auth from '@react-native-firebase/auth';
import { firestore } from '@/config/firebase';
import { isAdminUser } from '@/constants/user-roles';

export function useUsers(authUser: any, t: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Status modal state
  const [selectedUserForModal, setSelectedUserForModal] = useState<{
    id: string;
    name: string;
    targetStatus: 'activo' | 'inactivo';
    currentStatus: string;
  } | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStatusLoading, setIsStatusLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('usuarios')
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setUsers(data);
          setIsFromCache(snapshot.metadata.fromCache);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching users: ", error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      const state = await NetInfo.refresh();
      if (state.isConnected) {
        await firestore().enableNetwork();
      } else {
        Alert.alert("Sin Conexión", "Aún no hay acceso a internet.");
      }
    } catch (error) {
      console.error("Error retrying connection: ", error);
    } finally {
      setIsRetrying(false);
    }
  };

  const handleInitiateStatusChange = useCallback((userItem: { id: string; nombre?: string; email?: string; estado: string }) => {
    const currentUser = auth().currentUser;

    if (!currentUser) {
      Alert.alert(
        t('admin-users.accessDeniedTitle', 'Acceso Denegado'),
        t('admin-users.adminOnlyAction', 'Debes iniciar sesión para realizar modificaciones.')
      );
      return;
    }

    if (authUser && !isAdminUser(authUser)) {
      Alert.alert(
        t('admin-users.accessDeniedTitle', 'Acceso Denegado'),
        t('admin-users.adminOnlyAction', 'Solo los administradores pueden modificar el estado de los usuarios.')
      );
      return;
    }

    const nextStatus: 'activo' | 'inactivo' = userItem.estado === 'activo' ? 'inactivo' : 'activo';
    setSelectedUserForModal({
      id: userItem.id,
      name: userItem.nombre || userItem.email || 'Usuario',
      targetStatus: nextStatus,
      currentStatus: userItem.estado,
    });
    setIsModalVisible(true);
  }, [authUser, t]);

  const handleCancelStatusChange = useCallback(() => {
    if (isStatusLoading) return;
    setIsModalVisible(false);
    setSelectedUserForModal(null);
  }, [isStatusLoading]);

  const handleConfirmStatusChange = useCallback(async () => {
    if (!selectedUserForModal) return;

    setIsStatusLoading(true);
    const { id, targetStatus } = selectedUserForModal;

    try {
      await firestore().collection('usuarios').doc(id).update({ estado: targetStatus });

      setIsModalVisible(false);
      setSelectedUserForModal(null);

      const successMessage = targetStatus === 'activo'
        ? t('admin-users.userActivatedSuccess', 'Usuario activado con éxito')
        : t('admin-users.userDeactivatedSuccess', 'Usuario desactivado con éxito');

      Alert.alert(t('admin-users.successTitle', 'Éxito'), successMessage);
    } catch (error) {
      console.error("Error updating user status in DB: ", error);
      setIsModalVisible(false);
      setSelectedUserForModal(null);

      const errorMessage = targetStatus === 'activo'
        ? t('admin-users.errorActivateUser', 'No se pudo activar al usuario. Intente nuevamente')
        : t('admin-users.errorDeactivateUser', 'No se pudo desactivar al usuario. Intente nuevamente');

      Alert.alert(t('admin-users.errorTitle', 'Error'), errorMessage);
    } finally {
      setIsStatusLoading(false);
    }
  }, [selectedUserForModal, t]);

  return {
    users,
    loading,
    isFromCache,
    isRetrying,
    handleRetryConnection,
    selectedUserForModal,
    isModalVisible,
    isStatusLoading,
    handleInitiateStatusChange,
    handleCancelStatusChange,
    handleConfirmStatusChange,
  };
}