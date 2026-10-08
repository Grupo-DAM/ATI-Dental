/**
 * Servicio de Generación de Reportes e Impresión de Agenda Semanal (US-33).
 * Procesa la agenda semanal cargada en memoria y genera una plantilla monocromática
 * optimizada para impresión física en blanco y negro, ahorro de tinta y paginación limpia.
 */
import * as Print from 'expo-print';
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
 * Renderiza el logo corporativo de ATI Dental en versión monocromática optimizada para tinta
 */
function getMonochromeLogoSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" width="44" height="44">
      <rect width="54" height="54" rx="8" fill="#FFFFFF" stroke="#111111" stroke-width="2.5" />
      <g transform="translate(15, 14.5)">
        <path d="M18.6667 0C20.1333 0 21.3889 0.543227 22.4333 1.62968C23.4778 2.71613 24 4.02219 24 5.54785C24 5.80213 23.9833 6.14309 23.95 6.57074C23.9167 6.99838 23.8667 7.4896 23.8 8.04438L21.9667 22.018C21.8556 22.8964 21.4722 23.613 20.8167 24.1678C20.1611 24.7226 19.4111 25 18.5667 25C18.0556 25 17.5833 24.8844 17.15 24.6533C16.7167 24.4221 16.3556 24.0985 16.0667 23.6824L12.5 18.2732C12.4556 18.1808 12.3833 18.1172 12.2833 18.0825C12.1833 18.0479 12.0778 18.0305 11.9667 18.0305C11.8778 18.0305 11.7 18.1345 11.4333 18.3426L7.96667 23.5784C7.65556 24.0407 7.27222 24.3932 6.81667 24.6359C6.36111 24.8786 5.87778 25 5.36667 25C4.52222 25 3.77778 24.7168 3.13333 24.1505C2.48889 23.5841 2.11111 22.8618 2 21.9834L0.2 8.04438C0.133333 7.4896 0.0833333 6.99838 0.05 6.57074C0.0166667 6.14309 0 5.80213 0 5.54785C0 4.02219 0.522222 2.71613 1.56667 1.62968C2.61111 0.543227 3.86667 0 5.33333 0C6.13333 0 6.77222 0.109802 7.25 0.329405C7.72778 0.549007 8.18889 0.785946 8.63333 1.04022C9.07778 1.2945 9.55 1.53144 10.05 1.75104C10.55 1.97064 11.2 2.08044 12 2.08044C12.8 2.08044 13.45 1.97064 13.95 1.75104C14.45 1.53144 14.9222 1.2945 15.3667 1.04022C15.8111 0.785946 16.2778 0.549007 16.7667 0.329405C17.2556 0.109802 17.8889 0 18.6667 0Z" fill="#111111" />
      </g>
    </svg>
  `;
}

/**
 * Genera el documento HTML completo monocromático para la agenda semanal
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
  const reportSubtitle = options.customSubtitle || strings.defaultSubtitle;
  const reportCode = generateReportCode('AGE');
  const formattedEmission = formatReportDateTime(options.generatedAt, language);
  const dentistIssuer = options.dentistName || strings.allDentists;

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

            return `
              <tr class="appointment-row">
                <td class="col-time">${escapeHtml(timeDisplay)}</td>
                <td class="col-patient"><strong>${escapeHtml(appt.patientName)}</strong></td>
                <td class="col-treatment">${escapeHtml(appt.treatmentName)}</td>
                <td class="col-status"><span class="status-badge">${escapeHtml(statusLabel)}</span></td>
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
                  <th style="width: 15%;">${escapeHtml(strings.colTime)}</th>
                  <th style="width: 30%;">${escapeHtml(strings.colPatient)}</th>
                  <th style="width: 30%;">${escapeHtml(strings.colTreatment)}</th>
                  <th style="width: 15%;">${escapeHtml(strings.colStatus)}</th>
                  <th style="width: 10%;">${escapeHtml(strings.colChair)}</th>
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
  <title>${escapeHtml(reportTitle)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 12mm 14mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.35;
      color: #111111;
      background-color: #FFFFFF;
    }

    .report-container {
      width: 100%;
      margin: 0 auto;
    }

    .keep-together {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Membrete Monocromático de Ahorro de Tinta */
    .report-header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111111;
      padding-bottom: 10px;
      margin-bottom: 14px;
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
      color: #000000;
      letter-spacing: 0.5px;
    }

    .brand-titles .tagline {
      margin: 2px 0 0 0;
      font-size: 8pt;
      color: #333333;
      font-weight: 500;
    }

    .brand-titles .tax-id {
      margin: 1px 0 0 0;
      font-size: 7pt;
      color: #555555;
    }

    .header-clinic-meta {
      text-align: right;
      font-size: 7.5pt;
      color: #333333;
    }

    .header-clinic-meta p {
      margin: 1px 0;
    }

    /* Identificador del Reporte y Semana */
    .title-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1.5px solid #222222;
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 14px;
      background-color: #FAFAFA;
    }

    .title-info h2 {
      margin: 0;
      font-size: 13pt;
      font-weight: 700;
      color: #000000;
    }

    .title-info .subtitle {
      margin: 3px 0 0 0;
      font-size: 8pt;
      color: #444444;
    }

    .meta-box {
      text-align: right;
      font-size: 7.5pt;
      color: #333333;
    }

    .code-badge {
      display: inline-block;
      font-family: monospace;
      font-size: 8pt;
      font-weight: bold;
      border: 1px solid #111111;
      padding: 2px 6px;
      border-radius: 3px;
      margin-bottom: 3px;
    }

    /* Resumen de Métricas / KPIs Monocromático */
    .metrics-row {
      display: flex;
      flex-direction: row;
      gap: 12px;
      margin-bottom: 16px;
    }

    .metric-card {
      flex: 1;
      border: 1px solid #666666;
      border-radius: 4px;
      padding: 8px 10px;
      background-color: #FFFFFF;
    }

    .metric-label {
      font-size: 7pt;
      text-transform: uppercase;
      color: #555555;
      font-weight: 600;
      display: block;
    }

    .metric-value {
      font-size: 14pt;
      font-weight: 800;
      color: #000000;
      margin-top: 2px;
      display: block;
    }

    /* Tablas y Días de la Agenda */
    .day-section {
      margin-bottom: 18px;
    }

    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #F0F0F0;
      border-left: 4px solid #111111;
      padding: 5px 8px;
      margin-bottom: 4px;
    }

    .day-title {
      font-weight: 700;
      font-size: 9pt;
      color: #000000;
      text-transform: uppercase;
    }

    .day-count {
      font-size: 7.5pt;
      color: #555555;
      font-weight: 600;
    }

    .agenda-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
      break-inside: auto;
    }

    .agenda-table thead {
      display: table-header-group;
    }

    .agenda-table th {
      background-color: #FFFFFF;
      color: #000000;
      font-weight: 700;
      border-bottom: 1.5px solid #000000;
      padding: 5px 6px;
      font-size: 7.5pt;
      text-transform: uppercase;
      text-align: left;
    }

    .agenda-table td {
      border-bottom: 1px solid #CCCCCC;
      padding: 5px 6px;
      font-size: 8pt;
      color: #111111;
      vertical-align: middle;
    }

    .appointment-row {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .status-badge {
      display: inline-block;
      border: 1px solid #111111;
      padding: 1px 4px;
      border-radius: 2px;
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }

    /* Estado Vacío de la Semana */
    .empty-agenda-card {
      border: 1.5px dashed #666666;
      border-radius: 6px;
      padding: 28px 16px;
      text-align: center;
      margin: 20px 0;
      background-color: #FAFAFA;
    }

    .empty-agenda-icon {
      font-size: 24pt;
      margin-bottom: 8px;
    }

    .empty-agenda-title {
      margin: 0;
      font-size: 11pt;
      font-weight: 700;
      color: #000000;
    }

    .empty-agenda-desc {
      margin: 6px 0 0 0;
      font-size: 8.5pt;
      color: #555555;
    }

    /* Pie de Página Institucional */
    .report-footer {
      border-top: 1px solid #666666;
      padding-top: 6px;
      margin-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: #555555;
    }

    .footer-left {
      max-width: 75%;
    }

    .footer-right {
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Membrete Institucional Monocromático -->
    <header class="report-header">
      <div class="header-brand">
        ${getMonochromeLogoSvg()}
        <div class="brand-titles">
          <h1>${escapeHtml(clinic.name)}</h1>
          <p class="tagline">${escapeHtml(clinic.tagline)}</p>
          <p class="tax-id">RIF / Tax ID: ${escapeHtml(clinic.taxId)}</p>
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
      <div class="metric-card">
        <span class="metric-label">${escapeHtml(strings.daysWithActivity)}</span>
        <span class="metric-value">${daysWithAppointments} / ${agenda.days.length}</span>
      </div>
      <div class="metric-card">
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
  const html = buildWeeklyAgendaHtml(agenda, options);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      return;
    }
    window.print();
    return;
  }

  await Print.printAsync({ html });
}

/**
 * Genera el archivo físico PDF de la agenda semanal en el almacenamiento local del dispositivo
 */
export async function generateWeeklyAgendaPdf(
  agenda: WeeklyAgenda,
  options: WeeklyAgendaReportOptions = {}
): Promise<ReportFileResult> {
  const html = buildWeeklyAgendaHtml(agenda, options);

  const result = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  return {
    uri: result.uri,
    numberOfPages: result.numberOfPages,
    base64: result.base64,
  };
}
