import {
  isValidCost,
  validateTreatmentForm,
  TreatmentFormData,
} from '@/utils/treatment-validation';

describe('Treatment Validation Logic', () => {
  describe('isValidCost', () => {
    it('debe aceptar costos numéricos enteros positivos', () => {
      expect(isValidCost('100')).toBe(true);
      expect(isValidCost('0')).toBe(true);
    });

    it('debe aceptar costos decimales válidos no negativos', () => {
      expect(isValidCost('150.50')).toBe(true);
      expect(isValidCost('0.00')).toBe(true);
      expect(isValidCost('0.99')).toBe(true);
    });

    it('debe rechazar costos negativos', () => {
      expect(isValidCost('-1')).toBe(false);
      expect(isValidCost('-150.50')).toBe(false);
      expect(isValidCost('-0.01')).toBe(false);
    });

    it('debe rechazar cadenas vacías o no numéricas', () => {
      expect(isValidCost('')).toBe(false);
      expect(isValidCost('   ')).toBe(false);
      expect(isValidCost('abc')).toBe(false);
      expect(isValidCost('100a')).toBe(false);
      expect(isValidCost(null as any)).toBe(false);
      expect(isValidCost(undefined as any)).toBe(false);
    });
  });

  describe('validateTreatmentForm', () => {
    const validForm: TreatmentFormData = {
      category: 'Ortodoncia',
      treatmentName: 'Brackets metálicos',
      dentalPiece: 'Pieza 11',
      treatmentDate: '10/25/2023',
      responsibleDentist: 'Dr. Smith',
      status: 'En Progreso',
      notes: 'Control mensual',
      estimatedCost: '150.00',
    };

    it('debe retornar válido cuando todos los campos requeridos están presentes y correctos', () => {
      const result = validateTreatmentForm(validForm, 'patient-123');

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });

    it('debe permitir que la pieza dental sea opcional (vacía o no definida)', () => {
      const formWithoutDentalPiece: TreatmentFormData = {
        ...validForm,
        dentalPiece: '',
      };

      const result = validateTreatmentForm(formWithoutDentalPiece, 'patient-123');
      expect(result.isValid).toBe(true);
      expect(result.errors.dentalPiece).toBeUndefined();
    });

    it('debe permitir que las notas sean opcionales', () => {
      const formWithoutNotes: TreatmentFormData = {
        ...validForm,
        notes: '',
      };

      const result = validateTreatmentForm(formWithoutNotes, 'patient-123');
      expect(result.isValid).toBe(true);
    });

    it('debe invalidar si no se asocia un paciente (patientId vacío)', () => {
      const result = validateTreatmentForm(validForm, '');
      expect(result.isValid).toBe(false);
      expect(result.errors.patientId).toBe('errors.patientRequired');
    });

    it('debe invalidar si falta la categoría', () => {
      const invalidForm = { ...validForm, category: '' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.category).toBe('errors.categoryRequired');
    });

    it('debe invalidar si el nombre del tratamiento está vacío', () => {
      const invalidForm = { ...validForm, treatmentName: '   ' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.treatmentName).toBe('errors.treatmentNameRequired');
    });

    it('debe invalidar si la fecha del tratamiento está vacía', () => {
      const invalidForm = { ...validForm, treatmentDate: '' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.treatmentDate).toBe('errors.treatmentDateRequired');
    });

    it('debe invalidar si no se selecciona odontólogo responsable', () => {
      const invalidForm = { ...validForm, responsibleDentist: '' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.responsibleDentist).toBe('errors.dentistRequired');
    });

    it('debe invalidar si el estado está vacío', () => {
      const invalidForm = { ...validForm, status: '' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.status).toBe('errors.statusRequired');
    });

    it('debe invalidar si el costo estimado está vacío', () => {
      const invalidForm = { ...validForm, estimatedCost: '' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.estimatedCost).toBe('errors.costRequired');
    });

    it('debe invalidar si el costo estimado es negativo', () => {
      const invalidForm = { ...validForm, estimatedCost: '-50' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.estimatedCost).toBe('errors.costInvalid');
    });

    it('debe invalidar si el costo estimado no es un número', () => {
      const invalidForm = { ...validForm, estimatedCost: 'abc' };
      const result = validateTreatmentForm(invalidForm, 'patient-123');

      expect(result.isValid).toBe(false);
      expect(result.errors.estimatedCost).toBe('errors.costInvalid');
    });
  });
});
