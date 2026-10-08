import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { HourWindow } from '@/components/reports/utils/reports-utils';
import { PeakHoursDistribution } from '@/components/reports/types';
import { ReportService } from '@/services/report-service';
import { ReportLanguage } from '@/utils/report-template-engine';

export interface HourlyCsvHeaders {
  slot: string;
  count: string;
  percent: string;
}

export interface HourlyReportLabels extends HourlyCsvHeaders {
  peak: string;
  chartTitle?: string;
  chartSubtitle?: string;
}

function csvCell(value: string | number): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function buildHourlyDistributionCsv(
  distribution: PeakHoursDistribution,
  headers: HourlyCsvHeaders,
): string {
  const lines = [
    [headers.slot, headers.count, headers.percent].map(csvCell).join(','),
    ...distribution.slots.map((slot) =>
      [slot.label, slot.count, slot.percentage].map(csvCell).join(','),
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function buildHourlyDistributionNotes(
  distribution: PeakHoursDistribution,
  language: ReportLanguage,
): string[] {
  if (language === 'en') {
    const peakSummary = distribution.peaks
      .map((p) => `${p.label} (${p.count} accesses, ${p.percentage}%)`)
      .join(', ');
    const peakText = distribution.peaks.length > 0
      ? `Peak activity detected: ${peakSummary}.`
      : 'No peak activity detected during the selected period.';
    return [
      peakText,
      'Hourly distribution identifies peak concurrency intervals to optimize staff scheduling and maintenance windows.',
      'Data consolidated from user sessions recorded in Cloud Firestore.',
    ];
  }
  const peakSummaryEs = distribution.peaks
    .map((p) => `${p.label} (${p.count} accesos, ${p.percentage}%)`)
    .join(', ');
  const peakText = distribution.peaks.length > 0
    ? `Franja(s) de mayor actividad detectada(s): ${peakSummaryEs}.`
    : 'No se detectaron franjas pico en el período seleccionado.';
  return [
    peakText,
    'La distribución horaria permite identificar los intervalos de mayor concurrencia para planificar turnos clínicos y ventanas de mantenimiento.',
    'Datos consolidados a partir de las sesiones de usuario registradas en Cloud Firestore.',
  ];
}

export function buildHourlyDistributionReportHtml(
  distribution: PeakHoursDistribution,
  labels: HourlyReportLabels,
  language: ReportLanguage,
): string {
  const metrics = ReportService.buildMetrics(
    distribution.peaks.map((peak) => ({
      label: labels.peak,
      value: `${peak.label} (${peak.count})`,
      variant: 'primary',
    })),
  );

  const chartPoints = distribution.slots.map((slot) => ({
    label: `${String(slot.hour).padStart(2, '0')}:00`,
    value: slot.count,
  }));

  const chartTitle = labels.chartTitle || (language === 'en' ? 'Hourly Access Distribution' : 'Distribución de Accesos por Hora');
  const chartSubtitle = labels.chartSubtitle || (language === 'en' ? 'Access frequency across hourly slots' : 'Frecuencia de accesos por intervalo horario');

  const chart = ReportService.buildSvgLineChart({
    title: chartTitle,
    subtitle: chartSubtitle,
    series: [
      {
        name: labels.count,
        color: '#5B2D8B',
        points: chartPoints,
        unit: 'acc',
      },
    ],
  });

  const table = ReportService.buildTable({
    columns: [
      { header: labels.slot },
      { header: labels.count, align: 'right' },
      { header: labels.percent, align: 'right' },
    ],
    rows: distribution.slots.map((slot) => [slot.label, slot.count, `${slot.percentage}%`]),
    striped: true,
    language,
  });

  return `${metrics}${chart}${table}`;
}

export function buildHourlyExportBaseName(
  windowHours: HourWindow,
  dayKey: string | null,
  issuedAt: Date = new Date(),
): string {
  const issued = `${issuedAt.getFullYear()}-${String(issuedAt.getMonth() + 1).padStart(2, '0')}-${String(issuedAt.getDate()).padStart(2, '0')}`;
  const day = dayKey ?? issued;
  return `Accesos-por-hora_${day}_ultimas-${windowHours}-horas`;
}

export async function shareNamedHourlyPdf(
  sourceUri: string,
  fileBaseName: string,
  dialogTitle: string,
): Promise<void> {
  const destination = new File(Paths.cache, `${fileBaseName}.pdf`);
  if (destination.exists) {
    destination.delete();
  }
  new File(sourceUri).copy(destination);
  await Sharing.shareAsync(destination.uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle,
  });
}

export async function shareHourlyDistributionCsv(
  content: string,
  dialogTitle: string,
  fileName = `Accesos-por-hora_${Date.now()}.csv`,
): Promise<boolean> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(content);

  const available = await Sharing.isAvailableAsync();
  if (!available) return false;

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
    dialogTitle,
  });
  return true;
}
