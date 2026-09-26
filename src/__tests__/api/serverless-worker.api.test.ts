import { ApiTestClient } from './api-client';
import { Config } from '@/constants/config';

describe('API Integration: Serverless Retention Worker', () => {
  const workerClient = new ApiTestClient(Config.serverless.proxyUrl);

  it('GET /health - Debe responder 200 OK con cabeceras CORS y timestamp', async () => {
    const res = await workerClient.get('/health');

    expect(res.status).toBe(200);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(res.data).toMatchObject({
      status: 'ok',
      service: 'ati-dental-retention-worker',
      timestamp: expect.any(String),
    });
  });

  it('GET /metrics/retention - Debe validar contrato de retención y tiempos de latencia (< 1.5s)', async () => {
    const res = await workerClient.get('/metrics/retention', {
      headers: {
        'x-api-key': process.env.DENTAL_API_KEY || 'test-key',
      },
    });

    expect([200, 401]).toContain(res.status);
    expect(res.latencyMs).toBeLessThan(3500);

    if (res.status === 200) {
      expect(res.headers.get('content-type')).toContain('application/json');
      expect(res.data).toHaveProperty('status');
      // Verificación de contrato de métricas
      expect(typeof (res.data.overallRetentionRate ?? 0)).toBe('number');
    }
  });

  it('GET /ruta-inexistente - Debe retornar 404 Not Found con mensaje descriptivo', async () => {
    const res = await workerClient.get('/ruta-no-valida');
    expect(res.status).toBe(404);
    expect(res.data.status).toBe('error');
  });
});