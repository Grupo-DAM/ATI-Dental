import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import {
  buildWeeklyAgendaDocumentTitle,
  buildWeeklyAgendaFileName,
  buildWeeklyAgendaHtml,
  countWeeklyAppointments,
  formatAgendaDateReadable,
  formatReportDateTime,
  generateReportCode,
  generateWeeklyAgendaPdf,
  getCorporateLogoSvg,
  getStatusBadgeClass,
  isWeeklyAgendaEmpty,
  printWeeklyAgenda,
  shareWeeklyAgendaPdf,
  translateTreatmentName,
} from '@/services/weekly-agenda-report';
import { Appointment, WeeklyAgenda, buildWeeklyAgenda } from '@/services/agenda-service';

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

      // Reglas de color corporativo, badges semánticos y CSS anti-corte
      expect(html).toContain('page-break-inside: avoid !important');
      expect(html).toContain('break-inside: avoid !important');
      expect(html).toContain('#5B2D8B');
      expect(html).toContain('status-confirmed');
      expect(html).toContain('status-pending');
      expect(html).toContain('Clínica Odontológica Especializada');
      expect(html).toContain('RIF:');
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

    it('aplica la paleta oficial de ATI Dental y logotipo corporativo con fondo morado', () => {
      const html = buildWeeklyAgendaHtml(sampleWeeklyAgenda, { language: 'es' });
      const logoSvg = getCorporateLogoSvg();

      expect(logoSvg).toContain('fill="#5B2D8B"');
      expect(logoSvg).toContain('brand-logo');
      expect(html).toContain('brand-logo');
      expect(html).toContain('#FAF5FF');
      expect(html).toContain('#D8B4FE');
      expect(getStatusBadgeClass('CONFIRMADO')).toBe('status-confirmed');
      expect(getStatusBadgeClass('EN ESPERA')).toBe('status-pending');
      expect(getStatusBadgeClass('EN PROGRESO')).toBe('status-inprogress');
      expect(getStatusBadgeClass('COMPLETADO')).toBe('status-completed');
      expect(getStatusBadgeClass('CANCELADO')).toBe('status-cancelled');
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

  describe('buildWeeklyAgendaHtml [Soporte Multi-idioma y Traducción de Tratamientos]', () => {
    it('genera todas las cabeceras, títulos, estados y tratamientos en inglés cuando language es "en"', () => {
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

      // Membrete en inglés
      expect(html).toContain('Specialized Dental Clinic');
      expect(html).toContain('Tax ID:');

      // Traducciones automáticas de tratamientos clínicos al inglés
      expect(html).toContain('Prophylactic Dental Cleaning');
      expect(html).toContain('Wisdom Tooth Extraction');
      expect(html).toContain('Endodontics Tooth 16');
    });

    it('translateTreatmentName traduce correctamente todos los tratamientos de agenda-service', () => {
      expect(translateTreatmentName('Consulta Diagnóstica', 'en')).toBe('Diagnostic Consultation');
      expect(translateTreatmentName('Blanqueamiento Dental', 'en')).toBe('Teeth Whitening');
      expect(translateTreatmentName('Endodoncia', 'en')).toBe('Endodontics (Root Canal)');
      expect(translateTreatmentName('Limpieza Profunda', 'en')).toBe('Deep Cleaning');
      expect(translateTreatmentName('Extracción Molar', 'en')).toBe('Molar Extraction');
      expect(translateTreatmentName('Ajuste Ortodoncia', 'en')).toBe('Orthodontic Adjustment');
      expect(translateTreatmentName('Cirugía de Cordal', 'en')).toBe('Wisdom Tooth Surgery');
      expect(translateTreatmentName('Prótesis Fija', 'en')).toBe('Fixed Prosthesis');
      expect(translateTreatmentName('Profilaxis', 'en')).toBe('Dental Prophylaxis');
      expect(translateTreatmentName('Tratamiento Periodontal', 'en')).toBe('Periodontal Treatment');
      expect(translateTreatmentName('Restauración con Resina', 'en')).toBe('Resin Restoration');
      expect(translateTreatmentName('Control de Brackets', 'en')).toBe('Braces Checkup');
      expect(translateTreatmentName('Limpieza y Fluorización', 'en')).toBe('Cleaning and Fluoridation');

      // Preserva en español si el idioma del reporte es 'es'
      expect(translateTreatmentName('Limpieza Profunda', 'es')).toBe('Limpieza Profunda');
      // Preserva tratamiento desconocido o vacío
      expect(translateTreatmentName('', 'en')).toBe('');
      expect(translateTreatmentName('Tratamiento Especial X', 'en')).toBe('Tratamiento Especial X');
    });

    it('traduce todos los tratamientos de la semana al inglés al generar la plantilla completa', () => {
      const fullWeekAgenda = buildWeeklyAgenda(new Date('2026-10-05T12:00:00Z'));
      const htmlEn = buildWeeklyAgendaHtml(fullWeekAgenda, { language: 'en' });

      // Citas del Lunes
      expect(htmlEn).toContain('Diagnostic Consultation');
      expect(htmlEn).toContain('Teeth Whitening');
      expect(htmlEn).toContain('Endodontics (Root Canal)');

      // Citas del Martes
      expect(htmlEn).toContain('Deep Cleaning');
      expect(htmlEn).toContain('Molar Extraction');
      expect(htmlEn).toContain('Orthodontic Adjustment');

      // Citas del Miércoles
      expect(htmlEn).toContain('Wisdom Tooth Surgery');
      expect(htmlEn).toContain('Fixed Prosthesis');
      expect(htmlEn).toContain('Dental Prophylaxis');

      // Citas del Jueves
      expect(htmlEn).toContain('Periodontal Treatment');
      expect(htmlEn).toContain('Resin Restoration');

      // Citas del Viernes
      expect(htmlEn).toContain('Braces Checkup');
      expect(htmlEn).toContain('Cleaning and Fluoridation');
    });
  });

  describe('buildWeeklyAgendaFileName y buildWeeklyAgendaDocumentTitle [Nombres descriptivos para descargas]', () => {
    it('construye nombres de archivo descriptivos sin caer en "Document"', () => {
      const fileNameEs = buildWeeklyAgendaFileName(sampleWeeklyAgenda, { language: 'es' });
      const fileNameEn = buildWeeklyAgendaFileName(sampleWeeklyAgenda, { language: 'en' });

      expect(fileNameEs).toBe('Reporte_Agenda_Semanal_ATI_Dental_2026-06-08_2026-06-14');
      expect(fileNameEn).toBe('Weekly_Schedule_Report_ATI_Dental_2026-06-08_2026-06-14');

      const customName = buildWeeklyAgendaFileName(sampleWeeklyAgenda, { fileName: 'Mi_Agenda_Personalizada' });
      expect(customName).toBe('Mi_Agenda_Personalizada');
    });

    it('construye títulos formales para la cabecera HTML <title> y el visor del navegador', () => {
      const titleEs = buildWeeklyAgendaDocumentTitle(sampleWeeklyAgenda, { language: 'es' });
      const titleEn = buildWeeklyAgendaDocumentTitle(sampleWeeklyAgenda, { language: 'en' });

      expect(titleEs).toBe('Reporte de Agenda Semanal - ATI DENTAL (2026-06-08 - 2026-06-14)');
      expect(titleEn).toBe('Weekly Schedule Report - ATI DENTAL (2026-06-08 - 2026-06-14)');
    });

    it('buildWeeklyAgendaHtml asigna el título descriptivo a la etiqueta <title> en lugar de "Document"', () => {
      const html = buildWeeklyAgendaHtml(sampleWeeklyAgenda, { language: 'es' });
      expect(html).toContain('<title>Reporte de Agenda Semanal - ATI DENTAL (2026-06-08 - 2026-06-14)</title>');
      expect(html).not.toContain('<title>Document</title>');
    });
  });

  describe('printWeeklyAgenda y generateWeeklyAgendaPdf [Interacción con expo-print]', () => {
    it('printWeeklyAgenda invoca Print.printAsync con el URI descriptivo en plataforma nativa para evitar que Android use "Document"', async () => {
      await printWeeklyAgenda(sampleWeeklyAgenda, { language: 'es' });

      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(Print.printAsync).toHaveBeenCalledTimes(1);
      const callArg = (Print.printAsync as jest.Mock).mock.calls[0][0];
      expect(callArg.uri).toContain('Reporte_Agenda_Semanal_ATI_Dental_2026-06-08_2026-06-14.pdf');
    });

    it('shareWeeklyAgendaPdf invoca Sharing.shareAsync con el URI descriptivo generado', async () => {
      await shareWeeklyAgendaPdf(sampleWeeklyAgenda, { language: 'es' });

      expect(Sharing.shareAsync).toHaveBeenCalled();
      const [uriArg, optionsArg] = (Sharing.shareAsync as jest.Mock).mock.calls[0];
      expect(uriArg).toContain('Reporte_Agenda_Semanal_ATI_Dental_2026-06-08_2026-06-14.pdf');
      expect(optionsArg.mimeType).toBe('application/pdf');
    });

    it('generateWeeklyAgendaPdf invoca Print.printToFileAsync y copia el PDF a un nombre descriptivo', async () => {
      const result = await generateWeeklyAgendaPdf(sampleWeeklyAgenda, { language: 'es' });

      expect(Print.printToFileAsync).toHaveBeenCalledTimes(1);
      const callArg = (Print.printToFileAsync as jest.Mock).mock.calls[0][0];
      expect(callArg.width).toBe(612);
      expect(callArg.height).toBe(792);
      expect(result.uri).toBe('file:///data/user/0/com.atidental/cache/Reporte_Agenda_Semanal_ATI_Dental_2026-06-08_2026-06-14.pdf');

      // Prueba con pageSize: 'A4'
      await generateWeeklyAgendaPdf(sampleWeeklyAgenda, { language: 'es', pageSize: 'A4' });
      const callArgA4 = (Print.printToFileAsync as jest.Mock).mock.calls[1][0];
      expect(callArgA4.width).toBe(595);
      expect(callArgA4.height).toBe(842);
    });

    it('printWeeklyAgenda maneja la impresión en plataforma Web asignando el título descriptivo a la ventana', async () => {
      const originalOS = Platform.OS;
      (Platform as any).OS = 'web';

      const mockPrint = jest.fn();
      const mockDocument = {
        write: jest.fn(),
        close: jest.fn(),
        title: '',
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
      expect(mockDocument.title).toBe('Reporte de Agenda Semanal - ATI DENTAL (2026-06-08 - 2026-06-14)');
      expect(mockPrint).toHaveBeenCalled();

      (window as any).open = originalOpen;
      (Platform as any).OS = originalOS;
    });
  });
});
