import {
  hasReportData,
  buildAdminReportPdfOptions,
  AdminReportDataSnapshot,
  TranslateFunction,
} from '../admin-report-pdf-builder';

describe('admin-report-pdf-builder (US-02: Exportación e Impresión del Reporte Gráfico)', () => {
  const mockT: TranslateFunction = (key: string, fallbackOrOptions?: unknown) =>
    typeof fallbackOrOptions === 'string' ? fallbackOrOptions : key;

  describe('hasReportData', () => {
    it('valida datos para usage y access basándose en sessions', () => {
      expect(hasReportData({ reportType: 'usage', selectedPeriod: 30, periodLabel: '30 días', sessions: [] })).toBe(false);
      expect(hasReportData({ reportType: 'usage', selectedPeriod: 30, periodLabel: '30 días', sessions: [{ id: '1', fecha: 12345 }] })).toBe(true);

      expect(hasReportData({ reportType: 'access', selectedPeriod: 7, periodLabel: '7 días', sessions: [] })).toBe(false);
      expect(hasReportData({ reportType: 'access', selectedPeriod: 7, periodLabel: '7 días', sessions: [{ id: '1', fecha: 12345 }] })).toBe(true);
    });

    it('valida datos para demographics basándose en totalUsers', () => {
      expect(hasReportData({ reportType: 'demographics', selectedPeriod: 30, periodLabel: '30 días', demographicsMetrics: null })).toBe(false);
      expect(hasReportData({
        reportType: 'demographics',
        selectedPeriod: 30,
        periodLabel: '30 días',
        demographicsMetrics: { totalUsers: 0, averageAge: null, ageBuckets: [], genderSlices: [] },
      })).toBe(false);
      expect(hasReportData({
        reportType: 'demographics',
        selectedPeriod: 30,
        periodLabel: '30 días',
        demographicsMetrics: { totalUsers: 15, averageAge: 28, ageBuckets: [], genderSlices: [] },
      })).toBe(true);
    });

    it('valida datos para geographics basándose en totalUsers', () => {
      expect(hasReportData({ reportType: 'geographics', selectedPeriod: 30, periodLabel: '30 días', geographicsMetrics: null })).toBe(false);
      expect(hasReportData({
        reportType: 'geographics',
        selectedPeriod: 30,
        periodLabel: '30 días',
        geographicsMetrics: { totalCities: 0, mainCountry: '', mainCountryPercent: 0, totalUsers: 0, countryBuckets: [], regionSlices: [] },
      })).toBe(false);
      expect(hasReportData({
        reportType: 'geographics',
        selectedPeriod: 30,
        periodLabel: '30 días',
        geographicsMetrics: { totalCities: 2, mainCountry: 'VE', mainCountryPercent: 80, totalUsers: 10, countryBuckets: [], regionSlices: [] },
      })).toBe(true);
    });

    it('valida datos para dau_mau basándose en valores y serie histórica', () => {
      expect(hasReportData({ reportType: 'dau_mau', selectedPeriod: 30, periodLabel: '30 días', dauValue: 0, mauValue: 0, dauMauData: [] })).toBe(false);
      expect(hasReportData({ reportType: 'dau_mau', selectedPeriod: 30, periodLabel: '30 días', dauValue: 10, mauValue: 50, dauMauData: [] })).toBe(true);
      expect(hasReportData({
        reportType: 'dau_mau',
        selectedPeriod: 30,
        periodLabel: '30 días',
        dauValue: 0,
        mauValue: 0,
        dauMauData: [{ label: 'Sep', mau: 100, dau: 20 }],
      })).toBe(true);
    });

    it('valida datos para crash_rate basándose en crashRateData', () => {
      expect(hasReportData({ reportType: 'crash_rate', selectedPeriod: 30, periodLabel: '30 días', crashRateData: [] })).toBe(false);
      expect(hasReportData({
        reportType: 'crash_rate',
        selectedPeriod: 30,
        periodLabel: '30 días',
        crashRateData: [{ label: 'Hoy', value: 0.05 }],
      })).toBe(true);
    });

    it('valida datos para retention_rate basándose en retentionData', () => {
      expect(hasReportData({ reportType: 'retention_rate', selectedPeriod: 30, periodLabel: '30 días', retentionData: [] })).toBe(false);
      expect(hasReportData({
        reportType: 'retention_rate',
        selectedPeriod: 30,
        periodLabel: '30 días',
        retentionData: [{ cohort: 'D1', label: 'D1', percentage: 40 }],
      })).toBe(true);
    });

    it('retorna false para reportType no soportado', () => {
      expect(hasReportData({ reportType: 'unknown' as any, selectedPeriod: 30, periodLabel: '30 días' })).toBe(false);
    });
  });

  describe('buildAdminReportPdfOptions (Generación de los 7 reportes)', () => {
    it('1. Construye reporte PDF para tiempo de uso (usage)', () => {
      const now = Date.now();
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'usage',
        selectedPeriod: 7,
        periodLabel: 'Últimos 7 días',
        sessions: [
          { id: '1', fecha: now, duracion: 120 },
          { id: '2', tiempoInicio: now, duracion: 60 },
        ],
        totalAccessToday: 10,
        displayedActiveUsers: 5,
        language: 'es',
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Tiempo de Uso Diario');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.metadata.badge?.label).toBe('Últimos 7 días');
      expect(options.contentHtml).toContain('TOTAL ACCESOS (HOY)');
      expect(options.contentHtml).toContain('USUARIOS ACTIVOS');
      expect(options.contentHtml).toContain('Tiempo Promedio de Uso');
    });

    it('2. Construye reporte PDF para accesos diarios (access)', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'access',
        selectedPeriod: 15,
        periodLabel: 'Últimos 15 días',
        sessions: [{ id: '1', fecha: Date.now() }],
        totalAccessToday: 25,
        displayedActiveUsers: 14,
        language: 'es',
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Accesos Diarios al Sistema');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('Número de Accesos');
    });

    it('3. Construye reporte PDF para demografía (demographics)', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'demographics',
        selectedPeriod: 30,
        periodLabel: 'Últimos 30 días',
        demographicsMetrics: {
          totalUsers: 50,
          averageAge: 32,
          ageBuckets: [
            { key: '18_25', count: 15 },
            { key: '26_35', count: 25 },
          ],
          genderSlices: [
            { key: 'female', count: 30, percent: 60 },
            { key: 'male', count: 20, percent: 40 },
          ],
        },
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Demografía de Usuarios');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('Distribución por Rangos de Edad');
      expect(options.contentHtml).toContain('Distribución por Género');
      expect(options.contentHtml).toContain('32 años');
    });

    it('4. Construye reporte PDF para distribución geográfica (geographics)', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'geographics',
        selectedPeriod: 30,
        periodLabel: 'Últimos 30 días',
        geographicsMetrics: {
          totalCities: 5,
          mainCountry: 'Venezuela',
          mainCountryPercent: 85,
          totalUsers: 120,
          countryBuckets: [{ key: 'VE', label: 'Venezuela', count: 102 }],
          regionSlices: [{ key: 'andina', label: 'Andina', count: 40, percent: 33 }],
        },
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Distribución Geográfica');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('Venezuela');
      expect(options.contentHtml).toContain('Distribución por País');
      expect(options.contentHtml).toContain('Distribución por Regiones');
    });

    it('5. Construye reporte PDF para métricas DAU / MAU (dau_mau)', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'dau_mau',
        selectedPeriod: 30,
        periodLabel: 'Últimos 30 días',
        dauValue: 40,
        mauValue: 120,
        dauMauRatio: 33,
        dauMauData: [
          { label: 'Jul', mau: 110, dau: 35 },
          { label: 'Ago', mau: 120, dau: 40 },
        ],
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Usuarios Activos Diarios vs Mensuales (DAU/MAU)');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('RATIO DAU/MAU');
      expect(options.contentHtml).toContain('33%');
      expect(options.contentHtml).toContain('Jul');
    });

    it('6. Construye reporte PDF para tasa de fallos (crash_rate)', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'crash_rate',
        selectedPeriod: 15,
        periodLabel: 'Últimos 15 días',
        totalCrashesValue: 3,
        affectedUsersValue: 2,
        calculatedCrashRateString: '1.25%',
        crashRateData: [{ label: '1', value: 1.25 }],
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Porcentaje de Fallos');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('TASA DE FALLAS');
      expect(options.contentHtml).toContain('1.25%');
      expect(options.contentHtml).toContain('TOTAL DE FALLAS');
    });

    it('7. Construye reporte PDF para tasa de retención (retention_rate)', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'retention_rate',
        selectedPeriod: 30,
        periodLabel: 'Últimos 30 días',
        day1String: '75%',
        day7String: '50%',
        day30String: '35%',
        retentionData: [
          { cohort: 'Día 1', label: 'D1', percentage: 75 },
          { cohort: 'Día 7', label: 'D7', percentage: 50 },
          { cohort: 'Día 30', label: 'D30', percentage: 35 },
        ],
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);

      expect(options.metadata.title).toBe('Tasa de Retención de Usuarios');
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('RETENCIÓN DÍA 1');
      expect(options.contentHtml).toContain('75%');
      expect(options.contentHtml).toContain('Cohorte de Retención');
    });

    it('Maneja reportType desconocido con alerta neutral', () => {
      const snapshot: AdminReportDataSnapshot = {
        reportType: 'desconocido' as any,
        selectedPeriod: 30,
        periodLabel: '30 días',
      };

      const options = buildAdminReportPdfOptions(snapshot, mockT);
      expect(options.metadata.showSignatureBlock).toBe(false);
      expect(options.contentHtml).toContain('No hay registros disponibles');
    });

    describe('Ramas y casos borde para cobertura exhaustiva', () => {
      it('hasReportData cubre todas las combinaciones y variantes falsy', () => {
        expect(hasReportData({ reportType: 'usage', selectedPeriod: 30, periodLabel: '30 días' })).toBe(false);
        expect(hasReportData({ reportType: 'access', selectedPeriod: 30, periodLabel: '30 días' })).toBe(false);
        expect(hasReportData({ reportType: 'crash_rate', selectedPeriod: 30, periodLabel: '30 días' })).toBe(false);
        expect(hasReportData({ reportType: 'retention_rate', selectedPeriod: 30, periodLabel: '30 días' })).toBe(false);
        expect(hasReportData({ reportType: 'dau_mau', selectedPeriod: 30, periodLabel: '30 días', mauValue: 10 })).toBe(true);
        expect(hasReportData({
          reportType: 'dau_mau',
          selectedPeriod: 30,
          periodLabel: '30 días',
          dauMauData: [{ label: '1', mau: 0, dau: 5 }],
        })).toBe(true);
        expect(hasReportData({
          reportType: 'dau_mau',
          selectedPeriod: 30,
          periodLabel: '30 días',
          dauMauData: [{ label: '1', mau: 0, dau: 0 }],
        })).toBe(false);
      });

      it('buildUsageReportPdf maneja sesiones sin timestamp, fuera de rango y sin sesiones', () => {
        const oldTimestamp = Date.now() - 100 * 24 * 3600 * 1000;
        const snapshot: AdminReportDataSnapshot = {
          reportType: 'usage',
          selectedPeriod: 7,
          periodLabel: '7 días',
          sessions: [
            { id: 'no-ts' },
            { id: 'old', fecha: oldTimestamp },
          ],
        };
        const options = buildAdminReportPdfOptions(snapshot, mockT);
        expect(options.contentHtml).toContain('Tiempo Promedio de Uso');

        const emptySnapshot: AdminReportDataSnapshot = {
          reportType: 'usage',
          selectedPeriod: 7,
          periodLabel: '7 días',
        };
        const emptyOptions = buildAdminReportPdfOptions(emptySnapshot, mockT);
        expect(emptyOptions.contentHtml).toContain('Tiempo Promedio de Uso');
      });

      it('buildAccessReportPdf maneja sesiones sin timestamp, fuera de rango y sin sesiones', () => {
        const oldTimestamp = Date.now() - 100 * 24 * 3600 * 1000;
        const snapshot: AdminReportDataSnapshot = {
          reportType: 'access',
          selectedPeriod: 7,
          periodLabel: '7 días',
          sessions: [
            { id: 'no-ts' },
            { id: 'old', fecha: oldTimestamp },
          ],
        };
        const options = buildAdminReportPdfOptions(snapshot, mockT);
        expect(options.contentHtml).toContain('Número de Accesos');

        const emptySnapshot: AdminReportDataSnapshot = {
          reportType: 'access',
          selectedPeriod: 7,
          periodLabel: '7 días',
        };
        const emptyOptions = buildAdminReportPdfOptions(emptySnapshot, mockT);
        expect(emptyOptions.contentHtml).toContain('Número de Accesos');
      });

      it('buildDemographicsReportPdf maneja métricas nulas y totalUsers = 0', () => {
        const snapshotNull: AdminReportDataSnapshot = {
          reportType: 'demographics',
          selectedPeriod: 30,
          periodLabel: '30 días',
          demographicsMetrics: null,
        };
        const optionsNull = buildAdminReportPdfOptions(snapshotNull, mockT);
        expect(optionsNull.contentHtml).toContain('—');

        const snapshotZero: AdminReportDataSnapshot = {
          reportType: 'demographics',
          selectedPeriod: 30,
          periodLabel: '30 días',
          demographicsMetrics: {
            totalUsers: 0,
            averageAge: null,
            ageBuckets: [{ key: '18_25', count: 0 }],
            genderSlices: [{ key: 'unspecified', count: 0, percent: 0 }],
          },
        };
        const optionsZero = buildAdminReportPdfOptions(snapshotZero, mockT);
        expect(optionsZero.contentHtml).toContain('0%');
      });

      it('buildGeographicsReportPdf maneja métricas nulas y totalUsers = 0', () => {
        const snapshotNull: AdminReportDataSnapshot = {
          reportType: 'geographics',
          selectedPeriod: 30,
          periodLabel: '30 días',
          geographicsMetrics: null,
        };
        const optionsNull = buildAdminReportPdfOptions(snapshotNull, mockT);
        expect(optionsNull.contentHtml).toContain('N/A');

        const snapshotZero: AdminReportDataSnapshot = {
          reportType: 'geographics',
          selectedPeriod: 30,
          periodLabel: '30 días',
          geographicsMetrics: {
            totalCities: 0,
            mainCountry: 'Chile',
            mainCountryPercent: 0,
            totalUsers: 0,
            countryBuckets: [{ key: 'CL', label: 'Chile', count: 0 }],
            regionSlices: [{ key: 'otros', label: 'Otros', count: 0, percent: 0 }],
          },
        };
        const optionsZero = buildAdminReportPdfOptions(snapshotZero, mockT);
        expect(optionsZero.contentHtml).toContain('0%');
      });

      it('buildDauMauReportPdf calcula ratio si no viene provisto y maneja mau = 0', () => {
        const snapshot: AdminReportDataSnapshot = {
          reportType: 'dau_mau',
          selectedPeriod: 30,
          periodLabel: '30 días',
          dauValue: 20,
          mauValue: 100,
          dauMauData: [{ label: 'Oct', mau: 0, dau: 5 }],
        };
        const options = buildAdminReportPdfOptions(snapshot, mockT);
        expect(options.contentHtml).toContain('20%');
        expect(options.contentHtml).toContain('0%');

        const emptySnapshot: AdminReportDataSnapshot = {
          reportType: 'dau_mau',
          selectedPeriod: 30,
          periodLabel: '30 días',
        };
        const emptyOptions = buildAdminReportPdfOptions(emptySnapshot, mockT);
        expect(emptyOptions.contentHtml).toContain('RATIO DAU/MAU');
      });

      it('buildCrashRateReportPdf y buildRetentionReportPdf manejan valores nulos por defecto', () => {
        const crashSnapshot: AdminReportDataSnapshot = {
          reportType: 'crash_rate',
          selectedPeriod: 15,
          periodLabel: '15 días',
        };
        const crashOptions = buildAdminReportPdfOptions(crashSnapshot, mockT);
        expect(crashOptions.contentHtml).toContain('0.00%');

        const retentionSnapshot: AdminReportDataSnapshot = {
          reportType: 'retention_rate',
          selectedPeriod: 30,
          periodLabel: '30 días',
        };
        const retentionOptions = buildAdminReportPdfOptions(retentionSnapshot, mockT);
        expect(retentionOptions.contentHtml).toContain('0%');
      });
    });
  });
});
