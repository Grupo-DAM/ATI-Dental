import * as Print from 'expo-print';
import { Platform } from 'react-native';
import {
  buildWeeklyAgendaHtml,
  countWeeklyAppointments,
  formatAgendaDateReadable,
  formatReportDateTime,
  generateReportCode,
  generateWeeklyAgendaPdf,
  isWeeklyAgendaEmpty,
  printWeeklyAgenda,
} from '@/services/weekly-agenda-report';
import { Appointment, WeeklyAgenda } from '@/services/agenda-service';

describe('weekly-agenda-report (US-33: Reporte e Impresión de Agenda Semanal)', () => {
  const mockAppointmentsMonday: Appointment[] = [
    {
      id: '2026-06-08-1',
      time: '08:30',
      period: 'AM',
      patientName: 'Carlos Mendoza',
      treatmentName: 'Limpieza Dental Profiláctica',
      status: 'CONFIRMADO',
      chair: 'SILLÓN 1',
      durationMinutes: 45,
      date: '2026-06-08',
      dentistName: 'Dra. María González',
    },
    {
      id: '2026-06-08-2',
      time: '10:00',
      period: 'AM',
      patientName: 'Ana Lucía Rivas',
      treatmentName: 'Extracción Muela del Juicio',
      status: 'EN ESPERA',
      chair: 'SILLÓN 2',
      durationMinutes: 60,
      date: '2026-06-08',
      dentistName: 'Dr. Roberto Gómez',
    },
  ];

  const mockAppointmentsWednesday: Appointment[] = [
    {
      id: '2026-06-10-1',
      time: '02:30',
      period: 'PM',
      patientName: 'Luis Fernández',
      treatmentName: 'Endodoncia Pieza 16',
      status: 'EN PROGRESO',
      chair: 'SILLÓN 1',
      durationMinutes: 90,
      date: '2026-06-10',
    },
  ];

  const sampleWeeklyAgenda: WeeklyAgenda = {
    weekStart: '2026-06-08',
    weekEnd: '2026-06-14',
    month: 5,
    year: 2026,
    monthYearLabel: 'JUNIO 2026',
    days: [
      {
        date: '2026-06-08',
        dayOfWeek: 1,
        dayName: 'LUN',
        dayNumber: 8,
        isToday: true,
        appointments: mockAppointmentsMonday,
      },
      {
        date: '2026-06-09',
        dayOfWeek: 2,
        dayName: 'MAR',
        dayNumber: 9,
        isToday: false,
        appointments: [],
      },
      {
        date: '2026-06-10',
        dayOfWeek: 3,
        dayName: 'MIÉ',
        dayNumber: 10,
        isToday: false,
        appointments: mockAppointmentsWednesday,
      },
      {
        date: '2026-06-11',
        dayOfWeek: 4,
        dayName: 'JUE',
        dayNumber: 11,
        isToday: false,
        appointments: [],
      },
      {
        date: '2026-06-12',
        dayOfWeek: 5,
        dayName: 'VIE',
        dayNumber: 12,
        isToday: false,
        appointments: [],
      },
      {
        date: '2026-06-13',
        dayOfWeek: 6,
        dayName: 'SÁB',
        dayNumber: 13,
        isToday: false,
        appointments: [],
      },
      {
        date: '2026-06-14',
        dayOfWeek: 0,
        dayName: 'DOM',
        dayNumber: 14,
        isToday: false,
        appointments: [],
      },
    ],
  };

  const emptyWeeklyAgenda: WeeklyAgenda = {
    weekStart: '2026-06-15',
    weekEnd: '2026-06-21',
    month: 5,
    year: 2026,
    monthYearLabel: 'JUNIO 2026',
    days: [
      { date: '2026-06-15', dayOfWeek: 1, dayName: 'LUN', dayNumber: 15, isToday: false, appointments: [] },
      { date: '2026-06-16', dayOfWeek: 2, dayName: 'MAR', dayNumber: 16, isToday: false, appointments: [] },
      { date: '2026-06-17', dayOfWeek: 3, dayName: 'MIÉ', dayNumber: 17, isToday: false, appointments: [] },
      { date: '2026-06-18', dayOfWeek: 4, dayName: 'JUE', dayNumber: 18, isToday: false, appointments: [] },
      { date: '2026-06-19', dayOfWeek: 5, dayName: 'VIE', dayNumber: 19, isToday: false, appointments: [] },
      { date: '2026-06-20', dayOfWeek: 6, dayName: 'SÁB', dayNumber: 20, isToday: false, appointments: [] },
      { date: '2026-06-21', dayOfWeek: 0, dayName: 'DOM', dayNumber: 21, isToday: false, appointments: [] },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cálculos y utilidades de la agenda', () => {
    it('countWeeklyAppointments cuenta correctamente el total de citas en la semana', () => {
      expect(countWeeklyAppointments(sampleWeeklyAgenda)).toBe(3);
      expect(countWeeklyAppointments(emptyWeeklyAgenda)).toBe(0);
      expect(countWeeklyAppointments({} as any)).toBe(0);
    });

    it('isWeeklyAgendaEmpty detecta si la agenda tiene o no citas', () => {
      expect(isWeeklyAgendaEmpty(sampleWeeklyAgenda)).toBe(false);
      expect(isWeeklyAgendaEmpty(emptyWeeklyAgenda)).toBe(true);
    });

    it('formatAgendaDateReadable formatea fechas legibles en español e inglés', () => {
      const esFormatted = formatAgendaDateReadable('2026-06-08', 1, 'es');
      expect(esFormatted).toContain('Lunes');
      expect(esFormatted).toContain('8/6/2026');

      const enFormatted = formatAgendaDateReadable('2026-06-08', 1, 'en');
      expect(enFormatted).toContain('Monday');
      expect(enFormatted).toContain('6/8/2026');

      const fallback = formatAgendaDateReadable('fecha-invalida', 1, 'es');
      expect(fallback).toBe('fecha-invalida');
    });

    it('formatReportDateTime maneja fechas válidas e inválidas', () => {
      const valid = formatReportDateTime(new Date('2026-06-08T10:30:00Z'), 'es');
      expect(valid).toMatch(/\d{2}\/\d{2}\/\d{4}/);

      const invalid = formatReportDateTime('invalid-date', 'en');
      expect(typeof invalid).toBe('string');
    });

    it('generateReportCode genera códigos únicos que inician con el prefijo indicado', () => {
      const code1 = generateReportCode('AGE');
      const code2 = generateReportCode('AGE');
      expect(code1).toMatch(/^AGE-\d{8}-\d{4}$/);
      expect(code2).toMatch(/^AGE-\d{8}-\d{4}$/);
    });
  });

  describe('buildWeeklyAgendaHtml [Escenario 1: Camino feliz con citas programadas]', () => {
    it('genera la plantilla monocromática con las columnas obligatorias: Hora, Paciente, Tratamiento y Estado', () => {
      const html = buildWeeklyAgendaHtml(sampleWeeklyAgenda, {
        language: 'es',
        dentistName: 'Dra. María González',
      });

      // Cabecera institucional
      expect(html).toContain('ATI DENTAL');
      expect(html).toContain('Reporte de Agenda Semanal');
      expect(html).toContain('2026-06-08 &mdash; 2026-06-14');
      expect(html).toContain('Dra. María González');

      // Columnas obligatorias
      expect(html).toContain('Hora');
      expect(html).toContain('Paciente');
      expect(html).toContain('Tratamiento / Motivo');
      expect(html).toContain('Estado');

      // Citas de los pacientes
      expect(html).toContain('Carlos Mendoza');
      expect(html).toContain('Limpieza Dental Profiláctica');
      expect(html).toContain('08:30 AM');
      expect(html).toContain('Confirmado');

      expect(html).toContain('Ana Lucía Rivas');
      expect(html).toContain('Extracción Muela del Juicio');
      expect(html).toContain('En espera');

      expect(html).toContain('Luis Fernández');
      expect(html).toContain('Endodoncia Pieza 16');

      // Reglas de ahorro de tinta y CSS anti-corte
      expect(html).toContain('page-break-inside: avoid !important');
      expect(html).toContain('break-inside: avoid !important');
      expect(html).toContain('background-color: #FFFFFF');
    });

    it('incluye el resumen de indicadores clave (KPIs de la semana)', () => {
      const html = buildWeeklyAgendaHtml(sampleWeeklyAgenda, { language: 'es' });
      expect(html).toContain('Total de citas');
      expect(html).toContain('3');
      expect(html).toContain('Días con actividad');
      expect(html).toContain('2 / 7');
      expect(html).toContain('Citas confirmadas');
      expect(html).toContain('1');
    });
  });

  describe('buildWeeklyAgendaHtml [Escenario 2: Semana sin citas programadas]', () => {
    it('intercepta la ausencia de registros e incluye el texto exacto requerido', () => {
      const html = buildWeeklyAgendaHtml(emptyWeeklyAgenda, { language: 'es' });

      // Mensaje requerido según los criterios de aceptación del ticket
      expect(html).toContain('No se registran citas programadas para la presente semana.');
      expect(html).toContain('No existen pacientes agendados en el intervalo seleccionado.');

      // No debe contener filas de citas renderizadas en la tabla
      expect(html).not.toContain('<tr class="appointment-row">');
      expect(html).toContain('empty-agenda-card');
      expect(html).toContain('Total de citas');
      expect(html).toContain('>0<');
    });

    it('soporta la advertencia sin citas en idioma inglés', () => {
      const html = buildWeeklyAgendaHtml(emptyWeeklyAgenda, { language: 'en' });
      expect(html).toContain('No appointments scheduled for the current week.');
      expect(html).toContain('There are no patients scheduled in the selected time range.');
    });
  });

  describe('buildWeeklyAgendaHtml [Soporte Multi-idioma]', () => {
    it('genera todas las cabeceras, títulos y estados en inglés cuando language es "en"', () => {
      const html = buildWeeklyAgendaHtml(sampleWeeklyAgenda, {
        language: 'en',
        dentistName: 'Dr. John Doe',
      });

      expect(html).toContain('Weekly Schedule Report');
      expect(html).toContain('Time');
      expect(html).toContain('Patient');
      expect(html).toContain('Treatment / Reason');
      expect(html).toContain('Status');
      expect(html).toContain('Chair');
      expect(html).toContain('Confirmed');
      expect(html).toContain('Pending');
      expect(html).toContain('In Progress');
      expect(html).toContain('Total appointments');
    });
  });

  describe('printWeeklyAgenda y generateWeeklyAgendaPdf [Interacción con expo-print]', () => {
    it('printWeeklyAgenda invoca Print.printAsync con el HTML generado en plataforma nativa', async () => {
      await printWeeklyAgenda(sampleWeeklyAgenda, { language: 'es' });

      expect(Print.printAsync).toHaveBeenCalledTimes(1);
      const callArg = (Print.printAsync as jest.Mock).mock.calls[0][0];
      expect(callArg.html).toContain('Carlos Mendoza');
      expect(callArg.html).toContain('Reporte de Agenda Semanal');
    });

    it('generateWeeklyAgendaPdf invoca Print.printToFileAsync con dimensiones A4', async () => {
      const result = await generateWeeklyAgendaPdf(sampleWeeklyAgenda, { language: 'es' });

      expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
      const callArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0];
      expect(callArg.width).toBe(595);
      expect(callArg.height).toBe(842);
      expect(result.uri).toBe('file:///data/user/0/com.atidental/cache/test.pdf');
    });

    it('printWeeklyAgenda maneja la impresión en plataforma Web vía window.print', async () => {
      const originalOS = Platform.OS;
      (Platform as any).OS = 'web';

      const mockPrint = jest.fn();
      const mockDocument = {
        write: jest.fn(),
        close: jest.fn(),
      };
      const mockWindow = {
        document: mockDocument,
        focus: jest.fn(),
        print: mockPrint,
      };
      const originalOpen = window.open;
      (window as any).open = jest.fn(() => mockWindow);

      await printWeeklyAgenda(sampleWeeklyAgenda, { language: 'es' });

      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(mockDocument.write).toHaveBeenCalled();
      expect(mockPrint).toHaveBeenCalled();

      (window as any).open = originalOpen;
      (Platform as any).OS = originalOS;
    });
  });
});
