import React, { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ReportChartCard } from '@/components/reports/components/ReportChartCard';
import { KPICard } from '@/components/reports/KPICard';
import { PeakHoursDistribution, SessionRecord } from '@/components/reports/types';
import { ChartDataPoint, UsageLineChart } from '@/components/reports/usage-line-chart';
import {
  calculatePeakHoursDistribution,
  filterSessionsByDay,
  formatDayKeyLabel,
  formatSessionDayKey,
  HourWindow,
} from '@/components/reports/utils/reports-utils';
import { createHourlyDistributionStyles } from '@/constants/styles/hourly-distribution.styles';
import { createReportsStyles } from '@/constants/styles/reports.styles';
import { useTheme } from '@/hooks/use-theme';
import { BirthDatePicker } from '@/components/ui/birth-date-picker';
import { ModalOptionList, ModalOptionProp } from '@/components/ui/modal-option-list';

const ALL_DAYS = 'all';

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function minimumReportDay(): Date {
  const day = startOfDay(new Date());
  day.setDate(day.getDate() - 29);
  return day;
}

function dateFromDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export interface HourlyDistributionSnapshot {
  distribution: PeakHoursDistribution;
  dayLabel: string;
  windowLabel: string;
  dayKey: string | null;
  windowHours: HourWindow;
}

interface HourlyDistributionReportViewProps {
  sessions: SessionRecord[];
  loading: boolean;
  queryError: string | null;
  totalAccessToday: number;
  displayedActiveUsers: number;
  onSnapshot?: (snapshot: HourlyDistributionSnapshot) => void;
}

export function HourlyDistributionReportView({
  sessions,
  loading,
  queryError,
  totalAccessToday,
  displayedActiveUsers,
  onSnapshot,
}: Readonly<HourlyDistributionReportViewProps>) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useMemo(() => createHourlyDistributionStyles(theme), [theme]);
  const reportStyles = useMemo(() => createReportsStyles(theme), [theme]);
  const [selectedDay, setSelectedDay] = useState(ALL_DAYS);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [hourWindow, setHourWindow] = useState<HourWindow>(24);
  const [showWindowModal, setShowWindowModal] = useState(false);

  useEffect(() => {
    setSelectedDay(ALL_DAYS);
  }, [hourWindow]);

  const windowOptions = useMemo<ModalOptionProp[]>(() => ([
    { name: 4, testID: 'hourly-window-4', label: t('reports.hourlyWindow4') },
    { name: 12, testID: 'hourly-window-12', label: t('reports.hourlyWindow12') },
    { name: 24, testID: 'hourly-window-24', label: t('reports.hourlyWindow24') },
  ]), [t]);

  const windowLabel = useMemo(() => {
    if (hourWindow === 4) return t('reports.hourlyWindow4');
    if (hourWindow === 12) return t('reports.hourlyWindow12');
    return t('reports.hourlyWindow24');
  }, [hourWindow, t]);

  const dayKey = selectedDay === ALL_DAYS ? null : selectedDay;
  const dayLabel = dayKey ? formatDayKeyLabel(dayKey) : t('reports.hourlyAllDays');
  const pickerValue = dayKey ? dateFromDayKey(dayKey) : startOfDay(new Date());

  const distribution = useMemo(() => {
    const scoped = filterSessionsByDay(sessions, selectedDay === ALL_DAYS ? null : selectedDay);
    return calculatePeakHoursDistribution(scoped, hourWindow);
  }, [sessions, selectedDay, hourWindow]);

  const chartData = useMemo<ChartDataPoint[]>(() => (
    distribution.slots.map((slot) => ({
      label: String(slot.hour).padStart(2, '0'),
      value: slot.count,
      caption: slot.label,
      fullDate: slot.label,
    }))
  ), [distribution.slots]);

  useEffect(() => {
    onSnapshot?.({ distribution, dayLabel, windowLabel, dayKey, windowHours: hourWindow });
  }, [dayKey, distribution, dayLabel, hourWindow, windowLabel, onSnapshot]);

  const showInsight = !distribution.isEmpty && !loading && !queryError;

  return (
    <>
      <ModalOptionList
        visible={showWindowModal}
        onRequestClose={() => setShowWindowModal(false)}
        title={t('reports.hourlyWindowTitle')}
        options={windowOptions}
        selectedOption={hourWindow}
        onSelectOption={setHourWindow}
      />
      <BirthDatePicker
        visible={showDayPicker}
        value={pickerValue}
        title={t('reports.hourlyDayLabel')}
        confirmLabel={t('profile.confirmDate')}
        pickerTestID="hourly-day-picker"
        modalTestID="hourly-day-modal"
        confirmTestID="hourly-day-confirm"
        locale={i18n.language?.startsWith('en') ? 'en-US' : 'es-ES'}
        limitToBirthRange={false}
        minimumDate={minimumReportDay()}
        maximumDate={startOfDay(new Date())}
        onClose={() => setShowDayPicker(false)}
        onSelect={(date) => setSelectedDay(formatSessionDayKey(date.getTime()))}
      />

      <View style={reportStyles.kpiRow} testID="kpi-cards-container">
        <KPICard
          tinyType={false}
          label={t('reports.totalAccessToday')}
          value={totalAccessToday}
          iconName="log-in-outline"
          valueTestID="kpi-total-access-val"
          cardTestID="kpi-total-access"
          loading={loading}
        />
        <KPICard
          tinyType={false}
          label={t('reports.activeUsers')}
          value={displayedActiveUsers}
          iconName="people"
          valueTestID="kpi-active-users-val"
          cardTestID="kpi-active-users"
          loading={loading}
        />
      </View>

      {showInsight && (
        <View style={styles.insightCard} testID="hourly-peak-insight">
          <Text style={styles.insightTitle}>
            {distribution.isBimodal ? t('reports.hourlyPeaksTitle') : t('reports.hourlyPeakTitle')}
          </Text>
          {distribution.peaks.map((peak) => (
            <Text key={peak.hour} style={styles.insightPeak} testID={`hourly-peak-${peak.hour}`}>
              {`${peak.label} (${peak.count} ${t('reports.hourlyAccesses')})`}
            </Text>
          ))}
        </View>
      )}

      <View style={[reportStyles.filterSection, styles.filterGap]}>
        <Text style={reportStyles.fieldLabel}>{t('reports.hourlyDayLabel')}</Text>
        <View style={reportStyles.selectButton}>
          <TouchableOpacity
            style={styles.dayFieldPress}
            onPress={() => setShowDayPicker(true)}
            activeOpacity={0.7}
            testID="hourly-day-select"
          >
            <Text style={reportStyles.selectButtonText} numberOfLines={1}>{dayLabel}</Text>
          </TouchableOpacity>
          {dayKey ? (
            <TouchableOpacity
              onPress={() => setSelectedDay(ALL_DAYS)}
              activeOpacity={0.7}
              testID="hourly-day-clear"
            >
              <Ionicons name="close-circle-outline" size={18} color={theme.pageSubtitle} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => setShowDayPicker(true)} activeOpacity={0.7} testID="hourly-day-calendar">
            <Ionicons name="calendar-outline" size={18} color={theme.pageSubtitle} />
          </TouchableOpacity>
        </View>
      </View>

      <ReportChartCard
        title={t('reports.hourlyChartTitle')}
        periodLabel={windowLabel}
        onOpenPeriodModal={() => setShowWindowModal(true)}
        loading={loading}
        queryError={queryError}
        hasData={!distribution.isEmpty}
        emptyMessage={t('reports.hourlyEmpty')}
        emptyTestID="hourly-empty-state"
      >
        <UsageLineChart
          data={chartData}
          height={230}
          unit="acc"
          lineColor={theme.main}
          testID="hourly-distribution-chart"
        />
      </ReportChartCard>
    </>
  );
}
