import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { createReportsStyles } from '../styles/reports.styles';

interface ReportChartCardProps {
  readonly title: string;
  readonly periodLabel?: string;
  readonly onOpenPeriodModal?: () => void;
  readonly loading?: boolean;
  readonly queryError?: string | null;
  readonly hasData?: boolean;
  readonly children: ReactNode;
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

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.stateContainer} testID="chart-loading">
          <ActivityIndicator size="large" color={theme.main} />
          <Text style={styles.stateText}>{t('reports.loading')}</Text>
        </View>
      );
    }

    if (queryError) {
      return (
        <View style={styles.emptyContainer} testID="chart-error-state">
          <View style={styles.emptyIconCircle}>
            <Ionicons name="shield-outline" size={36} color={theme.error} />
          </View>
          <Text style={[styles.emptyText, { color: theme.error, fontWeight: '600' }]}>
            {queryError}
          </Text>
        </View>
      );
    }

    if (!hasData) {
      return (
        <View style={styles.emptyContainer} testID="chart-empty-state">
          <View style={styles.emptyIconCircle}>
            <Ionicons name="analytics-outline" size={36} color={theme.chartLegendText} />
          </View>
          <Text style={styles.emptyText}>{t('reports.emptyState')}</Text>
        </View>
      );
    }

    return (
      <View testID="chart-active-container">
        {children}
      </View>
    );
  };

  return (
    <View style={styles.chartCard} testID="chart-card">
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle} testID="chart-title">
          {title}
        </Text>
        {onOpenPeriodModal && (
          <TouchableOpacity
            style={styles.periodFilterBtn}
            onPress={onOpenPeriodModal}
            activeOpacity={0.7}
            testID="period-filter-btn"
          >
            <Text style={styles.periodFilterText}>{periodLabel}</Text>
            <Ionicons name="filter" size={14} color={theme.pageSubtitle} style={styles.filterIcon} />
          </TouchableOpacity>
        )}
      </View>

      {renderContent()}
    </View>
  );
}