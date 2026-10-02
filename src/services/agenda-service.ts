import NetInfo from '@react-native-community/netinfo';
import { recordScheduledAppointment } from '@/services/clinical-record-service';
import { firestore } from '@/config/firebase';
import {
  AppointmentConflict,
  AppointmentLifecycleStatus,
  findAppointmentConflict,
  formatAgendaClock,
  getAllowedStatusTransitions,
  parseAppointmentDateKey,
  parseAppointmentMinutes,
  parseDurationMinutes,
  ScheduleSlot,
} from '@/utils/appointment-schedule';

export type AppointmentStatus = AppointmentLifecycleStatus;

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
  readonly dentistName?: string;
  readonly patientId?: string;
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
      appointments: mergeAppointmentsForDate(dateKey, dayOfWeek),
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

  const weekly = buildWeeklyAgenda(baseDate);
  const remote = await loadRemoteAppointments();
  if (remote.length === 0) return weekly;

  return {
    ...weekly,
    days: weekly.days.map((day) => ({
      ...day,
      appointments: sortAppointments(mergeUnique(day.appointments, remote.filter((item) => item.date === day.date))),
    })),
  };
}

export const APPOINTMENTS_COLLECTION = 'citas';

export interface CreateAppointmentInput {
  readonly patientId: string;
  readonly patientName: string;
  readonly dentistName: string;
  readonly appointmentType: string;
  readonly date: string;
  readonly time: string;
  readonly duration: string;
  readonly reason: string;
  readonly notes?: string;
  readonly nextDate?: string;
  readonly nextTime?: string;
}

export class AppointmentConflictError extends Error {
  readonly party: AppointmentConflict['party'];

  constructor(party: AppointmentConflict['party']) {
    super(party === 'patient' ? 'PATIENT_CONFLICT' : 'DENTIST_CONFLICT');
    this.name = 'AppointmentConflictError';
    this.party = party;
  }
}

export class AppointmentRequestError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AppointmentRequestError';
    this.statusCode = statusCode;
  }
}

const savedAppointments: Appointment[] = [];
const statusOverrides = new Map<string, AppointmentStatus>();

export function resetAppointmentStore(): void {
  savedAppointments.length = 0;
  statusOverrides.clear();
}

function withStatus(appointment: Appointment): Appointment {
  const status = statusOverrides.get(appointment.id);
  return status ? { ...appointment, status } : appointment;
}

function sortAppointments(appointments: ReadonlyArray<Appointment>): Appointment[] {
  return [...appointments].sort((left, right) => {
    const leftStart = parseAppointmentMinutes(left.time, left.period) ?? 0;
    const rightStart = parseAppointmentMinutes(right.time, right.period) ?? 0;
    return leftStart - rightStart;
  });
}

function mergeUnique(current: ReadonlyArray<Appointment>, extra: ReadonlyArray<Appointment>): Appointment[] {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...extra.filter((item) => !ids.has(item.id))];
}

function mergeAppointmentsForDate(dateKey: string, dayOfWeek: number): Appointment[] {
  const mocks = createMockAppointmentsForDate(dateKey, dayOfWeek).map(withStatus);
  const saved = savedAppointments.filter((item) => item.date === dateKey).map(withStatus);
  return sortAppointments(mergeUnique(mocks, saved));
}

export function listAppointmentsOnDate(dateKey: string): Appointment[] {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return mergeAppointmentsForDate(dateKey, date.getDay());
}

export async function listAppointmentsForConflict(dateKey: string): Promise<Appointment[]> {
  const local = listAppointmentsOnDate(dateKey);
  const remote = (await loadRemoteAppointments()).filter((item) => item.date === dateKey);
  return sortAppointments(mergeUnique(local, remote));
}

function findAppointmentById(id: string): Appointment | null {
  const saved = savedAppointments.find((item) => item.id === id);
  if (saved) return withStatus(saved);
  const dateKey = /^(\d{4}-\d{2}-\d{2})/.exec(id)?.[1];
  if (!dateKey) return null;
  return listAppointmentsOnDate(dateKey).find((item) => item.id === id) ?? null;
}

function toScheduleSlot(appointment: Appointment): ScheduleSlot {
  return {
    date: appointment.date,
    time: appointment.time,
    period: appointment.period,
    durationMinutes: appointment.durationMinutes,
    status: appointment.status,
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    dentistName: appointment.dentistName,
  };
}

async function assertOnline(): Promise<void> {
  const state = await NetInfo.fetch();
  if (state.isConnected === false) {
    throw new AppointmentRequestError(0, 'NETWORK_ERROR');
  }
}

function readStatusCode(error: unknown): number {
  if (typeof error === 'object' && error && 'status' in error && typeof error.status === 'number') {
    return error.status;
  }
  return 500;
}

export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  const dateKey = parseAppointmentDateKey(input.date);
  const start = parseAppointmentMinutes(input.time);
  const durationMinutes = parseDurationMinutes(input.duration);
  if (!dateKey || start == null || durationMinutes <= 0) {
    throw new AppointmentRequestError(400, 'INVALID_APPOINTMENT');
  }

  const conflict = findAppointmentConflict(
    {
      patientId: input.patientId,
      patientName: input.patientName,
      dentistName: input.dentistName,
      date: dateKey,
      start,
      end: start + durationMinutes,
    },
    (await listAppointmentsForConflict(dateKey)).map(toScheduleSlot),
  );
  if (conflict) throw new AppointmentConflictError(conflict.party);

  await assertOnline();
  const clock = formatAgendaClock(start);
  const appointment: Appointment = {
    id: `local-${Date.now()}`,
    time: clock.time,
    period: clock.period,
    patientName: input.patientName.trim(),
    patientId: input.patientId,
    dentistName: input.dentistName.trim(),
    treatmentName: input.appointmentType.trim(),
    status: 'EN ESPERA',
    chair: 'SILLÓN 1',
    durationMinutes,
    date: dateKey,
    notes: input.notes?.trim() || '',
  };

  try {
    const docRef = await firestore().collection(APPOINTMENTS_COLLECTION).add({
      ...appointment,
      reason: input.reason.trim(),
    });
    const stored = { ...appointment, id: docRef?.id || appointment.id };
    savedAppointments.push(stored);
    try {
      await recordScheduledAppointment({
        patientId: input.patientId,
        dentistName: stored.dentistName || input.dentistName,
        appointmentType: input.appointmentType,
        date: stored.date,
        time: `${stored.time} ${stored.period}`,
        duration: input.duration,
        reason: input.reason,
        notes: input.notes,
        nextDate: input.nextDate,
        nextTime: input.nextTime,
        appointmentId: stored.id,
      });
    } catch (syncError) {
      console.warn('[agenda-service] La cita quedó en la agenda, pero no se copió a consultas:', syncError);
    }
    return stored;
  } catch (error) {
    throw new AppointmentRequestError(readStatusCode(error), 'SAVE_FAILED');
  }
}

export async function updateAppointmentStatus(
  id: string,
  next: AppointmentStatus,
  now: Date = new Date(),
): Promise<Appointment> {
  const current = findAppointmentById(id);
  if (!current) throw new AppointmentRequestError(404, 'NOT_FOUND');

  const allowed = getAllowedStatusTransitions(toScheduleSlot(current), now);
  if (!allowed.includes(next)) throw new AppointmentRequestError(409, 'INVALID_TRANSITION');

  await assertOnline();
  const previous = statusOverrides.get(id);
  statusOverrides.set(id, next);
  const index = savedAppointments.findIndex((item) => item.id === id);
  const previousSaved = index >= 0 ? savedAppointments[index] : null;
  if (index >= 0) savedAppointments[index] = { ...savedAppointments[index], status: next };

  try {
    await firestore().collection(APPOINTMENTS_COLLECTION).doc(id).update({ status: next });
    return { ...current, status: next };
  } catch (error) {
    if (previous) statusOverrides.set(id, previous);
    else statusOverrides.delete(id);
    if (index >= 0 && previousSaved) savedAppointments[index] = previousSaved;
    throw new AppointmentRequestError(readStatusCode(error), 'SAVE_FAILED');
  }
}

async function loadRemoteAppointments(): Promise<Appointment[]> {
  try {
    const snapshot = await firestore().collection(APPOINTMENTS_COLLECTION).get();
    if (!snapshot || snapshot.empty) return [];
    return snapshot.docs
      .map((doc) => mapRemoteAppointment(doc.id, doc.data?.() || {}))
      .filter((item): item is Appointment => item !== null)
      .map(withStatus);
  } catch {
    return [];
  }
}

function readRemoteClock(time: string, periodValue: unknown): { time: string; period: 'AM' | 'PM' } {
  const marker = periodValue === 'PM' || periodValue === 'AM' ? periodValue : undefined;
  const minutes = parseAppointmentMinutes(time, marker);
  if (minutes == null) return { time, period: periodValue === 'PM' ? 'PM' : 'AM' };
  return formatAgendaClock(minutes);
}

function readRemoteDuration(data: Record<string, unknown>): number {
  if (typeof data.durationMinutes === 'number' && data.durationMinutes > 0) return data.durationMinutes;
  if (typeof data.duration === 'string') {
    const parsed = parseDurationMinutes(data.duration);
    if (parsed > 0) return parsed;
  }
  return 30;
}

function mapRemoteAppointment(id: string, data: Record<string, unknown>): Appointment | null {
  const date = parseAppointmentDateKey(typeof data.date === 'string' ? data.date : '') ?? '';
  const rawTime = typeof data.time === 'string' ? data.time : '';
  const patientName = typeof data.patientName === 'string' ? data.patientName : '';
  if (!date || !rawTime || !patientName) return null;
  const clock = readRemoteClock(rawTime, data.period);
  const status = isAppointmentStatus(data.status) ? data.status : 'EN ESPERA';
  return {
    id,
    date,
    time: clock.time,
    period: clock.period,
    patientName,
    treatmentName: typeof data.treatmentName === 'string' ? data.treatmentName : '',
    status,
    chair: typeof data.chair === 'string' ? data.chair : 'SILLÓN 1',
    durationMinutes: readRemoteDuration(data),
    dentistName: typeof data.dentistName === 'string' ? data.dentistName : undefined,
    patientId: typeof data.patientId === 'string' ? data.patientId : undefined,
    notes: typeof data.notes === 'string' ? data.notes : undefined,
  };
}

function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return value === 'EN ESPERA'
    || value === 'CONFIRMADO'
    || value === 'EN PROGRESO'
    || value === 'COMPLETADO'
    || value === 'CANCELADO';
}
