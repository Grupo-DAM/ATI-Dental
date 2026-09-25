import { calculateAge, parseDateRobustly } from '../date-utils';

describe('date-utils', () => {
  describe('calculateAge', () => {
    it('retorna null si la fecha está vacía o indefinida', () => {
      expect(calculateAge()).toBeNull();
      expect(calculateAge('')).toBeNull();
    });

    it('retorna null si la fecha es inválida', () => {
      expect(calculateAge('fecha-invalida')).toBeNull();
    });

    it('calcula la edad correctamente considerando mes y día', () => {
      const now = new Date();
      const birthPast = new Date(now.getFullYear() - 25, now.getMonth() - 2, 1);
      expect(calculateAge(birthPast.toISOString())).toBe(25);

      const birthFutureMonth = new Date(now.getFullYear() - 25, now.getMonth() + 2, 1);
      expect(calculateAge(birthFutureMonth.toISOString())).toBe(24);

      const birthSameMonthFutureDay = new Date(now.getFullYear() - 25, now.getMonth(), now.getDate() + 5);
      expect(calculateAge(birthSameMonthFutureDay.toISOString())).toBe(24);
    });

    it('maneja excepciones de forma segura retornando null', () => {
      expect(calculateAge(null as any)).toBeNull();
      expect(calculateAge({ valueOf() { throw new Error('fail'); } } as any)).toBeNull();
    });
  });

  describe('parseDateRobustly', () => {
    it('retorna null si dateInput está vacío', () => {
      expect(parseDateRobustly(null)).toBeNull();
      expect(parseDateRobustly(undefined)).toBeNull();
      expect(parseDateRobustly('')).toBeNull();
    });

    it('soporta objetos Timestamp de Firestore con método toDate()', () => {
      const expected = new Date(2023, 5, 15);
      const firestoreTimestamp = { toDate: () => expected };
      expect(parseDateRobustly(firestoreTimestamp)).toBe(expected);
    });

    it('soporta strings ISO válidos', () => {
      const parsed = parseDateRobustly('2023-09-20T10:00:00Z');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.toISOString()).toBe('2023-09-20T10:00:00.000Z');
    });

    it('soporta formato DD/MM/YYYY y DD-MM-YYYY', () => {
      const parsedSlash = parseDateRobustly('15/09/2023');
      expect(parsedSlash).toBeInstanceOf(Date);
      expect(parsedSlash?.getFullYear()).toBe(2023);
      expect(parsedSlash?.getMonth()).toBe(8); // Septiembre (0-indexed)
      expect(parsedSlash?.getDate()).toBe(15);

      const parsedDash = parseDateRobustly('20-10-2023');
      expect(parsedDash).toBeInstanceOf(Date);
      expect(parsedDash?.getFullYear()).toBe(2023);
      expect(parsedDash?.getMonth()).toBe(9); // Octubre (0-indexed)
      expect(parsedDash?.getDate()).toBe(20);
    });

    it('soporta objetos Date nativos', () => {
      const now = new Date();
      expect(parseDateRobustly(now)).toEqual(now);
    });

    it('retorna null si la fecha no es parseable o lanza error', () => {
      expect(parseDateRobustly('no-es-fecha')).toBeNull();
      expect(parseDateRobustly({ toDate() { throw new Error('fail'); } })).toBeNull();
    });
  });
});
