import { ReportService } from '@/services/report-service';
import { formatVisitDay } from '@/utils/patient-visits';
import type { Patient } from '@/services/patient-service';
import type { RenderReportOptions, ReportLanguage } from '@/utils/report-template-engine';

export interface PatientDirectoryExportOptions {
  patients: Patient[];
  language?: ReportLanguage;
  generatedBy?: string;
  searchQuery?: string;
}

/**
 * Mapea un paciente a las 5 columnas requeridas:
 * [Código, Nombre, Teléfono/Email, Última Visita, Próxima Cita]
 * Sanitiza y protege la información sin exponer identificadores internos de Firestore.
 */
export function mapPatientToDirectoryRow(patient: any): [string, string, string, string, string] {
  const code = patient.patientCode || '—';
  const name = patient.fullName || '—';

  const phone = patient.phone?.trim();
  const email = patient.email?.trim();
  let contact = '—';
  if (phone && email) {
    contact = `${phone} / ${email}`;
  } else if (phone) {
    contact = phone;
  } else if (email) {
    contact = email;
  }

  const lastVisitRaw = patient.ultima_visita || patient.lastVisit || patient.ultimaVisita;
  const nextVisitRaw = patient.proxima_vista || patient.proxima_visita || patient.nextAppointment || patient.proximaCita;

  const lastVisit = formatVisitDay(lastVisitRaw);
  const nextVisit = formatVisitDay(nextVisitRaw);

  return [code, name, contact, lastVisit, nextVisit];
}

export function buildPatientDirectoryHtml(
  patients: Patient[],
  options: PatientDirectoryExportOptions = { patients: [] }
): RenderReportOptions {
  const lang = ReportService.resolveLanguage(options.language);
  const totalCount = patients.length;

  const isSpanish = lang === 'es';
  const title = isSpanish ? 'Directorio de Pacientes' : 'Patient Directory';
  const subtitle = options.searchQuery
    ? (isSpanish ? `Listado filtrado por: "${options.searchQuery}"` : `Filtered directory by: "${options.searchQuery}"`)
    : (isSpanish ? 'Listado consolidado de pacientes registrados' : 'Consolidated directory of registered patients');

  const metricsHtml = ReportService.buildMetrics([
    {
      label: isSpanish ? 'TOTAL DE PACIENTES' : 'TOTAL PATIENTS',
      value: totalCount,
      variant: 'primary',
    },
  ]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: isSpanish ? 'Código' : 'Code', width: '15%' },
      { header: isSpanish ? 'Nombre' : 'Name', width: '25%' },
      { header: isSpanish ? 'Teléfono / Email' : 'Phone / Email', width: '30%' },
      { header: isSpanish ? 'Última Visita' : 'Last Visit', width: '15%' },
      { header: isSpanish ? 'Próxima Cita' : 'Next Appointment', width: '15%' },
    ],
    rows: patients.map((p) => mapPatientToDirectoryRow(p)),
    striped: true,
    language: lang,
    emptyMessage: isSpanish
      ? 'No hay pacientes para mostrar en este directorio.'
      : 'No patients found in this directory.',
  });
  const dateFormatted = new Date().toISOString().split('T')[0];
  return {
    metadata: {
      title,
      subtitle,
      category: isSpanish ? 'Directorio Clínico' : 'Clinical Directory',
      generatedBy: options.generatedBy || (isSpanish ? 'Administración' : 'Administration'),
      fileName: isSpanish ? `Directorio_Pacientes_${dateFormatted}` : `Patient_Directory_${dateFormatted}`,
      language: lang,
      notes: [
        isSpanish
          ? 'Documento generado automáticamente para control administrativo y auditoría clínica.'
          : 'Automatically generated document for administrative control and clinical audit.',
        isSpanish
          ? 'Los datos contenidos en este directorio son estrictamente confidenciales.'
          : 'Data contained in this directory is strictly confidential.',
      ],
    },
    contentHtml: `${metricsHtml}${tableHtml}`,
    customStyles: `
      .report-table tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      /* Oculta la firma del doctor y conserva solo el sello institucional */
      .signature-section .signature-column:not(.seal-column) {
        display: none !important;
      }
      .signature-section {
        justify-content: flex-end !important;
      }
    `,
  };
}

export async function exportPatientDirectoryPdf(options: PatientDirectoryExportOptions): Promise<void> {
  const renderOptions = buildPatientDirectoryHtml(options.patients, options);
  await ReportService.generateAndShare(renderOptions, {
    dialogTitle: renderOptions.metadata.title,
    language: options.language,
  });
}