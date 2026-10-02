import { Patient } from '@/services/patient-service';
import { Treatment } from '@/services/treatment-service';

export interface Consultation {
  id: string;
  patientId: string;
  consultationDate: string;
  title: string;
  motivo: string;
  diagnostico: string;
  diagnosticoDetallado?: string[];
  proximaCita?: string;
  doctor: string;
  duration?: string;
  tratamientosRealizados?: string;
  notas?: string;
  createdAt?: any;
}

// Ojo, aparentemente estados unidos usa otro sistema de numeracion pero vamos a ignorarlo
export type AdultToothNumber = 

  | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 // assets del 21 al 28 
  | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 // 
  | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38
  | 41 | 42 | 43 | 44 | 45 | 46 | 47 | 48;

export type PediatricToothNumber = 

  | 51 | 52 | 53 | 54 | 55
  | 61 | 62 | 63 | 64 | 65
  | 71 | 72 | 73 | 74 | 75
  | 81 | 82 | 83 | 84 | 85;

export type ToothNumber = AdultToothNumber | PediatricToothNumber;

// Gemini me dijo que un diente puede en teoria tener varios de estos estados por superficie,
// para ser específicos voy a cambiar un poco la estructura
export const ALL_TOOTH_STATES = [
  'cavity',              // Requiere tratamiento
  'filled',            // Restauración (resina/amalgama) en buen estado
  'missing',             // Espacio vacío
  'implant',            // Falta pieza pero hay implante colocado
  'root_canal',          // Se realizó una endodoncia
  'fixed_dental_prosthesis',       // Corona o pilar de puente
  'retained_root', // Solo queda la raíz (tratamiento: extracción)
  'in_eruption',         // Diente saliendo
  'temporal'             // Corona provisional o tratamiento temporal
] as const;

export type ToothState = typeof ALL_TOOTH_STATES[number];

export const TOOTH_SURFACE = [
  'mesial',
  'distal',
  'vestibular',
  'lingual',
  'oclusal'
] as const;

export type ToothSurface = typeof TOOTH_SURFACE[number];

export interface ToothCondition {
  number: number; // 11-48 FDI notation
  generalStates: ToothState[]; // El diente es sano si state[] está vacío, es el estado del diente en general

  surfacesStates?: {
    [key in ToothSurface]?: 'caries' | 'obturado' | 'temporal';
  };
  notes?: string;
}

export interface OdontogramData {
  patientId: string;
  updatedAt?: string;
  status: 'placeholder' | 'ready';
  isAdult?: boolean;
  teeth?: Record<number, ToothCondition>;
  notes?: string;
}

export interface ClinicalRecord {
  patient: Patient;
  consultations: Consultation[];
  treatments: Treatment[];
  odontogram: OdontogramData;
}

export interface ClinicalRecordResponse {
  success: boolean;
  data?: ClinicalRecord;
  error?: string;
}
