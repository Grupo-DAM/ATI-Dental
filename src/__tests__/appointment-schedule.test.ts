import {
  findAppointmentConflict,
  getAllowedStatusTransitions,
  parseAppointmentDateKey,
} from '@/utils/appointment-schedule';

const slot = {
  date: '2026-06-16',
  time: '09:00',
  period: 'AM' as const,
  durationMinutes: 45,
  status: 'CONFIRMADO',
  patientName: 'Mariana López',
  dentistName: 'Dr. Smith',
};

describe('appointment schedule rules', () => {
  it('convierte dd/mm/yyyy a la clave de la agenda', () => {
    expect(parseAppointmentDateKey('16/06/2026')).toBe('2026-06-16');
  });

  it('detecta solapamiento del paciente y del odontólogo', () => {
    const patientConflict = findAppointmentConflict({
      patientId: 'otra',
      patientName: 'Mariana López',
      dentistName: 'Dra. García',
      date: '2026-06-16',
      start: 9 * 60 + 30,
      end: 10 * 60,
    }, [slot]);
    expect(patientConflict?.party).toBe('patient');

    const dentistConflict = findAppointmentConflict({
      patientId: 'p-2',
      patientName: 'Pedro Ramírez',
      dentistName: 'Dr. Smith',
      date: '2026-06-16',
      start: 9 * 60 + 15,
      end: 10 * 60,
    }, [slot]);
    expect(dentistConflict?.party).toBe('dentist');
  });

  it('ignora citas canceladas', () => {
    const result = findAppointmentConflict({
      patientId: 'p-2',
      patientName: 'Mariana López',
      dentistName: 'Dr. Smith',
      date: '2026-06-16',
      start: 9 * 60,
      end: 10 * 60,
    }, [{ ...slot, status: 'CANCELADO' }]);
    expect(result).toBeNull();
  });

  it('solo permite en progreso dentro del horario de una cita confirmada', () => {
    const during = new Date(2026, 5, 16, 9, 20);
    const before = new Date(2026, 5, 16, 8, 0);
    expect(getAllowedStatusTransitions({ ...slot, status: 'EN ESPERA' }, before)).toEqual(['CONFIRMADO', 'CANCELADO']);
    expect(getAllowedStatusTransitions(slot, during)).toEqual(['EN PROGRESO', 'CANCELADO']);
    expect(getAllowedStatusTransitions(slot, before)).toEqual(['CANCELADO']);
    expect(getAllowedStatusTransitions({ ...slot, status: 'EN PROGRESO' }, during)).toEqual(['COMPLETADO', 'CANCELADO']);
  });
});
