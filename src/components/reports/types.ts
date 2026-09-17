// Tipos e interfaces
export interface SessionRecord {
  id: string;
  userId?: string;
  usuarioId?: string;
  uid?: string;
  fecha?: any;
  tiempoInicio?: any;
  tiempoFin?: any;
  duracion?: number; // in minutes or seconds
  tiempoUso?: number; // in minutes
}

export type PeriodOption = 7 | 15 | 30;
export const AVAILABLE_PERIODS: PeriodOption[] = [7, 15, 30];

export const DAU_MAU_TARGET_RATIO = 50;
export const CRASH_RATE_TOLERANCE_LIMIT = 0.1;

export type ReportType = 'usage' | 'access' | 'dau_mau' | 'crash_rate' | 'retention_rate';

export interface RetentionDataPoint {
  cohort: string;
  label: string;
  percentage: number;
}

export interface RetentionMetricsDoc {
  dia1?: number;
  dia7?: number;
  dia30?: number;
  day1?: number;
  day7?: number;
  day30?: number;
  totalUsuariosCohorte?: number;
  actualizadoEn?: any;
}