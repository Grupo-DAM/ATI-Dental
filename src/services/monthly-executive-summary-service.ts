/**
 * Servicio ejecutivo de Resumen Mensual (US-35 / Issue #31)
 * Consolida indicadores clínicos, financieros y de actividad de plataforma del mes (30 días)
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
  // Concurrencia y plataforma
  totalAccesses: number;
  dailyAverageAccesses: number;
  activeUsers: number;
  totalCrashes: number;
  crashRatePercent: string;
  sessions: SessionRecord[];

  // Indicadores Clínicos y Financieros
  totalPatients: number;
  activePatients: number;
  monthlyTreatmentsCount: number;
  monthlyEstimatedCost: number;
  averageTreatmentCost: number;
  monthlyAppointmentsCount: number;
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
  const startDateStr = startDate.toISOString().split('T')[0];

  let sessions: SessionRecord[] = [];
  let activeUsers = 0;
  let totalCrashes = 0;
  let totalPatients = 0;
  let activePatients = 0;
  let monthlyTreatmentsCount = 0;
  let monthlyEstimatedCost = 0;
  let monthlyAppointmentsCount = 0;

  // 1. Sesiones de usuario (Últimos 30 días)
  try {
    const sessionsSnap = await firestore()
      .collection('sesiones')
      .where('fecha', '>=', startDate)
      .get();
    sessions = sessionsSnap?.docs?.map((doc: any) => ({ id: doc.id, ...doc.data() })) ?? [];
  } catch {
    // Manejo resiliente
  }

  // 2. Usuarios del sistema
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

  // 3. Métricas de estabilidad y fallos
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

  // 4. Pacientes registrados en la clínica
  try {
    const patientsSnap = await firestore().collection('pacientes').get();
    if (patientsSnap?.docs) {
      totalPatients = patientsSnap.docs.length;
      activePatients = patientsSnap.docs.filter((doc: any) => {
        const data = doc.data() || {};
        return data.status !== 'inactivo';
      }).length;
    }
  } catch {
    // Manejo resiliente
  }

  // 5. Tratamientos y costos del mes
  try {
    const treatmentsSnap = await firestore().collection('tratamientos').get();
    if (treatmentsSnap?.docs) {
      treatmentsSnap.docs.forEach((doc: any) => {
        const t = doc.data() || {};
        const tDate = t.treatmentDate || t.createdAt;
        const fallsInMonth = !tDate || String(tDate) >= startDateStr;
        if (fallsInMonth) {
          monthlyTreatmentsCount += 1;
          const cost = Number(t.estimatedCost || 0);
          if (!Number.isNaN(cost) && cost > 0) {
            monthlyEstimatedCost += cost;
          }
        }
      });
    }
  } catch {
    // Manejo resiliente
  }

  // 6. Citas médicas en agenda
  try {
    const appointmentsSnap = await firestore().collection('citas').get();
    if (appointmentsSnap?.docs) {
      monthlyAppointmentsCount = appointmentsSnap.docs.filter((doc: any) => {
        const a = doc.data() || {};
        return !a.date || String(a.date) >= startDateStr;
      }).length;
    }
  } catch {
    // Manejo resiliente
  }

  const totalAccesses = sessions.length;
  const dailyAverageAccesses = Math.round((totalAccesses / 30) * 10) / 10;
  const crashRatePercent = calculateCrashRatePercentage(totalCrashes, totalAccesses);
  const averageTreatmentCost =
    monthlyTreatmentsCount > 0 ? Math.round(monthlyEstimatedCost / monthlyTreatmentsCount) : 0;

  return {
    totalAccesses,
    dailyAverageAccesses,
    activeUsers,
    totalCrashes,
    crashRatePercent,
    sessions,
    totalPatients,
    activePatients,
    monthlyTreatmentsCount,
    monthlyEstimatedCost,
    averageTreatmentCost,
    monthlyAppointmentsCount,
  };
}

const STRINGS = {
  title: ['Resumen Ejecutivo Mensual', 'Executive Monthly Summary'],
  subtitle: [
    'Indicadores Clínicos, Financieros y Operativos · Últimos 30 días',
    'Clinical, Financial and Operational Indicators · Last 30 days',
  ],
  category: [
    'Módulo Administrativo · Resumen Gerencial',
    'Administrative Module · Managerial Summary',
  ],
  badge: ['30 DÍAS', '30 DAYS'],
  fileName: ['Resumen_Ejecutivo_Mensual', 'Executive_Monthly_Summary'],
  cardPatients: ['PACIENTES TOTALES', 'TOTAL PATIENTS'],
  cardTreatments: ['TRATAMIENTOS (MES)', 'TREATMENTS (MONTH)'],
  cardEstimatedCost: ['COSTOS ESTIMADOS', 'ESTIMATED COSTS'],
  cardAccesses: ['ACCESOS TOTALES', 'TOTAL ACCESSES'],
  cardDailyAvg: ['PROMEDIO DIARIO', 'DAILY AVERAGE'],
  cardCrashRate: ['TASA DE FALLOS', 'CRASH RATE'],
  secClinicalTitle: ['Resumen Clínico y Financiero', 'Clinical & Financial Summary'],
  colIndicator: ['Indicador', 'Indicator'],
  colValue: ['Valor', 'Value'],
  colDetail: ['Detalle / Observación', 'Detail / Observation'],
  rowPatients: ['Pacientes Registrados', 'Registered Patients'],
  rowPatientsDetail: ['Activos en la clínica', 'Active in clinic'],
  rowTreatments: ['Tratamientos Realizados', 'Completed Treatments'],
  rowTreatmentsDetail: ['Costo Promedio: ', 'Average Cost: '],
  rowCosts: ['Costos Totales Estimados', 'Total Estimated Costs'],
  rowCostsDetail: ['Presupuesto de procedimientos', 'Procedures budget'],
  rowAppointments: ['Citas Programadas', 'Scheduled Appointments'],
  rowAppointmentsDetail: ['Citas en agenda médica', 'Medical agenda appointments'],
  secConcurrencyTitle: ['Concurrencia y Actividad en Plataforma', 'Platform Concurrency & Activity'],
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
      'El presente informe consolida los indicadores clínicos, financieros y de actividad operativa registrados en los últimos 30 días.',
      'Los costos reflejan los presupuestos estimados acumulados de los tratamientos correspondientes al período.',
      'Documento estructurado para respaldo gerencial, toma de decisiones y auditoría de la plataforma.',
      'Datos extraídos de forma segura desde Cloud Firestore.',
    ],
    [
      'This report consolidates clinical, financial, and operational activity indicators recorded over the last 30 days.',
      'Costs reflect the cumulative estimated budgets of treatments corresponding to the period.',
      'Structured document for managerial backup, decision making, and platform auditing.',
      'Data securely extracted from Cloud Firestore.',
    ],
  ],
} as const;

function formatCurrency(amount: number): string {
  const safeAmount = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
  return `$${safeAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function buildMonthlyExecutiveSummaryHtml(
  data: MonthlyExecutiveMetrics,
  language: ReportLanguage = 'es',
  signerName?: string,
): RenderReportOptions {
  const i = language === 'en' ? 1 : 0;
  const isEn = language === 'en';
  const hasSessions = data.sessions && data.sessions.length > 0;

  // 1. Tarjetas de Indicadores Clave (KPIs)
  const clinicalKpis = ReportService.buildMetrics([
    {
      label: STRINGS.cardPatients[i],
      value: data.totalPatients,
      variant: 'primary',
    },
    {
      label: STRINGS.cardTreatments[i],
      value: data.monthlyTreatmentsCount,
      variant: 'info',
    },
    {
      label: STRINGS.cardEstimatedCost[i],
      value: formatCurrency(data.monthlyEstimatedCost),
      variant: 'neutral',
    },
  ]);

  const platformKpis = ReportService.buildMetrics([
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
      label: STRINGS.cardCrashRate[i],
      value: data.crashRatePercent,
      variant: 'warning',
    },
  ]);

  // 2. Tabla Resumen Clínico y Financiero
  const clinicalTableHtml = ReportService.buildTable({
    columns: [
      { header: STRINGS.colIndicator[i], align: 'left', width: '40%' },
      { header: STRINGS.colValue[i], align: 'center', width: '25%' },
      { header: STRINGS.colDetail[i], align: 'left', width: '35%' },
    ],
    rows: [
      [
        STRINGS.rowPatients[i],
        data.totalPatients,
        `${STRINGS.rowPatientsDetail[i]}: ${data.activePatients}`,
      ],
      [
        STRINGS.rowTreatments[i],
        data.monthlyTreatmentsCount,
        `${STRINGS.rowTreatmentsDetail[i]}${formatCurrency(data.averageTreatmentCost)}`,
      ],
      [
        STRINGS.rowCosts[i],
        formatCurrency(data.monthlyEstimatedCost),
        STRINGS.rowCostsDetail[i],
      ],
      [
        STRINGS.rowAppointments[i],
        data.monthlyAppointmentsCount,
        STRINGS.rowAppointmentsDetail[i],
      ],
    ],
    language,
  });

  // 3. Sección de Concurrencia y Actividad
  let concurrencySectionHtml = '';

  if (!hasSessions) {
    const alertHtml = ReportService.buildAlert(STRINGS.noActivityAlert[i], 'info');
    concurrencySectionHtml = `
      <div style="margin-top: 16px;">
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

    concurrencySectionHtml = `
      ${chartHtml}
      <div style="margin-top: 14px;">
        ${tableHtml}
      </div>
    `;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const fileName = `${STRINGS.fileName[i]}_${todayStr}`;

  const contentHtml = `
    ${clinicalKpis}
    <div style="margin-top: 8px;">
      ${platformKpis}
    </div>
    <h3 style="margin: 20px 0 10px; color: #5B2D8B; font-size: 11pt; font-family: 'Open Sans', sans-serif;">
      ${STRINGS.secClinicalTitle[i]}
    </h3>
    ${clinicalTableHtml}
    <h3 style="margin: 24px 0 10px; color: #5B2D8B; font-size: 11pt; font-family: 'Open Sans', sans-serif;">
      ${STRINGS.secConcurrencyTitle[i]}
    </h3>
    ${concurrencySectionHtml}
  `;

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
    contentHtml,
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
