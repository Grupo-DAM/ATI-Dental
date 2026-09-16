import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { KPICard } from '@/components/reports/KPICard';
import { UsageLineChart } from '@/components/reports/usage-line-chart';
import { PeriodOption } from '../types';
import { useCrashRateMetrics } from '../hooks/useCrashRateMetrics';
import { createReportsStyles } from '../styles/reports.styles';

interface CrashRateReportViewProps {
  user: any;
  authLoading: boolean;
  selectedPeriod: PeriodOption;
  totalSessionsCount: number;
  periodLabel: string;
  onOpenPeriodModal: () => void;
}

export function CrashRateReportView({
  user,
  authLoading,
  selectedPeriod,
  totalSessionsCount,
  periodLabel,
  onOpenPeriodModal,
}: CrashRateReportViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  const {
    totalCrashesValue,
    affectedUsersValue,
    crashRateData,
    calculatedCrashRateString,
    loading,
    queryError,
  } = useCrashRateMetrics({
    user,
    authLoading,
    enabled: true,
    selectedPeriod,
    totalSessionsCount,
    t,
  });

  return (
    <>
      {/* KPIs Crash Rate (Líneas 477-486 de reports.tsx) */}
      <View style={styles.kpiRowThree} testID="kpi-cards-container">
        <KPICard
          tinyType
          label={t('reports.crashRateToday')}
          value={calculatedCrashRateString}
          iconName="shield-checkmark-outline"
          valueTestID="kpi-crash-rate-val"
          cardTestID="kpi-crash-rate"
          loading={loading}
        />
        <KPICard
          tinyType
          label={t('reports.totalCrashesToday')}
          value={totalCrashesValue}
          iconName="bug-outline"
          valueTestID="kpi-total-crashes-val"
          cardTestID="kpi-total-crashes"
          loading={loading}
        />
        <KPICard
          tinyType
          label={t('reports.affectedUsers')}
          value={affectedUsersValue}
          iconName="sad-outline"
          valueTestID="kpi-affected-users-val"
          cardTestID="kpi-affected-users"
          loading={loading}
        />
      </View>

      {/* Gráfica Crash Rate (Líneas 682-740 de reports.tsx) */}
      <View style={styles.chartCard} testID="chart-card">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle} testID="chart-title">
            {t('reports.chartTitleCrashRate')}
          </Text>
          <TouchableOpacity
            style={styles.periodFilterBtn}
            onPress={onOpenPeriodModal}
            testID="period-filter-btn"
          >
            <Text style={styles.periodFilterText}>{periodLabel}</Text>
            <Ionicons name="filter" size={14} color={theme.pageSubtitle} style={styles.filterIcon} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.stateContainer} testID="chart-loading">
            <ActivityIndicator size="large" color={theme.main} />
            <Text style={styles.stateText}>{t('reports.loading')}</Text>
          </View>
        ) : queryError ? (
          <View style={styles.emptyContainer} testID="chart-error-state">
            <View style={styles.emptyIconCircle}>
              <Ionicons name="shield-outline" size={36} color={theme.error} />
            </View>
            <Text style={[styles.emptyText, { color: theme.error, fontWeight: '600' }]}>
              {queryError}
            </Text>
          </View>
        ) : crashRateData.length === 0 ? (
          <View style={styles.emptyContainer} testID="chart-empty-state">
            <View style={styles.emptyIconCircle}>
              <Ionicons name="analytics-outline" size={36} color={theme.chartLegendText} />
            </View>
            <Text style={styles.emptyText}>{t('reports.emptyState')}</Text>
          </View>
        ) : (
          <View testID="chart-active-container">
            <UsageLineChart
              data={crashRateData}
              height={230}
              unit="%"
              lineColor={theme.main}
              testID="reports-usage-chart"
            />
          </View>
        )}
      </View>
    </>
  );
}