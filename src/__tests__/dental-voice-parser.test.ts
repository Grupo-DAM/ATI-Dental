import { parseDentalVoiceCommand, isValidFdiToothNumber } from '@/utils/dental-voice-parser';

describe('US-15: Dental Voice Command Parser', () => {
  describe('Escenario 1: Comandos válidos en tiempo real', () => {
    it('reconoce comando con dígitos: "Diente 18 caries"', () => {
      const result = parseDentalVoiceCommand('Diente 18 caries', true);
      expect(result.success).toBe(true);
      expect(result.toothNumber).toBe(18);
      expect(result.state).toBe('cavity');
    });

    it('reconoce comando con número en texto: "Pieza veinticuatro endodoncia"', () => {
      const result = parseDentalVoiceCommand('Pieza veinticuatro endodoncia', true);
      expect(result.success).toBe(true);
      expect(result.toothNumber).toBe(24);
      expect(result.state).toBe('root_canal');
    });

    it('reconoce sinónimos de obturación y superficie: "16 calzado oclusal"', () => {
      const result = parseDentalVoiceCommand('16 calzado oclusal', true);
      expect(result.success).toBe(true);
      expect(result.toothNumber).toBe(16);
      expect(result.state).toBe('filled');
      expect(result.surface).toBe('oclusal');
    });

    it('reconoce comando de diente sano para limpiar afección: "Diente 31 sano"', () => {
      const result = parseDentalVoiceCommand('Diente 31 sano', true);
      expect(result.success).toBe(true);
      expect(result.toothNumber).toBe(31);
      expect(result.state).toBe('sano');
    });
  });

  describe('Escenario 2: Validación y manejo de comandos no reconocidos', () => {
    it('detecta número de diente fuera del rango FDI de adulto (ej. 99 o 55 en adulto)', () => {
      // 99 no existe
      const result = parseDentalVoiceCommand('Diente 99 caries', true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_COMMAND');
      expect(result.feedbackMessage).toContain('No se detectó el número de diente');

      // 55 es pediátrico, en modo adulto debe fallar
      const resultPediatricInAdult = parseDentalVoiceCommand('Diente 55 caries', true);
      expect(resultPediatricInAdult.success).toBe(false);
      expect(resultPediatricInAdult.error).toBe('TOOTH_OUT_OF_RANGE');
      expect(resultPediatricInAdult.feedbackMessage).toContain('fuera del rango válido');
    });

    it('falla cuando el estado no es reconocido: "Diente 18 con dolor"', () => {
      const result = parseDentalVoiceCommand('Diente 18 con dolor', true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('UNKNOWN_STATE');
      expect(result.feedbackMessage).toBe('Estado o afección no reconocida');
    });

    it('maneja strings vacíos o ruido sin crashear', () => {
      const result = parseDentalVoiceCommand('', true);
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_COMMAND');
    });
  });

  describe('Validación de rangos FDI', () => {
    it('valida cuadrantes 1 al 4 para adultos', () => {
      expect(isValidFdiToothNumber(18, true)).toBe(true);
      expect(isValidFdiToothNumber(48, true)).toBe(true);
      expect(isValidFdiToothNumber(19, true)).toBe(false); // No existe pieza 9
      expect(isValidFdiToothNumber(51, true)).toBe(false); // Es pediátrico
    });

    it('valida cuadrantes 5 al 8 para pediátricos', () => {
      expect(isValidFdiToothNumber(55, false)).toBe(true);
      expect(isValidFdiToothNumber(85, false)).toBe(true);
      expect(isValidFdiToothNumber(18, false)).toBe(false);
    });
  });
});