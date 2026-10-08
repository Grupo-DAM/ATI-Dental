import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { KPICard } from '@/components/reports/KPICard';
import { UsageLineChart, ChartDataPoint } from '@/components/reports/usage-line-chart';
import { PeriodOption } from '../types';
import { useCrashRateMetrics } from '../hooks/useCrashRateMetrics';
import { createReportsStyles } from '../../../constants/styles/reports.styles';
import { ReportChartCard } from '../components/ReportChartCard';
import type { UserProfile } from '@/hooks/use-auth';

interface CrashRateReportViewProps {
  user: UserProfile | null;
  authLoading: boolean;
  selectedPeriod: PeriodOption;
  totalSessionsCount: number;
  periodLabel: string;
  onOpenPeriodModal: () => void;
  onDataReady?: (data: {
    totalCrashesValue: number;
    affectedUsersValue: number;
    calculatedCrashRateString: string;
    crashRateData: ChartDataPoint[];
  }) => void;
}

export function CrashRateReportView({
  user,
  authLoading,
  selectedPeriod,
  totalSessionsCount,
  periodLabel,
  onOpenPeriodModal,
  onDataReady,
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

  useEffect(() => {
    onDataReady?.({
      totalCrashesValue,
      affectedUsersValue,
      calculatedCrashRateString,
      crashRateData,
    });
  }, [totalCrashesValue, affectedUsersValue, calculatedCrashRateString, crashRateData, onDataReady]);

  return (
    <>
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

      <ReportChartCard
        title={t('reports.chartTitleCrashRate')}
        periodLabel={periodLabel}
        onOpenPeriodModal={onOpenPeriodModal}
        loading={loading}
        queryError={queryError}
        hasData={crashRateData.length > 0}
      >
        <UsageLineChart
          data={crashRateData}
          height={230}
          unit="%"
          lineColor={theme.main}
          testID="reports-usage-chart"
        />
      </ReportChartCard>
    </>
  );
}