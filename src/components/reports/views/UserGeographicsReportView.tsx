import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KPICard } from '@/components/reports/KPICard';
import { CountryBarChart } from '@/components/reports/country-bar-chart';
import { RegionDonutChart } from '@/components/reports/region-donut-chart';
import { useTheme } from '@/hooks/use-theme';
import { createReportsStyles } from '../styles/reports.styles';
import { ReportChartCard } from '../components/ReportChartCard';
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

  // MOCK DATA PARA LA INTERFAZ
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserGeographicsMetrics | null>(null);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setData({
        totalCities: 12,
        mainCountry: 'Venezuela',
        mainCountryPercent: 38,
        totalUsers: 142,
        countryBuckets: [
          { key: 've', label: 'Venezuela', count: 54 },
          { key: 'co', label: 'Colombia', count: 31 },
          { key: 'pe', label: 'Peru', count: 22 },
          { key: 'cn', label: 'China', count: 15 },
          { key: 'ar', label: 'Argentina', count: 11 },
          { key: 'cl', label: 'Chile', count: 8 },
          { key: 'pt', label: 'Portugal', count: 5 },
          { key: 'uk', label: 'Inglaterra', count: 3 },
        ],
        regionSlices: [
          { key: 'andina', label: 'Andina', count: 88, percent: 62 },
          { key: 'caribe', label: 'Caribe', count: 26, percent: 18 },
          { key: 'pacifica', label: 'Pacífica', count: 17, percent: 12 },
          { key: 'otros', label: 'Otros', count: 11, percent: 8 },
        ]
      });
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const hasData = data && data.totalUsers > 0;

  if (loading || !data) {
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
        queryError={null}
        hasData={hasData}
      >
        <CountryBarChart data={data.countryBuckets} />
      </ReportChartCard>

      <ReportChartCard
        title={t('reports.chartRegions')}
        periodLabel={undefined}
        onOpenPeriodModal={undefined}
        loading={loading}
        queryError={null}
        hasData={hasData}
      >
        <RegionDonutChart data={data.regionSlices} total={data.totalUsers} />
      </ReportChartCard>
    </>
  );
}
