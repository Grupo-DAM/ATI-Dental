import { ApiTestClient } from './api-client';
import { createMockApiServer } from './mock-server';
import http from 'http';

describe('API Integration: Historias Clínicas y Consultas', () => {
  let server: http.Server;
  const client = new ApiTestClient();
  const token = 'mock-valid-token';

  beforeAll(async () => {
    server = await createMockApiServer(4042);
    (client as any).baseUrl = 'http://127.0.0.1:4042';
  });

  afterAll((done) => {
    server.close(done);
  });

  it('GET /clinical-records - Debe listar historias clínicas con estructura paginada (200 OK)', async () => {
    const res = await client.get('/clinical-records?page=1&limit=5', { token });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.items)).toBe(true);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('POST /clinical-records - Debe rechazar creación sin datos obligatorios (400 Bad Request)', async () => {
    const incompletePayload = {
      diagnosis: '', // Falta patientId
    };

    const res = await client.post('/clinical-records', incompletePayload, { token });
    expect([400, 422]).toContain(res.status);
  });

  it('GET /clinical-records/id_inexistente - Debe retornar (404 Not Found)', async () => {
    const res = await client.get('/clinical-records/id_inexistente_99999', { token });
    expect(res.status).toBe(404);
  });
});