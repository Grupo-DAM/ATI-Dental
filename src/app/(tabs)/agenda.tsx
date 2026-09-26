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

  return (
    <View style={styles.headerContainer}>
      <Text style={[styles.monthYearText, { color: colors.textSecondary }]}>
        {monthYear}
      </Text>
      <View style={styles.titleRow}>
        <ThemedText style={styles.agendaTitle}>{title}</ThemedText>
        <View style={styles.navButtonsRow}>
          <TouchableOpacity
            testID="prev-week-btn"
            onPress={onPrevWeek}
            activeOpacity={0.7}
            style={[styles.navButton, { borderColor: colors.border }]}
            accessibilityLabel="Semana anterior"
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="next-week-btn"
            onPress={onNextWeek}
            activeOpacity={0.7}
            style={[styles.navButton, { borderColor: colors.border }]}
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
              {
                backgroundColor: colors.backgroundElement,
                borderColor: isSelected ? colors.main : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.dayNameText,
                { color: isSelected ? colors.main : colors.textSecondary },
              ]}
            >
              {localizedDayName}
            </Text>
            <View
              style={[
                styles.dayNumberContainer,
                isSelected && { backgroundColor: colors.main },
              ]}
            >
              <Text
                style={[
                  styles.dayNumberText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
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
  const { t } = useTranslation();

  let badgeBg = '#5B2D8B';
  let labelKey = 'agenda.confirmed';

  if (status === 'EN ESPERA') {
    badgeBg = '#D97706';
    labelKey = 'agenda.pending';
  } else if (status === 'CANCELADO') {
    badgeBg = '#DC2626';
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
  const { t } = useTranslation();

  return (
    <View style={styles.timelineRow}>
      {/* Time and Timeline marker */}
      <View style={styles.timeColumn}>
        <Text style={[styles.timeText, { color: colors.text }]}>
          {appointment.time}
        </Text>
        <Text style={[styles.periodText, { color: colors.textSecondary }]}>
          {appointment.period}
        </Text>
        <View style={[styles.timelineMarker, { borderColor: colors.main }]} />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.cardSeparator }]} />}
      </View>

      {/* Appointment Details Card */}
      <View
        testID={`appointment-card-${appointment.id}`}
        style={[
          styles.appointmentCard,
          {
            backgroundColor: colors.backgroundElement,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.patientName, { color: colors.text }]}>
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
          <Text style={[styles.treatmentName, { color: colors.textSecondary }]}>
            {appointment.treatmentName}
          </Text>
        </View>

        <View style={styles.badgesRow}>
          <StatusBadge status={appointment.status} />
          <View style={[styles.outlineBadge, { borderColor: colors.cardSeparator }]}>
            <Text style={[styles.outlineBadgeText, { color: colors.textSecondary }]}>
              {t('agenda.chair', {
                number: appointment.chair.replace(/\D/g, '') || '1',
                defaultValue: appointment.chair,
              })}
            </Text>
          </View>
          <View style={[styles.outlineBadge, { borderColor: colors.cardSeparator }]}>
            <Text style={[styles.outlineBadgeText, { color: colors.textSecondary }]}>
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
  const { t } = useTranslation();

  return (
    <View style={styles.timelineRow}>
      <View style={styles.timeColumn}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>12:00</Text>
        <Text style={[styles.periodText, { color: colors.textSecondary }]}>PM</Text>
        <View style={[styles.timelineMarker, { borderColor: colors.cardSeparator }]} />
        {!isLast && <View style={[styles.timelineLine, { backgroundColor: colors.cardSeparator }]} />}
      </View>
      <View style={[styles.lunchBreakCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
        <Ionicons name="restaurant-outline" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
        <Text style={[styles.lunchBreakText, { color: colors.textSecondary }]}>
          {t('agenda.lunchBreak')}
        </Text>
      </View>
    </View>
  );
}

function EmptyAgendaView() {
  const colors = useTheme();
  const { t } = useTranslation();

  return (
    <View testID="agenda-empty-state" style={styles.emptyContainer}>
      <View style={[styles.emptyIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name="calendar-outline" size={44} color={colors.main} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t('agenda.noAppointments')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
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
  const { t } = useTranslation();

  return (
    <View testID="agenda-error-state" style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
      <Text style={[styles.emptyTitle, { color: colors.text, marginTop: 12 }]}>
        {t('agenda.errorLoading')}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        {t('agenda.errorLoadingSubtitle')}
      </Text>
      <TouchableOpacity
        testID="retry-agenda-btn"
        onPress={onRetry}
        activeOpacity={0.8}
        style={[styles.retryButton, { backgroundColor: colors.main }]}
      >
        <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.retryButtonText}>{t('agenda.retry')}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AgendaScreen() {
  const { t } = useTranslation();
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
          <Ionicons name="lock-closed-outline" size={48} color="#9CA3AF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPadding: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  monthYearText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agendaTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  navButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectorContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'space-between',
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginHorizontal: 3,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90,
  },
  timelineContainer: {
    paddingTop: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 60,
    alignItems: 'center',
    paddingTop: 4,
    position: 'relative',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  periodText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
  },
  timelineMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    marginTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    top: 50,
    bottom: -16,
    width: 2,
  },
  appointmentCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
  },
  menuIconButton: {
    padding: 4,
  },
  treatmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  treatmentIcon: {
    marginRight: 6,
  },
  treatmentName: {
    fontSize: 13,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  outlineBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  outlineBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  lunchBreakCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 10,
    marginLeft: 8,
  },
  lunchBreakText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  accessDeniedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  accessDeniedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  accessDeniedDesc: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
  },
});
