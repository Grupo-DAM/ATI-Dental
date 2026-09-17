// Cálculos matemáticos y manejo de fechas
import { ModalOptionList, ModalOptionProp } from '@/components/ui/modal-option-list';
import { ChartDataPoint } from '@/components/reports/usage-line-chart';
import { AVAILABLE_PERIODS, PeriodOption, SessionRecord } from '../types';

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
    if (value === undefined || value === null || isNaN(value) || value < 0) {
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

    const dia1 = typeof rawDia1 === 'number' && !isNaN(rawDia1) && rawDia1 >= 0 ? rawDia1 : 0;
    const dia7 = typeof rawDia7 === 'number' && !isNaN(rawDia7) && rawDia7 >= 0 ? rawDia7 : 0;
    const dia30 = typeof rawDia30 === 'number' && !isNaN(rawDia30) && rawDia30 >= 0 ? rawDia30 : 0;

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
    return isNaN(parsed) ? null : parsed;
};

// Helper to extract duration in minutes
export const getRecordDurationMinutes = (record: SessionRecord): number => {
    if (typeof record.tiempoUso === 'number') return record.tiempoUso;
    if (typeof record.duracion === 'number') {
        // If duration > 300, it's likely in seconds
        return record.duracion > 300 ? Math.round(record.duracion / 60) : record.duracion;
    }
    const start = record.tiempoInicio
        ? typeof record.tiempoInicio?.toMillis === 'function'
        ? record.tiempoInicio.toMillis()
        : new Date(record.tiempoInicio).getTime()
        : null;
    const end = record.tiempoFin
        ? typeof record.tiempoFin?.toMillis === 'function'
        ? record.tiempoFin.toMillis()
        : new Date(record.tiempoFin).getTime()
        : null;

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