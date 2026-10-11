import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, Platform, Pressable, ActivityIndicator } from 'react-native';
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
import {
  PeriodOption,
  ReportType,
  UserDemographicsMetrics,
  UserGeographicsMetrics,
  RetentionDataPoint,
} from '@/components/reports/types';
import { CsvDataRow, 
  generatePeriodOptions, 
  mapDauMauToCsvRows, 
  exportChartDataToCsv,
  mapDemographicsToCsvRows,
  mapGeographicsToCsvRows,
  mapRetentionToCsvRows,
  mapSessionsToCsvRows
} from '@/components/reports/utils/reports-utils';
import { DauMauDataPoint } from '@/components/reports/dau-mau-line-chart';
import { ChartDataPoint } from '@/components/reports/usage-line-chart';

// 2. Hook de datos (Sesiones y Usuarios)
import { useAdminSessions } from '@/components/reports/hooks/useAdminSessions';

// 3. Servicio de Reportes y Generador PDF (US-02)
import { ReportService } from '@/services/report-service';
import {
  buildAdminReportPdfOptions,
  hasReportData,
  AdminReportDataSnapshot,
} from '@/components/reports/utils/admin-report-pdf-builder';

// 4. Vistas Modulares
import { UsageReportView } from '@/components/reports/views/UsageReportView';
import { DauMauReportView } from '@/components/reports/views/DauMauReportView';
import { CrashRateReportView } from '@/components/reports/views/CrashRateReportView';
import { RetentionReportView } from '@/components/reports/views/RetentionReportView';
import { UserDemographicsReportView } from '@/components/reports/views/UserDemographicsReportView';
import { UserGeographicsReportView } from '@/components/reports/views/UserGeographicsReportView';
import { HourlyDistributionReportView, HourlyDistributionSnapshot } from '@/components/reports/views/HourlyDistributionReportView';
import {
  buildHourlyDistributionCsv,
  buildHourlyDistributionNotes,
  buildHourlyDistributionReportHtml,
  buildHourlyExportBaseName,
  shareHourlyDistributionCsv,
  shareNamedHourlyPdf,
} from '@/services/hourly-distribution-export';


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
  const [isExporting, setIsExporting] = useState(false);
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

  // Estados para datos analíticos de las vistas secundarias reportados mediante onDataReady
  const [demographicsData, setDemographicsData] = useState<UserDemographicsMetrics | null>(null);
  const [geographicsData, setGeographicsData] = useState<UserGeographicsMetrics | null>(null);
  const [dauMauMetrics, setDauMauMetrics] = useState<{
    dauValue: number;
    mauValue: number;
    dauMauRatio: number;
    dauMauData: DauMauDataPoint[];
  } | null>(null);
  const [crashRateMetrics, setCrashRateMetrics] = useState<{
    totalCrashesValue: number;
    affectedUsersValue: number;
    calculatedCrashRateString: string;
    crashRateData: ChartDataPoint[];
  } | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<{
    retentionData: RetentionDataPoint[];
    day1String: string;
    day7String: string;
    day30String: string;
  } | null>(null);

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

  // Snapshot consolidado de los datos actuales del reporte activo
  const currentSnapshot = useMemo<AdminReportDataSnapshot>(() => ({
    reportType: selectedReportType,
    selectedPeriod,
    periodLabel,
    language: (i18n?.language?.startsWith('en') ? 'en' : 'es'),
    sessions,
    totalAccessToday,
    displayedActiveUsers,
    demographicsMetrics: demographicsData,
    geographicsMetrics: geographicsData,
    dauValue: dauMauMetrics?.dauValue,
    mauValue: dauMauMetrics?.mauValue,
    dauMauRatio: dauMauMetrics?.dauMauRatio,
    dauMauData: dauMauMetrics?.dauMauData,
    totalCrashesValue: crashRateMetrics?.totalCrashesValue,
    affectedUsersValue: crashRateMetrics?.affectedUsersValue,
    calculatedCrashRateString: crashRateMetrics?.calculatedCrashRateString,
    crashRateData: crashRateMetrics?.crashRateData,
    retentionData: retentionMetrics?.retentionData,
    day1String: retentionMetrics?.day1String,
    day7String: retentionMetrics?.day7String,
    day30String: retentionMetrics?.day30String,
  }), [
    selectedReportType,
    selectedPeriod,
    periodLabel,
    i18n?.language,
    sessions,
    totalAccessToday,
    displayedActiveUsers,
    demographicsData,
    geographicsData,
    dauMauMetrics,
    crashRateMetrics,
    retentionMetrics,
  ]);

  const hasData = useMemo(() => hasReportData(currentSnapshot), [currentSnapshot]);

  const hourlyDistribution = hourlySnapshot?.distribution;
  const blockHourlyExport = selectedReportType === 'hourly' && (
    loading || Boolean(queryError) || !hourlyDistribution || hourlyDistribution.isEmpty
  );
  const language = ReportService.resolveLanguage(i18n.language);

  const handlePrint = useCallback(async () => {
    if (isExporting) return;

    if (selectedReportType === 'hourly') {
      if (blockHourlyExport || !hourlyDistribution) {
        Alert.alert(t('reports.title'), t('reports.exportNoData'));
        return;
      }
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.print();
        return;
      }
      Alert.alert(t('reports.print'), t('reports.printTriggered'));
      return;
    }

    if (!hasData) {
      Alert.alert(t('reports.title'), t('reports.exportNoData'));
      return;
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
      return;
    }

    try {
      setIsExporting(true);
      const options = buildAdminReportPdfOptions(currentSnapshot, t);
      await ReportService.print(options);
      Alert.alert(t('reports.print'), t('reports.printTriggered'));
    } catch (error) {
      console.error('Error al imprimir reporte:', error);
      Alert.alert(t('reports.title'), t('reports.printError'));
    } finally {
      setIsExporting(false);
    }
  }, [blockHourlyExport, currentSnapshot, hasData, hourlyDistribution, isExporting, selectedReportType, t]);

  const handleExportPdf = useCallback(async () => {
    setShowExportMenu(false);
    if (isExporting) return;

    if (selectedReportType === 'hourly') {
      if (!hourlyDistribution || hourlyDistribution.isEmpty) {
        return;
      }
      const headers = {
        slot: t('reports.hourlyCsvSlot'),
        count: t('reports.hourlyCsvCount'),
        percent: t('reports.hourlyCsvPercent'),
        peak: hourlyDistribution.isBimodal ? t('reports.hourlyPeaksTitle') : t('reports.hourlyPeakTitle'),
        chartTitle: t('reports.hourlyChartTitle', 'Accesos por hora'),
        chartSubtitle: `${hourlySnapshot?.windowLabel ?? ''} · ${hourlySnapshot?.dayLabel ?? ''}`,
      };
      const notes = buildHourlyDistributionNotes(hourlyDistribution, language);
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
          badge: { label: hourlySnapshot?.windowLabel ?? '24h', variant: 'primary' },
          notes,
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
      return;
    }

    if (!hasData) {
      Alert.alert(t('reports.title'), t('reports.exportNoData'));
      return;
    }

    try {
      setIsExporting(true);
      const options = buildAdminReportPdfOptions(currentSnapshot, t);
      await ReportService.generateAndShare(options);
      Alert.alert(t('reports.pdfExportSuccess'), t('reports.pdfExportMessage'));
    } catch (error) {
      console.error('Error al exportar reporte PDF:', error);
      Alert.alert(t('reports.title'), t('reports.exportError'));
    } finally {
      setIsExporting(false);
    }
  }, [
    currentSnapshot,
    hasData,
    hourlyDistribution,
    hourlySnapshot?.dayKey,
    hourlySnapshot?.dayLabel,
    hourlySnapshot?.windowHours,
    hourlySnapshot?.windowLabel,
    isExporting,
    language,
    selectedReportType,
    t,
  ]);

  const handleExportCsv = useCallback(async () => {
    setShowExportMenu(false);

    // 1. Manejo específico para el reporte por hora (Hourly Distribution)
    if (selectedReportType === 'hourly') {
      if (!hourlyDistribution || hourlyDistribution.isEmpty) {
        Alert.alert(t('reports.title'), t('reports.exportNoData'));
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
      return;
    }

    // 2. Intercepción preventiva ante ausencia de datos para el resto de los reportes
    if (!hasData) {
      Alert.alert(t('reports.title'), t('reports.exportNoData'));
      return;
    }

    try {
      setIsExporting(true);
      let exportRows: CsvDataRow[] = [];

      // 3. Mapeo dinámico según el tipo de gráfico activo
      switch (selectedReportType) {
        case 'usage':
        case 'access':
          exportRows = mapSessionsToCsvRows(sessions, reportTypeLabel);
          break;

        case 'dau_mau':
          if (dauMauMetrics?.dauMauData) {
            exportRows = mapDauMauToCsvRows(dauMauMetrics.dauMauData);
          }
          break;

        case 'crash_rate':
          if (crashRateMetrics?.crashRateData) {
            exportRows = crashRateMetrics.crashRateData.map((c) => ({
              fecha: c.label,
              valor: c.value,
              unidad: 'porcentaje',
              metrica: 'Tasa de Fallos',
            }));
          }
          break;

        case 'demographics':
          if (demographicsData) {
            exportRows = mapDemographicsToCsvRows(demographicsData);
          }
          break;

        case 'geographics':
          if (geographicsData) {
            exportRows = mapGeographicsToCsvRows(geographicsData);
          }
          break;

        case 'retention_rate':
          if (retentionMetrics?.retentionData) {
            exportRows = mapRetentionToCsvRows(retentionMetrics.retentionData);
          }
          break;

        default:
          break;
      }

      // 4. Validación si la serie o conjunto de datos está vacío
      if (exportRows.length === 0) {
        Alert.alert(t('reports.title'), t('reports.exportNoData'));
        return;
      }

      // 5. Generación del CSV con BOM UTF-8 y despliegue del Share Sheet nativo
      await exportChartDataToCsv(exportRows, periodLabel, selectedReportType);

      Alert.alert(
        t('reports.csvExportSuccess'),
        t('reports.csvExportMessage')
      );
    } catch (error) {
      console.error('Error al exportar CSV:', error);
      Alert.alert(t('reports.title'), t('reports.exportError'));
    } finally {
      setIsExporting(false);
    }
  }, [
    selectedReportType,
    hourlyDistribution,
    hourlySnapshot?.windowHours,
    hourlySnapshot?.dayKey,
    hasData,
    sessions,
    reportTypeLabel,
    dauMauMetrics,
    crashRateMetrics,
    demographicsData,
    geographicsData,
    retentionMetrics,
    periodLabel,
    t,
  ]);

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
            onDataReady={setDemographicsData}
          />
        )}

        {selectedReportType === 'geographics' && (
          <UserGeographicsReportView
            user={user}
            authLoading={authLoading}
            periodLabel={periodLabel}
            onOpenPeriodModal={() => setShowPeriodModal(true)}
            onDataReady={setGeographicsData}
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
            onDataReady={setDauMauMetrics}
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
            onDataReady={setCrashRateMetrics}
          />
        )}

        {selectedReportType === 'retention_rate' && (
          <RetentionReportView
            user={user}
            authLoading={authLoading}
            onDataReady={setRetentionMetrics}
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
            style={[styles.printBtn, isExporting && { opacity: 0.6 }]}
            onPress={handlePrint}
            activeOpacity={0.7}
            disabled={isExporting}
            testID="print-btn"
            accessibilityLabel={t('reports.print')}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.fieldLabel} testID="print-spinner" />
            ) : (
              <Ionicons name="print-outline" size={20} color={theme.fieldLabel} />
            )}
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
                    disabled={isExporting}
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
              style={[
                styles.downloadBtn,
                isExporting && { opacity: 0.6 },
                blockHourlyExport && styles.downloadBtnDisabled,
              ]}
              onPress={() => {
                if (blockHourlyExport || isExporting) return;
                setShowExportMenu((prev) => !prev);
              }}
              activeOpacity={0.7}
              disabled={isExporting || blockHourlyExport}
              testID="download-menu-btn"
              accessibilityLabel={t('reports.download')}
              accessibilityState={{ disabled: blockHourlyExport }}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color={theme.overMain} testID="download-spinner" />
              ) : (
                <Ionicons name="download-outline" size={20} color={theme.overMain} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </PageTitleLayout>
  );
}