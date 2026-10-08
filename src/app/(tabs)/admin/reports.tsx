import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { PageTitleLayout } from '@/components/page-title-layout';
import { ModalOptionList, ModalOptionProp } from '@/components/ui/modal-option-list';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { isAdminUser } from '@/constants/user-roles';

// 1. Estilos, Tipos y Utilidades
import { createReportsStyles } from '@/constants/styles/reports.styles';
import { PeriodOption, ReportType } from '@/components/reports/types';
import { generatePeriodOptions } from '@/components/reports/utils/reports-utils';

// 2. Hook de datos (Sesiones y Usuarios)
import { useAdminSessions } from '@/components/reports/hooks/useAdminSessions';

// 3. Vistas Modulares
import { UsageReportView } from '@/components/reports/views/UsageReportView';
import { DauMauReportView } from '@/components/reports/views/DauMauReportView';
import { CrashRateReportView } from '@/components/reports/views/CrashRateReportView';
import { RetentionReportView } from '@/components/reports/views/RetentionReportView';
import { UserDemographicsReportView } from '@/components/reports/views/UserDemographicsReportView';
import { UserGeographicsReportView } from '@/components/reports/views/UserGeographicsReportView';
import { HourlyDistributionReportView, HourlyDistributionSnapshot } from '@/components/reports/views/HourlyDistributionReportView';
import {
  buildHourlyDistributionCsv,
  buildHourlyDistributionReportHtml,
  buildHourlyExportBaseName,
  shareHourlyDistributionCsv,
  shareNamedHourlyPdf,
} from '@/services/hourly-distribution-export';
import { ReportService } from '@/services/report-service';


// 4. RE-EXPORTS (Crucial para no romper tests unitarios de Jest)
export {
  calculateDauMauRatio,
  calculateCrashRatePercentage,
  formatRetentionPercentage,
  parseRetentionData,
  generatePeriodOptions,
  aggregateUserDemographics,
} from '@/components/reports/utils/reports-utils';
export type { SessionRecord, RetentionDataPoint, RetentionMetricsDoc } from '@/components/reports/types';

export default function AdminReportsScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createReportsStyles(theme), [theme]);
  const { user, loading: authLoading } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>(30);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('usage');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showReportTypeModal, setShowReportTypeModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [hourlySnapshot, setHourlySnapshot] = useState<HourlyDistributionSnapshot | null>(null);
  const rememberHourlySnapshot = useCallback((next: HourlyDistributionSnapshot) => {
    setHourlySnapshot(next);
  }, []);

  // Validación de seguridad (No autenticado vs No administrador)
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
      return;
    }
  }, [user?.uid, user?.rol, authLoading, t]);

  // Hook de sesiones y usuarios activos
  const {
    sessions,
    loading,
    queryError,
    totalAccessToday,
    activeUsersCount,
    displayedActiveUsers,
  } = useAdminSessions(user, authLoading, selectedPeriod, t);

  // Etiqueta del período
  const periodLabel = useMemo(() => {
    switch (selectedPeriod) {
      case 7:
        return t('reports.period7Days');
      case 15:
        return t('reports.period15Days');
      case 30:
      default:
        return t('reports.period30Days');
    }
  }, [selectedPeriod, t]);

  // Etiqueta del tipo de reporte activo
  const reportTypeLabel = useMemo(() => {
    if (selectedReportType === 'geographics') {
      return t('reports.reportTypeGeographics');
    }
    if (selectedReportType === 'demographics') {
      return t('reports.reportTypeDemographics');
    }
    if (selectedReportType === 'dau_mau') {
      return t('reports.reportTypeDauMau');
    }
    if (selectedReportType === 'crash_rate') {
      return t('reports.reportTypeCrashRate');
    }
    if (selectedReportType === 'retention_rate') {
      return t('reports.reportTypeRetentionRate');
    }
    if (selectedReportType === 'hourly') {
      return t('reports.reportTypeHourly');
    }
    return selectedReportType === 'usage'
      ? t('reports.reportTypeUsage')
      : t('reports.chartTitle');
  }, [selectedReportType, t]);

  const reportTypeOptions: ModalOptionProp[] = [
    { name: 'geographics', testID: 'type-option-geographics', label: t('reports.reportTypeGeographics') },
    { name: 'demographics', testID: 'type-option-demographics', label: t('reports.reportTypeDemographics') },
    { name: 'usage', testID: 'type-option-usage', label: t('reports.reportTypeUsage') },
    { name: 'hourly', testID: 'type-option-hourly', label: t('reports.reportTypeHourly') },
    { name: 'dau_mau', testID: 'type-option-dau-mau', label: t('reports.reportTypeDauMau') },
    { name: 'access', testID: 'type-option-access', label: t('reports.chartTitle') },
    { name: 'crash_rate', testID: 'type-option-crash-rate', label: t('reports.reportTypeCrashRate') },
    { name: 'retention_rate', testID: 'type-option-retention-rate', label: t('reports.reportTypeRetentionRate') },
  ];

  const handlePrint = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
      return;
    }
    Alert.alert(t('reports.print'), t('reports.printTriggered'));
  }, [t]);

  const hourlyDistribution = hourlySnapshot?.distribution;
  const blockHourlyExport = selectedReportType === 'hourly' && (
    loading || Boolean(queryError) || !hourlyDistribution || hourlyDistribution.isEmpty
  );
  const language = ReportService.resolveLanguage(i18n.language);

  const handleExportPdf = useCallback(() => {
    setShowExportMenu(false);
    if (selectedReportType !== 'hourly' || !hourlyDistribution || hourlyDistribution.isEmpty) {
      if (selectedReportType !== 'hourly') {
        Alert.alert(t('reports.pdfExportSuccess'), t('reports.pdfExportMessage'));
      }
      return;
    }
    const headers = {
      slot: t('reports.hourlyCsvSlot'),
      count: t('reports.hourlyCsvCount'),
      percent: t('reports.hourlyCsvPercent'),
      peak: hourlyDistribution.isBimodal ? t('reports.hourlyPeaksTitle') : t('reports.hourlyPeakTitle'),
    };
    const contentHtml = buildHourlyDistributionReportHtml(hourlyDistribution, headers, language);
    const fileBaseName = buildHourlyExportBaseName(
      hourlySnapshot?.windowHours ?? 24,
      hourlySnapshot?.dayKey ?? null,
    );
    void ReportService.generatePdf({
      metadata: {
        title: t('reports.hourlyPdfTitle'),
        subtitle: `${hourlySnapshot?.windowLabel ?? ''} · ${hourlySnapshot?.dayLabel ?? ''}`,
        category: t('reports.hourlyPdfCategory'),
        showSignatureBlock: false,
        language,
      },
      contentHtml,
      language,
      pageSize: 'A4',
    }).then((file) => shareNamedHourlyPdf(file.uri, fileBaseName, t('reports.hourlyExportDialog')))
      .catch(() => {
        Alert.alert(t('reports.hourlyExportError'), '');
      });
  }, [hourlyDistribution, hourlySnapshot?.dayKey, hourlySnapshot?.dayLabel, hourlySnapshot?.windowHours, hourlySnapshot?.windowLabel, language, selectedReportType, t]);

  const handleExportCsv = useCallback(() => {
    setShowExportMenu(false);
    if (selectedReportType !== 'hourly' || !hourlyDistribution || hourlyDistribution.isEmpty) {
      if (selectedReportType !== 'hourly') {
        Alert.alert(t('reports.csvExportSuccess'), t('reports.csvExportMessage'));
      }
      return;
    }
    const headers = {
      slot: t('reports.hourlyCsvSlot'),
      count: t('reports.hourlyCsvCount'),
      percent: t('reports.hourlyCsvPercent'),
    };
    const fileBaseName = buildHourlyExportBaseName(
      hourlySnapshot?.windowHours ?? 24,
      hourlySnapshot?.dayKey ?? null,
    );
    const csv = buildHourlyDistributionCsv(hourlyDistribution, headers);
    void shareHourlyDistributionCsv(csv, t('reports.hourlyExportDialog'), `${fileBaseName}.csv`).catch(() => {
      Alert.alert(t('reports.hourlyExportError'), '');
    });
  }, [hourlyDistribution, hourlySnapshot?.dayKey, hourlySnapshot?.windowHours, selectedReportType, t]);

  return (
    <PageTitleLayout
      titleKey='reports.title'
      subtitleKey='reports.subtitle'
      parentBreadcrumbKey='reports.breadcrumbParent'
      currentBreadcrumbKey='reports.breadcrumbCurrent'
      testID="admin-reports-screen"
      modals = {
        <>
          <ModalOptionList
            visible={showPeriodModal}
            onRequestClose={() => setShowPeriodModal(false)}
            title={t('reports.reportTypeLabel')}
            options={generatePeriodOptions(t)}
            selectedOption={selectedPeriod}
            onSelectOption={setSelectedPeriod}
          />
          <ModalOptionList
            visible={showReportTypeModal}
            onRequestClose={() => setShowReportTypeModal(false)}
            title={t('reports.reportTypeLabel')}
            options={reportTypeOptions}
            selectedOption={selectedReportType}
            onSelectOption={setSelectedReportType}
          />
        </>
      }
    >
      <View style={styles.innerContainer}>
        {/* Filtro selector de reporte */}
        <View style={styles.filterSection}>
          <Text style={styles.fieldLabel}>{t('reports.reportTypeLabel')}</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowReportTypeModal(true)}
            activeOpacity={0.7}
            testID="report-type-select"
          >
            <Text style={styles.selectButtonText} numberOfLines={1}>
              {reportTypeLabel}
            </Text>
            <Ionicons name="chevron-down" size={18} color={theme.pageSubtitle} />
          </TouchableOpacity>
        </View>

        {/* VISTAS MODULARES */}
        {(selectedReportType === 'usage' || selectedReportType === 'access') && (
          <UsageReportView
            reportType={selectedReportType}
            sessions={sessions}
            loading={loading}
            queryError={queryError}
            totalAccessToday={totalAccessToday}
            displayedActiveUsers={displayedActiveUsers}
            selectedPeriod={selectedPeriod}
            periodLabel={periodLabel}
            onOpenPeriodModal={() => setShowPeriodModal(true)}
          />
        )}

        {selectedReportType === 'demographics' && (
          <UserDemographicsReportView
            user={user}
            authLoading={authLoading}
            periodLabel={periodLabel}
            onOpenPeriodModal={() => setShowPeriodModal(true)}
          />
        )}

        {selectedReportType === 'geographics' && (
          <UserGeographicsReportView
            user={user}
            authLoading={authLoading}
            periodLabel={periodLabel}
            onOpenPeriodModal={() => setShowPeriodModal(true)}
          />
        )}

        {selectedReportType === 'dau_mau' && (
          <DauMauReportView
            user={user}
            authLoading={authLoading}
            systemActiveUsersCount={displayedActiveUsers}
            activeUsersCount={activeUsersCount}
            periodLabel={periodLabel}
            onOpenPeriodModal={() => setShowPeriodModal(true)}
          />
        )}

        {selectedReportType === 'crash_rate' && (
          <CrashRateReportView
            user={user}
            authLoading={authLoading}
            selectedPeriod={selectedPeriod}
            totalSessionsCount={sessions.length}
            periodLabel={periodLabel}
            onOpenPeriodModal={() => setShowPeriodModal(true)}
          />
        )}

        {selectedReportType === 'retention_rate' && (
          <RetentionReportView
            user={user}
            authLoading={authLoading}
          />
        )}

        {selectedReportType === 'hourly' && (
          <HourlyDistributionReportView
            sessions={sessions}
            loading={loading}
            queryError={queryError}
            totalAccessToday={totalAccessToday}
            displayedActiveUsers={displayedActiveUsers}
            onSnapshot={rememberHourlySnapshot}
          />
        )}

        {/* Acciones de pie: Imprimir y Descargar con Popover (PDF / CSV) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            activeOpacity={0.7}
            testID="print-btn"
            accessibilityLabel={t('reports.print')}
          >
            <Ionicons name="print-outline" size={20} color={theme.fieldLabel} />
          </TouchableOpacity>

          <View style={styles.downloadContainer}>
            {showExportMenu && (
              <>
                <Pressable
                  style={styles.menuBackdrop}
                  onPress={() => setShowExportMenu(false)}
                  testID="export-menu-backdrop"
                />
                <View style={styles.exportMenuPopover} testID="export-menu-popover">
                  <TouchableOpacity
                    style={styles.exportMenuItem}
                    onPress={handleExportCsv}
                    activeOpacity={0.7}
                    testID="export-csv-btn"
                    accessibilityLabel={t('reports.exportCsv')}
                  >
                    <Ionicons name="document-text-outline" size={18} color={theme.fieldLabel} />
                    <Text style={styles.exportMenuText}>CSV</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.exportMenuItem}
                    onPress={handleExportPdf}
                    activeOpacity={0.7}
                    testID="export-pdf-btn"
                    accessibilityLabel={t('reports.exportPdf')}
                  >
                    <Ionicons name="documents-outline" size={18} color={theme.fieldLabel} />
                    <Text style={styles.exportMenuText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.downloadBtn, blockHourlyExport && styles.downloadBtnDisabled]}
              onPress={() => {
                if (blockHourlyExport) return;
                setShowExportMenu((prev) => !prev);
              }}
              activeOpacity={0.7}
              disabled={blockHourlyExport}
              testID="download-menu-btn"
              accessibilityLabel={t('reports.download')}
              accessibilityState={{ disabled: blockHourlyExport }}
            >
              <Ionicons name="download-outline" size={20} color={theme.overMain} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </PageTitleLayout>
  );
}