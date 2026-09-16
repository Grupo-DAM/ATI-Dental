import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { KPICard } from '@/components/reports/KPICard';
import { UsageLineChart, ChartDataPoint } from '@/components/reports/usage-line-chart';
import { PeriodOption, SessionRecord } from '../types';
import { getRecordTimestamp, getRecordDurationMinutes } from '../utils/reports-utils';
import { createReportsStyles } from '../styles/reports.styles';
import { ReportChartCard } from '../components/ReportChartCard';

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

      <ReportChartCard
        title={chartTitle}
        periodLabel={periodLabel}
        onOpenPeriodModal={onOpenPeriodModal}
        loading={loading}
        queryError={queryError}
        hasData={hasData}
      >
        <UsageLineChart
          data={chartData}
          height={230}
          unit={chartUnit}
          lineColor={theme.main}
          testID="reports-usage-chart"
        />
      </ReportChartCard>
    </>
  );
}