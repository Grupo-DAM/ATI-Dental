import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { KPICard } from '@/components/reports/KPICard';
import { UsageLineChart, ChartDataPoint } from '@/components/reports/usage-line-chart';
import { PeriodOption, SessionRecord } from '../types';
import { getRecordTimestamp, getRecordDurationMinutes } from '../utils/reports-utils';
import { createReportsStyles } from '../styles/reports.styles';

interface UsageReportViewProps {
  reportType: 'usage' | 'access';
  sessions: SessionRecord[];
  loading: boolean;
  queryError: string | null;
  totalAccessToday: number;
  displayedActiveUsers: number;
  selectedPeriod: PeriodOption;
  periodLabel: string;
  onOpenPeriodModal: () => void;
}

export function UsageReportView({
  reportType,
  sessions,
  loading,
  queryError,
  totalAccessToday,
  displayedActiveUsers,
  selectedPeriod,
  periodLabel,
  onOpenPeriodModal,
}: UsageReportViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  // [Líneas 497-549 de reports.tsx] Agregación en buckets por día
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const days = selectedPeriod;
    const now = new Date();
    const result: ChartDataPoint[] = [];

    const buckets: { [key: string]: { accesses: number; totalMinutes: number; dateStr: string; dayNum: number } } = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      buckets[key] = { accesses: 0, totalMinutes: 0, dateStr: key, dayNum: d.getDate() };
    }

    sessions.forEach((record) => {
      const ts = getRecordTimestamp(record);
      if (ts === null) return;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (buckets[key]) {
        buckets[key].accesses += 1;
        buckets[key].totalMinutes += getRecordDurationMinutes(record);
      }
    });

    Object.keys(buckets).forEach((key) => {
      const b = buckets[key];
      const val = reportType === 'usage'
        ? b.accesses > 0 ? Math.round(b.totalMinutes / b.accesses) : 0
        : b.accesses;

      result.push({
        label: String(b.dayNum),
        value: val,
        date: String(b.dayNum),
        fullDate: b.dateStr,
      });
    });

    return result;
  }, [sessions, selectedPeriod, reportType]);

  const hasData = sessions.length > 0 && chartData.some((d) => d.value > 0);
  const chartTitle = reportType === 'usage' ? t('reports.chartTitleUsage') : t('reports.chartTitle');
  const chartUnit = reportType === 'usage' ? 'min' : 'acc';

  return (
    <>
      {/* KPIs Accesos y Usuarios (Líneas 488-493 de reports.tsx) */}
      <View style={styles.kpiRow} testID="kpi-cards-container">
        <KPICard
          tinyType={false}
          label={t('reports.totalAccessToday')}
          value={totalAccessToday}
          iconName="log-in-outline"
          valueTestID="kpi-total-access-val"
          cardTestID="kpi-total-access"
          loading={loading}
        />
        <KPICard
          tinyType={false}
          label={t('reports.activeUsers')}
          value={displayedActiveUsers}
          iconName="people"
          valueTestID="kpi-active-users-val"
          cardTestID="kpi-active-users"
          loading={loading}
        />
      </View>

      {/* Gráfica (Líneas 682-740 de reports.tsx) */}
      <View style={styles.chartCard} testID="chart-card">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle} testID="chart-title">{chartTitle}</Text>
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
        ) : !hasData ? (
          <View style={styles.emptyContainer} testID="chart-empty-state">
            <View style={styles.emptyIconCircle}>
              <Ionicons name="analytics-outline" size={36} color={theme.chartLegendText} />
            </View>
            <Text style={styles.emptyText}>{t('reports.emptyState')}</Text>
          </View>
        ) : (
          <View testID="chart-active-container">
            <UsageLineChart
              data={chartData}
              height={230}
              unit={chartUnit}
              lineColor={theme.main}
              testID="reports-usage-chart"
            />
          </View>
        )}
      </View>
    </>
  );
}