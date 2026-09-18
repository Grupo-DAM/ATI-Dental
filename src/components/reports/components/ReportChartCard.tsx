import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { createReportsStyles } from '../styles/reports.styles';

interface ReportChartCardProps {
  title: string;
  periodLabel: string;
  onOpenPeriodModal: () => void;
  loading?: boolean;
  queryError?: string | null;
  hasData?: boolean;
  children: ReactNode;
}

export function ReportChartCard({
  title,
  periodLabel,
  onOpenPeriodModal,
  loading = false,
  queryError = null,
  hasData = true,
  children,
}: ReportChartCardProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const styles = createReportsStyles(theme);

  return (
    <View style={styles.chartCard} testID="chart-card">
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle} testID="chart-title">
          {title}
        </Text>
        <TouchableOpacity
          style={styles.periodFilterBtn}
          onPress={onOpenPeriodModal}
          activeOpacity={0.7}
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
          {children}
        </View>
      )}
    </View>
  );
}