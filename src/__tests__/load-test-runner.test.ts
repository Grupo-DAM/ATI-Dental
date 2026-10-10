import {
  THRESHOLDS,
  computeMetrics,
  calculatePercentile,
  evaluateThresholds,
  generateMarkdownReport,
} from '../../tests/performance/load-runner';

describe('Performance Load Test Runner Logic', () => {
  describe('calculatePercentile', () => {
    it('retorna 0 para un arreglo vacío', () => {
      expect(calculatePercentile([], 95)).toBe(0);
    });

    it('retorna el único elemento si el arreglo tiene 1 valor', () => {
      expect(calculatePercentile([42], 50)).toBe(42);
      expect(calculatePercentile([42], 95)).toBe(42);
      expect(calculatePercentile([42], 99)).toBe(42);
    });

    it('calcula los percentiles esperados en una distribución conocida de 100 valores', () => {
      // Array de 1 a 100
      const sorted = Array.from({ length: 100 }, (_, i) => i + 1);

      expect(calculatePercentile(sorted, 50)).toBe(50);
      expect(calculatePercentile(sorted, 90)).toBe(90);
      expect(calculatePercentile(sorted, 95)).toBe(95);
      expect(calculatePercentile(sorted, 99)).toBe(99);
    });
  });

  describe('computeMetrics', () => {
    it('retorna valores en cero cuando no hay latencias ni errores', () => {
      const metrics = computeMetrics([], 0);
      expect(metrics).toEqual({
        count: 0,
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        avg: 0,
        min: 0,
        max: 0,
        errorRate: 0,
      });
    });

    it('calcula métricas correctamente para una lista de latencias sin errores', () => {
      const latencies = [10, 20, 30, 40, 50];
      const metrics = computeMetrics(latencies, 0);

      expect(metrics.count).toBe(5);
      expect(metrics.min).toBe(10);
      expect(metrics.max).toBe(50);
      expect(metrics.avg).toBe(30);
      expect(metrics.p50).toBe(30);
      expect(metrics.errorRate).toBe(0);
    });

    it('calcula la tasa de error correctamente cuando hay fallos', () => {
      const latencies = [100, 200];
      const errorsCount = 2; // total 4 requests, 2 errors = 50%
      const metrics = computeMetrics(latencies, errorsCount);

      expect(metrics.count).toBe(4);
      expect(metrics.errorRate).toBe(0.5);
    });
  });

  describe('evaluateThresholds', () => {
    const mockPassingResults = {
      global: {
        latencies: Array.from({ length: 100 }, () => 50),
        errorsCount: 0,
      },
      byRole: {
        paciente: {
          latencies: Array.from({ length: 70 }, () => 80),
          errorsCount: 0,
        },
        odontologo: {
          latencies: Array.from({ length: 20 }, () => 200),
          errorsCount: 0,
        },
        admin: {
          latencies: Array.from({ length: 10 }, () => 400),
          errorsCount: 0,
        },
      },
      byEndpoint: {
        'GET /appointments/mine': {
          role: 'paciente',
          latencies: Array.from({ length: 70 }, () => 80),
          errorsCount: 0,
        },
      },
      durationSec: 10,
    };

    it('aprueba la evaluación cuando todas las métricas están bajo los umbrales', () => {
      const evaluation = evaluateThresholds(mockPassingResults);

      expect(evaluation.passed).toBe(true);
      expect(evaluation.violations).toHaveLength(0);
    });

    it('falla la evaluación si la tasa de error supera el umbral máximo', () => {
      const resultsWithError = {
        ...mockPassingResults,
        global: {
          latencies: [50],
          errorsCount: 10, // 10 / 11 > 1%
        },
      };

      const evaluation = evaluateThresholds(resultsWithError);

      expect(evaluation.passed).toBe(false);
      expect(evaluation.violations.some((v: string) => v.includes('Tasa de error global'))).toBe(true);
    });

    it('falla si el p95 o p99 del rol paciente excede el umbral', () => {
      const failingPatient = {
        ...mockPassingResults,
        byRole: {
          ...mockPassingResults.byRole,
          paciente: {
            latencies: Array.from({ length: 70 }, () => THRESHOLDS.paciente.p95 + 100),
            errorsCount: 0,
          },
        },
      };

      const evaluation = evaluateThresholds(failingPatient);

      expect(evaluation.passed).toBe(false);
      expect(evaluation.violations.some((v: string) => v.includes('paciente') && v.includes('p95'))).toBe(true);
    });

    it('falla si el p95 del rol admin excede el umbral', () => {
      const failingAdmin = {
        ...mockPassingResults,
        byRole: {
          ...mockPassingResults.byRole,
          admin: {
            latencies: Array.from({ length: 10 }, () => THRESHOLDS.admin.p95 + 100),
            errorsCount: 0,
          },
        },
      };

      const evaluation = evaluateThresholds(failingAdmin);

      expect(evaluation.passed).toBe(false);
      expect(evaluation.violations.some((v: string) => v.includes('admin') && v.includes('p95'))).toBe(true);
    });
  });

  describe('generateMarkdownReport', () => {
    it('genera un documento markdown con resumen de escenarios, métricas y estado', () => {
      const mockResults = {
        global: {
          latencies: [50, 60],
          errorsCount: 0,
        },
        byRole: {
          paciente: {
            latencies: [40, 50],
            errorsCount: 0,
          },
          odontologo: {
            latencies: [70, 80],
            errorsCount: 0,
          },
          admin: {
            latencies: [110, 120],
            errorsCount: 0,
          },
        },
        byEndpoint: {
          'GET /appointments/mine': {
            role: 'paciente',
            latencies: [40, 50],
            errorsCount: 0,
          },
        },
        durationSec: 5,
      };

      const evaluation = evaluateThresholds(mockResults);
      const markdown = generateMarkdownReport(evaluation, mockResults);

      expect(markdown).toContain('# Reporte de Pruebas de Carga y Rendimiento Heterogéneo');
      expect(markdown).toContain('PASSED ✅');
      expect(markdown).toContain('Paciente (usuario_externo)');
      expect(markdown).toContain('GET /appointments/mine');
      expect(markdown).toContain('## 3. Violaciones de Umbrales');
    });
  });
});
