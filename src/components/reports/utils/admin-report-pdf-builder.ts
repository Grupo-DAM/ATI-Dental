/**
 * Constructor de opciones de renderizado PDF 
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
    default: {
      const isEn = language === 'en';
      return {
        metadata: {
          title: t('reports.title', isEn ? 'Administrative Reports' : 'Reportes Administrativos'),
          subtitle: periodLabel,
          category: isEn ? 'General Administration' : 'Administración General',
          showSignatureBlock: false,
          language,
        },
        contentHtml: ReportService.buildAlert(
          t('reports.emptyState', isEn ? 'No records available for this report.' : 'No hay registros disponibles para este reporte.'),
          'info',
        ),
        language,
      };
    }
  }
}

// -------------------------------------------------------------
// HELPERS COMPARTIDOS DE EXTRACCIÓN Y TABLAS (Bilingüe y anti-duplicación)
// -------------------------------------------------------------
interface DailySessionBucket {
  accesses: number;
  totalMinutes: number;
  dayNum: number;
  dateStr: string;
}

function getReportI18nContext(isEn: boolean) {
  const terms = {
    date: isEn ? 'Date' : 'Fecha',
    accessesRecorded: isEn ? 'Recorded Accesses' : 'Accesos Registrados',
    avgUsageTime: isEn ? 'Average Usage Time' : 'Tiempo Promedio de Uso',
    accessCount: isEn ? 'Number of Accesses' : 'Número de Accesos',
    users: isEn ? 'Users' : 'Usuarios',
    percentage: isEn ? 'Percentage' : 'Porcentaje',
    share: isEn ? 'Share' : 'Participación',
    ageRange: isEn ? 'Age Range' : 'Rango de Edad',
    gender: isEn ? 'Gender' : 'Distribución por Género',
    country: isEn ? 'Country of Residence' : 'País de Residencia',
    region: isEn ? 'Region' : 'Distribución por Región',
    ageDistribution: isEn ? 'Distribution by Age Range' : 'Distribución por Rangos de Edad',
    genderDistribution: isEn ? 'Distribution by Gender' : 'Distribución por Género',
    countryDistribution: isEn ? 'Distribution by Country' : 'Distribución por País',
    regionDistribution: isEn ? 'Distribution by Region' : 'Distribución por Regiones',
    month: isEn ? 'Month' : 'Mes',
    dauDaily: isEn ? 'DAU (Daily)' : 'DAU (Diarios)',
    mauMonthly: isEn ? 'MAU (Monthly)' : 'MAU (Mensuales)',
    adoptionRatio: isEn ? 'Adoption Ratio' : 'Ratio de Adopción',
    crashRatePercent: isEn ? 'Crash Rate (%)' : 'Tasa de Fallos (%)',
    retentionCohort: isEn ? 'Retention Cohort' : 'Cohorte de Retención',
    identifier: isEn ? 'Identifier' : 'Identificador',
    retainedPercentage: isEn ? 'Retained Percentage' : 'Porcentaje Retenido',
    years: isEn ? 'years' : 'años',
    cities: isEn ? 'Cities' : 'Ciudades',
  };

  const meta = {
    usageCategory: isEn ? 'Administrative Module · Usage Analytics' : 'Módulo Administrativo · Analítica de Uso',
    usageFileName: isEn ? 'Report_Usage_Time' : 'Reporte_Tiempo_de_Uso',
    usageNotes: isEn
      ? [
          'Minutes reflect the calculated average per active session.',
          'Data extracted from Cloud Firestore centralized sessions collection.',
        ]
      : [
          'Los minutos reflejan el promedio calculado por sesión activa.',
          'Datos extraídos de la colección centralizada de sesiones de Cloud Firestore.',
        ],
    accessCategory: isEn ? 'Administrative Module · Access Concurrency' : 'Módulo Administrativo · Concurrencia de Accesos',
    accessFileName: isEn ? 'Report_Daily_Accesses' : 'Reporte_Accesos_Diarios',
    accessNotes: isEn
      ? ['Chronological record of logins and sessions initiated on the platform.']
      : ['Registro cronológico de logins y sesiones iniciadas en la plataforma.'],
    demoCategory: isEn ? 'Administrative Module · Registered Population' : 'Módulo Administrativo · Población Registrada',
    demoFileName: isEn ? 'Report_User_Demographics' : 'Reporte_Demografia_Usuarios',
    demoNotes: isEn
      ? ['Segmented distribution based on registered user and patient profiles.']
      : ['Distribución segmentada a partir de los perfiles de usuario y pacientes registrados.'],
    geoCategory: isEn ? 'Administrative Module · Geographic Reach' : 'Módulo Administrativo · Alcance Geográfico',
    geoFileName: isEn ? 'Report_Geographic_Distribution' : 'Reporte_Distribucion_Geografica',
    geoNotes: isEn
      ? ['Location derived from addresses and cities reported in the user profile.']
      : ['Localización derivada de las direcciones y ciudades reportadas en la ficha de usuario.'],
    dauMauCategory: isEn ? 'Administrative Module · Product Metrics' : 'Módulo Administrativo · Métricas de Producto',
    dauMauFileName: isEn ? 'Report_Active_Users_DAU_MAU' : 'Reporte_Usuarios_Activos_DAU_MAU',
    dauMauNotes: (targetRatio: number) => isEn
      ? [
          'DAU represents unique active users per day.',
          'MAU represents unique active users in a 30-day window.',
          `The clinic standard adoption target (Stickiness) is ${targetRatio}%.`,
        ]
      : [
          'DAU representa los usuarios únicos activos por día.',
          'MAU representa los usuarios únicos activos en una ventana de 30 días.',
          `El objetivo estándar de adopción (Stickiness) de la clínica es del ${targetRatio}%.`,
        ],
    crashCategory: isEn ? 'Administrative Module · Quality and Stability' : 'Módulo Administrativo · Calidad y Estabilidad',
    crashFileName: isEn ? 'Report_Crash_Rate' : 'Reporte_Porcentaje_de_Fallos',
    crashNotes: isEn
      ? ['The crash rate evaluates the proportion of exceptions and unexpected terminations against total executed sessions.']
      : ['La tasa de fallos evalúa la proporción de excepciones y cierres inesperados frente a las sesiones totales ejecutadas.'],
    retentionCategory: isEn ? 'Administrative Module · Loyalty' : 'Módulo Administrativo · Fidelización',
    retentionFileName: isEn ? 'Report_User_Retention_Rate' : 'Reporte_Tasa_de_Retencion',
    retentionNotes: isEn
      ? ['Cohort analysis evaluating user return after their initial registration date.']
      : ['Análisis de cohortes temporales evaluando el retorno de usuarios tras su fecha de registro inicial.'],
  };

  return { terms, meta };
}

function buildDailySessionBuckets(
  sessions: SessionRecord[],
  days: number,
): Record<string, DailySessionBucket> {
  const now = new Date();
  const buckets: Record<string, DailySessionBucket> = {};

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

  return buckets;
}

function buildSessionActivityMetricsHtml(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): string {
  const isEn = snapshot.language === 'en';
  return ReportService.buildMetrics([
    {
      label: t('reports.totalAccessToday', isEn ? 'TOTAL ACCESSES (TODAY)' : 'TOTAL ACCESOS (HOY)'),
      value: snapshot.totalAccessToday ?? 0,
      variant: 'primary',
    },
    {
      label: t('reports.activeUsers', isEn ? 'ACTIVE USERS' : 'USUARIOS ACTIVOS'),
      value: snapshot.displayedActiveUsers ?? 0,
      variant: 'info',
    },
    {
      label: t('reports.reportTypeLabel', isEn ? 'PERIOD' : 'PERÍODO'),
      value: snapshot.periodLabel,
      variant: 'neutral',
    },
  ]);
}

interface CategoryDistributionItem {
  label: string;
  count: number;
  percent: number | string;
}

function buildCategoryDistributionTableHtml(
  firstColumnHeader: string,
  items: CategoryDistributionItem[],
  percentHeader = 'Porcentaje',
  usersHeader = 'Usuarios',
  language?: 'es' | 'en',
): string {
  return ReportService.buildTable({
    columns: [
      { header: firstColumnHeader, align: 'left', width: '50%' },
      { header: usersHeader, align: 'center', width: '25%' },
      { header: percentHeader, align: 'right', width: '25%' },
    ],
    rows: items.map((it) => [it.label, it.count, typeof it.percent === 'number' ? `${it.percent}%` : it.percent]),
    language,
  });
}

// -------------------------------------------------------------
// 1. REPORTE DE TIEMPO DE USO
// -------------------------------------------------------------
function buildUsageReportPdf(
  snapshot: AdminReportDataSnapshot,
  t: TranslateFunction,
): RenderReportOptions {
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const buckets = buildDailySessionBuckets(snapshot.sessions ?? [], snapshot.selectedPeriod);

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
    title: t('reports.chartTitleUsage', isEn ? 'Daily Usage Time' : 'Tiempo de Uso Diario'),
    subtitle: t('reports.minutes', isEn ? 'Average minutes per session' : 'Minutos promedio por sesión'),
    series: [
      {
        name: t('reports.timeAvg', isEn ? 'Average Time' : 'Tiempo Promedio'),
        color: '#5B2D8B',
        points: chartPoints,
        unit: 'min',
      },
    ],
    valueSuffix: ' min',
  });

  const metricsHtml = buildSessionActivityMetricsHtml(snapshot, t);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: terms.date, align: 'left', width: '40%' },
      { header: terms.accessesRecorded, align: 'center', width: '30%' },
      { header: terms.avgUsageTime, align: 'right', width: '30%' },
    ],
    rows: tableRows,
    language: snapshot.language,
  });

  return {
    metadata: {
      title: t('reports.chartTitleUsage', isEn ? 'Daily Usage Time' : 'Tiempo de Uso Diario'),
      fileName: meta.usageFileName,
      subtitle: `${t('reports.reportTypeUsage', isEn ? 'View usage time per user' : 'Visualizar tiempo de uso por usuario')} · ${snapshot.periodLabel}`,
      category: meta.usageCategory,
      badge: { label: snapshot.periodLabel, variant: 'primary' },
      showSignatureBlock: false,
      notes: meta.usageNotes,
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
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const buckets = buildDailySessionBuckets(snapshot.sessions ?? [], snapshot.selectedPeriod);

  const tableRows = Object.keys(buckets).map((key) => [buckets[key].dateStr, buckets[key].accesses]);

  const chartPoints = Object.keys(buckets).map((key) => ({
    label: buckets[key].dateStr.slice(5),
    value: buckets[key].accesses,
  }));

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.chartTitle', isEn ? 'Daily System Accesses' : 'Accesos Diarios al Sistema'),
    subtitle: t('reports.totalAccessToday', isEn ? 'Number of recorded accesses' : 'Número de accesos registrados'),
    series: [
      {
        name: t('reports.totalAccessToday', isEn ? 'Accesses' : 'Accesos'),
        color: '#8E59CF',
        points: chartPoints,
      },
    ],
  });

  const metricsHtml = buildSessionActivityMetricsHtml(snapshot, t);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: terms.date, align: 'left', width: '60%' },
      { header: terms.accessCount, align: 'center', width: '40%' },
    ],
    rows: tableRows,
    language: snapshot.language,
  });

  return {
    metadata: {
      title: t('reports.chartTitle', isEn ? 'Daily System Accesses' : 'Accesos Diarios al Sistema'),
      fileName: meta.accessFileName,
      subtitle: snapshot.periodLabel,
      category: meta.accessCategory,
      badge: { label: snapshot.periodLabel, variant: 'info' },
      showSignatureBlock: false,
      notes: meta.accessNotes,
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
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const m = snapshot.demographicsMetrics;
  const totalUsers = m?.totalUsers ?? 0;
  const avgAge = m?.averageAge !== null && m?.averageAge !== undefined ? `${m.averageAge} ${terms.years}` : '—';

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.kpiTotalUsers', isEn ? 'TOTAL USERS' : 'TOTAL USUARIOS'),
      value: totalUsers,
      variant: 'primary',
    },
    {
      label: t('reports.kpiAverageAge', isEn ? 'AVERAGE AGE' : 'EDAD PROMEDIO'),
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
    title: t('reports.ageChartTitle', isEn ? 'Visual Distribution by Age Range' : 'Distribución Visual por Rangos de Edad'),
    items: ageItems,
    orientation: 'horizontal',
  });

  const ageTableHtml = buildCategoryDistributionTableHtml(
    terms.ageRange,
    ageItems.map((item) => ({ label: item.label, count: item.value, percent: item.percentage })),
    terms.percentage,
    terms.users,
    snapshot.language,
  );

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
    title: t('reports.genderChartTitle', isEn ? 'Visual Distribution by Gender' : 'Distribución Visual por Género'),
    slices: genderSlices,
    centerValue: totalUsers,
    centerLabel: t('reports.totalUsers', isEn ? 'Total' : 'Total'),
  });

  const genderTableHtml = buildCategoryDistributionTableHtml(
    terms.gender,
    genderSlices.map((g) => ({ label: g.label, count: g.value, percent: g.percent })),
    terms.percentage,
    terms.users,
    snapshot.language,
  );

  return {
    metadata: {
      title: t('reports.reportTypeDemographics', isEn ? 'User Demographics' : 'Demografía de Usuarios'),
      fileName: meta.demoFileName,
      subtitle: `${t('reports.title', isEn ? 'Population Report' : 'Reporte Poblacional')} · ${snapshot.periodLabel}`,
      category: meta.demoCategory,
      badge: { label: `${totalUsers} ${terms.users}`, variant: 'primary' },
      showSignatureBlock: false,
      notes: meta.demoNotes,
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}<h3 style="margin: 16px 0 8px; color: #5B2D8B; font-size: 11pt;">${terms.ageDistribution}</h3>${ageChartHtml}${ageTableHtml}<h3 style="margin: 20px 0 8px; color: #5B2D8B; font-size: 11pt;">${terms.genderDistribution}</h3>${genderChartHtml}${genderTableHtml}`,
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
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const g = snapshot.geographicsMetrics;
  const totalCities = g?.totalCities ?? 0;
  const totalUsers = g?.totalUsers ?? 0;
  const mainCountry = g?.mainCountry ?? 'N/A';
  const mainPercent = g?.mainCountryPercent ?? 0;

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.kpiCities', isEn ? 'CITIES' : 'CIUDADES'),
      value: totalCities,
      variant: 'primary',
    },
    {
      label: t('reports.kpiPrincipal', isEn ? 'MAIN COUNTRY' : 'PAÍS PRINCIPAL'),
      value: mainCountry,
      hint: `${mainPercent}% ${isEn ? 'of total' : 'del total'}`,
      variant: 'info',
    },
    {
      label: t('reports.kpiTotalUsers', isEn ? 'TOTAL USERS' : 'TOTAL USUARIOS'),
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
    title: t('reports.chartTopCountries', isEn ? 'Visual Distribution by Countries' : 'Distribución Visual por Países'),
    items: countryItems,
    orientation: 'horizontal',
  });

  const countryTableHtml = buildCategoryDistributionTableHtml(
    terms.country,
    countryItems.map((c) => ({ label: c.label, count: c.value, percent: c.percentage })),
    terms.share,
    terms.users,
    snapshot.language,
  );

  const regionPalette = ['#5B2D8B', '#8E59CF', '#B39DDB', '#D4C4E8', '#EDE4F5'];
  const regionSlices = (g?.regionSlices ?? []).map((r, i) => ({
    label: r.label,
    value: r.count,
    percent: r.percent,
    color: regionPalette[i % regionPalette.length],
  }));

  const regionChartHtml = ReportService.buildDonutChart({
    title: t('reports.chartRegions', isEn ? 'Visual Distribution by Region' : 'Distribución Visual por Región'),
    slices: regionSlices,
    centerValue: totalUsers,
    centerLabel: t('reports.totalUsers', isEn ? 'Total' : 'Total'),
  });

  const regionTableHtml = buildCategoryDistributionTableHtml(
    terms.region,
    regionSlices.map((r) => ({ label: r.label, count: r.value, percent: r.percent })),
    terms.percentage,
    terms.users,
    snapshot.language,
  );

  return {
    metadata: {
      title: t('reports.reportTypeGeographics', isEn ? 'Geographic Distribution' : 'Distribución Geográfica'),
      fileName: meta.geoFileName,
      subtitle: `${t('reports.title', isEn ? 'Geographic Presence' : 'Presencia Geográfica')} · ${snapshot.periodLabel}`,
      category: meta.geoCategory,
      badge: { label: `${totalCities} ${terms.cities}`, variant: 'primary' },
      showSignatureBlock: false,
      notes: meta.geoNotes,
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}<h3 style="margin: 16px 0 8px; color: #5B2D8B; font-size: 11pt;">${terms.countryDistribution}</h3>${countryChartHtml}${countryTableHtml}<h3 style="margin: 20px 0 8px; color: #5B2D8B; font-size: 11pt;">${terms.regionDistribution}</h3>${regionChartHtml}${regionTableHtml}`,
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
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const dauValue = snapshot.dauValue ?? 0;
  const mauValue = snapshot.mauValue ?? 0;
  const dauMauRatio = snapshot.dauMauRatio ?? calculateDauMauRatio(dauValue, mauValue);
  const dataPoints = snapshot.dauMauData ?? [];

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.kpiRatio', 'RATIO DAU/MAU'),
      value: `${dauMauRatio}%`,
      hint: `${isEn ? 'Target' : 'Meta'}: ${DAU_MAU_TARGET_RATIO}%`,
      variant: 'primary',
    },
    {
      label: t('reports.kpiDau', isEn ? 'DAU (DAILY)' : 'DAU (DIARIOS)'),
      value: dauValue,
      hint: t('reports.kpiDailyAvg', isEn ? 'Daily avg.' : 'Prom. diario'),
      variant: 'info',
    },
    {
      label: t('reports.kpiMau', isEn ? 'MAU (MONTHLY)' : 'MAU (MENSUALES)'),
      value: mauValue,
      hint: t('reports.kpiThisMonth', isEn ? 'This month' : 'Este mes'),
      variant: 'neutral',
    },
  ]);

  const dauPoints = dataPoints.map((pt) => ({ label: pt.label, value: pt.dau }));
  const mauPoints = dataPoints.map((pt) => ({ label: pt.label, value: pt.mau }));

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.dauMauChartTitle', isEn ? 'Active Users Trend (DAU vs MAU)' : 'Evolución de Usuarios Activos (DAU vs MAU)'),
    subtitle: t(
      'reports.adoptionRatio',
      isEn
        ? `Current ratio: ${dauMauRatio}% · Target: ${DAU_MAU_TARGET_RATIO}%`
        : `Ratio actual: ${dauMauRatio}% · Objetivo: ${DAU_MAU_TARGET_RATIO}%`,
    ),
    series: [
      { name: terms.mauMonthly, color: '#0284C7', points: mauPoints },
      { name: terms.dauDaily, color: '#5B2D8B', points: dauPoints },
    ],
  });

  const rows = dataPoints.map((pt) => {
    const ratio = pt.mau > 0 ? `${Math.round((pt.dau / pt.mau) * 100)}%` : '0%';
    return [pt.label, pt.dau, pt.mau, ratio];
  });

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: terms.month, align: 'left', width: '25%' },
      { header: terms.dauDaily, align: 'center', width: '25%' },
      { header: terms.mauMonthly, align: 'center', width: '25%' },
      { header: terms.adoptionRatio, align: 'right', width: '25%' },
    ],
    rows,
    language: snapshot.language,
  });

  return {
    metadata: {
      title: t('reports.reportTypeDauMau', isEn ? 'Daily vs Monthly Active Users (DAU/MAU)' : 'Usuarios Activos Diarios vs Mensuales (DAU/MAU)'),
      fileName: meta.dauMauFileName,
      subtitle: `${t('reports.dauMauChartTitle', isEn ? 'Adoption and Usage Frequency' : 'Adopción y Frecuencia de Uso')} · ${snapshot.periodLabel}`,
      category: meta.dauMauCategory,
      badge: { label: `Ratio: ${dauMauRatio}%`, variant: 'primary' },
      showSignatureBlock: false,
      notes: meta.dauMauNotes(DAU_MAU_TARGET_RATIO),
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
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const crashRateStr = snapshot.calculatedCrashRateString ?? '0.00%';
  const totalCrashes = snapshot.totalCrashesValue ?? 0;
  const affectedUsers = snapshot.affectedUsersValue ?? 0;
  const dataPoints = snapshot.crashRateData ?? [];

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.crashRateToday', isEn ? 'CRASH RATE' : 'TASA DE FALLAS'),
      value: crashRateStr,
      variant: 'warning',
    },
    {
      label: t('reports.totalCrashesToday', isEn ? 'TOTAL CRASHES' : 'TOTAL DE FALLAS'),
      value: totalCrashes,
      variant: 'primary',
    },
    {
      label: t('reports.affectedUsers', isEn ? 'AFFECTED USERS' : 'USUARIOS AFECTADOS'),
      value: affectedUsers,
      variant: 'neutral',
    },
  ]);

  const points = dataPoints.map((pt) => ({
    label: pt.date ? pt.date.slice(5) : pt.label,
    value: pt.value,
  }));

  const chartHtml = ReportService.buildSvgLineChart({
    title: t('reports.chartTitleCrashRate', isEn ? 'Stability Trend and Crash Rate' : 'Tendencia de Estabilidad y Tasa de Fallos'),
    subtitle: t('reports.crashRate', isEn ? 'Percentage of daily crashes per session' : 'Porcentaje de fallos diarios por sesión'),
    series: [
      {
        name: t('reports.crashRate', isEn ? 'Crash Rate' : 'Tasa de Fallos'),
        color: '#D97706',
        points,
      },
    ],
    valueSuffix: '%',
    targetLine: { value: 1.0, label: isEn ? 'Threshold 1.0%' : 'Umbral 1.0%', color: '#DC2626' },
  });

  const rows = dataPoints.map((pt) => [pt.date || pt.label, `${pt.value.toFixed(2)}%`]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: terms.date, align: 'left', width: '60%' },
      { header: terms.crashRatePercent, align: 'center', width: '40%' },
    ],
    rows,
    language: snapshot.language,
  });

  return {
    metadata: {
      title: t('reports.reportTypeCrashRate', isEn ? 'Crash Rate Percentage' : 'Porcentaje de Fallos'),
      fileName: meta.crashFileName,
      subtitle: `${t('reports.chartTitleCrashRate', isEn ? 'System Stability' : 'Estabilidad del Sistema')} · ${snapshot.periodLabel}`,
      category: meta.crashCategory,
      badge: { label: crashRateStr, variant: 'warning' },
      showSignatureBlock: false,
      notes: meta.crashNotes,
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
  const isEn = snapshot.language === 'en';
  const { terms, meta } = getReportI18nContext(isEn);
  const day1 = snapshot.day1String ?? '0%';
  const day7 = snapshot.day7String ?? '0%';
  const day30 = snapshot.day30String ?? '0%';
  const dataPoints = snapshot.retentionData ?? [];

  const metricsHtml = ReportService.buildMetrics([
    {
      label: t('reports.retentionKpiDay1', isEn ? 'DAY 1 RETENTION' : 'RETENCIÓN DÍA 1'),
      value: day1,
      hint: t('reports.retentionDay1Sub', isEn ? '24 hours' : '24 horas'),
      variant: 'primary',
    },
    {
      label: t('reports.retentionKpiDay7', isEn ? 'DAY 7 RETENTION' : 'RETENCIÓN DÍA 7'),
      value: day7,
      hint: t('reports.retentionDay7Sub', isEn ? '7 days' : '7 días'),
      variant: 'info',
    },
    {
      label: t('reports.retentionKpiDay30', isEn ? 'DAY 30 RETENTION' : 'RETENCIÓN DÍA 30'),
      value: day30,
      hint: t('reports.retentionDay30Sub', isEn ? '30 days' : '30 días'),
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
    title: t('reports.chartTitleRetentionRate', isEn ? 'Cohort Retention Curve' : 'Curva de Retención de Cohortes'),
    subtitle: t('reports.retentionRate', isEn ? 'Retention percentage D1, D7 and D30' : 'Porcentaje de retención D1, D7 y D30'),
    items: retentionItems,
    orientation: 'vertical',
  });

  const rows = dataPoints.map((d) => [d.cohort, d.label, `${d.percentage}%`]);

  const tableHtml = ReportService.buildTable({
    columns: [
      { header: terms.retentionCohort, align: 'left', width: '40%' },
      { header: terms.identifier, align: 'center', width: '30%' },
      { header: terms.retainedPercentage, align: 'right', width: '30%' },
    ],
    rows,
    language: snapshot.language,
  });

  return {
    metadata: {
      title: t('reports.reportTypeRetentionRate', isEn ? 'User Retention Rate' : 'Tasa de Retención de Usuarios'),
      fileName: meta.retentionFileName,
      subtitle: `${t('reports.chartTitleRetentionRate', isEn ? 'Cohort Analysis' : 'Análisis de Cohortes')} · ${snapshot.periodLabel}`,
      category: meta.retentionCategory,
      badge: { label: `D1: ${day1} | D7: ${day7}`, variant: 'info' },
      showSignatureBlock: false,
      notes: meta.retentionNotes,
      language: snapshot.language,
    },
    contentHtml: `${metricsHtml}${chartHtml}${tableHtml}`,
    language: snapshot.language,
  };
}

