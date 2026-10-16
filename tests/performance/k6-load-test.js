/**
 * ATI Dental - Pruebas de Carga y Rendimiento Heterogéneo (k6)
 *
 * Simula escenarios realistas con distribución porcentual de tráfico según el rol:
 * - 70% Paciente (usuario_externo): Lectura intensiva, consultas de citas y agendamiento
 * - 20% Odontólogo (odontologo): Escritura de historias clínicas, consultas y odontogramas
 * - 10% Administrador (admin): Consultas masivas de directorio y reportes analíticos
 *
 * Ejecución:
 *   k6 run tests/performance/k6-load-test.js
 *   k6 run -e API_URL=https://api-staging.atidental.com/v1 tests/performance/k6-load-test.js
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Métricas personalizadas
const loginDuration = new Trend('login_duration', true);
const errorRate = new Rate('load_error_rate');
const patientReqs = new Counter('patient_requests_total');
const dentistReqs = new Counter('dentist_requests_total');
const adminReqs = new Counter('admin_requests_total');

const BASE_URL = __ENV.API_URL || 'http://127.0.0.1:4040';

// Configuración de perfiles predeterminados
const PROFILES = {
  paciente: {
    email: __ENV.TEST_PATIENT_EMAIL || 'paciente.test@atidental.com',
    password: __ENV.TEST_PATIENT_PASSWORD || 'PacienteSecure123!',
    patientId: 'pat-1',
  },
  odontologo: {
    email: __ENV.TEST_DENTIST_EMAIL || 'odontologo.test@atidental.com',
    password: __ENV.TEST_DENTIST_PASSWORD || 'OdontoSecure123!',
  },
  admin: {
    email: __ENV.TEST_ADMIN_EMAIL || 'admin.test@atidental.com',
    password: __ENV.TEST_ADMIN_PASSWORD || 'AdminSecure123!',
  },
};

export const options = {
  scenarios: {
    // 70% del tráfico: Flujo de Pacientes
    paciente_traffic: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 14 },
        { duration: '40s', target: 14 },
        { duration: '10s', target: 0 },
      ],
      exec: 'pacienteScenario',
      tags: { role: 'paciente' },
    },
    // 20% del tráfico: Flujo de Odontólogos
    odontologo_traffic: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 4 },
        { duration: '40s', target: 4 },
        { duration: '10s', target: 0 },
      ],
      exec: 'odontologoScenario',
      tags: { role: 'odontologo' },
    },
    // 10% del tráfico: Flujo de Administradores
    admin_traffic: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '20s', target: 2 },
        { duration: '40s', target: 2 },
        { duration: '10s', target: 0 },
      ],
      exec: 'adminScenario',
      tags: { role: 'admin' },
    },
  },

  // Umbrales de rendimiento por rol y globales
  thresholds: {
    'http_req_duration{role:paciente}': ['p(95)<500', 'p(99)<800'],
    'http_req_duration{role:odontologo}': ['p(95)<1200', 'p(99)<2000'],
    'http_req_duration{role:admin}': ['p(95)<2500', 'p(99)<3500'],
    'http_req_failed': ['rate<0.01'],
    'load_error_rate': ['rate<0.01'],
  },
};

function login(email, password, role) {
  const payload = JSON.stringify({ email, password });
  const params = {
    headers: { 'Content-Type': 'application/json' },
    tags: { role, endpoint: 'login' },
  };

  const res = http.post(`${BASE_URL}/auth/login`, payload, params);
  loginDuration.add(res.timings.duration, { role });

  const ok = check(res, {
    'login exitoso (200)': (r) => r.status === 200,
    'token recibido': (r) => {
      try {
        return Boolean(JSON.parse(r.body).token);
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!ok);
  if (!ok) return null;

  try {
    return JSON.parse(res.body).token;
  } catch {
    return null;
  }
}

// Escenario 1: Paciente (70% de tráfico)
export function pacienteScenario() {
  patientReqs.add(1);
  const token = login(PROFILES.paciente.email, PROFILES.paciente.password, 'paciente');
  if (!token) return;

  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { role: 'paciente' },
  };

  group('Paciente: Consulta de perfil y citas', () => {
    // 1. Obtener perfil
    const meRes = http.get(`${BASE_URL}/users/me`, authParams);
    check(meRes, { 'perfil paciente 200': (r) => r.status === 200 });

    // 2. Consultar próximas citas del paciente
    const apptsRes = http.get(`${BASE_URL}/patients/${PROFILES.paciente.patientId}/appointments`, authParams);
    check(apptsRes, { 'citas paciente 200': (r) => r.status === 200 });

    // 3. Agendar nueva cita de control
    const appointmentPayload = JSON.stringify({
      patientId: PROFILES.paciente.patientId,
      date: '2026-11-15',
      time: '11:00',
      reason: 'Revisión y Limpieza Semestral',
    });
    const bookRes = http.post(`${BASE_URL}/agenda/appointments`, appointmentPayload, authParams);
    check(bookRes, { 'agendamiento paciente 201': (r) => r.status === 201 });
  });

  sleep(1);
}

// Escenario 2: Odontólogo (20% de tráfico)
export function odontologoScenario() {
  dentistReqs.add(1);
  const token = login(PROFILES.odontologo.email, PROFILES.odontologo.password, 'odontologo');
  if (!token) return;

  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { role: 'odontologo' },
  };

  group('Odontólogo: Evolución clínica y odontograma', () => {
    // 1. Buscar paciente en agenda
    const searchRes = http.get(`${BASE_URL}/patients?search=Carlos`, authParams);
    check(searchRes, { 'búsqueda pacientes 200': (r) => r.status === 200 });

    // 2. Consultar historial clínico
    const historyRes = http.get(`${BASE_URL}/clinical-records?page=1&limit=5`, authParams);
    check(historyRes, { 'historial clínico 200': (r) => r.status === 200 });

    // 3. Registrar nueva evolución clínica
    const consultPayload = JSON.stringify({
      patientId: 'pat-1',
      diagnosis: 'Caries interproximal pieza 24',
      motivo: 'Dolor al masticar',
      tratamiento: 'Resina compuesta fotocurada',
    });
    const newRecordRes = http.post(`${BASE_URL}/clinical-records`, consultPayload, authParams);
    check(newRecordRes, { 'registro consulta 201': (r) => r.status === 201 });

    // 4. Actualizar matriz de odontograma
    const odontogramPayload = JSON.stringify({
      patientId: 'pat-1',
      teeth: {
        24: { condition: 'cavity', surfaces: ['distal'] },
      },
    });
    const odoRes = http.post(`${BASE_URL}/clinical-records/rec-1/odontogram`, odontogramPayload, authParams);
    check(odoRes, { 'odontograma guardado 201': (r) => r.status === 201 });
  });

  sleep(1.5);
}

// Escenario 3: Administrador (10% de tráfico)
export function adminScenario() {
  adminReqs.add(1);
  const token = login(PROFILES.admin.email, PROFILES.admin.password, 'admin');
  if (!token) return;

  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    tags: { role: 'admin' },
  };

  group('Admin: Consultas masivas y analítica', () => {
    // 1. Directorio consolidado completo de pacientes
    const directoryRes = http.get(`${BASE_URL}/patients`, authParams);
    check(directoryRes, { 'directorio pacientes 200': (r) => r.status === 200 });

    // 2. Reporte de analítica demográfica
    const demoRes = http.get(`${BASE_URL}/reports/demographics`, authParams);
    check(demoRes, { 'reporte demográfico 200': (r) => r.status === 200 });

    // 3. Reporte de retención de usuarios
    const retRes = http.get(`${BASE_URL}/reports/retention`, authParams);
    check(retRes, { 'reporte retención 200': (r) => r.status === 200 });
  });

  sleep(2);
}
