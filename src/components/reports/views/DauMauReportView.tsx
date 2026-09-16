import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/reports/KPICard';
import { DauMauLineChart } from '@/components/reports/dau-mau-line-chart';
import { DAU_MAU_TARGET_RATIO } from '../types';
import { useDauMauMetrics } from '../hooks/useDauMauMetrics';
import { createReportsStyles } from '../styles/reports.styles';
import { useTheme } from '@/hooks/use-theme';
import { ReportChartCard } from '../components/ReportChartCard';

interface DauMauReportViewProps {
  user: any;
  authLoading: boolean;
  systemActiveUsersCount: number | null;
  activeUsersCount: number;
  periodLabel: string;
  onOpenPeriodModal: () => void;
}

export function DauMauReportView({
  user,
  authLoading,
  systemActiveUsersCount,
  activeUsersCount,
  periodLabel,
  onOpenPeriodModal,
}: DauMauReportViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  const { dauValue, mauValue, dauMauRatio, dauMauData } = useDauMauMetrics({
    user,
    authLoading,
    enabled: true,
    systemActiveUsersCount,
    activeUsersCount,
  });

  return (
    <>
      <View style={styles.kpiRowThree} testID="kpi-cards-container">
        <KPICard
          tinyType
          label={t('reports.kpiRatio')}
          value={`${dauMauRatio}%`}
          iconName="trending-up"
          valueTestID="kpi-ratio-value"
          cardTestID="kpi-card-ratio"
          hasSubLabel
          accentSubLabel
          subLabel={`Meta: ${DAU_MAU_TARGET_RATIO}%`}
        />
        <KPICard
          tinyType
          label={t('reports.kpiDau')}
          value={dauValue}
          iconName="person-outline"
          valueTestID="kpi-dau-value"
          cardTestID="kpi-card-dau"
          hasSubLabel
          subLabel={t('reports.kpiDailyAvg')}
        />
        <KPICard
          tinyType
          label={t('reports.kpiMau')}
          value={mauValue}
          iconName="people-outline"
          valueTestID="kpi-mau-value"
          cardTestID="kpi-card-mau"
          hasSubLabel
          subLabel={t('reports.kpiThisMonth')}
        />
      </View>

      <ReportChartCard
        title={t('reports.dauMauChartTitle')}
        periodLabel={periodLabel}
        onOpenPeriodModal={onOpenPeriodModal}
        hasData={true}
      >
        <DauMauLineChart data={dauMauData} height={230} testID="reports-dau-mau-chart" />
      </ReportChartCard>
    </>
  );
}