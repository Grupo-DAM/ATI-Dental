import React, { ReactNode, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNetInfo } from '@react-native-community/netinfo';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { OfflineBanner } from '@/components/offline-banner';
import { useTheme } from '@/hooks/use-theme';
import { createGlobalStyles } from '@/constants/styles/global.styles';

export interface PageTitleLayoutProps {
  readonly title?: string;
  readonly titleKey?: string;
  readonly subtitle?: string;
  readonly subtitleKey?: string;
  readonly parentBreadcrumb?: string;
  readonly parentBreadcrumbKey?: string;
  readonly currentBreadcrumb?: string;
  readonly currentBreadcrumbKey?: string;
  readonly authLoading?: boolean;
  readonly hasPermission?: boolean;
  readonly accessDeniedTitle?: string;
  readonly accessDeniedDesc?: string;
  readonly isRetrying?: boolean;
  readonly handleRetryConnection?: () => void;
  readonly headerRight?: ReactNode;
  readonly children?: ReactNode;
  readonly modals?: ReactNode;
  readonly scrollable?: boolean;
  readonly scrollContainerStyle?: StyleProp<ViewStyle>;
  readonly testID?: string;
}

export function PageTitleLayout({
  title,
  titleKey,
  subtitle,
  subtitleKey,
  parentBreadcrumb,
  parentBreadcrumbKey,
  currentBreadcrumb,
  currentBreadcrumbKey,
  authLoading = false,
  hasPermission = true,
  accessDeniedTitle = 'Acceso Denegado',
  accessDeniedDesc = 'No cuentas con los permisos necesarios para acceder a este módulo.',
  isRetrying = false,
  handleRetryConnection,
  headerRight,
  children,
  modals,
  scrollable = true,
  scrollContainerStyle,
  testID,
}: Readonly<PageTitleLayoutProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createGlobalStyles(theme), [theme]);
  const netInfo = useNetInfo();

  const finalTitle = titleKey ? t(titleKey) : (title ?? '');
  const finalSubtitle = subtitleKey ? t(subtitleKey) : subtitle;
  const finalParentBreadcrumb = parentBreadcrumbKey ? t(parentBreadcrumbKey) : (parentBreadcrumb ?? '');
  const finalCurrentBreadcrumb = currentBreadcrumbKey ? t(currentBreadcrumbKey) : (currentBreadcrumb ?? '');

  // 1. Estado de carga de autenticación
  if (authLoading) {
    return (
      <View style={[styles.screen, styles.centerContent]} testID="page-title-layout-loading">
        <ActivityIndicator size="large" color={theme.main} />
      </View>
    );
  }

  // 2. Estado de acceso denegado por rol
  if (!hasPermission) {
    return (
      <View style={styles.screen} testID="page-title-layout-access-denied">
        <AppHeader />
        <Breadcrumb parent={finalParentBreadcrumb} current={finalCurrentBreadcrumb} />
        <View style={styles.centerContent}>
          <Ionicons name="lock-closed-outline" size={56} color="#9CA3AF" />
          <Text style={styles.accessDeniedTitle}>{accessDeniedTitle}</Text>
          <Text style={styles.accessDeniedDesc}>{accessDeniedDesc}</Text>
        </View>
      </View>
    );
  }

  const renderContent = () => (
    <>
      {/* Sección Título y Subtítulo */}
      <View style={styles.titleSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.mainTitle}>{finalTitle}</Text>
          {headerRight}
        </View>
        {finalSubtitle ? <Text style={styles.subtitle}>{finalSubtitle}</Text> : null}
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
    <View style={styles.screen} testID={testID}>
      <AppHeader />
      <Breadcrumb parent={finalParentBreadcrumb} current={finalCurrentBreadcrumb} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, scrollContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{renderContent()}</View>
      )}
      {modals}
    </View>
  );
}
