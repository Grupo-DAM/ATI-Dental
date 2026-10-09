import {
  build30DayBuckets,
  buildMonthlyExecutiveSummaryHtml,
  exportMonthlyExecutiveSummary,
  fetchMonthlyExecutiveSummaryData,
  MonthlyExecutiveMetrics,
} from '@/services/monthly-executive-summary-service';
import { ReportService } from '@/services/report-service';
import { firestore } from '@/config/firebase';

jest.mock('@/config/firebase', () => ({
  firestore: jest.fn(),
}));

jest.mock('@/services/report-service', () => ({
  ReportService: {
    buildMetrics: jest.fn((cards: any[]) => `<div class="kpi-cards">${cards.length} cards</div>`),
    buildAlert: jest.fn((msg: string, variant: string) => `<div class="alert-${variant}">${msg}</div>`),
    buildSvgLineChart: jest.fn((opts: any) => `<div class="svg-chart">${opts.title}</div>`),
    buildTable: jest.fn((opts: any) => `<div class="table">${opts.columns.map((c: any) => c.header).join(',')}</div>`),
    generateAndShare: jest.fn(),
  },
}));

describe('monthly-executive-summary-service (US-35 / Issue #31)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('build30DayBuckets', () => {
    it('construye 30 cubetas ordenadas cronológicamente para los últimos 30 días', () => {
      const buckets = build30DayBuckets([]);
      expect(buckets).toHaveLength(30);
      expect(buckets[0].dateStr <= buckets[29].dateStr).toBe(true);
      expect(buckets[0].accesses).toBe(0);
      expect(buckets[0].totalMinutes).toBe(0);
    });

    it('agrega accesos y minutos correctamente según timestamp de sesión', () => {
      const now = new Date();
      const sessions = [
        { id: '1', fecha: now.toISOString(), duracion: 120 },
        { id: '2', fecha: now.getTime(), duracion: 60 },
        { id: '3', fecha: 'fecha-invalida' }, // Se descarta
      ];
      const buckets = build30DayBuckets(sessions);
      const lastBucket = buckets[buckets.length - 1];
      expect(lastBucket.accesses).toBe(2);
      expect(lastBucket.totalMinutes).toBe(180); // 120 + 60 = 180 min
    });
  });

  describe('fetchMonthlyExecutiveSummaryData', () => {
    it('recupera sesiones, conteo de usuarios y métricas de estabilidad desde Firestore', async () => {
      const mockGetSessions = jest.fn().mockResolvedValue({
        docs: [
          { id: 's1', data: () => ({ fecha: new Date().getTime(), duracion: 60 }) },
          { id: 's2', data: () => ({ fecha: new Date().getTime(), duracion: 120 }) },
        ],
      });

      const mockGetUsers = jest.fn().mockResolvedValue({
        docs: [
          { id: 'u1', data: () => ({ estado: 'activo' }) },
          { id: 'u2', data: () => ({ estado: 'inactivo' }) },
          { id: 'u3', data: () => ({}) }, // activo por defecto
        ],
      });

      const mockGetStability = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ totalCrashes: 1 }),
      });

      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn((colName: string) => {
          if (colName === 'sesiones') {
            return {
              where: jest.fn(() => ({ get: mockGetSessions })),
            };
          }
          if (colName === 'usuarios') {
            return { get: mockGetUsers };
          }
          if (colName === 'metricas_estabilidad') {
            return {
              doc: jest.fn(() => ({ get: mockGetStability })),
            };
          }
          return { get: jest.fn().mockResolvedValue({ docs: [] }) };
        }),
      });

      const data = await fetchMonthlyExecutiveSummaryData();

      expect(data.totalAccesses).toBe(2);
      expect(data.activeUsers).toBe(2); // u1 activo y u3 activo por defecto
      expect(data.totalCrashes).toBe(1);
      expect(data.crashRatePercent).toBe('50.00%');
      expect(data.dailyAverageAccesses).toBe(0.1);
    });

    it('maneja fallos de red o excepciones en Firestore de manera resiliente', async () => {
      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn(() => {
          throw new Error('Firestore offline');
        }),
      });

      const data = await fetchMonthlyExecutiveSummaryData();

      expect(data.totalAccesses).toBe(0);
      expect(data.activeUsers).toBe(0);
      expect(data.totalCrashes).toBe(0);
      expect(data.crashRatePercent).toBe('0.00%');
      expect(data.sessions).toEqual([]);
    });
  });

  describe('buildMonthlyExecutiveSummaryHtml', () => {
    const mockDataWithSessions: MonthlyExecutiveMetrics = {
      totalAccesses: 100,
      dailyAverageAccesses: 3.3,
      activeUsers: 45,
      totalCrashes: 2,
      crashRatePercent: '2.00%',
      sessions: [{ id: '1', fecha: new Date().getTime(), duracion: 300 }],
    };

    it('genera el reporte ejecutivo completo con gráficos, tabla y firmas en español', () => {
      const options = buildMonthlyExecutiveSummaryHtml(mockDataWithSessions, 'es', 'Dr. Ramirez');

      expect(options.metadata.title).toBe('Resumen Ejecutivo Mensual');
      expect(options.metadata.subtitle).toContain('Últimos 30 días');
      expect(options.metadata.category).toBe('Módulo Administrativo · Resumen Gerencial');
      expect(options.metadata.badge?.label).toBe('30 DÍAS');
      expect(options.metadata.showSignatureBlock).toBe(true);
      expect(options.metadata.signatureTitle).toBe('Dr. Ramirez');
      expect(options.metadata.signatureSubtitle).toBe('Administrador de Sistema · ATI Dental');
      expect(options.metadata.fileName).toContain('Resumen_Ejecutivo_Mensual_');

      expect(ReportService.buildMetrics).toHaveBeenCalled();
      expect(ReportService.buildSvgLineChart).toHaveBeenCalled();
      expect(ReportService.buildTable).toHaveBeenCalled();
      expect(options.metadata.notes).toHaveLength(3);
      expect(options.language).toBe('es');
    });

    it('soporta la generación bilingüe en inglés (en)', () => {
      const options = buildMonthlyExecutiveSummaryHtml(mockDataWithSessions, 'en');

      expect(options.metadata.title).toBe('Executive Monthly Summary');
      expect(options.metadata.subtitle).toContain('Last 30 days');
      expect(options.metadata.category).toBe('Administrative Module · Managerial Summary');
      expect(options.metadata.badge?.label).toBe('30 DAYS');
      expect(options.metadata.signatureTitle).toBe('Medical & Administrative Direction');
      expect(options.metadata.signatureSubtitle).toBe('System Administrator · ATI Dental');
      expect(options.metadata.fileName).toContain('Executive_Monthly_Summary_');
      expect(options.metadata.notes?.[0]).toContain('operational and activity indicators');
      expect(options.language).toBe('en');
    });

    it('maneja el caso borde de período sin sesiones con alerta explicativa y métricas en cero', () => {
      const emptyData: MonthlyExecutiveMetrics = {
        totalAccesses: 0,
        dailyAverageAccesses: 0,
        activeUsers: 10,
        totalCrashes: 0,
        crashRatePercent: '0.00%',
        sessions: [],
      };

      const options = buildMonthlyExecutiveSummaryHtml(emptyData, 'es');

      expect(ReportService.buildAlert).toHaveBeenCalledWith(
        'Sin actividad de sesiones registrada en el período seleccionado.',
        'info'
      );
      expect(ReportService.buildSvgLineChart).not.toHaveBeenCalled();
      expect(ReportService.buildTable).not.toHaveBeenCalled();
      expect(options.contentHtml).toContain('alert-info');
    });
  });

  describe('exportMonthlyExecutiveSummary', () => {
    it('rechaza la exportación si el usuario no tiene rol administrador', async () => {
      const nonAdminUser = { uid: '1', rol: 'odontologo' };
      await expect(exportMonthlyExecutiveSummary(nonAdminUser, 'es')).rejects.toThrow(
        'Access denied: Administrator role required.'
      );
    });

    it('genera y comparte el reporte si el usuario es administrador', async () => {
      const adminUser = { uid: '1', rol: 'admin', nombre: 'Admin User' };

      (firestore as unknown as jest.Mock).mockReturnValue({
        collection: jest.fn(() => ({
          where: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ docs: [] }),
          })),
          get: jest.fn().mockResolvedValue({ docs: [] }),
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({ exists: false }),
          })),
        })),
      });

      (ReportService.generateAndShare as jest.Mock).mockResolvedValueOnce({
        file: { uri: 'file://summary.pdf', size: 1024 },
        share: { shared: true },
      });

      const result = await exportMonthlyExecutiveSummary(adminUser, 'es');

      expect(ReportService.generateAndShare).toHaveBeenCalled();
      expect(result.share.shared).toBe(true);
    });
  });
});
