import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { View, Text, ScrollView, StyleProp, ViewStyle, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
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
  readonly headerRight?: React.ReactNode;
  readonly children?: React.ReactNode;
  readonly modals?: React.ReactNode;
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

  const finalTitle = titleKey ? t(titleKey) : (title ?? '');
  const finalSubtitle = subtitleKey ? t(subtitleKey) : subtitle;
  const finalParentBreadcrumb = parentBreadcrumbKey ? t(parentBreadcrumbKey) : (parentBreadcrumb || undefined);
  const finalCurrentBreadcrumb = currentBreadcrumbKey ? t(currentBreadcrumbKey) : (currentBreadcrumb ?? '');

  if (authLoading) {
    return (
      <View style={[styles.screen, styles.centerContent]} testID="page-title-layout-loading">
        <ActivityIndicator size="large" color={theme.main} />
      </View>
    );
  }

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

  const hasTitleSection = Boolean(titleKey || subtitleKey || title || subtitle);

  const renderTitleSection = () => {
    if (!hasTitleSection) {
      return null;
    }

    if (headerRight) {
      return (
        <View style={styles.titleSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {finalTitle ? <Text style={styles.mainTitle}>{finalTitle}</Text> : null}
            {headerRight}
          </View>
          {finalSubtitle ? <Text style={styles.subtitle}>{finalSubtitle}</Text> : null}
        </View>
      );
    }

    return (
      <View style={styles.titleSection}>
        {finalTitle ? <Text style={styles.mainTitle}>{finalTitle}</Text> : null}
        {finalSubtitle ? <Text style={styles.subtitle}>{finalSubtitle}</Text> : null}
      </View>
    );
  };

  return (
    <View testID={testID} style={styles.screen}>
      <AppHeader />
      <Breadcrumb parent={finalParentBreadcrumb} current={finalCurrentBreadcrumb} />

      {scrollable ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, scrollContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {renderTitleSection()}
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {renderTitleSection()}
          {children}
        </View>
      )}
      {modals}
    </View>
  );
}
