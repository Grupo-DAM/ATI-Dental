import { parseAppointmentDateKey } from '@/utils/appointment-schedule';

const VISIT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface VisitStamp {
  readonly date: string;
  readonly status?: string;
}

export interface PatientVisitDates {
  lastVisit?: string;
  nextAppointment?: string;
}

function todayKey(today: Date): string {
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export function summarizePatientVisits(
  visits: ReadonlyArray<VisitStamp>,
  today: Date = new Date(),
): PatientVisitDates {
  const currentDay = todayKey(today);
  let lastVisit: string | undefined;
  let nextAppointment: string | undefined;

  visits.forEach((visit) => {
    if (visit.status === 'CANCELADO') return;
    const key = parseAppointmentDateKey(visit.date);
    if (!key) return;
    if (key <= currentDay && (!lastVisit || key > lastVisit)) lastVisit = key;
    if (key >= currentDay && (!nextAppointment || key < nextAppointment)) nextAppointment = key;
  });

  return { lastVisit, nextAppointment };
}

export function formatVisitDay(value?: string): string {
  if (!value?.trim()) return '—';
  const key = parseAppointmentDateKey(value);
  if (!key) return value.trim();
  const [year, month, day] = key.split('-');
  return `${day} ${VISIT_MONTHS[Number(month) - 1]} ${year}`;
}
