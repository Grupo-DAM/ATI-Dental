import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Platform, StyleSheet, Image, TextInput,
  ScrollView, Pressable} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { SearchFilter } from '@/components/search-filter-selector';
import { ListPages } from '@/components/list-pages-viewer';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTheme } from '@/hooks/use-theme';
import { UserCard } from '@/components/user-card';
import { firestore } from '@/config/firebase';

export default function AdminUserList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);

    const pageCapacity = 5;
    const [ currentPage, setCurrentPage ] = useState<int>(0);

    const [ users, setUsers ] = useState<any[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ isFromCache, setIsFromCache ] = useState(false)

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

    const [searchQuery, setSearchQuery] = useState('');
    const [orderBy, setOrderBy] = useState('name');

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesName = user.nombre?.toLowerCase().includes(query);
            const matchesEmail = user.email?.toLowerCase().includes(query);
            // falta la opcion de filtrar por ID cuando se añada a los usuarios
            return matchesName || matchesEmail;
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
    }, [users, searchQuery, orderBy]);

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


              {/* Filter section */}
              <SearchFilter
                general={true}
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    setCurrentPage(1);
                }}
                onChangeOrder = {setOrderBy}
              />

              {/* List of users*/}
              {paginatedUsers.map((user: userList) => (
                  <UserCard key = {user.id}
                    ID="#P-0042"
                    name={user.nombre}
                    email= {user.email}
                    type='general'
                    status={user.estado}
                    role= {user.rol}
                  />
              ))}

              {/*Selection of result pages*/}
              <ListPages
                total= {users.length}
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
    }
});