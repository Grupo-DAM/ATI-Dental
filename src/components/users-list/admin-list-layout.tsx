import React, { ReactNode, useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import { ThemedView } from '@/components/themed-view';
import { SearchFilter } from '@/components/users-list/search-filter-selector';
import { ListPages } from '@/components/users-list/list-pages-viewer';
import { NoResultSearch } from '@/components/users-list/no-results';
import { AccessDeniedView } from '@/components/access-denied-view';
import { AppHeader } from '@/components/app-header';
import { OfflineBanner } from '@/components/offline-banner';
import { useTheme } from '@/hooks/use-theme';
import { createListStyles } from '@/constants/styles/users-list.styles';
import { PageTitleLayout } from '../page-title-layout';

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
  footerAction?: ReactNode;
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
  footerAction,
  children,
  testID,
}: Readonly<AdminListLayoutProps>) {
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
        <AccessDeniedView
          title={t(accessDeniedTitleKey)}
          message={t(accessDeniedDescKey)}
        />
      </ThemedView>
    );
  }

  // 3. Renderizado Principal
  return (
    <PageTitleLayout
      titleKey={titleKey}
      subtitleKey={subtitleKey}
      parentBreadcrumbKey={parentBreadcrumbKey}
      currentBreadcrumbKey={currentBreadcrumbKey}
      testID={testID}
      scrollContainerStyle={styles.scrollContent}
    >
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

      {/* Acción inferior (Botón PDF según Wireframe) */}
      {footerAction && (
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 12, marginBottom: 8 }}>
          {footerAction}
        </View>
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
    </PageTitleLayout>
  );
}