import { validatePatientForm, validateDocument, isValidEmail } from '@/utils/patient-validation';

describe('Patient Validation', () => {
  describe('isValidEmail', () => {
    it('retorna true para emails vacíos ya que es opcional', () => {
      expect(isValidEmail('')).toBe(true);
      expect(isValidEmail('   ')).toBe(true);
    });

    it('retorna true para emails válidos', () => {
      expect(isValidEmail('paciente@correo.com')).toBe(true);
      expect(isValidEmail('maria.gonzalez@dominio.co')).toBe(true);
    });

    it('retorna false para formatos inválidos', () => {
      expect(isValidEmail('invalido')).toBe(false);
      expect(isValidEmail('sin-arroba.com')).toBe(false);
      expect(isValidEmail('doble@@correo.com')).toBe(false);
    });

  describe('validateDocument', () => {
    it('es válido si ambos tipo y número están vacíos (opcional)', () => {
      expect(validateDocument('', '')).toEqual({ isValid: true });
      expect(validateDocument(undefined, undefined)).toEqual({ isValid: true });
    });
    it('falla si hay número pero no hay tipo de documento', () => {
      const res = validateDocument('', '12345678');
      expect(res.isValid).toBe(false);
      expect(res.errorKey).toBe('registerPatient.alerts.missingDocumentType');
    });
    it('falla si hay tipo pero el número está vacío', () => {
      const res = validateDocument('V', '');
      expect(res.isValid).toBe(false);
      expect(res.errorKey).toBe('registerPatient.alerts.emptyDocumentNumber');
    });
    it('falla si el tipo no es soportado', () => {
      const res = validateDocument('X' as any, '12345678');
      expect(res.isValid).toBe(false);
      expect(res.errorKey).toBe('registerPatient.alerts.invalidDocumentType');
    });
    it('falla si un tipo numérico contiene letras o caracteres especiales', () => {
      const res = validateDocument('V', '1234ABC');
      expect(res.isValid).toBe(false);
      expect(res.errorKey).toBe('registerPatient.alerts.documentMustBeNumeric');
    });
    it('falla si la longitud es menor al mínimo o mayor al máximo', () => {
      const muyCorto = validateDocument('V', '123');
      expect(muyCorto.isValid).toBe(false);
      expect(muyCorto.errorKey).toBe('registerPatient.alerts.invalidDocumentLength');
      const muyLargo = validateDocument('V', '1234567890');
      expect(muyLargo.isValid).toBe(false);
      expect(muyLargo.errorKey).toBe('registerPatient.alerts.invalidDocumentLength');
    });
    it('pasa con éxito para cédula válida (V) y pasaporte alfanumérico (P)', () => {
      expect(validateDocument('V', '12345678')).toEqual({ isValid: true });
      expect(validateDocument('P', 'PAS123456')).toEqual({ isValid: true });
    });
  });
  });

  describe('validatePatientForm', () => {
    it('falla cuando el nombre completo está vacío', () => {
      const result = validatePatientForm({
        fullName: '',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.fullName).toBe('registerPatient.alerts.emptyName');
    });

    it('falla cuando el email tiene formato erróneo', () => {
      const result = validatePatientForm({
        fullName: 'Carlos Rojas',
        email: 'correo-invalido',
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('registerPatient.alerts.invalidEmail');
    });

    it('falla cuando los datos de documento son inválidos y asigna errors.documentId', () => {
      const result = validatePatientForm({
        fullName: 'Carlos Rojas',
        documentType: 'V',
        documentNumber: '123', // Longitud inválida
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.documentId).toBe('registerPatient.alerts.invalidDocumentLength');
    });

    it('pasa cuando todos los datos requeridos y formatos son válidos', () => {
      const result = validatePatientForm({
        fullName: 'Carlos Rojas',
        email: 'carlos@ejemplo.com',
        phone: '04141234567',
        documentId: 'V-12345678',
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });
});