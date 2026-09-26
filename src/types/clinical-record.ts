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

export interface ToothCondition {
  number: number; // 11-48 FDI notation
  state: 'sano' | 'caries' | 'obturado' | 'ausente' | 'endodoncia' | 'corona' | 'en_tratamiento';
  surfaces?: {
    mesial?: boolean;
    distal?: boolean;
    vestibular?: boolean;
    lingual?: boolean;
    oclusal?: boolean;
  };
  notes?: string;
}

export interface OdontogramData {
  patientId: string;
  updatedAt?: string;
  status: 'placeholder' | 'ready';
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
