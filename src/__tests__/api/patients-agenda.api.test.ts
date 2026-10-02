import { ApiTestClient } from '@/test-utils/api-client';
import { createMockApiServer } from '@/test-utils/mock-server';
import http from 'http';

describe('API Integration: Gestión de Pacientes y Agenda Dental', () => {
  let server: http.Server;
  const client = new ApiTestClient();
  const token = 'valid-bearer-token';

  beforeAll(async () => {
    server = await createMockApiServer(4043);
    (client as any).baseUrl = 'http://127.0.0.1:4043';
  });

  afterAll((done) => {
    server.close(done);
  });

  // --- Pacientes ---
  it('GET /patients - Debe retornar el listado de pacientes con código de estado 200', async () => {
    const res = await client.get('/patients', { token });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data[0]).toMatchObject({
      id: expect.any(String),
      patientCode: expect.any(String),
      fullName: expect.any(String),
      status: expect.stringMatching(/activo|inactivo/),
    });
  });

  it('POST /patients - Debe registrar un nuevo paciente y devolver 201 Created', async () => {
    const newPatient = {
      fullName: 'María Rodríguez',
      documentId: 'V-20123456',
      phone: '+584121234567',
    };

    const res = await client.post('/patients', newPatient, { token });

    expect(res.status).toBe(201);
    expect(res.data).toMatchObject({
      id: expect.any(String),
      patientCode: expect.any(String),
      fullName: newPatient.fullName,
      status: 'activo',
    });
  });

  it('POST /patients - Debe fallar con 400 Bad Request si faltan campos obligatorios', async () => {
    const res = await client.post('/patients', { phone: '123' }, { token });

    expect(res.status).toBe(400);
    expect(res.data).toHaveProperty('error');
  });

  // --- Agenda y Citas ---
  it('POST /agenda/appointments - Debe agendar cita exitosamente con 201 Created', async () => {
    const appointment = {
      patientId: 'pat-1',
      date: '2026-10-01',
      time: '11:00',
      reason: 'Limpieza dental y revisión',
    };

    const res = await client.post('/agenda/appointments', appointment, { token });

    expect(res.status).toBe(201);
    expect(res.data.status).toBe('confirmada');
  });

  it('POST /agenda/appointments - Debe detectar solapamiento de horarios (409 Conflict)', async () => {
    const conflictAppointment = {
      patientId: 'pat-2',
      date: '2026-10-01',
      time: '10:00', // Horario ocupado
      reason: 'Extracción de molar',
    };

    const res = await client.post('/agenda/appointments', conflictAppointment, { token });

    expect(res.status).toBe(409);
    expect(res.data.error).toContain('Horario no disponible');
  });

  // --- Validación de Fallos de Servidor (500) ---
  it('GET /system/simulate-error - Debe manejar respuestas 500 Internal Server Error con estructura de error controlada', async () => {
    const res = await client.get('/system/simulate-error', { token });

    expect(res.status).toBe(500);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(res.data).toMatchObject({
      status: 'error',
      message: expect.stringContaining('Internal Server Error'),
    });
  });
});