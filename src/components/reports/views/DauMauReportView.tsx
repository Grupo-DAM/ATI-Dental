import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { KPICard } from '@/components/reports/KPICard';
import { DauMauLineChart } from '@/components/reports/dau-mau-line-chart';
import { DAU_MAU_TARGET_RATIO } from '../types';
import { useDauMauMetrics } from '../hooks/useDauMauMetrics';
import { createReportsStyles } from '../styles/reports.styles';

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
      {/* KPIs DAU / MAU (Líneas 466-475 de reports.tsx) */}
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

      {/* Gráfico DAU / MAU (Líneas 682-707 de reports.tsx) */}
      <View style={styles.chartCard} testID="chart-card">
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle} testID="chart-title">
            {t('reports.dauMauChartTitle')}
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

        <View testID="chart-active-container">
          <DauMauLineChart data={dauMauData} height={230} testID="reports-dau-mau-chart" />
        </View>
      </View>
    </>
  );
}