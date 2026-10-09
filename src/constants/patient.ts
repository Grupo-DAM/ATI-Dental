export const PATIENT_GENDERS = {
  FEMALE: 'female',
  MALE: 'male',
  OTHER: 'other',
} as const;

export type PatientGender = (typeof PATIENT_GENDERS)[keyof typeof PATIENT_GENDERS];

export const PATIENT_GENDER_VALUES = [
  PATIENT_GENDERS.FEMALE,
  PATIENT_GENDERS.MALE,
  PATIENT_GENDERS.OTHER,
] as const;

export const PATIENT_BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type PatientBloodType = (typeof PATIENT_BLOOD_TYPES)[number];

export function isPatientGender(value: string): value is PatientGender {
  return (PATIENT_GENDER_VALUES as readonly string[]).includes(value);
}

export function getPatientGenderLabelKey(gender: PatientGender): `registerPatient.genders.${PatientGender}` {
  return `registerPatient.genders.${gender}`;
}

//Tipos de Documento de Identidad
export const DOCUMENT_TYPES = {
  V: 'V', // Venezolano
  E: 'E', // Extranjero
  J: 'J', // Jurídico
  P: 'P', // Pasaporte
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

export const DOCUMENT_TYPE_VALUES: DocumentType[] = ['V', 'E', 'J', 'P'];

export interface DocumentTypeConfig {
  type: DocumentType;
  label: string;
  isNumericOnly: boolean;
  minLength: number;
  maxLength: number;
  placeholder: string;
}

export const DOCUMENT_CONFIGS: Record<DocumentType, DocumentTypeConfig> = {
  V: { type: 'V', label: 'V - Venezolano', isNumericOnly: true, minLength: 6, maxLength: 8, placeholder: '12345678' },
  E: { type: 'E', label: 'E - Extranjero', isNumericOnly: true, minLength: 6, maxLength: 9, placeholder: '123456789' },
  J: { type: 'J', label: 'J - Jurídico', isNumericOnly: true, minLength: 8, maxLength: 10, placeholder: '123456789' },
  P: { type: 'P', label: 'P - Pasaporte', isNumericOnly: false, minLength: 6, maxLength: 12, placeholder: 'ABC123456' },
};