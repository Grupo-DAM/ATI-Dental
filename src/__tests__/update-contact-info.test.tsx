import { EMAIL_REGEX, PHONE_REGEX, validate } from '../app/(tabs)/update-contact-info';

describe('update-contact-info validation logic', () => {
  const mockTranslate = (key: string) => key;

  describe('EMAIL_REGEX', () => {
    it('accepts valid email addresses', () => {
      expect(EMAIL_REGEX.test('dr.nuevo@atidental.com')).toBe(true);
      expect(EMAIL_REGEX.test('usuario@dominio.co')).toBe(true);
      expect(EMAIL_REGEX.test('nombre.apellido@clinica.es')).toBe(true);
    });

    it('rejects invalid email addresses without linear backtracking risk', () => {
      expect(EMAIL_REGEX.test('')).toBe(false);
      expect(EMAIL_REGEX.test('correo_sin_arroba')).toBe(false);
      expect(EMAIL_REGEX.test('@dominio.com')).toBe(false);
      expect(EMAIL_REGEX.test('usuario@')).toBe(false);
      expect(EMAIL_REGEX.test('usuario@dominio')).toBe(false);
      expect(EMAIL_REGEX.test('usuario@@dominio.com')).toBe(false);
    });
  });

  describe('PHONE_REGEX', () => {
    it('accepts valid phone numbers', () => {
      expect(PHONE_REGEX.test('+1234567890')).toBe(true);
      expect(PHONE_REGEX.test('1234567890')).toBe(true);
      expect(PHONE_REGEX.test('+58 412 1234567')).toBe(true);
    });

    it('rejects invalid phone numbers', () => {
      expect(PHONE_REGEX.test('')).toBe(false);
      expect(PHONE_REGEX.test('123')).toBe(false);
      expect(PHONE_REGEX.test('abc')).toBe(false);
    });
  });

  describe('validate form function', () => {
    it('returns no errors for a valid form', () => {
      const validForm = {
        email: 'contacto@atidental.com',
        telefono: '+1234567890',
        whatsapp: '+1234567890',
      };
      const errors = validate(validForm, mockTranslate);
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('returns error keys when fields are invalid or empty', () => {
      const invalidForm = {
        email: 'invalido',
        telefono: '12',
        whatsapp: '   ',
      };
      const errors = validate(invalidForm, mockTranslate);
      expect(errors.email).toBe('updateContact.validation.invalidEmail');
      expect(errors.telefono).toBe('updateContact.validation.invalidPhone');
      expect(errors.whatsapp).toBe('updateContact.validation.emptyWhatsapp');
    });
  });
});
