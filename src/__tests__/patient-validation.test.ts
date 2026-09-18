import { validatePatientForm, isValidEmail } from '@/utils/patient-validation';

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

    it('pasa cuando todos los datos requeridos y formatos son válidos', () => {
      const result = validatePatientForm({
        fullName: 'Carlos Rojas',
        email: 'carlos@ejemplo.com',
        phone: '04141234567',
        documentId: 'V-12345678',
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors).length).toBe(0);
    });
  });
});