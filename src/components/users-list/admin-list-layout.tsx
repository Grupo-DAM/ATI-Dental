import React, { ReactNode, useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SearchFilter } from '@/components/users-list/search-filter-selector';
import { ListPages } from '@/components/users-list/list-pages-viewer';
import { NoResultSearch } from '@/components/users-list/no-results';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { OfflineBanner } from '@/components/offline-banner';
import { useTheme } from '@/hooks/use-theme';
import { createListStyles } from '@/constants/styles/users-list.styles';

interface AdminListLayoutProps {
  titleKey: string;
  subtitleKey: string;
  parentBreadcrumbKey: string;
  currentBreadcrumbKey: string;
  accessDeniedTitleKey: string;
  accessDeniedDescKey: string;
  authLoading: boolean;
  hasPermission: boolean;
  isRetrying: boolean;
  handleRetryConnection: () => void;
  filter: any;
  isGeneralFilter?: boolean;
  children: ReactNode;
  testID?: string;
}

export function AdminListLayout({
  titleKey,
  subtitleKey,
  parentBreadcrumbKey,
  currentBreadcrumbKey,
  accessDeniedTitleKey,
  accessDeniedDescKey,
  authLoading,
  hasPermission,
  isRetrying,
  handleRetryConnection,
  filter,
  isGeneralFilter = false,
  children,
  testID,
}: AdminListLayoutProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createListStyles(theme), [theme]); //only will recalculate if theme changes
  const netInfo = useNetInfo();

  // 1. Loader de autenticación
  if (authLoading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.main} />
      </ThemedView>
    );
  }

  // 2. Estado Acceso Denegado
  if (!hasPermission) {
    return (
      <ThemedView style={styles.container}>
        <AppHeader />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginBottom: 8 }}>
            {t(accessDeniedTitleKey)}
          </ThemedText>
          <ThemedText style={{ textAlign: 'center' }}>
            {t(accessDeniedDescKey)}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // 3. Renderizado Principal
  return (
    <ThemedView testID={testID} style={styles.container}>
      <AppHeader />
      <Breadcrumb parent={t(parentBreadcrumbKey)} current={t(currentBreadcrumbKey)} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Sección Título */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.mainTitle}>{t(titleKey)}</ThemedText>
          <ThemedText style={styles.subtitle}>{t(subtitleKey)}</ThemedText>
        </View>

        {/* Banner Sin Conexión */}
        {!netInfo.isConnected && (
          <OfflineBanner isRetrying={isRetrying} onRetry={handleRetryConnection} />
        )}

        {/* Buscador / Filtro */}
        <SearchFilter
          general={isGeneralFilter}
          value={filter.searchQuery}
          onChangeText={(text) => {
            filter.setSearchQuery(text);
            filter.setCurrentPage(1);
          }}
          onChangeOrder={filter.setOrderBy}
          activeRoles={filter.selectedRoles}
          activeStatus={filter.selectedStatus}
          onToggleFilter={filter.handleToggleFilter}
        />

        {/* Lista o Sin Resultados */}
        {filter.filteredData.length === 0 ? (
          <NoResultSearch general={isGeneralFilter} />
        ) : (
          children
        )}

        {/* Paginador */}
        <ListPages
          total={filter.filteredData.length}
          maxRange={filter.maxRange}
          minRange={filter.minRange}
          currentPage={filter.currentPage}
          totalPages={filter.totalPages}
          onPageChange={filter.setCurrentPage}
        />
      </ScrollView>
    </ThemedView>
  );
}