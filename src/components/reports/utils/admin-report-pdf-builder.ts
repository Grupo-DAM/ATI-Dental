/**
 * Constructor de opciones de renderizado PDF para los 7 reportes administrativos de ATI Dental (US-02).
 * Transforma los datos en memoria de cada reporte en plantillas estructuradas con la identidad visual corporativa.
 */
import { ReportService } from '@/services/report-service';
import type { RenderReportOptions } from '@/utils/report-template-engine';
import {
  PeriodOption,
  ReportType,
  SessionRecord,
  UserDemographicsMetrics,
  UserGeographicsMetrics,
  RetentionDataPoint,
  DAU_MAU_TARGET_RATIO,
} from '../types';
import {
  getRecordTimestamp,
  getRecordDurationMinutes,
  calculateDauMauRatio,
} from './reports-utils';

export interface AdminReportDataSnapshot {
  reportType: ReportType;
  selectedPeriod: PeriodOption;
  periodLabel: string;
  language?: 'es' | 'en';
  // 1 & 2: Uso y Accesos
  sessions?: SessionRecord[];
  totalAccessToday?: number;
  displayedActiveUsers?: number;
  // 3: Demografía
  demographicsMetrics?: UserDemographicsMetrics | null;
  // 4: Geografía
  geographicsMetrics?: UserGeographicsMetrics | null;
  // 5: DAU / MAU
  dauValue?: number;
  mauValue?: number;
  dauMauRatio?: number;
  dauMauData?: { label: string; mau: number; dau: number }[];
  // 6: Tasa de Fallos (Crash Rate)
  totalCrashesValue?: number;
  affectedUsersValue?: number;
  calculatedCrashRateString?: string;
  crashRateData?: { label: string; value: number; date?: string }[];
  // 7: Retención
  retentionData?: RetentionDataPoint[];
  day1String?: string;
  day7String?: string;
  day30String?: string;
}

/**
 * Valida si el reporte seleccionado posee datos activos suficientes para exportar
 */
export function hasReportData(snapshot: AdminReportDataSnapshot): boolean {
  const { reportType } = snapshot;

  switch (reportType) {
    case 'usage':
    case 'access':
      return Boolean(snapshot.sessions && snapshot.sessions.length > 0);
    case 'demographics':
      return Boolean(snapshot.demographicsMetrics && snapshot.demographicsMetrics.totalUsers > 0);
    case 'geographics':
      return Boolean(snapshot.geographicsMetrics && snapshot.geographicsMetrics.totalUsers > 0);
    case 'dau_mau': {
      const points = snapshot.dauMauData ?? [];
      const hasNumbers = (snapshot.dauValue ?? 0) > 0 || (snapshot.mauValue ?? 0) > 0;
      const hasPoints = points.some((p) => p.dau > 0 || p.mau > 0);
      return hasNumbers || hasPoints;
    }
    case 'crash_rate':
      return Boolean(snapshot.crashRateData && snapshot.crashRateData.length > 0);
    case 'retention_rate':
      return Boolean(snapshot.retentionData && snapshot.retentionData.length > 0);
    default:
      return false;
  }
}

export type TranslateFunction = (key: string, fallback?: any) => string;

/**
 * Construye la configuración completa de RenderReportOptions para ReportService
 */
export function buildAdminReportPdfOptions(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const { reportType, periodLabel, language } = snapshot;

  switch (reportType) {
    case 'usage':
      return buildUsageReportPdf(snapshot, t);
    case 'access':
      return buildAccessReportPdf(snapshot, t);
    case 'demographics':
      return buildDemographicsReportPdf(snapshot, t);
    case 'geographics':
      return buildGeographicsReportPdf(snapshot, t);
    case 'dau_mau':
      return buildDauMauReportPdf(snapshot, t);
    case 'crash_rate':
      return buildCrashRateReportPdf(snapshot, t);
    case 'retention_rate':
      return buildRetentionReportPdf(snapshot, t);
    default:
      return {
        metadata: {
          title: t('reports.title', 'Reportes Administrativos'),
          subtitle: periodLabel,
          category: 'Administración General',
          showSignatureBlock: false,
          language,
        },
        contentHtml: ReportService.buildAlert(
          t('reports.emptyState', 'No hay registros disponibles para este reporte.'),
          'info',
        ),
        language,
      };
  }
}

// -------------------------------------------------------------
// 1. REPORTE DE TIEMPO DE USO
// -------------------------------------------------------------
function buildUsageReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const sessions = snapshot.sessions ?? [];
  const days = snapshot.selectedPeriod;
  const now = new Date();

  const buckets: Record<string, { accesses: number; totalMinutes: number; dayNum: number; dateStr: string }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    buckets[key] = { accesses: 0, totalMinutes: 0, dayNum: d.getDate(), dateStr: key };
  }

  sessions.forEach((record) => {
    const ts = getRecordTimestamp(record);
    if (ts === null) return;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].accesses += 1;
      buckets[key].totalMinutes += getRecordDurationMinutes(record);
    }
  });

  const tableRows = Object.keys(buckets).map((key) => {
    const b = buckets[key];
    const avgMin = b.accesses > 0 ? Math.round(b.totalMinutes / b.accesses) : 0;
    return [b.dateStr, b.accesses, `${avgMin} min`];
  });

  const chartPoints = Object.keys(buckets).map((key) => {
    const b = buckets[key];
    const avgMin = b.accesses > 0 ? Math.round(b.totalMinutes / b.accesses) : 0;
    return { label: b.dateStr.slice(5), value: avgMin };
  });

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.chartTitleUsage', 'Tiempo de Uso Diario'),
    subtitle: t('reports.minutes', 'Minutos promedio por sesión'),
    series: [
      {
        name: t('reports.timeAvg', 'Tiempo Promedio'),
        color: '#5B2D8B',
        points: chartPoints,
        unit: 'min',
      },
    ],
    valueSuffix: ' min',
  });

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.totalAccessToday', 'TOTAL ACCESOS (HOY)'),
      value: snapshot.totalAccessToday ?? 0,
      variant: 'primary',
    },
    {
      label: t('reports.activeUsers', 'USUARIOS ACTIVOS'),
      value: snapshot.displayedActiveUsers ?? 0,
      variant: 'info',
    },
    {
      label: t('reports.reportTypeLabel', 'PERÍODO'),
      value: snapshot.periodLabel,
      variant: 'neutral',
    },
  ]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: 'Fecha', align: 'left', width: '40%' },
      { header: 'Accesos Registrados', align: 'center', width: '30%' },
      { header: 'Tiempo Promedio de Uso', align: 'right', width: '30%' },
    ],
    rows: tableRows,
  });

  return {
    metadata: {
      title: t('reports.chartTitleUsage', 'Tiempo de Uso Diario'),
      fileName: 'Reporte_Tiempo_de_Uso',
      subtitle: `${t('reports.reportTypeUsage', 'Visualizar tiempo de uso por usuario')} · ${snapshot.periodLabel}`,
      category: 'Módulo Administrativo · Analítica de Uso',
      badge: { label: snapshot.periodLabel, variant: 'primary' },
      showSignatureBlock: false,
      notes: [
        'Los minutos reflejan el promedio calculado por sesión activa.',
        'Datos extraídos de la colección centralizada de sesiones de Cloud Firestore.',
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}${chartHtml}${tableHtml}`,
    language: snapshot.language,
  };
}

// -------------------------------------------------------------
// 2. REPORTE DE FRECUENCIA DE ACCESOS
// -------------------------------------------------------------
function buildAccessReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const sessions = snapshot.sessions ?? [];
  const days = snapshot.selectedPeriod;
  const now = new Date();

  const buckets: Record<string, { accesses: number; dateStr: string }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    buckets[key] = { accesses: 0, dateStr: key };
  }

  sessions.forEach((record) => {
    const ts = getRecordTimestamp(record);
    if (ts === null) return;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (buckets[key]) {
      buckets[key].accesses += 1;
    }
  });

  const tableRows = Object.keys(buckets).map((key) => {
    const b = buckets[key];
    return [b.dateStr, b.accesses];
  });

  const chartPoints = Object.keys(buckets).map((key) => {
    const b = buckets[key];
    return { label: b.dateStr.slice(5), value: b.accesses };
  });

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.chartTitle', 'Accesos Diarios al Sistema'),
    subtitle: t('reports.totalAccessToday', 'Número de accesos registrados'),
    series: [
      {
        name: t('reports.totalAccessToday', 'Accesos'),
        color: '#8E59CF',
        points: chartPoints,
      },
    ],
  });

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.totalAccessToday', 'TOTAL ACCESOS (HOY)'),
      value: snapshot.totalAccessToday ?? 0,
      variant: 'primary',
    },
    {
      label: t('reports.activeUsers', 'USUARIOS ACTIVOS'),
      value: snapshot.displayedActiveUsers ?? 0,
      variant: 'info',
    },
    {
      label: t('reports.reportTypeLabel', 'PERÍODO'),
      value: snapshot.periodLabel,
      variant: 'neutral',
    },
  ]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: 'Fecha', align: 'left', width: '60%' },
      { header: 'Número de Accesos', align: 'center', width: '40%' },
    ],
    rows: tableRows,
  });

  return {
    metadata: {
      title: t('reports.chartTitle', 'Accesos Diarios al Sistema'),
      fileName: 'Reporte_Accesos_Diarios',
      subtitle: snapshot.periodLabel,
      category: 'Módulo Administrativo · Concurrencia de Accesos',
      badge: { label: snapshot.periodLabel, variant: 'info' },
      showSignatureBlock: false,
      notes: [
        'Registro cronológico de logins y sesiones iniciadas en la plataforma.',
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}${chartHtml}${tableHtml}`,
    language: snapshot.language,
  };
}

// -------------------------------------------------------------
// 3. REPORTE DE DEMOGRAFÍA DE USUARIOS
// -------------------------------------------------------------
function buildDemographicsReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const m = snapshot.demographicsMetrics;
  const totalUsers = m?.totalUsers ?? 0;
  const avgAge = m?.averageAge !== null && m?.averageAge !== undefined ? `${m.averageAge} años` : '—';

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.kpiTotalUsers', 'TOTAL USUARIOS'),
      value: totalUsers,
      variant: 'primary',
    },
    {
      label: t('reports.kpiAverageAge', 'EDAD PROMEDIO'),
      value: avgAge,
      variant: 'info',
    },
  ]);

  const ageColors: Record<string, string> = {
    '18_25': '#C4B0DC',
    '26_35': '#5B2D8B',
    '36_50': '#9B7BB8',
    '50_plus': '#D4C4E8',
    unspecified: '#EDE4F5',
  };

  const ageItems = (m?.ageBuckets ?? []).map((b) => {
    const labelKey = `reports.ageRange${b.key.charAt(0).toUpperCase() + b.key.slice(1)}`;
    const label = t(labelKey, b.key.replaceAll('_', ' '));
    const percent = totalUsers > 0 ? Math.round((b.count / totalUsers) * 100) : 0;
    return {
      label,
      value: b.count,
      percentage: percent,
      formattedValue: `${b.count} (${percent}%)`,
      color: ageColors[b.key] || '#5B2D8B',
    };
  });

  const ageChartHtml = ReportService.buildBarChart({
    title: t('reports.ageChartTitle', 'Distribución Visual por Rangos de Edad'),
    items: ageItems,
    orientation: 'horizontal',
  });

  const ageRows = ageItems.map((item) => [item.label, item.value, `${item.percentage}%`]);

  const ageTableHtml = ReportService.buildTable({
    columns: [
      { header: t('reports.ageChartTitle', 'Rango de Edad'), align: 'left', width: '50%' },
      { header: 'Usuarios', align: 'center', width: '25%' },
      { header: 'Porcentaje', align: 'right', width: '25%' },
    ],
    rows: ageRows,
  });

  const genderColors: Record<string, string> = {
    female: '#5B2D8B',
    male: '#B39DDB',
    unspecified: '#EDE4F5',
  };

  const genderSlices = (m?.genderSlices ?? []).map((g) => {
    const labelKey = `reports.gender${g.key.charAt(0).toUpperCase() + g.key.slice(1)}`;
    const label = t(labelKey, g.key);
    return {
      label,
      value: g.count,
      percent: g.percent,
      color: genderColors[g.key] || '#5B2D8B',
    };
  });

  const genderChartHtml = ReportService.buildDonutChart({
    title: t('reports.genderChartTitle', 'Distribución Visual por Género'),
    slices: genderSlices,
    centerValue: totalUsers,
    centerLabel: t('reports.totalUsers', 'Total'),
  });

  const genderRows = genderSlices.map((g) => [g.label, g.value, `${g.percent}%`]);

  const genderTableHtml = ReportService.buildTable({
    columns: [
      { header: t('reports.genderChartTitle', 'Distribución por Género'), align: 'left', width: '50%' },
      { header: 'Usuarios', align: 'center', width: '25%' },
      { header: 'Porcentaje', align: 'right', width: '25%' },
    ],
    rows: genderRows,
  });

  return {
    metadata: {
      title: t('reports.reportTypeDemographics', 'Demografía de Usuarios'),
      fileName: 'Reporte_Demografia_Usuarios',
      subtitle: `${t('reports.title', 'Reporte Poblacional')} · ${snapshot.periodLabel}`,
      category: 'Módulo Administrativo · Población Registrada',
      badge: { label: `${totalUsers} Usuarios`, variant: 'primary' },
      showSignatureBlock: false,
      notes: [
        'Distribución segmentada a partir de los perfiles de usuario y pacientes registrados.',
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}<h3 style="margin: 16px 0 8px; color: #5B2D8B; font-size: 11pt;">Distribución por Rangos de Edad</h3>${ageChartHtml}${ageTableHtml}<h3 style="margin: 20px 0 8px; color: #5B2D8B; font-size: 11pt;">Distribución por Género</h3>${genderChartHtml}${genderTableHtml}`,
    language: snapshot.language,
  };
}

// -------------------------------------------------------------
// 4. REPORTE DE DISTRIBUCIÓN GEOGRÁFICA
// -------------------------------------------------------------
function buildGeographicsReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const g = snapshot.geographicsMetrics;
  const totalCities = g?.totalCities ?? 0;
  const totalUsers = g?.totalUsers ?? 0;
  const mainCountry = g?.mainCountry ?? 'N/A';
  const mainPercent = g?.mainCountryPercent ?? 0;

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.kpiCities', 'CIUDADES'),
      value: totalCities,
      variant: 'primary',
    },
    {
      label: t('reports.kpiPrincipal', 'PAÍS PRINCIPAL'),
      value: mainCountry,
      hint: `${mainPercent}% del total`,
      variant: 'info',
    },
    {
      label: t('reports.kpiTotalUsers', 'TOTAL USUARIOS'),
      value: totalUsers,
      variant: 'neutral',
    },
  ]);

  const countryItems = (g?.countryBuckets ?? []).map((c) => {
    const percent = totalUsers > 0 ? Math.round((c.count / totalUsers) * 100) : 0;
    return {
      label: c.label,
      value: c.count,
      percentage: percent,
      formattedValue: `${c.count} (${percent}%)`,
      color: '#5B2D8B',
    };
  });

  const countryChartHtml = ReportService.buildBarChart({
    title: t('reports.chartTopCountries', 'Distribución Visual por Países'),
    items: countryItems,
    orientation: 'horizontal',
  });

  const countryRows = countryItems.map((c) => [c.label, c.value, `${c.percentage}%`]);

  const countryTableHtml = ReportService.buildTable({
    columns: [
      { header: t('reports.chartTopCountries', 'País de Residencia'), align: 'left', width: '50%' },
      { header: 'Usuarios', align: 'center', width: '25%' },
      { header: 'Participación', align: 'right', width: '25%' },
    ],
    rows: countryRows,
  });

  const regionPalette = ['#5B2D8B', '#8E59CF', '#B39DDB', '#D4C4E8', '#EDE4F5'];
  const regionSlices = (g?.regionSlices ?? []).map((r, i) => ({
    label: r.label,
    value: r.count,
    percent: r.percent,
    color: regionPalette[i % regionPalette.length],
  }));

  const regionChartHtml = ReportService.buildDonutChart({
    title: t('reports.chartRegions', 'Distribución Visual por Región'),
    slices: regionSlices,
    centerValue: totalUsers,
    centerLabel: t('reports.totalUsers', 'Total'),
  });

  const regionRows = regionSlices.map((r) => [r.label, r.value, `${r.percent}%`]);

  const regionTableHtml = ReportService.buildTable({
    columns: [
      { header: t('reports.chartRegions', 'Distribución por Región'), align: 'left', width: '50%' },
      { header: 'Usuarios', align: 'center', width: '25%' },
      { header: 'Porcentaje', align: 'right', width: '25%' },
    ],
    rows: regionRows,
  });

  return {
    metadata: {
      title: t('reports.reportTypeGeographics', 'Distribución Geográfica'),
      fileName: 'Reporte_Distribucion_Geografica',
      subtitle: `${t('reports.title', 'Presencia Geográfica')} · ${snapshot.periodLabel}`,
      category: 'Módulo Administrativo · Alcance Geográfico',
      badge: { label: `${totalCities} Ciudades`, variant: 'primary' },
      showSignatureBlock: false,
      notes: [
        'Localización derivada de las direcciones y ciudades reportadas en la ficha de usuario.',
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}<h3 style="margin: 16px 0 8px; color: #5B2D8B; font-size: 11pt;">Distribución por País</h3>${countryChartHtml}${countryTableHtml}<h3 style="margin: 20px 0 8px; color: #5B2D8B; font-size: 11pt;">Distribución por Regiones</h3>${regionChartHtml}${regionTableHtml}`,
    language: snapshot.language,
  };
}

// -------------------------------------------------------------
// 5. REPORTE DE DAU / MAU
// -------------------------------------------------------------
function buildDauMauReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const dauValue = snapshot.dauValue ?? 0;
  const mauValue = snapshot.mauValue ?? 0;
  const dauMauRatio = snapshot.dauMauRatio ?? calculateDauMauRatio(dauValue, mauValue);
  const dataPoints = snapshot.dauMauData ?? [];

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.kpiRatio', 'RATIO DAU/MAU'),
      value: `${dauMauRatio}%`,
      hint: `Meta: ${DAU_MAU_TARGET_RATIO}%`,
      variant: 'primary',
    },
    {
      label: t('reports.kpiDau', 'DAU (DIARIOS)'),
      value: dauValue,
      hint: t('reports.kpiDailyAvg', 'Prom. diario'),
      variant: 'info',
    },
    {
      label: t('reports.kpiMau', 'MAU (MENSUALES)'),
      value: mauValue,
      hint: t('reports.kpiThisMonth', 'Este mes'),
      variant: 'neutral',
    },
  ]);

  const dauPoints = dataPoints.map((pt) => ({ label: pt.label, value: pt.dau }));
  const mauPoints = dataPoints.map((pt) => ({ label: pt.label, value: pt.mau }));

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.dauMauChartTitle', 'Evolución de Usuarios Activos (DAU vs MAU)'),
    subtitle: t('reports.adoptionRatio', `Ratio actual: ${dauMauRatio}% · Objetivo: ${DAU_MAU_TARGET_RATIO}%`),
    series: [
      { name: 'MAU (Mensuales)', color: '#0284C7', points: mauPoints },
      { name: 'DAU (Diarios)', color: '#5B2D8B', points: dauPoints },
    ],
  });

  const rows = dataPoints.map((pt) => {
    const ratio = pt.mau > 0 ? `${Math.round((pt.dau / pt.mau) * 100)}%` : '0%';
    return [pt.label, pt.dau, pt.mau, ratio];
  });

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: 'Mes', align: 'left', width: '25%' },
      { header: 'DAU (Diarios)', align: 'center', width: '25%' },
      { header: 'MAU (Mensuales)', align: 'center', width: '25%' },
      { header: 'Ratio de Adopción', align: 'right', width: '25%' },
    ],
    rows,
  });

  return {
    metadata: {
      title: t('reports.reportTypeDauMau', 'Usuarios Activos Diarios vs Mensuales (DAU/MAU)'),
      fileName: 'Reporte_Usuarios_Activos_DAU_MAU',
      subtitle: `${t('reports.dauMauChartTitle', 'Adopción y Frecuencia de Uso')} · ${snapshot.periodLabel}`,
      category: 'Módulo Administrativo · Métricas de Producto',
      badge: { label: `Ratio: ${dauMauRatio}%`, variant: 'primary' },
      showSignatureBlock: false,
      notes: [
        'DAU representa los usuarios únicos activos por día.',
        'MAU representa los usuarios únicos activos en una ventana de 30 días.',
        `El objetivo estándar de adopción (Stickiness) de la clínica es del ${DAU_MAU_TARGET_RATIO}%.`,
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}${chartHtml}${tableHtml}`,
    language: snapshot.language,
  };
}

// -------------------------------------------------------------
// 6. REPORTE DE TASA DE FALLOS (CRASH RATE)
// -------------------------------------------------------------
function buildCrashRateReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const crashRateStr = snapshot.calculatedCrashRateString ?? '0.00%';
  const totalCrashes = snapshot.totalCrashesValue ?? 0;
  const affectedUsers = snapshot.affectedUsersValue ?? 0;
  const dataPoints = snapshot.crashRateData ?? [];

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.crashRateToday', 'TASA DE FALLAS'),
      value: crashRateStr,
      variant: 'warning',
    },
    {
      label: t('reports.totalCrashesToday', 'TOTAL DE FALLAS'),
      value: totalCrashes,
      variant: 'primary',
    },
    {
      label: t('reports.affectedUsers', 'USUARIOS AFECTADOS'),
      value: affectedUsers,
      variant: 'neutral',
    },
  ]);

  const points = dataPoints.map((pt) => ({
    label: pt.date ? pt.date.slice(5) : pt.label,
    value: pt.value,
  }));

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.chartTitleCrashRate', 'Tendencia de Estabilidad y Tasa de Fallos'),
    subtitle: t('reports.crashRate', 'Porcentaje de fallos diarios por sesión'),
    series: [
      {
        name: t('reports.crashRate', 'Tasa de Fallos'),
        color: '#D97706',
        points,
      },
    ],
    valueSuffix: '%',
    targetLine: { value: 1.0, label: 'Umbral 1.0%', color: '#DC2626' },
  });

  const rows = dataPoints.map((pt) => [pt.date || pt.label, `${pt.value.toFixed(2)}%`]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: 'Fecha', align: 'left', width: '60%' },
      { header: 'Tasa de Fallos (%)', align: 'center', width: '40%' },
    ],
    rows,
  });

  return {
    metadata: {
      title: t('reports.reportTypeCrashRate', 'Porcentaje de Fallos'),
      fileName: 'Reporte_Porcentaje_de_Fallos',
      subtitle: `${t('reports.chartTitleCrashRate', 'Estabilidad del Sistema')} · ${snapshot.periodLabel}`,
      category: 'Módulo Administrativo · Calidad y Estabilidad',
      badge: { label: crashRateStr, variant: 'warning' },
      showSignatureBlock: false,
      notes: [
        'La tasa de fallos evalúa la proporción de excepciones y cierres inesperados frente a las sesiones totales ejecutadas.',
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}${chartHtml}${tableHtml}`,
    language: snapshot.language,
  };
}

// -------------------------------------------------------------
// 7. REPORTE DE TASA DE RETENCIÓN
// -------------------------------------------------------------
function buildRetentionReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const day1 = snapshot.day1String ?? '0%';
  const day7 = snapshot.day7String ?? '0%';
  const day30 = snapshot.day30String ?? '0%';
  const dataPoints = snapshot.retentionData ?? [];

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.retentionKpiDay1', 'RETENCIÓN DÍA 1'),
      value: day1,
      hint: t('reports.retentionDay1Sub', '24 horas'),
      variant: 'primary',
    },
    {
      label: t('reports.retentionKpiDay7', 'RETENCIÓN DÍA 7'),
      value: day7,
      hint: t('reports.retentionDay7Sub', '7 días'),
      variant: 'info',
    },
    {
      label: t('reports.retentionKpiDay30', 'RETENCIÓN DÍA 30'),
      value: day30,
      hint: t('reports.retentionDay30Sub', '30 días'),
      variant: 'neutral',
    },
  ]);

  const retentionItems = dataPoints.map((d) => ({
    label: `${d.cohort} (${d.label})`,
    value: d.percentage,
    percentage: d.percentage,
    formattedValue: `${d.percentage}%`,
    color: '#5B2D8B',
  }));

  const chartHtml = ReportService.buildBarChart({
    title: t('reports.chartTitleRetentionRate', 'Curva de Retención de Cohortes'),
    subtitle: t('reports.retentionRate', 'Porcentaje de retención D1, D7 y D30'),
    items: retentionItems,
    orientation: 'vertical',
  });

  const rows = dataPoints.map((d) => [d.cohort, d.label, `${d.percentage}%`]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: 'Cohorte de Retención', align: 'left', width: '40%' },
      { header: 'Identificador', align: 'center', width: '30%' },
      { header: 'Porcentaje Retenido', align: 'right', width: '30%' },
    ],
    rows,
  });

  return {
    metadata: {
      title: t('reports.reportTypeRetentionRate', 'Tasa de Retención de Usuarios'),
      fileName: 'Reporte_Tasa_de_Retencion',
      subtitle: `${t('reports.chartTitleRetentionRate', 'Análisis de Cohortes')} · ${snapshot.periodLabel}`,
      category: 'Módulo Administrativo · Fidelización',
      badge: { label: `D1: ${day1} | D7: ${day7}`, variant: 'info' },
      showSignatureBlock: false,
      notes: [
        'Análisis de cohortes temporales evaluando el retorno de usuarios tras su fecha de registro inicial.',
      ],
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}${chartHtml}${tableHtml}`,
    language: snapshot.language,
  };
}
