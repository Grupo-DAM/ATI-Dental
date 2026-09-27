import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/components/app-header';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser } from '@/constants/user-roles';
import {
  Appointment,
  AppointmentStatus,
  DaySchedule,
  WeeklyAgenda,
  fetchWeeklyAgenda,
  formatDateKey,
} from '@/services/agenda-service';
import { createAgendaStyles } from '@/constants/styles/agenda.styles';

interface WeekHeaderProps {
  readonly monthYear: string;
  readonly title: string;
  readonly onPrevWeek: () => void;
  readonly onNextWeek: () => void;
}

function WeekHeader({
  monthYear,
  title,
  onPrevWeek,
  onNextWeek,
}: Readonly<WeekHeaderProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.monthYearText}>
        {monthYear}
      </Text>
      <View style={styles.titleRow}>
        <ThemedText style={styles.agendaTitle}>{title}</ThemedText>
        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            testID="prev-week-btn"
            onPress={onPrevWeek}
            activeOpacity={0.7}
            style={styles.navButton}
            accessibilityLabel="Semana anterior"
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="next-week-btn"
            onPress={onNextWeek}
            activeOpacity={0.7}
            style={styles.navButton}
            accessibilityLabel="Semana siguiente"
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

interface DaySelectorProps {
  readonly days: ReadonlyArray<DaySchedule>;
  readonly selectedDate: string;
  readonly onSelectDay: (date: string) => void;
}

function DaySelector({
  days,
  selectedDate,
  onSelectDay,
}: Readonly<DaySelectorProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.daySelectorContainer}>
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        const localizedDayName = t(`agenda.days.${day.dayOfWeek}`, { defaultValue: day.dayName });
        return (
          <TouchableOpacity
            key={day.date}
            testID={`day-item-${day.date}`}
            activeOpacity={0.8}
            onPress={() => onSelectDay(day.date)}
            style={[
              styles.dayCard,
              isSelected && styles.dayCardSelected
            ]}
          >
            <Text
              style={[
                styles.dayNameText, isSelected && styles.dayNameTextSelected,
              ]}
            >
              {localizedDayName}
            </Text>
            <View
              style={[
                styles.dayNumberContainer,
                isSelected && styles.dayNumberContainerSelected,
              ]}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  isSelected && styles.dayNumberTextSelected,
                ]}
              >
                {day.dayNumber}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

interface StatusBadgeProps {
  readonly status: AppointmentStatus;
}

function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  let badgeBg = colors.main;
  let labelKey = 'agenda.confirmed';

  if (status === 'EN ESPERA') {
    badgeBg = colors.warning;
    labelKey = 'agenda.pending';
  } else if (status === 'CANCELADO') {
    badgeBg = colors.alert;
    labelKey = 'agenda.cancelled';
  }

  return (
    <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
      <Text style={styles.statusBadgeText}>{t(labelKey)}</Text>
    </View>
  );
}

interface AppointmentCardProps {
  readonly appointment: Appointment;
  readonly isLast: boolean;
  readonly onMenuPress: (appointment: Appointment) => void;
}

function AppointmentCard({
  appointment,
  isLast,
  onMenuPress,
}: Readonly<AppointmentCardProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.timelineRow}>
      {/* Time and Timeline marker */}
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>
          {appointment.time}
        </Text>
        <Text style={styles.periodText}>
          {appointment.period}
        </Text>
        <View style={styles.timelineMarker} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>

      {/* Appointment Details Card */}
      <View
        testID={`appointment-card-${appointment.id}`}
        style={styles.appointmentCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.patientName}>
            {appointment.patientName}
          </Text>
          <TouchableOpacity
            testID={`appointment-menu-${appointment.id}`}
            activeOpacity={0.7}
            onPress={() => onMenuPress(appointment)}
            style={styles.menuIconButton}
            accessibilityLabel={`Opciones para ${appointment.patientName}`}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.treatmentRow}>
          <Ionicons
            name="document-text-outline"
            size={15}
            color={colors.textSecondary}
            style={styles.treatmentIcon}
          />
          <Text style={styles.treatmentName}>
            {appointment.treatmentName}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          <StatusBadge status={appointment.status} />
          <View style={styles.outlineBadge}>
            <Text style={styles.outlineBadgeText}>
              {t('agenda.chair', {
                number: appointment.chair.replace(/\D/g, '') || '1',
                defaultValue: appointment.chair,
              })}
            </Text>
          </View>
          <View style={styles.outlineBadge}>
            <Text style={styles.outlineBadgeText}>
              {appointment.durationMinutes} {t('agenda.minutes')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

interface LunchBreakDividerProps {
  readonly isLast: boolean;
}

function LunchBreakDivider({ isLast }: Readonly<LunchBreakDividerProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>12:00</Text>
        <Text style={styles.periodText}>PM</Text>
        <View style={styles.timelineMarker} />
        {!isLast && <View style={styles.timelineLine} />}
      </View>
      <View style={styles.lunchBreakCard}>
        <Ionicons name="restaurant-outline" size={14} color={colors.textSecondary} style={styles.treatmentIcon} />
        <Text style={styles.lunchBreakText}>
          {t('agenda.lunchBreak')}
        </Text>
      </View>
    </View>
  );
}

function EmptyAgendaView() {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View testID="agenda-empty-state" style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="calendar-outline" size={44} color={colors.main} />
      </View>
      <Text style={styles.emptyTitle}>
        {t('agenda.noAppointments')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t('agenda.noAppointmentsMessage')}
      </Text>
    </View>
  );
}

interface ErrorAgendaViewProps {
  readonly onRetry: () => void;
}

function ErrorAgendaView({ onRetry }: Readonly<ErrorAgendaViewProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View testID="agenda-error-state" style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      <Text style={styles.emptyTitle}>
        {t('agenda.errorLoading')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {t('agenda.errorLoadingSubtitle')}
      </Text>
      <TouchableOpacity
        testID="retry-agenda-btn"
        onPress={onRetry}
        activeOpacity={0.8}
        style={styles.retryButton}
      >
        <Ionicons name="refresh-outline" size={18} color={colors.overMain} style={styles.treatmentIcon} />
        <Text style={styles.retryButtonText}>{t('agenda.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AgendaScreen() {
  const { t } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { user: authUser, loading: authLoading } = useAuth();

  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [agenda, setAgenda] = useState<WeeklyAgenda | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  const isOdontologo = authUser ? isOdontologoUser(authUser) : false;
  const isAdmin = authUser ? isAdminUser(authUser) : false;
  const hasPermission = isOdontologo || isAdmin;

  const loadAgenda = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      setHasError(false);
      const data = await fetchWeeklyAgenda(date);
      setAgenda(data);

      // If selected date is not in the new week, pick today (if in week) or first day of that week
      setSelectedDate((prevSelected) => {
        const dateInWeek = data.days.some((d) => d.date === prevSelected);
        if (!dateInWeek && data.days.length > 0) {
          const todayKey = formatDateKey(new Date());
          const todayInWeek = data.days.some((d) => d.date === todayKey);
          return todayInWeek ? todayKey : data.days[0].date;
        }
        return prevSelected;
      });
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgenda(currentWeekDate);
  }, [currentWeekDate, loadAgenda]);

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekDate);
    next.setDate(next.getDate() + 7);
    setCurrentWeekDate(next);
  };

  const handleSelectDay = (date: string) => {
    setSelectedDate(date);
  };

  const handleAppointmentMenu = (appointment: Appointment) => {
    Alert.alert(
      t('agenda.options'),
      t('agenda.optionsMessage', { name: appointment.patientName }),
      [
        { text: t('agenda.viewDetails'), onPress: () => {} },
        { text: t('agenda.close'), style: 'cancel' },
      ]
    );
  };

  // Find the selected day's schedule
  const currentDaySchedule = useMemo(() => {
    if (!agenda) return null;
    return agenda.days.find((d) => d.date === selectedDate) ?? agenda.days[0] ?? null;
  }, [agenda, selectedDate]);

  const monthName = agenda
    ? t(`agenda.months.${agenda.month}`, { defaultValue: agenda.monthYearLabel })
    : '';
  const monthYearDisplay = agenda ? `${monthName} ${agenda.year}` : '';

  if (authLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!hasPermission) {
    return (
      <ThemedView testID="agenda-screen" style={styles.container}>
        <AppHeader />
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.breadcrumbSeparator} />
          <ThemedText type="subtitle" style={styles.accessDeniedTitle}>
            {t('agenda.accessDeniedTitle')}
          </ThemedText>
          <ThemedText style={styles.accessDeniedDesc}>
            {t('agenda.accessDeniedMessage')}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView testID="agenda-screen" style={styles.container}>
      <AppHeader />

      {/* Week Title & Navigation */}
      <WeekHeader
        monthYear={monthYearDisplay}
        title={t('agenda.weeklySchedule')}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
      />

      {/* Week Days Strip */}
      {agenda && (
        <DaySelector
          days={agenda.days}
          selectedDate={selectedDate}
          onSelectDay={handleSelectDay}
        />
      )}

      {/* Appointments List / States */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.centerPadding}>
            <ActivityIndicator size="large" />
          </View>
        )}

        {!loading && hasError && (
          <ErrorAgendaView onRetry={() => loadAgenda(currentWeekDate)} />
        )}

        {!loading && !hasError && currentDaySchedule && (
          <>
            {currentDaySchedule.appointments.length === 0 ? (
              <EmptyAgendaView />
            ) : (
              <View style={styles.timelineContainer}>
                {renderAppointmentItems(
                  currentDaySchedule,
                  handleAppointmentMenu
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

/**
 * Helper to render appointments with lunch break divider inserted appropriately.
 */
function renderAppointmentItems(
  daySchedule: DaySchedule,
  onMenuPress: (appointment: Appointment) => void
) {
  const morningAppointments = daySchedule.appointments.filter(
    (a) => a.period === 'AM'
  );
  const afternoonAppointments = daySchedule.appointments.filter(
    (a) => a.period === 'PM'
  );

  const items: React.ReactNode[] = [];

  morningAppointments.forEach((item, index) => {
    const isLast = !daySchedule.hasLunchBreak && afternoonAppointments.length === 0 && index === morningAppointments.length - 1;
    items.push(
      <AppointmentCard
        key={item.id}
        appointment={item}
        isLast={isLast}
        onMenuPress={onMenuPress}
      />
    );
  });

  if (daySchedule.hasLunchBreak) {
    const isLast = afternoonAppointments.length === 0;
    items.push(<LunchBreakDivider key="lunch-break" isLast={isLast} />);
  }

  afternoonAppointments.forEach((item, index) => {
    const isLast = index === afternoonAppointments.length - 1;
    items.push(
      <AppointmentCard
        key={item.id}
        appointment={item}
        isLast={isLast}
        onMenuPress={onMenuPress}
      />
    );
  });

  return items;
}