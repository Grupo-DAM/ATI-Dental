import worker from '../../workers/retention-worker/src/index';
import * as retentionCalculator from '../../workers/retention-worker/src/retention-calculator';

describe('Cloudflare Worker Entry Point (index.ts)', () => {
  const mockCtx = {
    waitUntil: jest.fn(),
    passThroughOnException: jest.fn(),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles OPTIONS preflight request with 204 and CORS headers', async () => {
    const req = new Request('https://worker.dev/metrics/retention', {
      method: 'OPTIONS',
    });

    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('handles /health endpoint with 200 OK', async () => {
    const req = new Request('https://worker.dev/health');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe('ok');
    expect(json.service).toBe('ati-dental-retention-worker');
  });

  it('handles / (root path) and returns retention metrics', async () => {
    jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockResolvedValue({
      status: 'success',
      dia1: 80,
      dia7: 60,
      dia30: 30,
      day1: 80,
      day7: 60,
      day30: 30,
      overallRetentionRate: 57,
      totalCohortUsers: 50,
      calculatedAt: '2026-09-18T00:00:00Z',
    });

    const req = new Request('https://worker.dev/');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.status).toBe('success');
    expect(json.dia1).toBe(80);
  });

  it('handles /metrics/retention path', async () => {
    jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockResolvedValue({
      status: 'success',
      dia1: 70,
      dia7: 40,
      dia30: 20,
      day1: 70,
      day7: 40,
      day30: 20,
      overallRetentionRate: 43,
      totalCohortUsers: 100,
      calculatedAt: '2026-09-18T00:00:00Z',
    });

    const req = new Request('https://worker.dev/metrics/retention');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.dia1).toBe(70);
  });

  it('handles /retention shorthand path', async () => {
    jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockResolvedValue({
      status: 'success',
      dia1: 90,
      dia7: 75,
      dia30: 50,
      day1: 90,
      day7: 75,
      day30: 50,
      overallRetentionRate: 72,
      totalCohortUsers: 20,
      calculatedAt: '2026-09-18T00:00:00Z',
    });

    const req = new Request('https://worker.dev/retention');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.dia1).toBe(90);
  });

  it('returns 500 when calculating retention throws an error', async () => {
    jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockRejectedValue(new Error('DB failure'));

    const req = new Request('https://worker.dev/metrics/retention');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(500);
    const json = (await res.json()) as any;
    expect(json.status).toBe('error');
    expect(json.message).toBe('DB failure');
  });

  it('returns 500 with default message when non-Error is thrown', async () => {
    jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockRejectedValue('unknown string');

    const req = new Request('https://worker.dev/metrics/retention');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(500);
    const json = (await res.json()) as any;
    expect(json.status).toBe('error');
    expect(json.message).toBe('Error al calcular métricas de retención');
  });

  it('returns 404 for unknown endpoints', async () => {
    const req = new Request('https://worker.dev/non-existent');
    const res = await worker.fetch(req, {}, mockCtx);

    expect(res.status).toBe(404);
    const json = (await res.json()) as any;
    expect(json.status).toBe('error');
    expect(json.message).toContain('/non-existent');
  });

  describe('Authentication via DENTAL_API_KEY', () => {
    const envWithKey = {
      DENTAL_API_KEY: 'secret-token-123',
    };

    it('rejects with 401 when API key is missing', async () => {
      const req = new Request('https://worker.dev/metrics/retention');
      const res = await worker.fetch(req, envWithKey, mockCtx);

      expect(res.status).toBe(401);
      const json = (await res.json()) as any;
      expect(json.error).toContain('Unauthorized');
    });

    it('rejects with 401 when API key is invalid', async () => {
      const req = new Request('https://worker.dev/metrics/retention', {
        headers: { 'x-api-key': 'wrong-key' },
      });
      const res = await worker.fetch(req, envWithKey, mockCtx);

      expect(res.status).toBe(401);
    });

    it('accepts valid key via x-api-key header', async () => {
      jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockResolvedValue({
        status: 'success',
        dia1: 50,
        dia7: 50,
        dia30: 50,
        day1: 50,
        day7: 50,
        day30: 50,
        overallRetentionRate: 50,
        totalCohortUsers: 10,
        calculatedAt: '',
      });

      const req = new Request('https://worker.dev/metrics/retention', {
        headers: { 'x-api-key': 'secret-token-123' },
      });
      const res = await worker.fetch(req, envWithKey, mockCtx);

      expect(res.status).toBe(200);
    });

    it('accepts valid key via Authorization Bearer header', async () => {
      jest.spyOn(retentionCalculator, 'getRetentionMetrics').mockResolvedValue({
        status: 'success',
        dia1: 50,
        dia7: 50,
        dia30: 50,
        day1: 50,
        day7: 50,
        day30: 50,
        overallRetentionRate: 50,
        totalCohortUsers: 10,
        calculatedAt: '',
      });

      const req = new Request('https://worker.dev/metrics/retention', {
        headers: { Authorization: 'Bearer secret-token-123' },
      });
      const res = await worker.fetch(req, envWithKey, mockCtx);

      expect(res.status).toBe(200);
    });
  });
});
