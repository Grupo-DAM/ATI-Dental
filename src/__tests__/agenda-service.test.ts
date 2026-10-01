import {
  getMondayOfWeek,
  formatDateKey,
  getMonthYearLabel,
  buildWeeklyAgenda,
  fetchWeeklyAgenda,
  createAppointment,
  updateAppointmentStatus,
  resetAppointmentStore,
  AppointmentConflictError,
  AppointmentRequestError,
} from '@/services/agenda-service';
import { recordScheduledAppointment } from '@/services/clinical-record-service';
import { firestore } from '@/config/firebase';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@/services/clinical-record-service', () => {
  const actual = jest.requireActual('@/services/clinical-record-service');
  return {
    ...actual,
    recordScheduledAppointment: jest.fn((...args: unknown[]) => actual.recordScheduledAppointment(...args)),
  };
});

describe('Agenda Service', () => {
  beforeEach(() => {
    resetAppointmentStore();
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });
  describe('getMondayOfWeek', () => {
    it('returns the Monday for a Wednesday', () => {
      // Wednesday June 17, 2026
      const wednesday = new Date(2026, 5, 17);
      const monday = getMondayOfWeek(wednesday);
      expect(monday.getDay()).toBe(1); // Monday
      expect(monday.getDate()).toBe(15);
    });

    it('returns the Monday for a Sunday', () => {
      // Sunday June 21, 2026
      const sunday = new Date(2026, 5, 21);
      const monday = getMondayOfWeek(sunday);
      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(15);
    });

    it('returns itself if already a Monday', () => {
      // Monday June 15, 2026
      const mondayInput = new Date(2026, 5, 15);
      const monday = getMondayOfWeek(mondayInput);
      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(15);
    });
  });

  describe('formatDateKey', () => {
    it('formats a date as YYYY-MM-DD with zero-padding', () => {
      const date = new Date(2026, 5, 9); // June 9, 2026
      expect(formatDateKey(date)).toBe('2026-06-09');
    });

    it('formats double digit days and months properly', () => {
      const date = new Date(2026, 11, 25); // Dec 25, 2026
      expect(formatDateKey(date)).toBe('2026-12-25');
    });
  });

  describe('getMonthYearLabel', () => {
    it('returns uppercase Spanish month and year', () => {
      const date = new Date(2026, 5, 14); // June 2026
      expect(getMonthYearLabel(date)).toBe('JUNIO 2026');
    });

    it('returns correct label for December', () => {
      const date = new Date(2026, 11, 1);
      expect(getMonthYearLabel(date)).toBe('DICIEMBRE 2026');
    });
  });

  describe('buildWeeklyAgenda', () => {
    it('builds a 6-day week from Monday to Saturday with month, year and dayOfWeek', () => {
      const baseDate = new Date(2026, 5, 16); // Tuesday June 16, 2026
      const weekly = buildWeeklyAgenda(baseDate);

      expect(weekly.days).toHaveLength(6);
      expect(weekly.month).toBe(5);
      expect(weekly.year).toBe(2026);
      expect(weekly.days[0].dayName).toBe('LUN');
      expect(weekly.days[0].dayOfWeek).toBe(1);
      expect(weekly.days[1].dayName).toBe('MAR');
      expect(weekly.days[1].dayOfWeek).toBe(2);
      expect(weekly.days[5].dayName).toBe('SÁB');
      expect(weekly.days[5].dayOfWeek).toBe(6);
    });

    it('populates Tuesday appointments matching mockup', () => {
      const baseDate = new Date(2026, 5, 16);
      const weekly = buildWeeklyAgenda(baseDate);
      const tuesday = weekly.days[1];

      expect(tuesday.appointments.length).toBeGreaterThan(0);
      expect(tuesday.appointments[0].patientName).toBe('Mariana López');
      expect(tuesday.appointments[0].status).toBe('CONFIRMADO');
      expect(tuesday.appointments[1].patientName).toBe('Carlos Mendoza');
      expect(tuesday.appointments[1].status).toBe('EN ESPERA');
      expect(tuesday.appointments[2].patientName).toBe('Elena Rojas');
      expect(tuesday.appointments[2].status).toBe('CONFIRMADO');
    });

    it('leaves Saturday empty for empty-state demonstration', () => {
      const baseDate = new Date(2026, 5, 16);
      const weekly = buildWeeklyAgenda(baseDate);
      const saturday = weekly.days[5];

      expect(saturday.appointments).toHaveLength(0);
    });
  });

  describe('fetchWeeklyAgenda', () => {
    it('resolves weekly agenda successfully', async () => {
      const baseDate = new Date(2026, 5, 16);
      const result = await fetchWeeklyAgenda(baseDate);

      expect(result).toBeDefined();
      expect(result.days).toHaveLength(6);
      expect(result.monthYearLabel).toContain('2026');
    });

    it('rejects when shouldFail is true', async () => {
      const baseDate = new Date(2026, 5, 16);
      await expect(fetchWeeklyAgenda(baseDate, true)).rejects.toThrow('NETWORK_ERROR');
    });

    it('mezcla las citas remotas del día y omite las incompletas', async () => {
      firestore().collection('citas').get.mockResolvedValueOnce({
        empty: false,
        docs: [
          {
            id: 'remote-1',
            data: () => ({
              date: '2026-06-16',
              time: '11:00 AM',
              patientName: 'Remoto',
              status: 'EN ESPERA',
              duration: '40 minutos',
            }),
          },
          {
            id: 'remote-2',
            data: () => ({
              date: '2026-06-16',
              time: '04:00',
              period: 'PM',
              patientName: 'Sin duración',
              status: 'CONFIRMADO',
            }),
          },
          {
            id: 'bad',
            data: () => ({ time: '09:00' }),
          },
        ],
      });

      const result = await fetchWeeklyAgenda(new Date(2026, 5, 16));
      const tuesday = result.days.find((day) => day.date === '2026-06-16');

      expect(tuesday?.appointments.some((item) => item.patientName === 'Remoto')).toBe(true);
      expect(tuesday?.appointments.some((item) => item.patientName === 'Sin duración' && item.durationMinutes === 30)).toBe(true);
    });

    it('muestra la semana local si no puede leer las citas remotas', async () => {
      firestore().collection('citas').get.mockRejectedValueOnce(new Error('down'));
      const result = await fetchWeeklyAgenda(new Date(2026, 5, 16));
      expect(result.days).toHaveLength(6);
    });
  });

  describe('createAppointment', () => {
    const input = {
      patientId: 'pat-nueva',
      patientName: 'Paciente Nueva',
      dentistName: 'Dra. Única',
      appointmentType: 'Control',
      date: '20/06/2026',
      time: '09:30 AM',
      duration: '30 minutos',
      reason: 'Control',
      notes: 'Traer estudios',
    };

    it('registra la cita en espera y la muestra en la agenda de ese día', async () => {
      const saved = await createAppointment(input);

      expect(saved.status).toBe('EN ESPERA');
      expect(saved.dentistName).toBe('Dra. Única');
      expect(saved.date).toBe('2026-06-20');

      const saturday = buildWeeklyAgenda(new Date(2026, 5, 20)).days[5];
      expect(saturday.appointments.some((item) => item.patientName === 'Paciente Nueva')).toBe(true);
    });

    it('rechaza el solapamiento del odontólogo', async () => {
      await createAppointment(input);
      await expect(createAppointment({
        ...input,
        patientId: 'pat-otra',
        patientName: 'Otra Persona',
      })).rejects.toBeInstanceOf(AppointmentConflictError);
    });

    it('rechaza el solapamiento de una cita ya guardada en la agenda', async () => {
      const { firestore } = require('@/config/firebase');
      firestore().collection('citas').get.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'cita-1',
          data: () => ({
            date: '20/06/2026',
            time: '09:30 AM',
            patientName: 'Otra Persona',
            patientId: 'pat-otra',
            dentistName: 'Dra. Única',
            status: 'EN ESPERA',
            duration: '45 minutos',
            treatmentName: 'Control',
          }),
        }],
      });

      await expect(createAppointment(input)).rejects.toBeInstanceOf(AppointmentConflictError);
    });

    it('no guarda la cita si no hay conexión', async () => {
      (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });
      await expect(createAppointment(input)).rejects.toBeInstanceOf(AppointmentRequestError);
      const saturday = buildWeeklyAgenda(new Date(2026, 5, 20)).days[5];
      expect(saturday.appointments).toHaveLength(0);
    });

    it('rechaza el solapamiento del mismo paciente', async () => {
      await createAppointment(input);
      await expect(createAppointment({
        ...input,
        dentistName: 'Dr. Otro',
        time: '09:45 AM',
      })).rejects.toMatchObject({ party: 'patient', message: 'PATIENT_CONFLICT' });
    });

    it('rechaza una cita con fecha inválida', async () => {
      await expect(createAppointment({ ...input, date: 'fecha' })).rejects.toMatchObject({ statusCode: 400 });
    });

    it('informa el código del error cuando Firestore no guarda', async () => {
      firestore().collection('citas').add.mockRejectedValueOnce({ status: 503 });
      await expect(createAppointment(input)).rejects.toMatchObject({ statusCode: 503 });
    });

    it('conserva la cita en la agenda si no puede copiarla a la historia', async () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      (recordScheduledAppointment as jest.Mock).mockRejectedValueOnce(new Error('sync'));

      const saved = await createAppointment(input);

      expect(saved.status).toBe('EN ESPERA');
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });

    it('restaura el estado anterior si Firestore rechaza el cambio', async () => {
      const saved = await createAppointment(input);
      await updateAppointmentStatus(saved.id, 'CONFIRMADO', new Date(2026, 5, 20, 8, 0));
      firestore().collection('citas').update.mockRejectedValueOnce(new Error('fail'));

      await expect(updateAppointmentStatus(saved.id, 'CANCELADO', new Date(2026, 5, 20, 8, 0)))
        .rejects.toBeInstanceOf(AppointmentRequestError);
      await expect(updateAppointmentStatus('sin-fecha', 'CANCELADO')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('permite confirmar y bloquea en progreso fuera del horario', async () => {
      const saved = await createAppointment(input);
      const confirmed = await updateAppointmentStatus(saved.id, 'CONFIRMADO', new Date(2026, 5, 20, 8, 0));
      expect(confirmed.status).toBe('CONFIRMADO');
      await expect(updateAppointmentStatus(saved.id, 'EN PROGRESO', new Date(2026, 5, 20, 8, 0)))
        .rejects.toBeInstanceOf(AppointmentRequestError);
    });
  });
});
