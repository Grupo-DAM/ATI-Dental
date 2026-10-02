import React, { ReactNode } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetInfo } from '@react-native-community/netinfo';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { OfflineBanner } from '@/components/offline-banner';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { createGlobalStyles } from '@/constants/styles/global.styles';

export interface PageTitleLayoutProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly parentBreadcrumb: string;
  readonly currentBreadcrumb: string;
  readonly authLoading?: boolean;
  readonly hasPermission?: boolean;
  readonly accessDeniedTitle?: string;
  readonly accessDeniedDesc?: string;
  readonly isRetrying?: boolean;
  readonly handleRetryConnection?: () => void;
  readonly headerRight?: ReactNode;
  readonly children: ReactNode;
  readonly scrollable?: boolean;
  readonly testID?: string;
}

export function PageTitleLayout({
  title,
  subtitle,
  parentBreadcrumb,
  currentBreadcrumb,
  authLoading = false,
  hasPermission = true,
  accessDeniedTitle = 'Acceso Denegado',
  accessDeniedDesc = 'No cuentas con los permisos necesarios para acceder a este módulo.',
  isRetrying = false,
  handleRetryConnection,
  headerRight,
  children,
  scrollable = true,
  testID,
}: Readonly<PageTitleLayoutProps>) {
  const theme = useTheme();
  const globalStyles = createGlobalStyles(theme);
  const netInfo = useNetInfo();

  // 1. Estado de carga de autenticación
  if (authLoading) {
    return (
      <ThemedView style={[globalStyles.container, globalStyles.centerContent]} testID="page-title-layout-loading">
        <ActivityIndicator size="large" color={theme.main} />
      </ThemedView>
    );
  }

  // 2. Estado de acceso denegado por rol
  if (!hasPermission) {
    return (
      <ThemedView style={globalStyles.container} testID="page-title-layout-access-denied">
        <AppHeader />
        <Breadcrumb parent={parentBreadcrumb} current={currentBreadcrumb} />
        <View style={globalStyles.centerContent}>
          <Ionicons name="lock-closed-outline" size={56} color="#9CA3AF" />
          <ThemedText style={globalStyles.accessDeniedTitle}>{accessDeniedTitle}</ThemedText>
          <ThemedText style={globalStyles.accessDeniedDesc}>{accessDeniedDesc}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const renderContent = () => (
    <>
      {/* Sección Título y Subtítulo */}
      <View style={globalStyles.titleSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <ThemedText style={globalStyles.mainTitle}>{title}</ThemedText>
          {headerRight}
        </View>
        {subtitle ? <ThemedText style={globalStyles.subtitle}>{subtitle}</ThemedText> : null}
      </View>

      {/* Banner Sin Conexión */}
      {!netInfo.isConnected && handleRetryConnection && (
        <OfflineBanner isRetrying={isRetrying} onRetry={handleRetryConnection} />
      )}

      {/* Contenido Principal */}
      {children}
    </>
  );

  return (
    <ThemedView style={globalStyles.container} testID={testID}>
      <AppHeader />
      <Breadcrumb parent={parentBreadcrumb} current={currentBreadcrumb} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={globalStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{renderContent()}</View>
      )}
    </ThemedView>
  );
}
