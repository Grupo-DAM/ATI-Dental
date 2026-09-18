import {
  generatePeriodOptions,
  calculateDauMauRatio,
  calculateCrashRatePercentage,
  formatRetentionPercentage,
  parseRetentionData,
  getRecordTimestamp,
  getRecordDurationMinutes,
  buildHistoryMap,
  generatePaddedChartData,
} from '../utils/reports-utils';

describe('reports-utils unit tests', () => {
  describe('generatePeriodOptions', () => {
    it('genera opciones con formato y testID correctos', () => {
      const mockT = (key: string) => `Label_${key}`;
      const options = generatePeriodOptions(mockT);
      expect(options).toHaveLength(3);
      expect(options[0].name).toBe(7);
      expect(options[0].testID).toBe('period-option-7');
    });
  });

  describe('calculateDauMauRatio', () => {
    it('devuelve 0 si MAU es 0', () => {
      expect(calculateDauMauRatio(10, 0)).toBe(0);
      expect(calculateDauMauRatio(0, 0)).toBe(0);
    });

    it('calcula el porcentaje redondeado', () => {
      expect(calculateDauMauRatio(50, 100)).toBe(50);
      expect(calculateDauMauRatio(1, 3)).toBe(33);
    });
  });

  describe('calculateCrashRatePercentage', () => {
    it('devuelve 0.00% si no hay sesiones o fallos', () => {
      expect(calculateCrashRatePercentage(0, 100)).toBe('0.00%');
      expect(calculateCrashRatePercentage(5, 0)).toBe('0.00%');
    });

    it('calcula la tasa con 2 decimales', () => {
      expect(calculateCrashRatePercentage(5, 100)).toBe('5.00%');
      expect(calculateCrashRatePercentage(1, 3)).toBe('33.33%');
    });
  });

  describe('formatRetentionPercentage', () => {
    it('devuelve 0% para undefined, null, NaN o negativos', () => {
      expect(formatRetentionPercentage(undefined)).toBe('0%');
      expect(formatRetentionPercentage(null)).toBe('0%');
      expect(formatRetentionPercentage(NaN)).toBe('0%');
      expect(formatRetentionPercentage(-5)).toBe('0%');
    });

    it('formatea enteros sin decimales', () => {
      expect(formatRetentionPercentage(0)).toBe('0%');
      expect(formatRetentionPercentage(50)).toBe('50%');
      expect(formatRetentionPercentage(100)).toBe('100%');
    });

    it('formatea decimales con 1 posición decimal', () => {
      expect(formatRetentionPercentage(33.333)).toBe('33.3%');
      expect(formatRetentionPercentage(45.56)).toBe('45.6%');
    });
  });

  describe('parseRetentionData', () => {
    const mockT = (key: string) => {
      if (key === 'reports.retentionDay1') return 'Día 1';
      if (key === 'reports.retentionDay7') return 'Día 7';
      if (key === 'reports.retentionDay30') return 'Día 30';
      return key;
    };

    it('extrae valores de dia1, dia7, dia30 correctamente', () => {
      const data = parseRetentionData({ dia1: 80, dia7: 50, dia30: 25 }, mockT);
      expect(data).toHaveLength(3);
      expect(data[0]).toEqual({ cohort: 'Día 1', label: 'D1', percentage: 80 });
      expect(data[1]).toEqual({ cohort: 'Día 7', label: 'D7', percentage: 50 });
      expect(data[2]).toEqual({ cohort: 'Día 30', label: 'D30', percentage: 25 });
    });

    it('acepta nombres alternativos en inglés (day1, day7, day30)', () => {
      const data = parseRetentionData({ day1: 75, day7: 40, day30: 20 }, mockT);
      expect(data[0].percentage).toBe(75);
      expect(data[1].percentage).toBe(40);
      expect(data[2].percentage).toBe(20);
    });

    it('proporciona 0 de fallback seguro para base de datos vacía o datos corruptos', () => {
      const dataEmpty = parseRetentionData(null, mockT);
      expect(dataEmpty[0].percentage).toBe(0);
      expect(dataEmpty[1].percentage).toBe(0);
      expect(dataEmpty[2].percentage).toBe(0);

      const dataInvalid = parseRetentionData({ dia1: 'inválido', dia7: -10, dia30: NaN }, mockT);
      expect(dataInvalid[0].percentage).toBe(0);
      expect(dataInvalid[1].percentage).toBe(0);
      expect(dataInvalid[2].percentage).toBe(0);
    });

    it('utiliza fallbacks de texto por defecto si t() devuelve cadena vacía', () => {
      const mockEmptyT = () => '';
      const data = parseRetentionData({ dia1: 50 }, mockEmptyT);
      expect(data[0].cohort).toBe('Día 1');
      expect(data[1].cohort).toBe('Día 7');
      expect(data[2].cohort).toBe('Día 30');
    });
  });

  describe('getRecordTimestamp', () => {
    it('devuelve null si no hay fecha ni tiempoInicio', () => {
      expect(getRecordTimestamp({ id: '1' })).toBeNull();
    });

    it('maneja valor numérico', () => {
      expect(getRecordTimestamp({ id: '1', fecha: 123456789 })).toBe(123456789);
    });

    it('maneja objeto Date', () => {
      const d = new Date('2026-09-01T12:00:00Z');
      expect(getRecordTimestamp({ id: '1', fecha: d })).toBe(d.getTime());
    });

    it('maneja objeto con toMillis()', () => {
      const mockTimestamp = { toMillis: () => 987654321 };
      expect(getRecordTimestamp({ id: '1', fecha: mockTimestamp })).toBe(987654321);
    });

    it('maneja objeto con toDate()', () => {
      const d = new Date('2026-09-02T10:00:00Z');
      const mockTimestamp = { toDate: () => d };
      expect(getRecordTimestamp({ id: '1', fecha: mockTimestamp })).toBe(d.getTime());
    });

    it('maneja string ISO parseable', () => {
      const ts = getRecordTimestamp({ id: '1', tiempoInicio: '2026-09-01T00:00:00.000Z' });
      expect(ts).not.toBeNull();
    });

    it('devuelve null si el string es inválido', () => {
      expect(getRecordTimestamp({ id: '1', fecha: 'fecha-no-valida' })).toBeNull();
    });
  });

  describe('getRecordDurationMinutes', () => {
    it('usa tiempoUso si existe', () => {
      expect(getRecordDurationMinutes({ id: '1', tiempoUso: 45 })).toBe(45);
    });

    it('convierte duracion de segundos a minutos si es mayor a 300', () => {
      expect(getRecordDurationMinutes({ id: '1', duracion: 600 })).toBe(10);
    });

    it('usa duracion directamente si es menor o igual a 300', () => {
      expect(getRecordDurationMinutes({ id: '1', duracion: 120 })).toBe(120);
    });

    it('calcula diferencia entre tiempoInicio y tiempoFin con toMillis()', () => {
      const rec = {
        id: '1',
        tiempoInicio: { toMillis: () => 60000 },
        tiempoFin: { toMillis: () => 180000 },
      };
      expect(getRecordDurationMinutes(rec)).toBe(2);
    });

    it('calcula diferencia entre tiempoInicio y tiempoFin con Date o string', () => {
      const rec = {
        id: '1',
        tiempoInicio: '2026-09-01T10:00:00Z',
        tiempoFin: '2026-09-01T10:30:00Z',
      };
      expect(getRecordDurationMinutes(rec)).toBe(30);
    });

    it('devuelve 0 si no hay campos o end <= start', () => {
      expect(getRecordDurationMinutes({ id: '1' })).toBe(0);
      expect(getRecordDurationMinutes({
        id: '1',
        tiempoInicio: '2026-09-01T11:00:00Z',
        tiempoFin: '2026-09-01T10:00:00Z',
      })).toBe(0);
    });
  });

  describe('buildHistoryMap y generatePaddedChartData', () => {
    it('construye mapa con historico y rellena datos padded', () => {
      const historico = [
        { label: '15', value: 2.5 },
        { fecha: '2026-09-14', tasa: 1.2 },
        { date: 'sin-clave' },
      ];
      const map = buildHistoryMap(historico);
      expect(map.get('15')).toBe(2.5);
      expect(map.get('2026-09-14')).toBe(1.2);

      const chartData = generatePaddedChartData(map, 7);
      expect(chartData).toHaveLength(7);
      expect(chartData[0]).toHaveProperty('label');
      expect(chartData[0]).toHaveProperty('value');
    });
  });
});