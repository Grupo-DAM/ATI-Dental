import { ApiTestClient } from '@/test-utils/api-client';
import { createMockApiServer } from '@/test-utils/mock-server';
import http from 'http';

describe('API Integration: Autenticación y Gestión de Tokens', () => {
  let server: http.Server;
  const client = new ApiTestClient();
  const maxLatency = Number(process.env.MAX_LATENCY_MS) || 2000;

  beforeAll(async () => {
    server = await createMockApiServer(4040);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('POST /auth/login - Debe autenticar con credenciales válidas y devolver Bearer token (200 OK)', async () => {
    const payload = {
      email: 'dentist@atidental.com',
      password: 'Password123!',
    };

    const res = await client.post('/auth/login', payload);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.latencyMs).toBeLessThan(maxLatency);
    expect(res.data).toHaveProperty('token');
    expect(typeof res.data.token).toBe('string');
    expect(res.data.user).toMatchObject({
      email: payload.email,
      role: expect.any(String),
    });
  });

  it('POST /auth/login - Debe rechazar credenciales incorrectas (401 Unauthorized)', async () => {
    const res = await client.post('/auth/login', {
      email: 'usuario.invalido@atidental.com',
      password: 'ClaveErronea_999!',
    });

    expect(res.status).toBe(401);
    expect(res.data).toHaveProperty('error');
  });

  it('POST /auth/login - Debe rechazar peticiones con payload malformado (400 Bad Request)', async () => {
    const res = await client.post('/auth/login', {
      email: 'formato-invalido-sin-arroba',
    });

    expect([400, 422]).toContain(res.status);
    expect(res.data).toBeDefined();
  });
});