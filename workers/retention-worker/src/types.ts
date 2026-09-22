export interface RetentionResponse {
  status: 'success' | 'error';
  dia1: number;
  dia7: number;
  dia30: number;
  day1: number;
  day7: number;
  day30: number;
  overallRetentionRate: number;
  totalCohortUsers: number;
  calculatedAt: string;
  source?: 'firestore-live' | 'computed-cohort' | 'cached-metrics';
  breakdown?: {
    day1Eligible: number;
    day1Returned: number;
    day7Eligible: number;
    day7Returned: number;
    day30Eligible: number;
    day30Returned: number;
  };
  message?: string;
  error?: string;
}

export interface Env {
  ENVIRONMENT?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_API_KEY?: string;
  DENTAL_API_KEY?: string;
}

export interface UserEntity {
  id: string;
  createdAt: number; // millis
  estado?: string;
}

export interface SessionEntity {
  id: string;
  userId: string;
  timestamp: number; // millis
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}
