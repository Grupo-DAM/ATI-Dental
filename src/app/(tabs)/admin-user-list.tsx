import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { View, Text, Platform, StyleSheet, Image, TextInput} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Collapsible } from '@/components/ui/collapsible.tsx';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { useTheme } from '@/hooks/use-theme';
import { UserCard } from '@/components/user-card';
import { firestore } from '@/config/firebase';

const SearchIcon = require('@/assets/icons/search.png');

export default function AdminUserList() {
    const { t } = useTranslation();
    const theme = useTheme();
    const styles = createStyles(theme);

    const [ users, setUsers ] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFromCache, setIsFromCache] = useState(false);

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

    return (
        <ThemedView style={styles.container}>
            <AppHeader />
            <Breadcrumb parent={t('admin.path')} current={t('admin-users.path')} />
              <View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <ThemedText style={styles.mainTitle}>{t('admin-users.title')}</ThemedText>
                <ThemedText style={styles.subtitle}>
                  {t('admin-users.subtitle')}
                </ThemedText>
              </View>

              {/* Filter section */}
              <View style = {styles.filterContainer}>
                <View style = {styles.searchContainer}>
                    <Text style = {styles.filterLabels}>{t('admin-users.searchUsers')}</Text>
                    <View style = {styles.inputContainer}>
                        <Image
                            source={SearchIcon}
                            style={styles.icon}
                          />
                        <TextInput
                            placeholder={t('admin-users.searchUserPlaceholder')}
                            placeholderTextColor= {theme.placeholderColor}
                            style={styles.input}
                          />
                    </View>
                </View>
                <View style = {styles.orderByContainer}>
                    <Text style = {styles.filterLabels}>
                        {t('admin-users.orderBy')}
                    </Text>

                </View>
              </View>

              {users.map((user: userList) => (
                  <UserCard key = {user.id}
                    ID="#P-0042"
                    name={user.nombre}
                    email= {user.email}
                    type='general'
                    status={user.estado}
                    role= {user.rol}
                  />
              ))}

              </View>
        </ThemedView>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
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
        gap: 16,
        paddingHorizontal: 20
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
        paddingLeft: Spacing.three || 12,
        paddingRight: 4,
        marginBottom: Spacing.four || 16,
        height: 50,
    },
    searchContainer: {
        width: '70%',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
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
        width: '20%',
    }
});