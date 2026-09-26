import { ApiTestClient } from './api-client';
import { createMockApiServer } from './mock-server';
import http from 'http';

describe('API Integration: Perfil de Usuario', () => {
  let server: http.Server;
  const client = new ApiTestClient();
  let validToken = '';

  beforeAll(async () => {
    server = await createMockApiServer(4041);
    // Asignar el puerto al cliente
    (client as any).baseUrl = 'http://127.0.0.1:4041';

    const authRes = await client.post('/auth/login', {
      email: 'dentist@atidental.com',
      password: 'Password123!',
    });
    if (authRes.status === 200 && authRes.data?.token) {
      validToken = authRes.data.token;
    }
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /users/me - Debe rechazar la consulta sin cabecera de autenticación (401 Unauthorized)', async () => {
    const res = await client.get('/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/me - Debe rechazar tokens alterados o inválidos (401 o 403 Forbidden)', async () => {
    const res = await client.get('/users/me', { token: 'token_falso_invalido_xyz' });
    expect([401, 403]).toContain(res.status);
  });

  it('GET /users/me - Debe responder con los datos del perfil y esquema esperado (200 OK)', async () => {
    const res = await client.get('/users/me', { token: validToken });

    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({
      id: expect.any(String),
      email: expect.any(String),
      fullName: expect.any(String),
      role: expect.any(String),
    });
  });
});