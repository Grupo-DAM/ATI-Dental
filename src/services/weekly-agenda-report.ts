/**
 * Servicio de Generación de Reportes e Impresión de Agenda Semanal (US-33).
 * Genera el reporte institucional en color corporativo de ATI Dental (#5B2D8B)
 * con soporte bilingüe (ES / EN), traducción de tratamientos y paginación limpia A4.
 */
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  Appointment,
  AppointmentStatus,
  DaySchedule,
  WeeklyAgenda,
} from '@/services/agenda-service';
export type ReportLanguage = 'es' | 'en';

export interface ReportFileResult {
  uri: string;
  numberOfPages?: number;
  base64?: string;
}

export const DEFAULT_CLINIC_INFO = {
  name: 'ATI DENTAL',
  tagline: 'Clínica Odontológica Especializada',
  address: 'Av. Principal Las Mercedes, Edif. Centro Dental, Piso 3, Caracas',
  phone: '+58 (212) 999-0000',
  email: 'contacto@atidental.com',
  website: 'www.atidental.com',
  taxId: 'J-12345678-9',
};

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function resolveReportLanguage(requested?: string): ReportLanguage {
  if (requested === 'en' || requested === 'es') return requested;
  if (typeof requested === 'string' && requested.toLowerCase().startsWith('en')) return 'en';
  return 'es';
}

export function formatReportDateTime(date?: string | Date, language: ReportLanguage = 'es'): string {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  if (Number.isNaN(d.getTime())) {
    return language === 'en' ? new Date().toLocaleString('en-US') : new Date().toLocaleString('es-ES');
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  if (language === 'en') {
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

let sequenceCounter = 0;
export function generateReportCode(prefix = 'AGE'): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  sequenceCounter = (sequenceCounter + 1) % 9000;
  const randomPart = 1000 + (sequenceCounter % 9000);
  return `${prefix}-${datePart}-${randomPart}`;
}

export interface WeeklyAgendaReportOptions {
  language?: ReportLanguage;
  dentistName?: string;
  generatedAt?: string | Date;
  clinicInfo?: Partial<typeof DEFAULT_CLINIC_INFO>;
  customTitle?: string;
  customSubtitle?: string;
  fileName?: string;
  pageSize?: 'A4' | 'letter';
}

const STATUS_TEXT: Record<'es' | 'en', Record<AppointmentStatus, string>> = {
  es: {
    CONFIRMADO: 'Confirmado',
    'EN ESPERA': 'En espera',
    'EN PROGRESO': 'En progreso',
    COMPLETADO: 'Completado',
    CANCELADO: 'Cancelado',
  },
  en: {
    CONFIRMADO: 'Confirmed',
    'EN ESPERA': 'Pending',
    'EN PROGRESO': 'In Progress',
    COMPLETADO: 'Completed',
    CANCELADO: 'Cancelled',
  },
};

const DAY_NAMES_FULL: Record<'es' | 'en', string[]> = {
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

const STRINGS_AGENDA = {
  es: {
    clinicTagline: 'Clínica Odontológica Especializada',
    taxIdLabel: 'RIF',
    defaultTitle: 'Reporte de Agenda Semanal',
    defaultSubtitle: 'Listado cronológico de citas programadas',
    weekLabel: 'Semana',
    emissionDate: 'Fecha de emisión',
    issuerLabel: 'Odontólogo / Profesional',
    allDentists: 'Clínica Dental',
    totalAppointments: 'Total de citas',
    daysWithActivity: 'Días con actividad',
    confirmedAppointments: 'Citas confirmadas',
    noAppointmentsNotice: 'No se registran citas programadas para la presente semana.',
    noAppointmentsSub: 'No existen pacientes agendados en el intervalo seleccionado.',
    colTime: 'Hora',
    colPatient: 'Paciente',
    colTreatment: 'Tratamiento / Motivo',
    colStatus: 'Estado',
    colChair: 'Sillón',
    chairPrefix: 'Sillón',
    confidentiality:
      'Documento de uso clínico exclusivo para organización de consulta y preparación de instrumental. Información confidencial de pacientes protegida bajo normativa de secreto médico.',
    pageFooter: 'Agenda Semanal de Consultas · ATI Dental',
  },
  en: {
    clinicTagline: 'Specialized Dental Clinic',
    taxIdLabel: 'Tax ID',
    defaultTitle: 'Weekly Schedule Report',
    defaultSubtitle: 'Chronological list of scheduled appointments',
    weekLabel: 'Week',
    emissionDate: 'Emission Date',
    issuerLabel: 'Dentist / Professional',
    allDentists: 'Dental Clinic',
    totalAppointments: 'Total appointments',
    daysWithActivity: 'Days with activity',
    confirmedAppointments: 'Confirmed appointments',
    noAppointmentsNotice: 'No appointments scheduled for the current week.',
    noAppointmentsSub: 'There are no patients scheduled in the selected time range.',
    colTime: 'Time',
    colPatient: 'Patient',
    colTreatment: 'Treatment / Reason',
    colStatus: 'Status',
    colChair: 'Chair',
    chairPrefix: 'Chair',
    confidentiality:
      'Exclusive clinical document for schedule coordination and tray preparation. Confidential patient data protected by medical secrecy regulations.',
    pageFooter: 'Weekly Appointment Schedule · ATI Dental',
  },
};

/**
 * Diccionario de traducción de tratamientos dentales (Español -> Inglés)
 * indexado por clave normalizada (sin acentos, en minúsculas)
 */
export const TREATMENT_TRANSLATIONS_EN: Record<string, string> = {
  // Citas de ejemplo en agenda semanal
  'consulta diagnostica': 'Diagnostic Consultation',
  'blanqueamiento dental': 'Teeth Whitening',
  'endodoncia': 'Endodontics (Root Canal)',
  'limpieza profunda': 'Deep Cleaning',
  'extraccion molar': 'Molar Extraction',
  'ajuste ortodoncia': 'Orthodontic Adjustment',
  'cirugia de cordal': 'Wisdom Tooth Surgery',
  'protesis fija': 'Fixed Prosthesis',
  'profilaxis': 'Dental Prophylaxis',
  'tratamiento periodontal': 'Periodontal Treatment',
  'restauracion con resina': 'Resin Restoration',
  'control de brackets': 'Braces Checkup',
  'limpieza y fluorizacion': 'Cleaning and Fluoridation',

  // Tratamientos clínicos y pruebas unitarias
  'limpieza dental profilactica': 'Prophylactic Dental Cleaning',
  'extraccion muela del juicio': 'Wisdom Tooth Extraction',
  'endodoncia pieza 16': 'Endodontics Tooth 16',
  'revision general': 'General Checkup',
  'consulta general': 'General Consultation',
  'consulta reciente': 'Recent Consultation',
  'limpieza dental': 'Dental Cleaning',
  'limpieza': 'Dental Cleaning',
  'extraccion de muela': 'Tooth Extraction',
  'extraccion': 'Tooth Extraction',
  'colocacion de brackets': 'Braces Placement',
  'brackets metalicos': 'Metal Braces',
  'brackets': 'Braces',
  'ortodoncia': 'Orthodontics',
  'implante dental': 'Dental Implant',
  'implante': 'Dental Implant',
  'tratamiento de conducto': 'Root Canal Treatment',
  'conducto': 'Root Canal Treatment',
  'control de ortodoncia': 'Orthodontic Checkup',
  'control y limpieza': 'Checkup & Cleaning',
  'control': 'Checkup',
  'resina compuesta': 'Composite Resin',
  'resina': 'Resin Restoration',
  'profilaxis dental': 'Dental Prophylaxis',
  'evaluacion periodontal': 'Periodontal Evaluation',
  'blanqueamiento': 'Teeth Whitening',
  'carillas dentales': 'Dental Veneers',
  'corona dental': 'Dental Crown',
  'puente dental': 'Dental Bridge',
  'cirugia oral': 'Oral Surgery',
  'radiografia dental': 'Dental X-Ray',
};

/**
 * Normaliza un término clínico para búsqueda insensible a acentos y mayúsculas
 */
export function normalizeTreatmentKey(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Traduce el nombre de un tratamiento clínico al idioma seleccionado si es inglés
 */
export function translateTreatmentName(
  treatment: string | undefined | null,
  language: ReportLanguage
): string {
  if (!treatment || language !== 'en') return treatment || '';
  const normalized = normalizeTreatmentKey(treatment);
  if (TREATMENT_TRANSLATIONS_EN[normalized]) {
    return TREATMENT_TRANSLATIONS_EN[normalized];
  }
  const pieceMatch = normalized.match(/^(endodoncia|resina|extraccion|corona|implante)\s+pieza\s+(\d+)$/i);
  if (pieceMatch) {
    const base = translateTreatmentName(pieceMatch[1], 'en');
    return `${base} Tooth ${pieceMatch[2]}`;
  }
  return treatment;
}

/**
 * Retorna la clase CSS adecuada para colorear el badge de estado
 */
export function getStatusBadgeClass(status: AppointmentStatus): string {
  switch (status) {
    case 'CONFIRMADO':
      return 'status-confirmed';
    case 'EN ESPERA':
      return 'status-pending';
    case 'EN PROGRESO':
      return 'status-inprogress';
    case 'COMPLETADO':
      return 'status-completed';
    case 'CANCELADO':
      return 'status-cancelled';
    default:
      return 'status-pending';
  }
}

/**
 * Cuenta el total de citas programadas a lo largo de toda la semana
 */
export function countWeeklyAppointments(agenda: WeeklyAgenda): number {
  if (!agenda || !agenda.days) return 0;
  return agenda.days.reduce((total, day) => total + (day.appointments?.length || 0), 0);
}

/**
 * Verifica si la agenda semanal se encuentra vacía de citas
 */
export function isWeeklyAgendaEmpty(agenda: WeeklyAgenda): boolean {
  return countWeeklyAppointments(agenda) === 0;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible
 */
export function formatAgendaDateReadable(
  dateStr: string,
  dayOfWeek: number,
  language: ReportLanguage
): string {
  const dayName = DAY_NAMES_FULL[language][dayOfWeek] ?? '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return dateStr;
  const dayNum = Number(match[3]);
  const monthNum = Number(match[2]);
  const yearNum = Number(match[1]);

  if (language === 'en') {
    return `${dayName}, ${monthNum}/${dayNum}/${yearNum}`;
  }
  return `${dayName}, ${dayNum}/${monthNum}/${yearNum}`;
}

/**
 * Renderiza el logo corporativo de ATI Dental en color institucional
 */
export function getCorporateLogoSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" width="46" height="46" class="brand-logo">
      <rect width="54" height="54" rx="12" fill="#5B2D8B" />
      <g transform="translate(15, 14.5)">
        <path d="M18.6667 0C20.1333 0 21.3889 0.543227 22.4333 1.62968C23.4778 2.71613 24 4.02219 24 5.54785C24 5.80213 23.9833 6.14309 23.95 6.57074C23.9167 6.99838 23.8667 7.4896 23.8 8.04438L21.9667 22.018C21.8556 22.8964 21.4722 23.613 20.8167 24.1678C20.1611 24.7226 19.4111 25 18.5667 25C18.0556 25 17.5833 24.8844 17.15 24.6533C16.7167 24.4221 16.3556 24.0985 16.0667 23.6824L12.5 18.2732C12.4556 18.1808 12.3833 18.1172 12.2833 18.0825C12.1833 18.0479 12.0778 18.0305 11.9667 18.0305C11.8778 18.0305 11.7 18.1345 11.4333 18.3426L7.96667 23.5784C7.65556 24.0407 7.27222 24.3932 6.81667 24.6359C6.36111 24.8786 5.87778 25 5.36667 25C4.52222 25 3.77778 24.7168 3.13333 24.1505C2.48889 23.5841 2.11111 22.8618 2 21.9834L0.2 8.04438C0.133333 7.4896 0.0833333 6.99838 0.05 6.57074C0.0166667 6.14309 0 5.80213 0 5.54785C0 4.02219 0.522222 2.71613 1.56667 1.62968C2.61111 0.543227 3.86667 0 5.33333 0C6.13333 0 6.77222 0.109802 7.25 0.329405C7.72778 0.549007 8.18889 0.785946 8.63333 1.04022C9.07778 1.2945 9.55 1.53144 10.05 1.75104C10.55 1.97064 11.2 2.08044 12 2.08044C12.8 2.08044 13.45 1.97064 13.95 1.75104C14.45 1.53144 14.9222 1.2945 15.3667 1.04022C15.8111 0.785946 16.2778 0.549007 16.7667 0.329405C17.2556 0.109802 17.8889 0 18.6667 0ZM18.6667 2.77393C18.1556 2.77393 17.7056 2.88373 17.3167 3.10333C16.9278 3.32293 16.5 3.55987 16.0333 3.81415C15.5667 4.06842 15.0222 4.30536 14.4 4.52497C13.7778 4.74457 12.9778 4.85437 12 4.85437C11.0222 4.85437 10.2222 4.74457 9.6 4.52497C8.97778 4.30536 8.43333 4.06842 7.96667 3.81415C7.5 3.55987 7.07222 3.32293 6.68333 3.10333C6.29444 2.88373 5.84444 2.77393 5.33333 2.77393C4.6 2.77393 3.97222 3.04554 3.45 3.58877C2.92778 4.13199 2.66667 4.78502 2.66667 5.54785C2.66667 5.73278 2.67778 5.99861 2.7 6.34535C2.72222 6.69209 2.76667 7.09663 2.83333 7.55895L4.66667 21.6019C4.68889 21.7869 4.76667 21.9313 4.9 22.0354C5.03333 22.1394 5.18889 22.1914 5.36667 22.1914C5.47778 22.1914 5.57778 22.1683 5.66667 22.1221C5.75556 22.0758 5.82222 22.0065 5.86667 21.914L9.23333 16.7822C9.54444 16.3199 9.94444 15.9501 10.4333 15.6727C10.9222 15.3953 11.4444 15.2566 12 15.2566C12.5556 15.2566 13.0778 15.3953 13.5667 15.6727C14.0556 15.9501 14.4556 16.3199 14.7667 16.7822L18.2 22.018C18.2444 22.0874 18.3 22.1394 18.3667 22.1741C18.4333 22.2087 18.5111 22.2261 18.6 22.2261C18.7778 22.2261 18.9389 22.1741 19.0833 22.07C19.2278 21.966 19.3111 21.8215 19.3333 21.6366L21.1667 7.55895C21.2333 7.09663 21.2778 6.69209 21.3 6.34535C21.3222 5.99861 21.3333 5.73278 21.3333 5.54785C21.3333 4.78502 21.0722 4.13199 20.55 3.58877C20.0278 3.04554 19.4 2.77393 18.6667 2.77393Z" fill="#FFFFFF"/>
      </g>
    </svg>
  `;
}

/**
 * Alias retrocompatible para consumidores previos
 */
export function getMonochromeLogoSvg(): string {
  return getCorporateLogoSvg();
}

/**
 * Construye el título formal del documento para la cabecera HTML <title> y el diálogo de impresión
 */
export function buildWeeklyAgendaDocumentTitle(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): string {
  if (options.fileName) {
    return options.fileName;
  }
  const language = resolveReportLanguage(options.language);
  const prefix = language === 'en' ? 'Weekly Schedule Report' : 'Reporte de Agenda Semanal';
  const clinicName = options.clinicInfo?.name || DEFAULT_CLINIC_INFO.name;
  const start = agenda?.weekStart || '';
  const end = agenda?.weekEnd || '';
  if (start && end) {
    return `${prefix} - ${clinicName} (${start} - ${end})`;
  }
  return `${prefix} - ${clinicName}`;
}

/**
 * Construye un nombre de archivo descriptivo normalizado para descargas y almacenamiento de PDF
 */
export function buildWeeklyAgendaFileName(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): string {
  if (options.fileName) {
    return options.fileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  }
  const language = resolveReportLanguage(options.language);
  const prefix = language === 'en' ? 'Weekly_Schedule_Report' : 'Reporte_Agenda_Semanal';
  const start = (agenda?.weekStart || '').replace(/[^0-9-]/g, '');
  const end = (agenda?.weekEnd || '').replace(/[^0-9-]/g, '');
  if (start && end) {
    return `${prefix}_ATI_Dental_${start}_${end}`;
  }
  return `${prefix}_ATI_Dental`;
}

/**
 * Copia el archivo PDF generado en la caché a una ruta con nombre de archivo descriptivo
 */
export async function resolveDescriptivePdfUri(sourceUri: string, fileName?: string): Promise<string> {
  if (!fileName || Platform.OS === 'web') {
    return sourceUri;
  }

  try {
    const cleanFileName = fileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!cleanFileName) {
      return sourceUri;
    }

    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (!baseDir) {
      return sourceUri;
    }

    const targetUri = `${baseDir}${cleanFileName}.pdf`;
    try {
      await FileSystem.deleteAsync(targetUri, { idempotent: true });
    } catch {
      // Ignorar si el archivo destino aún no existía
    }

    await FileSystem.copyAsync({
      from: sourceUri,
      to: targetUri,
    });

    return targetUri;
  } catch (error) {
    console.warn('No se pudo renombrar el PDF al nombre descriptivo:', error);
    return sourceUri;
  }
}

/**
 * Genera el documento HTML completo corporativo a color para la agenda semanal
 */
export function buildWeeklyAgendaHtml(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): string {
  const language = resolveReportLanguage(options.language);
  const strings = STRINGS_AGENDA[language];
  const clinic = {
    ...DEFAULT_CLINIC_INFO,
    ...(options.clinicInfo || {}),
  };

  const reportTitle = options.customTitle || strings.defaultTitle;
  const documentTitle = options.fileName || buildWeeklyAgendaDocumentTitle(agenda, options);
  const reportSubtitle = options.customSubtitle || strings.defaultSubtitle;
  const reportCode = generateReportCode('AGE');
  const formattedEmission = formatReportDateTime(options.generatedAt, language);
  const dentistIssuer = options.dentistName || strings.allDentists;
  const clinicTagline = options.clinicInfo?.tagline || strings.clinicTagline;

  const totalAppointments = countWeeklyAppointments(agenda);
  const daysWithAppointments = agenda.days.filter((d) => d.appointments && d.appointments.length > 0).length;
  const confirmedCount = agenda.days.reduce(
    (count, d) => count + (d.appointments?.filter((a) => a.status === 'CONFIRMADO').length || 0),
    0
  );

  let bodyHtml = '';

  if (totalAppointments === 0) {
    bodyHtml = `
      <section class="empty-agenda-card keep-together">
        <div class="empty-agenda-icon">📅</div>
        <h3 class="empty-agenda-title">${escapeHtml(strings.noAppointmentsNotice)}</h3>
        <p class="empty-agenda-desc">${escapeHtml(strings.noAppointmentsSub)}</p>
      </section>
    `;
  } else {
    const daysHtml = agenda.days
      .filter((day) => day.appointments && day.appointments.length > 0)
      .map((day) => {
        const dayHeader = formatAgendaDateReadable(day.date, day.dayOfWeek, language);
        const rowsHtml = day.appointments
          .map((appt) => {
            const timeDisplay = `${appt.time} ${appt.period || ''}`.trim();
            const statusLabel = STATUS_TEXT[language][appt.status] || appt.status;
            const chairDisplay = appt.chair
              ? `${strings.chairPrefix} ${appt.chair.replace(/\D/g, '') || appt.chair}`
              : '-';
            const localizedTreatment = translateTreatmentName(appt.treatmentName, language);
            const badgeClass = getStatusBadgeClass(appt.status);

            return `
              <tr class="appointment-row">
                <td class="col-time">${escapeHtml(timeDisplay)}</td>
                <td class="col-patient"><strong>${escapeHtml(appt.patientName)}</strong></td>
                <td class="col-treatment">${escapeHtml(localizedTreatment)}</td>
                <td class="col-status"><span class="status-badge ${badgeClass}">${escapeHtml(statusLabel)}</span></td>
                <td class="col-chair">${escapeHtml(chairDisplay)}</td>
              </tr>
            `;
          })
          .join('');

        return `
          <div class="day-section keep-together">
            <div class="day-header">
              <span class="day-title">${escapeHtml(dayHeader)}</span>
              <span class="day-count">${day.appointments.length} ${language === 'en' ? 'appt(s)' : 'cita(s)'}</span>
            </div>
            <table class="agenda-table">
              <thead>
                <tr>
                  <th style="width: 14%;">${escapeHtml(strings.colTime)}</th>
                  <th style="width: 28%;">${escapeHtml(strings.colPatient)}</th>
                  <th style="width: 32%;">${escapeHtml(strings.colTreatment)}</th>
                  <th style="width: 14%;">${escapeHtml(strings.colStatus)}</th>
                  <th style="width: 12%;">${escapeHtml(strings.colChair)}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      })
      .join('');

    bodyHtml = daysHtml;
  }

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no">
  <title>${escapeHtml(documentTitle)}</title>
  <script>
    try { document.title = ${JSON.stringify(documentTitle)}; } catch (e) {}
  </script>
  <style>
    @page {
      size: ${options.pageSize === 'A4' ? 'A4 portrait' : 'letter portrait'};
      margin: 8mm 8mm 8mm 8mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.3;
      color: #141018;
      background-color: #FFFFFF;
    }

    .report-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      box-sizing: border-box;
    }

    .keep-together {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Membrete Corporativo Oficial en Color */
    .report-header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #5B2D8B;
      padding-bottom: 8px;
      margin-bottom: 10px;
    }

    .header-brand {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }

    .brand-titles h1 {
      margin: 0;
      font-size: 16pt;
      font-weight: 800;
      color: #5B2D8B;
      letter-spacing: 0.5px;
    }

    .brand-titles .tagline {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      color: #52287D;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .brand-titles .tax-id {
      margin: 2px 0 0 0;
      font-size: 7.5pt;
      color: #6B7280;
    }

    .header-clinic-meta {
      text-align: right;
      font-size: 7.5pt;
      color: #4B5563;
      line-height: 1.4;
    }

    .header-clinic-meta p {
      margin: 1px 0;
    }

    /* Franja de Identificación de Agenda */
    .title-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #FAF5FF;
      border: 1px solid #D8B4FE;
      border-left: 5px solid #5B2D8B;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 10px;
    }

    .title-info h2 {
      margin: 0;
      font-size: 13pt;
      font-weight: 700;
      color: #52287D;
    }

    .title-info .subtitle {
      margin: 3px 0 0 0;
      font-size: 8pt;
      color: #6B7280;
    }

    .meta-box {
      text-align: right;
      font-size: 7.5pt;
      color: #4B5563;
    }

    .code-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 8pt;
      font-weight: bold;
      color: #5B2D8B;
      background-color: #F3E8FF;
      border: 1px solid #D8B4FE;
      padding: 2px 7px;
      border-radius: 4px;
      margin-bottom: 4px;
    }

    /* Resumen de Métricas / KPIs en Color */
    .metrics-row {
      display: flex;
      flex-direction: row;
      gap: 10px;
      margin-bottom: 10px;
    }

    .metric-card {
      flex: 1;
      border: 1px solid #E9D5FF;
      border-top: 3px solid #5B2D8B;
      border-radius: 6px;
      padding: 8px 10px;
      background-color: #FFFFFF;
    }

    .metric-card.metric-days {
      border-top-color: #7C3AED;
    }

    .metric-card.metric-confirmed {
      border-top-color: #059669;
    }

    .metric-label {
      font-size: 7pt;
      text-transform: uppercase;
      color: #6B7280;
      font-weight: 600;
      letter-spacing: 0.3px;
      display: block;
    }

    .metric-value {
      font-size: 15pt;
      font-weight: 800;
      color: #5B2D8B;
      margin-top: 3px;
      display: block;
    }

    .metric-card.metric-days .metric-value {
      color: #7C3AED;
    }

    .metric-card.metric-confirmed .metric-value {
      color: #059669;
    }

    /* Tablas y Días de la Agenda */
    .day-section {
      margin-bottom: 8px;
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #F3E8FF;
      border-left: 4px solid #5B2D8B;
      padding: 5px 8px;
      margin-bottom: 0;
      border-radius: 4px 4px 0 0;
    }

    .day-title {
      font-weight: 700;
      font-size: 8.5pt;
      color: #52287D;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .day-count {
      font-size: 7.5pt;
      color: #5B2D8B;
      font-weight: 600;
      background-color: #FFFFFF;
      border: 1px solid #D8B4FE;
      border-radius: 10px;
      padding: 1px 8px;
    }

    .agenda-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      break-inside: auto;
      border: 1px solid #E9D5FF;
      border-top: none;
    }

    .agenda-table thead {
      display: table-header-group;
    }

    .agenda-table th {
      background-color: #FAF5FF;
      color: #52287D;
      font-weight: 700;
      border-bottom: 1.5px solid #D8B4FE;
      border-top: 1px solid #E9D5FF;
      padding: 4px 6px;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      text-align: left;
    }

    .agenda-table td {
      border-bottom: 1px solid #F3E8FF;
      padding: 4px 6px;
      font-size: 8pt;
      color: #1F2937;
      vertical-align: middle;
    }

    .agenda-table tbody tr:nth-child(even) {
      background-color: #FDFAFF;
    }

    .col-time {
      color: #5B2D8B;
      font-weight: 700;
    }

    .col-patient strong {
      color: #111827;
      font-weight: 600;
    }

    .col-treatment {
      color: #374151;
    }

    .col-chair {
      color: #6B7280;
      font-weight: 500;
    }

    .appointment-row {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Badges Semánticos en Color */
    .status-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }

    .status-badge.status-confirmed {
      background-color: #ECFDF5;
      color: #047857;
      border: 1px solid #A7F3D0;
    }

    .status-badge.status-pending {
      background-color: #FEF3C7;
      color: #92400E;
      border: 1px solid #FDE68A;
    }

    .status-badge.status-inprogress {
      background-color: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
    }

    .status-badge.status-completed {
      background-color: #F0FDF4;
      color: #166534;
      border: 1px solid #BBF7D0;
    }

    .status-badge.status-cancelled {
      background-color: #FEF2F2;
      color: #B91C1C;
      border: 1px solid #FECACA;
    }

    /* Estado Vacío de la Semana */
    .empty-agenda-card {
      border: 1.5px dashed #D8B4FE;
      border-radius: 8px;
      padding: 28px 16px;
      text-align: center;
      margin: 20px 0;
      background-color: #FAF5FF;
    }

    .empty-agenda-icon {
      font-size: 26pt;
      margin-bottom: 8px;
    }

    .empty-agenda-title {
      margin: 0;
      font-size: 11pt;
      font-weight: 700;
      color: #52287D;
    }

    .empty-agenda-desc {
      margin: 6px 0 0 0;
      font-size: 8.5pt;
      color: #6B7280;
    }

    /* Pie de Página Institucional */
    .report-footer {
      border-top: 1.5px solid #E9D5FF;
      padding-top: 6px;
      margin-top: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: #6B7280;
    }

    .footer-left {
      max-width: 75%;
    }

    .footer-right {
      text-align: right;
      color: #5B2D8B;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Membrete Institucional en Color -->
    <header class="report-header">
      <div class="header-brand">
        ${getCorporateLogoSvg()}
        <div class="brand-titles">
          <h1>${escapeHtml(clinic.name)}</h1>
          <p class="tagline">${escapeHtml(clinicTagline)}</p>
          <p class="tax-id">${escapeHtml(strings.taxIdLabel)}: ${escapeHtml(clinic.taxId)}</p>
        </div>
      </div>
      <div class="header-clinic-meta">
        <p>${escapeHtml(clinic.address)}</p>
        <p>Tel: ${escapeHtml(clinic.phone)} · ${escapeHtml(clinic.email)}</p>
        <p>${escapeHtml(clinic.website)}</p>
      </div>
    </header>

    <!-- Franja de Identificación de Agenda -->
    <section class="title-banner keep-together">
      <div class="title-info">
        <h2>${escapeHtml(reportTitle)}</h2>
        <p class="subtitle">${escapeHtml(strings.weekLabel)}: ${escapeHtml(agenda.weekStart)} &mdash; ${escapeHtml(agenda.weekEnd)}</p>
      </div>
      <div class="meta-box">
        <span class="code-badge">${escapeHtml(reportCode)}</span>
        <div>${escapeHtml(strings.emissionDate)}: ${escapeHtml(formattedEmission)}</div>
        <div>${escapeHtml(strings.issuerLabel)}: ${escapeHtml(dentistIssuer)}</div>
      </div>
    </section>

    <!-- Resumen de Indicadores Clave -->
    <section class="metrics-row keep-together">
      <div class="metric-card">
        <span class="metric-label">${escapeHtml(strings.totalAppointments)}</span>
        <span class="metric-value">${totalAppointments}</span>
      </div>
      <div class="metric-card metric-days">
        <span class="metric-label">${escapeHtml(strings.daysWithActivity)}</span>
        <span class="metric-value">${daysWithAppointments} / ${agenda.days.length}</span>
      </div>
      <div class="metric-card metric-confirmed">
        <span class="metric-label">${escapeHtml(strings.confirmedAppointments)}</span>
        <span class="metric-value">${confirmedCount}</span>
      </div>
    </section>

    <!-- Listado Cronológico de Citas por Día -->
    <main class="agenda-body">
      ${bodyHtml}
    </main>

    <!-- Pie de Confidencialidad -->
    <footer class="report-footer keep-together">
      <div class="footer-left">
        ${escapeHtml(strings.confidentiality)}
      </div>
      <div class="footer-right">
        ${escapeHtml(strings.pageFooter)} · ${escapeHtml(reportCode)}
      </div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Imprime directamente la agenda semanal utilizando expo-print en móvil o window.print() en Web
 */
export async function printWeeklyAgenda(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): Promise<void> {
  const fileName = options.fileName || buildWeeklyAgendaFileName(agenda, options);
  const documentTitle = options.fileName || buildWeeklyAgendaDocumentTitle(agenda, options);
  const html = buildWeeklyAgendaHtml(agenda, { ...options, fileName });

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const originalDocumentTitle = typeof document !== 'undefined' ? document.title : '';

    // Asignar el título descriptivo a la ventana principal para evitar que Chromium
    // recurra al valor por defecto "Document" en el diálogo de guardar PDF
    if (typeof document !== 'undefined') {
      try {
        document.title = documentTitle;
      } catch {
        // En caso de restricciones del navegador
      }
    }

    const restoreParentTitle = () => {
      setTimeout(() => {
        if (typeof document !== 'undefined' && originalDocumentTitle) {
          try {
            document.title = originalDocumentTitle;
          } catch {
            // Ignorar
          }
        }
      }, 5000);
    };

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      try {
        printWindow.document.title = documentTitle;
      } catch {
        // En caso de restricciones del navegador
      }

      // En entornos de testing (Jest), ejecutar sincrónicamente
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
        printWindow.focus();
        printWindow.print();
        restoreParentTitle();
        return;
      }

      // En navegador real, permitir que el proceso de renderizado y el IPC registren el título
      // antes de abrir la interfaz de impresión del sistema
      setTimeout(() => {
        try {
          printWindow.document.title = documentTitle;
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.warn('Error al invocar impresión en popup:', e);
        } finally {
          restoreParentTitle();
        }
      }, 250);
      return;
    }

    // Fallback si popup fue bloqueado por el navegador
    try {
      window.print();
    } finally {
      restoreParentTitle();
    }
    return;
  }

  // En plataformas nativas (Android / iOS):
  // Si pasamos { html }, expo-print en Android invoca internamente:
  // webView.createPrintDocumentAdapter("Document"), lo que hardcodea el nombre del trabajo de impresión
  // en el Print Spooler de Android a "Document" (provocando que al "Guardar como PDF" se guarde como Document.pdf).
  // Al generar primero el archivo físico con generateWeeklyAgendaPdf() y luego imprimir pasando { uri },
  // PrintDocumentAdapter de Android utiliza el último segmento del URI (uri.lastPathSegment),
  // garantizando que Android Print Spooler asigne el nombre descriptivo (ej: Reporte_Agenda_Semanal_ATI_Dental_...)
  // al archivo cuando el usuario presiona "Guardar como PDF".
  const pdfResult = await generateWeeklyAgendaPdf(agenda, {
    ...options,
    fileName,
  });

  await Print.printAsync({ uri: pdfResult.uri });
}

/**
 * Despliega el menú nativo de compartición (Share Sheet) para enviar o guardar
 * el archivo PDF de la agenda semanal directamente con su nombre descriptivo.
 */
export async function shareWeeklyAgendaPdf(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): Promise<void> {
  const fileName = options.fileName || buildWeeklyAgendaFileName(agenda, options);
  const pdfResult = await generateWeeklyAgendaPdf(agenda, {
    ...options,
    fileName,
  });

  if (Platform.OS !== 'web') {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(pdfResult.uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: fileName,
      });
      return;
    }
  }

  await printWeeklyAgenda(agenda, {
    ...options,
    fileName,
  });
}

/**
 * Genera el archivo físico PDF de la agenda semanal en el almacenamiento local del dispositivo
 */
export async function generateWeeklyAgendaPdf(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): Promise<ReportFileResult> {
  const fileName = options.fileName || buildWeeklyAgendaFileName(agenda, options);
  const html = buildWeeklyAgendaHtml(agenda, { ...options, fileName });

  const isA4 = options.pageSize === 'A4';
  const width = isA4 ? 595 : 612;
  const height = isA4 ? 842 : 792;

  const result = await Print.printToFileAsync({
    html,
    width,
    height,
  });

  const uri = await resolveDescriptivePdfUri(result.uri, fileName);

  return {
    uri,
    numberOfPages: result.numberOfPages,
    base64: result.base64,
  };
}

