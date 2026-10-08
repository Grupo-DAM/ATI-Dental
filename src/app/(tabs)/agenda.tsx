import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AccessDeniedView } from '@/components/access-denied-view';
import { AppHeader } from '@/components/app-header';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';
import { isOdontologoUser, isAdminUser, isAsistenteUser } from '@/constants/user-roles';
import {
  Appointment,
  AppointmentStatus,
  DaySchedule,
  WeeklyAgenda,
  fetchWeeklyAgenda,
  formatDateKey,
  updateAppointmentStatus,
} from '@/services/agenda-service';
import { getAllowedStatusTransitions } from '@/utils/appointment-schedule';
import { NotificationToast } from '@/components/notification-toast';
import { ScheduleAppointmentButton } from '@/components/schedule-appointment-button';
import { createAgendaStyles } from '@/constants/styles/agenda.styles';
import { printWeeklyAgenda } from '@/services/weekly-agenda-report';

interface WeekHeaderProps {
  readonly monthYear: string;
  readonly title: string;
  readonly onPrevWeek: () => void;
  readonly onNextWeek: () => void;
  readonly onScheduleAppointment: () => void;
  readonly onPrintAgenda?: () => void;
  readonly isPrinting?: boolean;
}

function WeekHeader({
  monthYear,
  title,
  onPrevWeek,
  onNextWeek,
  onScheduleAppointment,
  onPrintAgenda,
  isPrinting = false,
}: Readonly<WeekHeaderProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

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
      <View style={styles.headerActionsRow}>
        <ScheduleAppointmentButton onPress={onScheduleAppointment} />
        {onPrintAgenda ? (
          <TouchableOpacity
            testID="print-agenda-btn"
            style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
            onPress={onPrintAgenda}
            disabled={isPrinting}
            activeOpacity={0.7}
            accessibilityLabel={t('agenda.printAgenda', 'Imprimir Agenda')}
            accessibilityRole="button"
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="print-outline" size={16} color={colors.text} />
            )}
            <Text style={styles.printButtonText}>
              {t('agenda.printAgenda', 'Imprimir Agenda')}
            </Text>
          </TouchableOpacity>
        ) : null}
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

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  CONFIRMADO: 'agenda.confirmed',
  'EN ESPERA': 'agenda.pending',
  'EN PROGRESO': 'agenda.inProgress',
  COMPLETADO: 'agenda.completed',
  CANCELADO: 'agenda.cancelled',
};

const STATUS_ACTION: Record<AppointmentStatus, string> = {
  CONFIRMADO: 'agenda.markConfirmed',
  'EN ESPERA': 'agenda.pending',
  'EN PROGRESO': 'agenda.markInProgress',
  COMPLETADO: 'agenda.markCompleted',
  CANCELADO: 'agenda.markCancelled',
};

function statusBadgeColor(status: AppointmentStatus, colors: { main: string; warning?: string; alert?: string; positive?: string; header?: string }): string {
  if (status === 'EN ESPERA') return colors.warning || colors.main;
  if (status === 'CANCELADO') return colors.alert || colors.main;
  if (status === 'COMPLETADO') return colors.positive || colors.main;
  if (status === 'EN PROGRESO') return colors.header || colors.main;
  return colors.main;
}

interface StatusBadgeProps {
  readonly status: AppointmentStatus;
}

function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { t } = useTranslation();

  const badgeBg = statusBadgeColor(status, colors);
  const labelKey = STATUS_LABEL[status];

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
        {appointment.dentistName ? (
          <Text style={styles.dentistName}>{appointment.dentistName}</Text>
        ) : null}

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
  const { t, i18n } = useTranslation();
  const colors = useTheme();
  const styles = useMemo(() => createAgendaStyles(colors), [colors]);
  const { user: authUser, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{ date?: string; refresh?: string }>();

  const [currentWeekDate, setCurrentWeekDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [agenda, setAgenda] = useState<WeeklyAgenda | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: '',
  });

  const isOdontologo = authUser ? isOdontologoUser(authUser) : false;
  const isAdmin = authUser ? isAdminUser(authUser) : false;
  const isAsistente = authUser ? isAsistenteUser(authUser) : false;
  const hasPermission = isOdontologo || isAdmin || isAsistente;

  const handlePrintAgenda = useCallback(async () => {
    if (!agenda || isPrinting) return;

    try {
      setIsPrinting(true);
      const dentistName = isOdontologo
        ? authUser?.displayName || (authUser as any)?.nombre || authUser?.email
        : undefined;

      await printWeeklyAgenda(agenda, {
        language: i18n?.language?.startsWith('en') ? 'en' : 'es',
        dentistName,
      });
    } catch (error) {
      console.error('Error al imprimir agenda semanal:', error);
      Alert.alert(
        t('agenda.title', 'Agenda Semanal'),
        t('agenda.printError', 'Ocurrió un error al procesar la impresión de la agenda.')
      );
    } finally {
      setIsPrinting(false);
    }
  }, [agenda, isPrinting, isOdontologo, authUser, i18n?.language, t]);

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
    if (!params.date) return;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(params.date);
    if (!match) return;
    setSelectedDate(params.date);
    setCurrentWeekDate(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  }, [params.date, params.refresh]);

  useEffect(() => {
    loadAgenda(currentWeekDate);
  }, [currentWeekDate, loadAgenda, params.refresh]);

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

  const applyStatus = async (appointment: Appointment, next: AppointmentStatus) => {
    try {
      await updateAppointmentStatus(appointment.id, next);
      await loadAgenda(currentWeekDate);
      setToastConfig({
        visible: true,
        type: 'success',
        title: t('agenda.statusUpdatedTitle'),
        message: t('agenda.statusUpdatedMessage', { status: t(STATUS_LABEL[next]) }),
      });
    } catch {
      setToastConfig({
        visible: true,
        type: 'error',
        title: t('agenda.statusErrorTitle'),
        message: t('agenda.statusErrorMessage'),
      });
    }
  };

  const handleAppointmentMenu = (appointment: Appointment) => {
    const transitions = getAllowedStatusTransitions(appointment, new Date());
    const actions = transitions.map((status) => ({
      text: t(STATUS_ACTION[status]),
      style: status === 'CANCELADO' ? 'destructive' as const : 'default' as const,
      onPress: () => {
        void applyStatus(appointment, status);
      },
    }));
    Alert.alert(
      t('agenda.options'),
      t('agenda.optionsMessage', { name: appointment.patientName }),
      [
        ...actions,
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
        <AccessDeniedView
          title={t('agenda.accessDeniedTitle')}
          message={t('agenda.accessDeniedMessage')}
        />
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
        onScheduleAppointment={() => router.push('/(tabs)/patients/schedule-appointment' as any)}
        onPrintAgenda={agenda && !loading ? handlePrintAgenda : undefined}
        isPrinting={isPrinting}
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
      <NotificationToast
        visible={toastConfig.visible}
        type={toastConfig.type}
        title={toastConfig.title}
        message={toastConfig.message}
        onDismiss={() => setToastConfig((prev) => ({ ...prev, visible: false }))}
      />
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