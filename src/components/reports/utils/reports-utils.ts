// Cálculos matemáticos y manejo de fechas
import { ModalOptionProp } from '@/components/ui/modal-option-list';
import { ChartDataPoint } from '@/components/reports/usage-line-chart';
import { DauMauDataPoint } from '@/components/reports/dau-mau-line-chart';
import {
  AGE_BUCKET_ORDER,
  AgeBucketKey,
  AVAILABLE_PERIODS,
  GenderBucket,
  HourlySlot,
  PeakHoursDistribution,
  SessionRecord,
  UserDemographicsMetrics,
  UserDemographicsRecord,
  UserGeographicsMetrics,
  RetentionDataPoint,
} from '../types';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export function generatePeriodOptions(t: (key: string) => string): ModalOptionProp[] {
    return AVAILABLE_PERIODS.map((days) => ({
        name: days,
        testID: `period-option-${days}`,
        label: t(`reports.period${days}Days`),
    }));
}

// Calcula la relación porcentual entre DAU y MAU (Stickiness).
// Protege la division entre 0.
export function calculateDauMauRatio(dau: number, mau: number): number {
    return mau > 0 ? Math.round((dau / mau) * 100) : 0;
}

export function calculateCrashRatePercentage(totalCrashes: number, totalSessions: number): string {
    if (!totalSessions || totalSessions === 0 || !totalCrashes || totalCrashes === 0) {
        return '0.00%'; // returns 0.00% if 0 crashes (scenario 3)
    }
    const rate = (totalCrashes / totalSessions) * 100;
    return `${rate.toFixed(2)}%`;
}

export function formatRetentionPercentage(value: number | undefined | null): string {
    if (value === undefined || value === null || Number.isNaN(value) || value < 0) {
        return '0%';
    }
    const cleanNum = Number(value);
    return Number.isInteger(cleanNum) ? `${cleanNum}%` : `${cleanNum.toFixed(1)}%`;
}

export function parseRetentionData(
    docData: any,
    t: (key: string) => string
): { cohort: string; label: string; percentage: number }[] {
    const rawDia1 = docData?.dia1 ?? docData?.day1;
    const rawDia7 = docData?.dia7 ?? docData?.day7;
    const rawDia30 = docData?.dia30 ?? docData?.day30;

    const dia1 = typeof rawDia1 === 'number' && !Number.isNaN(rawDia1) && rawDia1 >= 0 ? rawDia1 : 0;
    const dia7 = typeof rawDia7 === 'number' && !Number.isNaN(rawDia7) && rawDia7 >= 0 ? rawDia7 : 0;
    const dia30 = typeof rawDia30 === 'number' && !Number.isNaN(rawDia30) && rawDia30 >= 0 ? rawDia30 : 0;

    return [
        { cohort: t('reports.retentionDay1') || 'Día 1', label: 'D1', percentage: dia1 },
        { cohort: t('reports.retentionDay7') || 'Día 7', label: 'D7', percentage: dia7 },
        { cohort: t('reports.retentionDay30') || 'Día 30', label: 'D30', percentage: dia30 },
    ];
}

// Helper to extract timestamp millis from varied date formats
export const getRecordTimestamp = (record: SessionRecord): number | null => {
    const raw = record.fecha ?? record.tiempoInicio;
    if (!raw) return null;
    if (typeof raw === 'number') return raw;
    if (raw instanceof Date) return raw.getTime();
    if (typeof raw?.toMillis === 'function') return raw.toMillis();
    if (typeof raw?.toDate === 'function') return raw.toDate().getTime();
    const parsed = Date.parse(raw);
    return Number.isNaN(parsed) ? null : parsed;
};

function parseSessionBoundary(val: unknown): number | null {
    if (!val) return null;
    const value = val as { toMillis?: () => number };
    if (typeof value?.toMillis === 'function') {
        return value.toMillis();
    }
    return new Date(val as string | number | Date).getTime();
}

// Helper to extract duration in minutes
export const getRecordDurationMinutes = (record: SessionRecord): number => {
    if (typeof record.tiempoUso === 'number') return record.tiempoUso;
    if (typeof record.duracion === 'number') {
        // If duration > 300, it's likely in seconds
        return record.duracion > 300 ? Math.round(record.duracion / 60) : record.duracion;
    }
    const start = parseSessionBoundary(record.tiempoInicio);
    const end = parseSessionBoundary(record.tiempoFin);

    if (start && end && end > start) {
        return Math.round((end - start) / 60000);
    }
    return 0;
};

// Helper to Build history lookup map from raw array
export const buildHistoryMap = (historico: any[]): Map<string, number> => {
    const historyMap = new Map<string, number>();
    for (const item of historico) {
        const rawVal = typeof item.value === 'number' ? item.value : (Number(item.tasa) || 0);
        const key = item.date || item.fecha || item.label;
        if (key) {
            historyMap.set(String(key), rawVal);
        }
    }
    return historyMap;
};

// Helper to Generate padded time-series chart data
export const generatePaddedChartData = (historyMap: Map<string, number>, periodDays: number): ChartDataPoint[] => {
    const paddedData: ChartDataPoint[] = [];
    const now = new Date();
    for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayNumLabel = String(d.getDate());
        const matchedValue = historyMap.get(dateKey) ?? historyMap.get(dayNumLabel) ?? 0.0;
        paddedData.push({
            label: dayNumLabel,
            value: matchedValue,
            date: dateKey,
        });
    }
    return paddedData;
};

function parseFirestoreTimestampObject(raw: object): number | null {
    const value = raw as { toMillis?: () => number; toDate?: () => Date; seconds?: number };
    if (typeof value.toMillis === 'function') {
        return value.toMillis();
    }
    if (typeof value.toDate === 'function') {
        const date = value.toDate();
        return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
    }
    if (typeof value.seconds === 'number') {
        return value.seconds * 1000;
    }
    return null;
}

function parseStringTimestamp(raw: string): number | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (dmy) {
        const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
        return Number.isNaN(date.getTime()) ? null : date.getTime();
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
}

export function parseFlexibleTimestamp(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (raw instanceof Date) {
        const time = raw.getTime();
        return Number.isNaN(time) ? null : time;
    }
    if (typeof raw === 'object') {
        return parseFirestoreTimestampObject(raw);
    }
    if (typeof raw === 'string') {
        return parseStringTimestamp(raw);
    }
    return null;
}

function calculateAgeFromBirthDate(birth: Date, now: Date): number | null {
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age -= 1;
    }
    if (age < 0 || age > 129) return null;
    return age;
}

export function parseUserAge(user: UserDemographicsRecord, now: Date = new Date()): number | null {
    const numeric = user.edad ?? user.age;
    if (typeof numeric === 'number' && Number.isFinite(numeric) && numeric > 0 && numeric < 130) {
        return Math.round(numeric);
    }
    if (typeof numeric === 'string' && numeric.trim()) {
        const parsed = Number(numeric);
        if (Number.isFinite(parsed) && parsed > 0 && parsed < 130) {
            return Math.round(parsed);
        }
    }

    const birthMs = parseFlexibleTimestamp(
        user.fechaNacimiento ?? user.birthDate ?? user.fecha_nacimiento,
    );
    if (birthMs === null) return null;

    return calculateAgeFromBirthDate(new Date(birthMs), now);
}

export function normalizeUserGender(user: UserDemographicsRecord): GenderBucket {
    const raw = String(user.genero ?? user.gender ?? user.sexo ?? '')
        .trim()
        .toLowerCase();
    if (!raw) return 'unspecified';
    if (['female', 'femenino', 'f', 'mujer', 'woman'].includes(raw)) return 'female';
    if (['male', 'masculino', 'hombre', 'man', 'h'].includes(raw)) return 'male';
    return 'unspecified';
}

export function getAgeBucketKey(age: number | null): AgeBucketKey {
    if (age == null || age < 18) return 'unspecified';
    if (age <= 25) return '18_25';
    if (age <= 35) return '26_35';
    if (age <= 50) return '36_50';
    return '50_plus';
}

export function aggregateUserDemographics(
    users: UserDemographicsRecord[],
    now: Date = new Date(),
): UserDemographicsMetrics {
    const ageCounts: Record<AgeBucketKey, number> = {
        '18_25': 0,
        '26_35': 0,
        '36_50': 0,
        '50_plus': 0,
        unspecified: 0,
    };
    const genderCounts: Record<GenderBucket, number> = {
        female: 0,
        male: 0,
        unspecified: 0,
    };

    let ageSum = 0;
    let knownAges = 0;

    users.forEach((user) => {
        const age = parseUserAge(user, now);
        if (age != null) {
            ageSum += age;
            knownAges += 1;
        }
        ageCounts[getAgeBucketKey(age)] += 1;
        genderCounts[normalizeUserGender(user)] += 1;
    });

    const totalUsers = users.length;
    const genderSlices = (['female', 'male', 'unspecified'] as GenderBucket[]).map((key, index, keys) => {
        const count = genderCounts[key];
        if (totalUsers === 0) return { key, count, percent: 0 };
        if (index < keys.length - 1) {
            return { key, count, percent: Math.round((count / totalUsers) * 100) };
        }
        const assigned = keys.slice(0, -1).reduce((sum, current) => {
            return sum + Math.round((genderCounts[current] / totalUsers) * 100);
        }, 0);
        return { key, count, percent: Math.max(0, 100 - assigned) };
    });

    return {
        totalUsers,
        averageAge: knownAges > 0 ? Math.round(ageSum / knownAges) : null,
        ageBuckets: AGE_BUCKET_ORDER.map((key) => ({ key, count: ageCounts[key] })),
        genderSlices,
    };
}

function padClock(value: number): string {
    return String(value).padStart(2, '0');
}

export function formatHourlyRangeLabel(hour: number): string {
    const start = padClock(hour);
    const end = padClock((hour + 1) % 24);
    return `${start}:00 - ${end}:00`;
}

export function readSessionStartMillis(record: SessionRecord): number | null {
    const fromStart = parseFlexibleTimestamp(record.tiempoInicio);
    if (fromStart !== null) return fromStart;
    return parseFlexibleTimestamp(record.fecha);
}

export function formatSessionDayKey(millis: number): string {
    const date = new Date(millis);
    const month = padClock(date.getMonth() + 1);
    const day = padClock(date.getDate());
    return `${date.getFullYear()}-${month}-${day}`;
}

export function formatDayKeyLabel(dayKey: string): string {
    const [year, month, day] = dayKey.split('-');
    if (!year || !month || !day) return dayKey;
    return `${day}/${month}/${year}`;
}

export function listSessionDayKeys(sessions: SessionRecord[]): string[] {
    const keys = new Set<string>();
    sessions.forEach((session) => {
        const millis = readSessionStartMillis(session);
        if (millis === null) return;
        keys.add(formatSessionDayKey(millis));
    });
    return [...keys].sort((left, right) => left.localeCompare(right));
}

export function filterSessionsByDay(sessions: SessionRecord[], dayKey: string | null): SessionRecord[] {
    if (!dayKey) return sessions;
    return sessions.filter((session) => {
        const millis = readSessionStartMillis(session);
        if (millis === null) return false;
        return formatSessionDayKey(millis) === dayKey;
    });
}

function percentageOf(count: number, total: number): number {
    if (total <= 0) return 0;
    return Math.round((count * 1000) / total) / 10;
}

function buildDistribution(counts: number[], hours: number[]): PeakHoursDistribution {
    const total = counts.reduce((sum, count) => sum + count, 0);
    const maxCount = Math.max(...counts, 0);
    const slots: HourlySlot[] = counts.map((count, index) => ({
        hour: hours[index],
        label: formatHourlyRangeLabel(hours[index]),
        count,
        percentage: percentageOf(count, total),
    }));
    const peaks = maxCount > 0 ? slots.filter((slot) => slot.count === maxCount) : [];
    return {
        slots,
        total,
        peaks,
        isBimodal: peaks.length > 1,
        isEmpty: total === 0,
    };
}

export type HourWindow = 4 | 12 | 24;

export function calculatePeakHoursDistribution(
    sessions: SessionRecord[],
    windowHours?: HourWindow,
    now: Date = new Date(),
): PeakHoursDistribution {
    if (!windowHours) {
        const counts = Array.from({ length: 24 }, () => 0);
        sessions.forEach((session) => {
            const millis = readSessionStartMillis(session);
            if (millis === null) return;
            counts[new Date(millis).getHours()] += 1;
        });
        return buildDistribution(counts, counts.map((_, hour) => hour));
    }

    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() - (windowHours - 1));
    const startMs = start.getTime();
    const counts = Array.from({ length: windowHours }, () => 0);
    const hours = Array.from({ length: windowHours }, (_, index) => {
        const slot = new Date(start);
        slot.setHours(start.getHours() + index);
        return slot.getHours();
    });

    sessions.forEach((session) => {
        const millis = readSessionStartMillis(session);
        if (millis === null || millis < startMs || millis > now.getTime()) return;
        const index = Math.floor((millis - startMs) / 3600000);
        if (index >= 0 && index < windowHours) counts[index] += 1;
    });

    return buildDistribution(counts, hours);
}

// export csv data

export interface CsvDataRow {
  fecha: string;
  valor: number | string;
  unidad: string;
  metrica: string;
}

export const formatDateToIsoString = (dateVal: any): string => {
  if (!dateVal) return 'N/A';

  if (typeof dateVal === 'object' && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().toISOString().split('T')[0];
  }
  if (typeof dateVal === 'object' && typeof dateVal.seconds === 'number') {
    return new Date(dateVal.seconds * 1000).toISOString().split('T')[0];
  }

  if (dateVal instanceof Date) {
    return dateVal.toISOString().split('T')[0];
  }

  if (typeof dateVal === 'number') {
    return new Date(dateVal).toISOString().split('T')[0];
  }

  if (typeof dateVal === 'string') {
    if (dateVal.startsWith('Timestamp')) return 'N/A';
    return dateVal.split('T')[0];
  }

  return 'N/A';
};

export const mapSessionsToCsvRows = (
  sessions: SessionRecord[],
  reportTypeLabel: string
): CsvDataRow[] => {
  return sessions.map((s: any) => {
    const rawDate = s.fecha || s.date || s.timestamp || s.createdAt;
    return {
      fecha: formatDateToIsoString(rawDate),
      valor: s.tiempoUso ?? s.durationMinutes ?? 0,
      unidad: 'minutos',
      metrica: reportTypeLabel,
    };
  });
};

export const mapDauMauToCsvRows = (dauMauData: DauMauDataPoint[]): CsvDataRow[] => {
  return dauMauData.flatMap((item) => [
    { fecha: item.label, valor: item.dau, unidad: 'usuarios', metrica: 'DAU' },
    { fecha: item.label, valor: item.mau, unidad: 'usuarios', metrica: 'MAU' },
  ]);
};

export const mapDemographicsToCsvRows = (demographics: UserDemographicsMetrics): CsvDataRow[] => {
  const rows: CsvDataRow[] = [];

  // 1. Mapear rangos de edad (ageBuckets)
  if (Array.isArray(demographics.ageBuckets)) {
    demographics.ageBuckets.forEach((bucket) => {
      rows.push({
        fecha: 'N/A',
        valor: bucket.count ?? 0,
        unidad: 'usuarios',
        metrica: `Rango de edad: ${bucket.key}`,
      });
    });
  }

  // 2. Mapear distribución por género (genderSlices)
  if (Array.isArray(demographics.genderSlices)) {
    demographics.genderSlices.forEach((slice) => {
      rows.push({
        fecha: 'N/A',
        valor: slice.count ?? 0,
        unidad: 'usuarios',
        metrica: `Género: ${slice.key} (${slice.percent ?? 0}%)`,
      });
    });
  }

  // 3. Incluir promedio de edad si existe
  if (demographics.averageAge !== null && demographics.averageAge !== undefined) {
    rows.push({
      fecha: 'N/A',
      valor: demographics.averageAge,
      unidad: 'años',
      metrica: 'Promedio de edad',
    });
  }

  return rows;
};

// Geographics Mapper (City / Region distribution)
export const mapGeographicsToCsvRows = (geographics: UserGeographicsMetrics): CsvDataRow[] => {
  const rows: CsvDataRow[] = [];

  // Map Country Buckets
  if (Array.isArray(geographics.countryBuckets)) {
    geographics.countryBuckets.forEach((bucket) => {
      rows.push({
        fecha: 'N/A',
        valor: bucket.count ?? bucket.count ?? 0,
        unidad: 'usuarios',
        metrica: `País: ${bucket.key || bucket.label || 'Desconocido'}`,
      });
    });
  }

  // Map Region Slices
  if (Array.isArray(geographics.regionSlices)) {
    geographics.regionSlices.forEach((slice) => {
      rows.push({
        fecha: 'N/A',
        valor: slice.count ?? slice.percent ?? 0,
        unidad: 'usuarios',
        metrica: `Región: ${slice.key || slice.label || 'Desconocida'}`,
      });
    });
  }

  return rows;
};

export const mapRetentionToCsvRows = (retentionData: RetentionDataPoint[]): CsvDataRow[] => {
  return retentionData.map((item) => ({
    fecha: item.cohort || 'N/A',
    valor: item.percentage,
    unidad: 'porcentaje',
    metrica: `Retención (${item.label})`,
  }));
};

export const sanitizeCsvCell = (value: string | number): string => {
  const str = String(value ?? '').trim();
  if (/^[=+\-@]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

export const formatChartDataToCsv = (
  data: CsvDataRow[],
  periodLabel: string,
  reportType: string
): string => {
  const headers = ['Fecha', 'Valor', 'Unidad', 'Metrica'];
  const headerRow = headers.map(sanitizeCsvCell).join(',');

  const rows = data.map((item) => {
    return [
      sanitizeCsvCell(item.fecha),
      sanitizeCsvCell(item.valor),
      sanitizeCsvCell(item.unidad),
      sanitizeCsvCell(item.metrica),
    ].join(',');
  });

  return ['\uFEFF' + headerRow, ...rows].join('\n');
};

export const exportChartDataToCsv = async (
  data: CsvDataRow[],
  periodLabel: string,
  reportType: string
): Promise<boolean> => {
  try {
    const sanitizedReportType = reportType.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const sanitizedPeriod = periodLabel.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const today = new Date().toISOString().split('T')[0];
    
    // Append timestamp or random suffix to guarantee unique filenames
    const fileName = `reporte_${sanitizedReportType}_${sanitizedPeriod}_${today}_${Date.now()}.csv`;

    const csvContent = formatChartDataToCsv(data, periodLabel, reportType);
    const file = new File(Paths.cache, fileName);

    // If file exists, delete it first to prevent the 'already exists' exception
    if (file.exists) {
      file.delete();
    }

    file.create();
    file.write(csvContent);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar CSV',
        UTI: 'public.comma-separated-values-text',
      });
    }

    return true;
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    throw error;
  }
};