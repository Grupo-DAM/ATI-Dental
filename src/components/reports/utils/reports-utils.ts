// Cálculos matemáticos y manejo de fechas
import { ModalOptionProp } from '@/components/ui/modal-option-list';
import { ChartDataPoint } from '@/components/reports/usage-line-chart';
import {
  AGE_BUCKET_ORDER,
  AgeBucketKey,
  AVAILABLE_PERIODS,
  GenderBucket,
  SessionRecord,
  UserDemographicsMetrics,
  UserDemographicsRecord,
} from '../types';

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

export function parseFlexibleTimestamp(raw: unknown): number | null {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (raw instanceof Date) {
        const time = raw.getTime();
        return Number.isNaN(time) ? null : time;
    }
    if (typeof raw === 'object') {
        const value = raw as { toMillis?: () => number; toDate?: () => Date; seconds?: number };
        if (typeof value.toMillis === 'function') return value.toMillis();
        if (typeof value.toDate === 'function') {
            const date = value.toDate();
            return date instanceof Date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
        }
        if (typeof value.seconds === 'number') return value.seconds * 1000;
    }
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
        if (dmy) {
            const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
            return Number.isNaN(date.getTime()) ? null : date.getTime();
        }
        const parsed = Date.parse(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
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