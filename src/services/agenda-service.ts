export type AppointmentStatus = 'CONFIRMADO' | 'EN ESPERA' | 'CANCELADO';

export interface Appointment {
  readonly id: string;
  readonly time: string;
  readonly period: 'AM' | 'PM';
  readonly patientName: string;
  readonly treatmentName: string;
  readonly status: AppointmentStatus;
  readonly chair: string;
  readonly durationMinutes: number;
  readonly dentistId?: string;
  readonly date: string; // ISO format "YYYY-MM-DD"
  readonly notes?: string;
}

export interface DaySchedule {
  readonly date: string; // "YYYY-MM-DD"
  readonly dayOfWeek: number; // 0=Dom, 1=Lun, ..., 6=Sáb
  readonly dayName: string; // "LUN", "MAR", etc.
  readonly dayNumber: number; // 13, 14, etc.
  readonly isToday: boolean;
  readonly appointments: ReadonlyArray<Appointment>;
  readonly hasLunchBreak?: boolean;
}

export interface WeeklyAgenda {
  readonly weekStart: string;
  readonly weekEnd: string;
  readonly month: number;
  readonly year: number;
  readonly monthYearLabel: string;
  readonly days: ReadonlyArray<DaySchedule>;
}

const MONTH_NAMES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
] as const;

const DAY_ABBREVIATIONS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const;

/**
 * Normalizes a date to Monday of its week.
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formats a Date object to "YYYY-MM-DD".
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns month and year in uppercase string (e.g. "JUNIO 2026").
 */
export function getMonthYearLabel(date: Date): string {
  const monthName = MONTH_NAMES[date.getMonth()] ?? '';
  return `${monthName} ${date.getFullYear()}`;
}

/**
 * Generate mock appointments for a particular date.
 */
function createMockAppointmentsForDate(dateStr: string, dayIndex: number): Appointment[] {
  // Monday
  if (dayIndex === 1) {
    return [
      {
        id: `${dateStr}-1`,
        time: '08:30',
        period: 'AM',
        patientName: 'Pedro Ramírez',
        treatmentName: 'Consulta Diagnóstica',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 1',
        durationMinutes: 30,
        date: dateStr,
      },
      {
        id: `${dateStr}-2`,
        time: '10:00',
        period: 'AM',
        patientName: 'Ana González',
        treatmentName: 'Blanqueamiento Dental',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 2',
        durationMinutes: 60,
        date: dateStr,
      },
      {
        id: `${dateStr}-3`,
        time: '02:00',
        period: 'PM',
        patientName: 'Roberto Torres',
        treatmentName: 'Endodoncia',
        status: 'EN ESPERA',
        chair: 'SILLÓN 1',
        durationMinutes: 60,
        date: dateStr,
      },
    ];
  }

  // Tuesday (matches issue #170 mockup)
  if (dayIndex === 2) {
    return [
      {
        id: `${dateStr}-1`,
        time: '09:00',
        period: 'AM',
        patientName: 'Mariana López',
        treatmentName: 'Limpieza Profunda',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 1',
        durationMinutes: 45,
        date: dateStr,
      },
      {
        id: `${dateStr}-2`,
        time: '10:30',
        period: 'AM',
        patientName: 'Carlos Mendoza',
        treatmentName: 'Extracción Molar',
        status: 'EN ESPERA',
        chair: 'SILLÓN 3',
        durationMinutes: 45,
        date: dateStr,
      },
      {
        id: `${dateStr}-3`,
        time: '01:15',
        period: 'PM',
        patientName: 'Elena Rojas',
        treatmentName: 'Ajuste Ortodoncia',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 2',
        durationMinutes: 30,
        date: dateStr,
      },
    ];
  }

  // Wednesday
  if (dayIndex === 3) {
    return [
      {
        id: `${dateStr}-1`,
        time: '09:15',
        period: 'AM',
        patientName: 'Sofía Castro',
        treatmentName: 'Cirugía de Cordal',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 3',
        durationMinutes: 90,
        date: dateStr,
      },
      {
        id: `${dateStr}-2`,
        time: '11:30',
        period: 'AM',
        patientName: 'Javier Navarro',
        treatmentName: 'Prótesis Fija',
        status: 'CANCELADO',
        chair: 'SILLÓN 1',
        durationMinutes: 45,
        date: dateStr,
      },
      {
        id: `${dateStr}-3`,
        time: '03:00',
        period: 'PM',
        patientName: 'Laura Morales',
        treatmentName: 'Profilaxis',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 2',
        durationMinutes: 30,
        date: dateStr,
      },
    ];
  }

  // Thursday
  if (dayIndex === 4) {
    return [
      {
        id: `${dateStr}-1`,
        time: '10:00',
        period: 'AM',
        patientName: 'Valentina Cruz',
        treatmentName: 'Tratamiento Periodontal',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 1',
        durationMinutes: 45,
        date: dateStr,
      },
      {
        id: `${dateStr}-2`,
        time: '02:30',
        period: 'PM',
        patientName: 'Diego Silva',
        treatmentName: 'Restauración con Resina',
        status: 'EN ESPERA',
        chair: 'SILLÓN 2',
        durationMinutes: 45,
        date: dateStr,
      },
    ];
  }

  // Friday
  if (dayIndex === 5) {
    return [
      {
        id: `${dateStr}-1`,
        time: '08:30',
        period: 'AM',
        patientName: 'Camila Rivas',
        treatmentName: 'Control de Brackets',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 3',
        durationMinutes: 30,
        date: dateStr,
      },
      {
        id: `${dateStr}-2`,
        time: '10:00',
        period: 'AM',
        patientName: 'Martín Herrera',
        treatmentName: 'Limpieza y Fluorización',
        status: 'CONFIRMADO',
        chair: 'SILLÓN 1',
        durationMinutes: 45,
        date: dateStr,
      },
    ];
  }

  // Saturday (empty day by default to satisfy empty state criterion)
  return [];
}

/**
 * Builds the week structure starting from Monday through Saturday (6 days, like the mockup).
 */
export function buildWeeklyAgenda(baseDate: Date): WeeklyAgenda {
  const monday = getMondayOfWeek(baseDate);
  const todayKey = formatDateKey(new Date());

  const days: DaySchedule[] = [];

  for (let i = 0; i < 6; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const dateKey = formatDateKey(current);
    const dayOfWeek = current.getDay(); // 1=Mon, 2=Tue, ..., 6=Sat
    const dayAbbrev = DAY_ABBREVIATIONS[dayOfWeek] ?? '';

    days.push({
      date: dateKey,
      dayOfWeek,
      dayName: dayAbbrev,
      dayNumber: current.getDate(),
      isToday: dateKey === todayKey,
      appointments: createMockAppointmentsForDate(dateKey, dayOfWeek),
      hasLunchBreak: dayOfWeek >= 1 && dayOfWeek <= 5,
    });
  }

  const weekEndDate = new Date(monday);
  weekEndDate.setDate(monday.getDate() + 5);

  return {
    weekStart: formatDateKey(monday),
    weekEnd: formatDateKey(weekEndDate),
    month: monday.getMonth(),
    year: monday.getFullYear(),
    monthYearLabel: getMonthYearLabel(monday),
    days,
  };
}

/**
 * Fetches the weekly agenda with simulated network delay.
 * Allows passing a shouldFail flag for testing error state.
 */
export async function fetchWeeklyAgenda(
  baseDate: Date,
  shouldFail: boolean = false
): Promise<WeeklyAgenda> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  if (shouldFail) {
    throw new Error('NETWORK_ERROR');
  }

  return buildWeeklyAgenda(baseDate);
}
