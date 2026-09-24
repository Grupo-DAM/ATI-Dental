import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/reports/KPICard';
import { CountryBarChart } from '@/components/reports/country-bar-chart';
import { RegionDonutChart } from '@/components/reports/region-donut-chart';
import { useTheme } from '@/hooks/use-theme';
import { createReportsStyles } from '../styles/reports.styles';
import { ReportChartCard } from '../components/ReportChartCard';
import { useUserGeographics } from '../hooks/useUserGeographics';
import type { UserProfile } from '@/hooks/use-auth';
import type { UserGeographicsMetrics } from '../types';

interface UserGeographicsReportViewProps {
  user: UserProfile | null;
  authLoading: boolean;
  periodLabel: string;
  onOpenPeriodModal: () => void;
}

export function UserGeographicsReportView({
  user,
  authLoading,
  periodLabel,
  onOpenPeriodModal,
}: Readonly<UserGeographicsReportViewProps>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  const { data, loading, queryError } = useUserGeographics({
    user,
    authLoading,
    enabled: true,
    t,
  });

  const hasData = data && data.totalUsers > 0;

  if (loading || (!data && !queryError)) {
    return (
      <View style={{ marginTop: 20 }}>
        <Text style={{ textAlign: 'center', color: theme.pageSubtitle, fontFamily: 'Open Sans' }}>
          Cargando datos geográficos...
        </Text>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={{ marginTop: 20, padding: 20, backgroundColor: theme.backgroundElement, borderRadius: 12, alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', color: theme.pageSubtitle, fontFamily: 'Open Sans' }}>
          {t('reports.geoDataUnavailable')}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.kpiRow} testID="kpi-cards-container">
        <KPICard
          tinyType={true}
          label={t('reports.kpiCities')}
          value={data.totalCities}
          iconName="location-outline"
          valueTestID="kpi-cities-val"
          cardTestID="kpi-cities"
        />
        <KPICard
          tinyType={true}
          label={t('reports.kpiPrincipal')}
          value={data.mainCountry}
          iconName="star-outline"
          subLabel={`${data.mainCountryPercent}%`}
          hasSubLabel={true}
          accentSubLabel={false}
          valueTestID="kpi-principal-val"
          cardTestID="kpi-principal"
        />
      </View>

      <ReportChartCard
        title={t('reports.chartTopCountries')}
        periodLabel={periodLabel}
        onOpenPeriodModal={onOpenPeriodModal}
        loading={loading}
        queryError={queryError}
        hasData={hasData}
      >
        <CountryBarChart data={data.countryBuckets} />
      </ReportChartCard>

      <ReportChartCard
        title={t('reports.chartRegions')}
        periodLabel={undefined}
        onOpenPeriodModal={undefined}
        loading={loading}
        queryError={queryError}
        hasData={hasData}
      >
        <RegionDonutChart data={data.regionSlices} total={data.totalUsers} />
      </ReportChartCard>
    </>
  );
}
