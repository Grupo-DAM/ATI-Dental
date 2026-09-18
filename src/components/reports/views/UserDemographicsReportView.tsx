import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/reports/KPICard';
import { AgeBarChart } from '@/components/reports/age-bar-chart';
import { GenderDonutChart } from '@/components/reports/gender-donut-chart';
import { useTheme } from '@/hooks/use-theme';
import { createReportsStyles } from '../styles/reports.styles';
import { ReportChartCard } from '../components/ReportChartCard';
import { useUserDemographics } from '../hooks/useUserDemographics';
import type { UserProfile } from '@/hooks/use-auth';

interface UserDemographicsReportViewProps {
  user: UserProfile | null;
  authLoading: boolean;
  periodLabel: string;
  onOpenPeriodModal: () => void;
}

export function UserDemographicsReportView({
  user,
  authLoading,
  periodLabel,
  onOpenPeriodModal,
}: UserDemographicsReportViewProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  const {
    totalUsers,
    averageAge,
    ageBuckets,
    genderSlices,
    loading,
    queryError,
  } = useUserDemographics({
    user,
    authLoading,
    enabled: true,
    t,
  });

  const hasData = totalUsers > 0;

  return (
    <>
      <View style={styles.kpiRow} testID="kpi-cards-container">
        <KPICard
          tinyType={false}
          label={t('reports.kpiTotalUsers')}
          value={totalUsers}
          iconName="people-outline"
          valueTestID="kpi-total-users-val"
          cardTestID="kpi-total-users"
          loading={loading}
        />
        <KPICard
          tinyType={false}
          label={t('reports.kpiAverageAge')}
          value={averageAge ?? '—'}
          iconName="calendar-outline"
          valueTestID="kpi-average-age-val"
          cardTestID="kpi-average-age"
          loading={loading}
        />
      </View>

      <ReportChartCard
        title={t('reports.ageChartTitle')}
        periodLabel={periodLabel}
        onOpenPeriodModal={onOpenPeriodModal}
        loading={loading}
        queryError={queryError}
        hasData={hasData}
      >
        <AgeBarChart data={ageBuckets} />
      </ReportChartCard>

      <ReportChartCard
        title={t('reports.genderChartTitle')}
        periodLabel={periodLabel}
        onOpenPeriodModal={onOpenPeriodModal}
        loading={loading}
        queryError={queryError}
        hasData={hasData}
      >
        <GenderDonutChart data={genderSlices} total={totalUsers} />
      </ReportChartCard>
    </>
  );
}
