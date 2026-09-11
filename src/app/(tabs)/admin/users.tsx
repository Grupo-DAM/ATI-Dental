import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import auth from '@react-native-firebase/auth';
import { useTranslation } from 'react-i18next';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Platform, StyleSheet, TextInput,
  ScrollView, Pressable, Alert, ActivityIndicator} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { SearchFilter } from '@/components/users-list/search-filter-selector';
import { ListPages } from '@/components/users-list/list-pages-viewer';
import { NoResultSearch } from '@/components/users-list/no-results';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTheme } from '@/hooks/use-theme';
import { UserCard } from '@/components/users-list/user-card';
import { firestore } from '@/config/firebase';
import { USER_ROLES, LEGACY_ADMIN_ROLE } from '@/constants/user-roles';

export default function AdminUserList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);
    const netInfo = useNetInfo();

    const pageCapacity = 5;
    const [ currentPage, setCurrentPage ] = useState<int>(0);

    const [ users, setUsers ] = useState<any[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ isFromCache, setIsFromCache ] = useState(false);
    const [ isRetrying, setIsRetrying ] = useState(false);

    useEffect(() => {
        const userList = firestore().collection('usuarios')
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

        return () => userList()
    }, []);

    const toggleUserStatus = async (userId: string, currentStatus: string) => {
        const currentUser = auth().currentUser;

        if (!currentUser) {
            Alert.alert("Acceso Denegado", "Debes iniciar sesión para realizar modificaciones.");
            return;
        }

        const nextStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';

        try {
            await firestore()
                .collection('usuarios')
                .doc(userId)
                .update({
                    estado: nextStatus
                });
        } catch (error) {
            console.error("Error updating user status in DB: ", error);
            Alert.alert("Error", t('admin-users.errorUpdateUserStatus'));
        }
    };

    const handleRetryConnection = async () => {
        setIsRetrying(true);
        try {
            // Force network check
            const state = await NetInfo.refresh();

            if (state.isConnected) {
                // Enable network on Firestore to pull fresh data
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

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

    const handleToggleFilter = (categoryTitle: string, optionName: string) => {
        setCurrentPage(1); // Reset page on filter toggle
        if (categoryTitle === 'rol') {
            setSelectedRoles(prev =>
                prev.includes(optionName)
                    ? prev.filter(r => r !== optionName)
                    : [...prev, optionName]
            );
        } else if (categoryTitle === 'estado') {
            setSelectedStatus(prev =>
                prev.includes(optionName)
                    ? prev.filter(s => s !== optionName)
                    : [...prev, optionName]
            );
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [orderBy, setOrderBy] = useState('name');

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesName = user.nombre?.toLowerCase().includes(query);
            const matchesEmail = user.email?.toLowerCase().includes(query);
            // falta la opcion de filtrar por ID cuando se añada a los usuarios
            const matchesSearch = matchesName || matchesEmail;

            const matchesRole = selectedRoles.length === 0 || selectedRoles.some(role => {
                 if (role === USER_ROLES.ADMIN) {
                     return user.rol === USER_ROLES.ADMIN || user.rol === LEGACY_ADMIN_ROLE;
                 }
                 return user.rol === role;
            });
            const matchesStatus = selectedStatus.length === 0 ||  selectedStatus.includes(user.estado);

            return matchesSearch && matchesRole && matchesStatus;
        }).sort((a, b) => {
              if (orderBy === 'name') {
                  const nameA = a.nombre?.toLowerCase() || '';
                  const nameB = b.nombre?.toLowerCase() || '';
                  const hasA = nameA.length > 0;
                  const hasB = nameB.length > 0;

                  if (hasA && !hasB) return -1;
                  if (!hasA && hasB) return 1;

                  return nameA.localeCompare(nameB);
              } else if (orderBy === 'lastname') {
                  const partsA = a.nombre?.toLowerCase().split(' ') || [];
                  const partsB = b.nombre?.toLowerCase().split(' ') || [];

                  const lastNameA = partsA.slice(1).join(' ') || '';
                  const lastNameB = partsB.slice(1).join(' ') || '';
                  const hasA = lastNameA.length > 0;
                  const hasB = lastNameB.length > 0;

                  if (hasA && !hasB) return -1;
                  if (!hasA && hasB) return 1;

                  return lastNameA.localeCompare(lastNameB);
              }
              // falta la opcion de ordenar por ID cuando se añada a los usuarios
              return 0;
          });
    }, [users, searchQuery, orderBy, selectedRoles, selectedStatus, t]);

    const startIndex = (currentPage - 1) * pageCapacity;
    const endIndex = startIndex + pageCapacity;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    const minRange = filteredUsers.length > 0 ? startIndex + 1 : 0;
    const maxRange = Math.min(endIndex, filteredUsers.length);
    const totalPages = Math.ceil(filteredUsers.length / pageCapacity);

    useEffect(() => {
        if (filteredUsers.length > 0 && currentPage === 0) {
            setCurrentPage(1);
        } else if (filteredUsers.length === 0) {
            setCurrentPage(0);
        }
    }, [filteredUsers, currentPage]);

    const isOffline = !netInfo.isConnected;

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

              {isOffline && (
                <View style={styles.offlineBanner}>
                    <View style={styles.offlineMessageContainer}>
                      <Ionicons name="cloud-offline-outline" size={16} color={theme.offlineBannerText} style={{ marginRight: 6 }} />
                      <Text style={styles.offlineText}>{t('contacts.offlineMode')}</Text>
                    </View>
                  <Pressable
                    style={({ pressed }) => [
                    styles.retryButton,
                    pressed && styles.retryButtonPressed
                    ]}
                    onPress={handleRetryConnection}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                          <ActivityIndicator size="small" color={theme.offlineBannerText} />
                        ) : (
                          <>
                            <Ionicons name="refresh-outline" size={14} color={theme.offlineBannerText} style={{ marginRight: 4 }} />
                            <Text style={styles.retryButtonText}>{t('common.retry', 'Reintentar')}</Text>
                          </>
                        )}
                  </Pressable>
                </View>
              )}


              {/* Filter section */}
              <SearchFilter
                general={true}
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    setCurrentPage(1);
                }}
                onChangeOrder = {setOrderBy}
                activeRoles={selectedRoles}
                activeStatus={selectedStatus}
                onToggleFilter={handleToggleFilter}
              />
              {/* List of users*/}
              {filteredUsers.length == 0 ? (
                  <NoResultSearch general = {true} />
              ) : (
                  paginatedUsers.map((user: userList) => (
                        <UserCard key = {user.id}
                          ID="#P-0042"
                          name={user.nombre}
                          email= {user.email}
                          type='general'
                          status={user.estado === 'activo'}
                          switchStatus = {()=>toggleUserStatus(user.id, user.estado)}
                          role= {user.rol}
                        />
                  ))
              )}

              {/*Selection of result pages*/}
              <ListPages
                total= {filteredUsers.length}
                maxRange= {maxRange}
                minRange= {minRange}
                currentPage= {currentPage}
                totalPages= {totalPages}
                onPageChange = {setCurrentPage}
              />
            </ScrollView>
        </ThemedView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.pageTitle, // Ebony Clay
    fontFamily: 'Open Sans',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.pageSubtitle, // Pale Sky
    lineHeight: 20,
    fontFamily: 'Open Sans',
  },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    filterLabels: {
        color: theme.textNames,
        fontWeight: 600,
        fontSize: 12,
        lineHeight: 20,
        fontFamily: 'Open Sans',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.backgroundElement,
        borderRadius: 8,
        paddingLeft: Spacing.two || 6,
        paddingRight: 4,
        height: 28,
    },
    searchContainer: {
        width: '70%',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 12,
        paddingVertical: 0,
        color: theme.text,
        fontFamily: Fonts.regular || 'System'
    },
    icon: {
        margin: Spacing.two || 8,
        justifyContent: 'center',
        alignItems: 'center',
        tintColor: theme.placeholderColor
    },
    orderByContainer: {
        width: '25%',
    },offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.offlineBannerBackground || '#FEF3C7',
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: theme.offlineBannerBorder || '#F59E0B',
    },
    offlineMessageContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    offlineText: {
      fontSize: 12,
      color: theme.offlineBannerText || '#92400E',
      fontFamily: 'Open Sans',
      fontWeight: '600',
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(180, 83, 9, 0.1)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: 'rgba(180, 83, 9, 0.3)',
    },
    retryButtonPressed: {
      opacity: 0.7,
    },
    retryButtonText: {
      fontSize: 12,
      color: '#B45309',
      fontWeight: '600',
      fontFamily: 'Open Sans',
    },
});