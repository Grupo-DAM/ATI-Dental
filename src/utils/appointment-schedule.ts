export type AppointmentLifecycleStatus =
  | 'EN ESPERA'
  | 'CONFIRMADO'
  | 'EN PROGRESO'
  | 'COMPLETADO'
  | 'CANCELADO';

export interface ScheduleSlot {
  readonly date: string;
  readonly time: string;
  readonly period?: 'AM' | 'PM';
  readonly durationMinutes: number;
  readonly status: string;
  readonly patientId?: string;
  readonly patientName: string;
  readonly dentistName?: string;
}

export interface AppointmentConflict {
  readonly party: 'patient' | 'dentist';
}

export function parseAppointmentDateKey(value: string): string | null {
  const trimmed = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const local = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!local) return null;
  const day = local[1].padStart(2, '0');
  const month = local[2].padStart(2, '0');
  const year = local[3];
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (parsed.getFullYear() !== Number(year) || parsed.getMonth() !== Number(month) - 1) return null;
  return `${year}-${month}-${day}`;
}

export function parseAppointmentMinutes(time: string, period?: 'AM' | 'PM'): number | null {
  const match = /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i.exec(time.trim());
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const marker = (match[3] || period || '').toUpperCase();
  if (minutes > 59 || hours > 23) return null;
  if (marker === 'PM' && hours < 12) hours += 12;
  if (marker === 'AM' && hours === 12) hours = 0;
  if (marker === 'AM' && hours > 12) return null;
  if (hours > 23) return null;
  return hours * 60 + minutes;
}

export function parseDurationMinutes(value: string): number {
  const match = /(\d+)/.exec(value);
  return match ? Number(match[1]) : 0;
}

export function formatAgendaClock(totalMinutes: number): { time: string; period: 'AM' | 'PM' } {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
  let display = hours % 12;
  if (display === 0) display = 12;
  return {
    time: `${String(display).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    period,
  };
}

export function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

function samePerson(left?: string, right?: string): boolean {
  const a = left?.trim().toLowerCase() || '';
  const b = right?.trim().toLowerCase() || '';
  return a.length > 0 && a === b;
}

export function findAppointmentConflict(
  candidate: {
    readonly patientId: string;
    readonly patientName: string;
    readonly dentistName: string;
    readonly date: string;
    readonly start: number;
    readonly end: number;
  },
  existing: ReadonlyArray<ScheduleSlot>,
): AppointmentConflict | null {
  for (const slot of existing) {
    if (slot.status === 'CANCELADO' || slot.date !== candidate.date) continue;
    const start = parseAppointmentMinutes(slot.time, slot.period);
    if (start == null || slot.durationMinutes <= 0) continue;
    if (!rangesOverlap(candidate.start, candidate.end, start, start + slot.durationMinutes)) continue;

    const samePatient = samePerson(candidate.patientId, slot.patientId) || samePerson(candidate.patientName, slot.patientName);
    if (samePatient) return { party: 'patient' };
    if (samePerson(candidate.dentistName, slot.dentistName)) return { party: 'dentist' };
  }
  return null;
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isInsideAppointmentWindow(slot: ScheduleSlot, now: Date): boolean {
  if (slot.date !== localDateKey(now)) return false;
  const start = parseAppointmentMinutes(slot.time, slot.period);
  if (start == null) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= start && nowMinutes < start + slot.durationMinutes;
}

export function isAfterAppointmentWindow(slot: ScheduleSlot, now: Date): boolean {
  const today = localDateKey(now);
  if (slot.date < today) return true;
  if (slot.date > today) return false;
  const start = parseAppointmentMinutes(slot.time, slot.period);
  if (start == null) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return nowMinutes >= start + slot.durationMinutes;
}

export function getAllowedStatusTransitions(slot: ScheduleSlot, now: Date): AppointmentLifecycleStatus[] {
  if (slot.status === 'CANCELADO' || slot.status === 'COMPLETADO') return [];
  if (slot.status === 'EN ESPERA') return ['CONFIRMADO', 'CANCELADO'];
  if (slot.status === 'EN PROGRESO') return ['COMPLETADO', 'CANCELADO'];
  if (slot.status !== 'CONFIRMADO') return [];
  if (isInsideAppointmentWindow(slot, now)) return ['EN PROGRESO', 'CANCELADO'];
  if (isAfterAppointmentWindow(slot, now)) return ['COMPLETADO', 'CANCELADO'];
  return ['CANCELADO'];
}
