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
