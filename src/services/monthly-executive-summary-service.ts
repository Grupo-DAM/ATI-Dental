/**
 * Servicio ejecutivo de Resumen Mensual (US-35 / Issue #31)
 * Consolida indicadores operativos y de actividad del mes (30 días)
 * para exportación gerencial en PDF con membrete institucional y bloque de firmas.
 */
import { firestore } from '@/config/firebase';
import { isAdminUser } from '@/constants/user-roles';
import { SessionRecord } from '@/components/reports/types';
import {
  calculateCrashRatePercentage,
  getRecordDurationMinutes,
  getRecordTimestamp,
} from '@/components/reports/utils/reports-utils';
import {
  GenerateAndShareReportResult,
  RenderReportOptions,
  ReportLanguage,
  ReportService,
} from '@/services/report-service';

export interface MonthlyExecutiveMetrics {
  totalAccesses: number;
  dailyAverageAccesses: number;
  activeUsers: number;
  totalCrashes: number;
  crashRatePercent: string;
  sessions: SessionRecord[];
}

export interface DailyExecutiveSummaryBucket {
  dateStr: string;
  accesses: number;
  totalMinutes: number;
}

export function build30DayBuckets(sessions: SessionRecord[]): DailyExecutiveSummaryBucket[] {
  const now = new Date();
  const bucketsMap = new Map<string, DailyExecutiveSummaryBucket>();

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    bucketsMap.set(dateStr, { dateStr, accesses: 0, totalMinutes: 0 });
  }

  sessions.forEach((record) => {
    const ts = getRecordTimestamp(record);
    if (ts === null) return;
    const d = new Date(ts);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const bucket = bucketsMap.get(dateStr);
    if (bucket) {
      bucket.accesses += 1;
      bucket.totalMinutes += getRecordDurationMinutes(record);
    }
  });

  return Array.from(bucketsMap.values());
}

export async function fetchMonthlyExecutiveSummaryData(): Promise<MonthlyExecutiveMetrics> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 29);
  startDate.setHours(0, 0, 0, 0);

  let sessions: SessionRecord[] = [];
  let activeUsers = 0;
  let totalCrashes = 0;

  try {
    const sessionsSnap = await firestore()
      .collection('sesiones')
      .where('fecha', '>=', startDate)
      .get();
    sessions = sessionsSnap?.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) ?? [];
  } catch {
    // Manejo resiliente ante errores de red o emuladores
  }

  try {
    const usersSnap = await firestore().collection('usuarios').get();
    if (usersSnap?.docs) {
      const activeDocs = usersSnap.docs.filter((doc: any) => {
        const data = doc.data() || {};
        return data.estado === 'activo' || (!data.estado && data.estado !== 'inactivo');
      });
      activeUsers = activeDocs.length > 0 ? activeDocs.length : usersSnap.docs.length;
    }
  } catch {
    // Manejo resiliente
  }

  try {
    const stabilityDoc = await firestore()
      .collection('metricas_estabilidad')
      .doc('actual')
      .get();
    const data = typeof stabilityDoc?.data === 'function' ? stabilityDoc.data() : (stabilityDoc as any)?.data;
    if (data) {
      totalCrashes = Number(data.totalCrashes ?? data.crashes ?? 0);
    }
  } catch {
    // Manejo resiliente
  }

  const totalAccesses = sessions.length;
  const dailyAverageAccesses = Math.round((totalAccesses / 30) * 10) / 10;
  const crashRatePercent = calculateCrashRatePercentage(totalCrashes, totalAccesses);

  return {
    totalAccesses,
    dailyAverageAccesses,
    activeUsers,
    totalCrashes,
    crashRatePercent,
    sessions,
  };
}

const STRINGS = {
  title: ['Resumen Ejecutivo Mensual', 'Executive Monthly Summary'],
  subtitle: [
    'Indicadores de Actividad y Desempeño Operativo · Últimos 30 días',
    'Activity Indicators and Operational Performance · Last 30 days',
  ],
  category: [
    'Módulo Administrativo · Resumen Gerencial',
    'Administrative Module · Managerial Summary',
  ],
  badge: ['30 DÍAS', '30 DAYS'],
  fileName: ['Resumen_Ejecutivo_Mensual', 'Executive_Monthly_Summary'],
  cardAccesses: ['ACCESOS TOTALES (MES)', 'TOTAL ACCESSES (MONTH)'],
  cardDailyAvg: ['PROMEDIO DIARIO', 'DAILY AVERAGE'],
  cardUsers: ['USUARIOS ACTIVOS', 'ACTIVE USERS'],
  cardCrashRate: ['TASA DE FALLOS', 'CRASH RATE'],
  noActivityAlert: [
    'Sin actividad de sesiones registrada en el período seleccionado.',
    'No session activity recorded during the selected period.',
  ],
  chartTitle: [
    'Tendencia Diaria de Accesos (30 Días)',
    'Daily Access Trend (30 Days)',
  ],
  colDate: ['Fecha', 'Date'],
  colAccesses: ['Accesos Registrados', 'Recorded Accesses'],
  colAvgTime: ['Tiempo Promedio', 'Average Time'],
  signerRole: [
    'Administrador de Sistema · ATI Dental',
    'System Administrator · ATI Dental',
  ],
  notes: [
    [
      'El presente informe consolida los indicadores operativos y de actividad registrados en los últimos 30 días.',
      'Documento estructurado para respaldo gerencial y auditoría de la plataforma.',
      'Datos extraídos de forma segura desde Cloud Firestore.',
    ],
    [
      'This report consolidates operational and activity indicators recorded over the last 30 days.',
      'Structured document for managerial backup and platform auditing.',
      'Data securely extracted from Cloud Firestore.',
    ],
  ],
} as const;

export function buildMonthlyExecutiveSummaryHtml(
  data: MonthlyExecutiveMetrics,
  language: ReportLanguage = 'es',
  signerName?: string,
): RenderReportOptions {
  const i = language === 'en' ? 1 : 0;
  const isEn = language === 'en';
  const hasSessions = data.sessions && data.sessions.length > 0;

  const kpiCards = ReportService.buildMetrics([
    {
      label: STRINGS.cardAccesses[i],
      value: data.totalAccesses,
      variant: 'primary',
    },
    {
      label: STRINGS.cardDailyAvg[i],
      value: data.dailyAverageAccesses,
      variant: 'neutral',
    },
    {
      label: STRINGS.cardUsers[i],
      value: data.activeUsers,
      variant: 'info',
    },
    {
      label: STRINGS.cardCrashRate[i],
      value: data.crashRatePercent,
      variant: 'warning',
    },
  ]);

  let detailHtml = '';

  if (!hasSessions) {
    const alertHtml = ReportService.buildAlert(STRINGS.noActivityAlert[i], 'info');
    detailHtml = `
      <div style="margin-top: 20px;">
        ${alertHtml}
      </div>
    `;
  } else {
    const buckets = build30DayBuckets(data.sessions);

    const chartPoints = buckets.map((b) => ({
      label: b.dateStr.slice(5),
      value: b.accesses,
    }));

    const chartHtml = ReportService.buildSvgLineChart({
      title: STRINGS.chartTitle[i],
      series: [
        {
          name: isEn ? 'Accesses' : 'Accesos',
          color: '#5B2D8B',
          points: chartPoints,
        },
      ],
      valueSuffix: isEn ? ' accesses' : ' accesos',
    });

    const tableRows = buckets.map((b) => {
      const avgMin = b.accesses > 0 ? Math.round(b.totalMinutes / b.accesses) : 0;
      return [b.dateStr, b.accesses, `${avgMin} min`];
    });

    const tableHtml = ReportService.buildTable({
      columns: [
        { header: STRINGS.colDate[i], align: 'left', width: '35%' },
        { header: STRINGS.colAccesses[i], align: 'center', width: '35%' },
        { header: STRINGS.colAvgTime[i], align: 'right', width: '30%' },
      ],
      rows: tableRows,
      language,
    });

    detailHtml = `
      ${chartHtml}
      <div style="margin-top: 14px;">
        ${tableHtml}
      </div>
    `;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const fileName = `${STRINGS.fileName[i]}_${todayStr}`;

  return {
    metadata: {
      title: STRINGS.title[i],
      subtitle: STRINGS.subtitle[i],
      category: STRINGS.category[i],
      badge: {
        label: STRINGS.badge[i],
        variant: 'primary',
      },
      fileName,
      showSignatureBlock: true,
      signatureTitle: signerName || (isEn ? 'Medical & Administrative Direction' : 'Dirección Médica y Administrativa'),
      signatureSubtitle: STRINGS.signerRole[i],
      notes: [...STRINGS.notes[i]],
      language,
    },
    contentHtml: `${kpiCards}${detailHtml}`,
    language,
  };
}

export async function exportMonthlyExecutiveSummary(
  user: any,
  language: ReportLanguage = 'es',
): Promise<GenerateAndShareReportResult> {
  if (!isAdminUser(user)) {
    throw new Error('Access denied: Administrator role required.');
  }

  const metrics = await fetchMonthlyExecutiveSummaryData();
  const signer = user?.nombre || user?.displayName;
  const options = buildMonthlyExecutiveSummaryHtml(metrics, language, signer);

  return ReportService.generateAndShare(options);
}
