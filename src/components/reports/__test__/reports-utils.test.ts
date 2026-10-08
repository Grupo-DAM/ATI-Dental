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
  aggregateUserDemographics,
  parseFlexibleTimestamp,
  parseUserAge,
  normalizeUserGender,
  getAgeBucketKey,
  calculatePeakHoursDistribution,
  filterSessionsByDay,
  listSessionDayKeys,
  readSessionStartMillis,
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

  describe('demografía de usuarios', () => {
    const now = new Date(2026, 8, 17);

    it('calcula totales, edad promedio, rangos y género', () => {
      const metrics = aggregateUserDemographics(
        [
          { id: '1', genero: 'femenino', edad: 22 },
          { id: '2', gender: 'male', fechaNacimiento: new Date(1991, 0, 1) },
          { id: '3', sexo: 'mujer', birthDate: '10/10/1985' },
          { id: '4' },
          { id: '5', edad: '60', genero: 'otro' },
        ],
        now,
      );

      expect(metrics.totalUsers).toBe(5);
      expect(metrics.averageAge).toBe(39);
      expect(metrics.ageBuckets.find((bucket) => bucket.key === '18_25')?.count).toBe(1);
      expect(metrics.ageBuckets.find((bucket) => bucket.key === '26_35')?.count).toBe(1);
      expect(metrics.ageBuckets.find((bucket) => bucket.key === '36_50')?.count).toBe(1);
      expect(metrics.ageBuckets.find((bucket) => bucket.key === '50_plus')?.count).toBe(1);
      expect(metrics.ageBuckets.find((bucket) => bucket.key === 'unspecified')?.count).toBe(1);
      expect(metrics.genderSlices.find((slice) => slice.key === 'female')?.count).toBe(2);
      expect(metrics.genderSlices.find((slice) => slice.key === 'male')?.count).toBe(1);
      expect(metrics.genderSlices.find((slice) => slice.key === 'unspecified')?.percent).toBe(40);
    });

    it('devuelve promedio nulo y porcentajes en 0 si no hay usuarios', () => {
      const metrics = aggregateUserDemographics([]);
      expect(metrics.totalUsers).toBe(0);
      expect(metrics.averageAge).toBeNull();
      expect(metrics.genderSlices.every((slice) => slice.percent === 0)).toBe(true);
    });

    it('parsea timestamps flexibles y descarta edades inválidas', () => {
      expect(parseFlexibleTimestamp(123)).toBe(123);
      expect(parseFlexibleTimestamp({ toMillis: () => 50 })).toBe(50);
      expect(parseFlexibleTimestamp({ toDate: () => new Date(2020, 0, 1) })).toBe(
        new Date(2020, 0, 1).getTime(),
      );
      expect(parseFlexibleTimestamp({ seconds: 2 })).toBe(2000);
      expect(parseFlexibleTimestamp('no-date')).toBeNull();
      expect(parseUserAge({ id: '1', edad: 200 })).toBeNull();
      expect(parseUserAge({ id: '1', fechaNacimiento: '15/05/1990' }, now)).toBe(36);
      expect(normalizeUserGender({ id: '1', genero: 'HOMBRE' })).toBe('male');
      expect(getAgeBucketKey(17)).toBe('unspecified');
      expect(getAgeBucketKey(50)).toBe('36_50');
      expect(getAgeBucketKey(51)).toBe('50_plus');
    });
  });
});

describe('calculatePeakHoursDistribution', () => {
  const at = (day: number, hour: number) => new Date(2026, 9, day, hour, 15, 0);

  it('agrupa 24 franjas y marca la hora pico', () => {
    const sessions = [
      { id: '1', tiempoInicio: at(1, 10) },
      { id: '2', tiempoInicio: at(1, 10) },
      { id: '3', tiempoInicio: at(1, 10) },
      { id: '4', tiempoInicio: at(1, 8) },
    ];
    const result = calculatePeakHoursDistribution(sessions);

    expect(result.slots).toHaveLength(24);
    expect(result.slots[0].label).toBe('00:00 - 01:00');
    expect(result.slots[23].label).toBe('23:00 - 00:00');
    expect(result.total).toBe(4);
    expect(result.isEmpty).toBe(false);
    expect(result.isBimodal).toBe(false);
    expect(result.peaks).toEqual([
      expect.objectContaining({ hour: 10, label: '10:00 - 11:00', count: 3 }),
    ]);
    expect(result.slots[10].percentage).toBe(75);
    expect(result.slots[8].percentage).toBe(25);
  });

  it('conserva todas las franjas empatadas', () => {
    const sessions = [
      { id: '1', tiempoInicio: at(1, 10) },
      { id: '2', tiempoInicio: at(1, 10) },
      { id: '3', tiempoInicio: at(1, 16) },
      { id: '4', tiempoInicio: at(1, 16) },
    ];
    const result = calculatePeakHoursDistribution(sessions);

    expect(result.isBimodal).toBe(true);
    expect(result.peaks.map((peak) => peak.hour)).toEqual([10, 16]);
    expect(result.peaks.every((peak) => peak.count === 2)).toBe(true);
  });

  it('queda vacío cuando no hay marcas de tiempo', () => {
    const result = calculatePeakHoursDistribution([
      { id: '1' },
      { id: '2', fecha: 'no-es-fecha' },
    ]);
    expect(result.isEmpty).toBe(true);
    expect(result.peaks).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.slots.every((slot) => slot.count === 0)).toBe(true);
  });

  it('prioriza tiempoInicio sobre fecha para la hora', () => {
    const result = calculatePeakHoursDistribution([
      { id: '1', fecha: at(1, 1), tiempoInicio: at(1, 10) },
    ]);
    expect(result.slots[10].count).toBe(1);
    expect(result.slots[1].count).toBe(0);
  });

  it('filtra por día sin mezclar otras fechas', () => {
    const sessions = [
      { id: '1', tiempoInicio: at(1, 10) },
      { id: '2', tiempoInicio: at(2, 16) },
    ];
    const [firstDay] = listSessionDayKeys(sessions);
    const filtered = filterSessionsByDay(sessions, firstDay);
    const result = calculatePeakHoursDistribution(filtered);
    expect(filtered).toHaveLength(1);
    expect(result.peaks[0].hour).toBe(10);
    expect(readSessionStartMillis(sessions[0])).toBe(at(1, 10).getTime());
  });

  it('limita la serie a las últimas 4 horas', () => {
    const now = new Date(2026, 9, 8, 15, 30, 0);
    const result = calculatePeakHoursDistribution([
      { id: '1', tiempoInicio: new Date(2026, 9, 8, 14, 10, 0) },
      { id: '2', tiempoInicio: new Date(2026, 9, 8, 8, 0, 0) },
    ], 4, now);

    expect(result.slots).toHaveLength(4);
    expect(result.slots.map((slot) => slot.hour)).toEqual([12, 13, 14, 15]);
    expect(result.total).toBe(1);
    expect(result.peaks[0].hour).toBe(14);
    expect(result.isEmpty).toBe(false);
  });

  it('distribuye 10000 sesiones en menos de 100 ms', () => {
    const sessions = Array.from({ length: 10000 }, (_, index) => ({
      id: String(index),
      tiempoInicio: at(1, index % 24),
    }));
    const started = Date.now();
    const result = calculatePeakHoursDistribution(sessions);
    expect(Date.now() - started).toBeLessThanOrEqual(100);
    expect(result.total).toBe(10000);
    expect(result.slots).toHaveLength(24);
  });
});