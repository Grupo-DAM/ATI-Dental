import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/reports/KPICard';
import { DauMauLineChart, DauMauDataPoint } from '@/components/reports/dau-mau-line-chart';
import { DAU_MAU_TARGET_RATIO } from '../types';
import { useDauMauMetrics } from '../hooks/useDauMauMetrics';
import { createReportsStyles } from '../../../constants/styles/reports.styles';
import { useTheme } from '@/hooks/use-theme';
import { ReportChartCard } from '../components/ReportChartCard';
import type { UserProfile } from '@/hooks/use-auth';

interface DauMauReportViewProps {
  user: UserProfile | null;
  authLoading: boolean;
  systemActiveUsersCount: number | null;
  activeUsersCount: number;
  periodLabel: string;
  onOpenPeriodModal: () => void;
  onDataReady?: (data: {
    dauValue: number;
    mauValue: number;
    dauMauRatio: number;
    dauMauData: DauMauDataPoint[];
  }) => void;
}

export function DauMauReportView({
  user,
  authLoading,
  systemActiveUsersCount,
  activeUsersCount,
  periodLabel,
  onOpenPeriodModal,
  onDataReady,
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

  useEffect(() => {
    onDataReady?.({ dauValue, mauValue, dauMauRatio, dauMauData });
  }, [dauValue, mauValue, dauMauRatio, dauMauData, onDataReady]);

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
          infoTooltip={{
            title: t('reports.kpiRatioTooltipTitle'),
            description: t('reports.kpiRatioTooltipDesc'),
            calculationNote: `(DAU / MAU) × 100`,
          }}
          infoTestID="kpi-ratio-info-icon"
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
          infoTooltip={{
            title: t('reports.kpiDauTooltipTitle'),
            description: t('reports.kpiDauTooltipDesc'),
          }}
          infoTestID="kpi-dau-info-icon"
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
          infoTooltip={{
            title: t('reports.kpiMauTooltipTitle'),
            description: t('reports.kpiMauTooltipDesc'),
          }}
          infoTestID="kpi-mau-info-icon"
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