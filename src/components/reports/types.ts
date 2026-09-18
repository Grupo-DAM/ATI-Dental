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

export type ReportType = 'usage' | 'access' | 'dau_mau' | 'crash_rate' | 'retention_rate' | 'demographics';

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

export type GenderBucket = 'female' | 'male' | 'unspecified';
export type AgeBucketKey = '18_25' | '26_35' | '36_50' | '50_plus' | 'unspecified';

export const AGE_BUCKET_ORDER: AgeBucketKey[] = ['18_25', '26_35', '36_50', '50_plus', 'unspecified'];

export interface UserDemographicsRecord {
  id: string;
  genero?: string;
  gender?: string;
  sexo?: string;
  fechaNacimiento?: unknown;
  birthDate?: unknown;
  fecha_nacimiento?: unknown;
  edad?: number | string;
  age?: number | string;
}

export interface AgeBucket {
  key: AgeBucketKey;
  count: number;
}

export interface GenderSlice {
  key: GenderBucket;
  count: number;
  percent: number;
}

export interface UserDemographicsMetrics {
  totalUsers: number;
  averageAge: number | null;
  ageBuckets: AgeBucket[];
  genderSlices: GenderSlice[];
}