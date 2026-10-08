import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAdminSessions } from '@/components/reports/hooks/useAdminSessions';
import {
  HourlyDistributionReportView,
  HourlyDistributionSnapshot,
} from '@/components/reports/views/HourlyDistributionReportView';
import { PageTitleLayout } from '@/components/page-title-layout';
import { createHourlyDistributionStyles } from '@/constants/styles/hourly-distribution.styles';
import { createReportsStyles } from '@/constants/styles/reports.styles';
import { isAdminUser } from '@/constants/user-roles';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import {
  buildHourlyDistributionCsv,
  buildHourlyDistributionNotes,
  buildHourlyDistributionReportHtml,
  buildHourlyExportBaseName,
  shareHourlyDistributionCsv,
  shareNamedHourlyPdf,
} from '@/services/hourly-distribution-export';
import { ReportService } from '@/services/report-service';

export default function HourlyDistributionScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createHourlyDistributionStyles(theme), [theme]);
  const reportStyles = useMemo(() => createReportsStyles(theme), [theme]);
  const { user, loading: authLoading } = useAuth();

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [snapshot, setSnapshot] = useState<HourlyDistributionSnapshot | null>(null);

  const isAdmin = Boolean(user && isAdminUser(user));
  const handleSnapshot = useCallback((next: HourlyDistributionSnapshot) => {
    setSnapshot(next);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      Alert.alert(t('reports.sessionRequired'), '');
      router.replace('/(tabs)/home');
      return;
    }
    if (!isAdminUser(user)) {
      Alert.alert(t('reports.accessDenied'), '');
      router.replace('/(tabs)/home');
    }
  }, [user, authLoading, t]);

  const {
    sessions,
    loading,
    queryError,
    totalAccessToday,
    displayedActiveUsers,
  } = useAdminSessions(user, authLoading, 30, t);

  const distribution = snapshot?.distribution;
  const dayLabel = snapshot?.dayLabel ?? '';
  const windowLabel = snapshot?.windowLabel ?? '';
  const dayKey = snapshot?.dayKey ?? null;
  const windowHours = snapshot?.windowHours ?? 24;
  const canExport = isAdmin && !loading && !queryError && Boolean(distribution && !distribution.isEmpty);
  const language = ReportService.resolveLanguage(i18n.language);
  const csvHeaders = useMemo(() => ({
    slot: t('reports.hourlyCsvSlot'),
    count: t('reports.hourlyCsvCount'),
    percent: t('reports.hourlyCsvPercent'),
    peak: distribution?.isBimodal ? t('reports.hourlyPeaksTitle') : t('reports.hourlyPeakTitle'),
  }), [distribution?.isBimodal, t]);

  const handlePrint = useCallback(() => {
    if (Platform.OS === 'web' && globalThis.window !== undefined) {
      globalThis.window.print();
      return;
    }
    Alert.alert(t('reports.print'), t('reports.printTriggered'));
  }, [t]);

  const exportPdf = useCallback(async () => {
    if (!user || !isAdminUser(user) || !distribution || distribution.isEmpty) return;
    setShowExportMenu(false);
    try {
      const notes = buildHourlyDistributionNotes(distribution, language);
      const contentHtml = buildHourlyDistributionReportHtml(
        distribution,
        {
          ...csvHeaders,
          chartTitle: t('reports.hourlyChartTitle', 'Accesos por hora'),
          chartSubtitle: `${windowLabel} · ${dayLabel}`,
        },
        language,
      );
      const file = await ReportService.generatePdf({
        metadata: {
          title: t('reports.hourlyPdfTitle'),
          subtitle: `${windowLabel} · ${dayLabel}`,
          category: t('reports.hourlyPdfCategory'),
          badge: { label: windowLabel, variant: 'primary' },
          notes,
          showSignatureBlock: false,
          language,
        },
        contentHtml,
        language,
        pageSize: 'A4',
      });
      const fileBaseName = buildHourlyExportBaseName(windowHours, dayKey);
      await shareNamedHourlyPdf(file.uri, fileBaseName, t('reports.hourlyExportDialog'));
    } catch {
      Alert.alert(t('reports.hourlyExportError'), '');
    }
  }, [csvHeaders, dayKey, dayLabel, distribution, language, t, user, windowHours, windowLabel]);

  const exportCsv = useCallback(async () => {
    if (!user || !isAdminUser(user) || !distribution || distribution.isEmpty) return;
    setShowExportMenu(false);
    try {
      const csv = buildHourlyDistributionCsv(distribution, csvHeaders);
      const fileBaseName = buildHourlyExportBaseName(windowHours, dayKey);
      await shareHourlyDistributionCsv(csv, t('reports.hourlyExportDialog'), `${fileBaseName}.csv`);
    } catch {
      Alert.alert(t('reports.hourlyExportError'), '');
    }
  }, [csvHeaders, dayKey, distribution, t, user, windowHours]);

  return (
    <PageTitleLayout
      titleKey="reports.hourlyTitle"
      subtitleKey="reports.hourlySubtitle"
      parentBreadcrumbKey="reports.breadcrumbCurrent"
      currentBreadcrumbKey="reports.hourlyBreadcrumb"
      testID="hourly-distribution-screen"
      authLoading={authLoading}
      hasPermission={!user || isAdmin}
      accessDeniedTitle={t('reports.accessDenied')}
      accessDeniedDesc={t('reports.accessDenied')}
    >
      <View style={reportStyles.innerContainer}>
        <HourlyDistributionReportView
          sessions={sessions}
          loading={loading}
          queryError={queryError}
          totalAccessToday={totalAccessToday}
          displayedActiveUsers={displayedActiveUsers}
          onSnapshot={handleSnapshot}
        />

        <View style={reportStyles.actionsRow}>
          <TouchableOpacity
            style={reportStyles.printBtn}
            onPress={handlePrint}
            activeOpacity={0.7}
            testID="print-btn"
            accessibilityLabel={t('reports.print')}
          >
            <Ionicons name="print-outline" size={20} color={theme.fieldLabel} />
          </TouchableOpacity>

          <View style={reportStyles.downloadContainer}>
            {showExportMenu && (
              <>
                <Pressable
                  style={reportStyles.menuBackdrop}
                  onPress={() => setShowExportMenu(false)}
                  testID="export-menu-backdrop"
                />
                <View style={reportStyles.exportMenuPopover} testID="export-menu-popover">
                  <TouchableOpacity
                    style={reportStyles.exportMenuItem}
                    onPress={() => { void exportCsv(); }}
                    activeOpacity={0.7}
                    testID="export-csv-btn"
                    accessibilityLabel={t('reports.exportCsv')}
                  >
                    <Ionicons name="document-text-outline" size={18} color={theme.fieldLabel} />
                    <Text style={reportStyles.exportMenuText}>CSV</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={reportStyles.exportMenuItem}
                    onPress={() => { void exportPdf(); }}
                    activeOpacity={0.7}
                    testID="export-pdf-btn"
                    accessibilityLabel={t('reports.exportPdf')}
                  >
                    <Ionicons name="documents-outline" size={18} color={theme.fieldLabel} />
                    <Text style={reportStyles.exportMenuText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity
              style={[reportStyles.downloadBtn, !canExport && styles.downloadBtnDisabled]}
              onPress={() => {
                if (!canExport) return;
                setShowExportMenu((open) => !open);
              }}
              activeOpacity={0.7}
              disabled={!canExport}
              testID="download-menu-btn"
              accessibilityLabel={t('reports.download')}
              accessibilityState={{ disabled: !canExport }}
            >
              <Ionicons name="download-outline" size={20} color={theme.overMain} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </PageTitleLayout>
  );
}
