import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { KPICard } from '@/components/reports/KPICard';
import { RetentionBarChart } from '@/components/reports/retention-bar-chart';
import { useRetentionMetrics } from '../hooks/useRetentionMetrics';
import { createReportsStyles } from '../styles/reports.styles';
import { ReportChartCard } from '../components/ReportChartCard';

interface RetentionReportViewProps {
  user: any;
  authLoading: boolean;
}

export function RetentionReportView({
  user,
  authLoading,
}: RetentionReportViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  const {
    retentionData,
    day1String,
    day7String,
    day30String,
    loading,
    queryError,
  } = useRetentionMetrics({
    user,
    authLoading,
    enabled: true,
    t,
  });

  return (
    <>
      <View style={styles.kpiRowThree} testID="kpi-cards-container">
        <KPICard
          tinyType
          label={t('reports.retentionKpiDay1')}
          value={day1String}
          iconName="time-outline"
          valueTestID="kpi-retention-day1-val"
          cardTestID="kpi-retention-day1"
          loading={loading}
          hasSubLabel
          subLabel={t('reports.retentionDay1Sub')}
        />
        <KPICard
          tinyType
          label={t('reports.retentionKpiDay7')}
          value={day7String}
          iconName="calendar-outline"
          valueTestID="kpi-retention-day7-val"
          cardTestID="kpi-retention-day7"
          loading={loading}
          hasSubLabel
          subLabel={t('reports.retentionDay7Sub')}
        />
        <KPICard
          tinyType
          label={t('reports.retentionKpiDay30')}
          value={day30String}
          iconName="repeat-outline"
          valueTestID="kpi-retention-day30-val"
          cardTestID="kpi-retention-day30"
          loading={loading}
          hasSubLabel
          subLabel={t('reports.retentionDay30Sub')}
        />
      </View>

      <ReportChartCard
        title={t('reports.chartTitleRetentionRate')}
        loading={loading}
        queryError={queryError}
        hasData={retentionData.length > 0}
      >
        <RetentionBarChart
          data={retentionData}
          height={230}
          testID="reports-retention-chart"
        />
      </ReportChartCard>
    </>
  );
}
