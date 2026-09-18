import {
  getPatientGenderLabelKey,
  isPatientGender,
  PATIENT_BLOOD_TYPES,
  PATIENT_GENDER_VALUES,
  PATIENT_GENDERS,
} from '@/constants/patient';

describe('patient constants', () => {
  it('expone géneros canónicos para persistir', () => {
    expect(PATIENT_GENDER_VALUES).toEqual([
      PATIENT_GENDERS.FEMALE,
      PATIENT_GENDERS.MALE,
      PATIENT_GENDERS.OTHER,
    ]);
  });

  it('expone tipos de sangre clínicos', () => {
    expect(PATIENT_BLOOD_TYPES).toContain('O+');
    expect(PATIENT_BLOOD_TYPES).toHaveLength(8);
  });

  it('resuelve la clave i18n de género', () => {
    expect(getPatientGenderLabelKey(PATIENT_GENDERS.FEMALE)).toBe('registerPatient.genders.female');
    expect(isPatientGender('male')).toBe(true);
    expect(isPatientGender('otro')).toBe(false);
  });
});
