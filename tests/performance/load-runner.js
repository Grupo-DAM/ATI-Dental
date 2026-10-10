#!/usr/bin/env node
/**
 * ATI Dental - Runner Autónomo de Pruebas de Carga y Rendimiento Heterogéneo
 * 
 * Evalúa el rendimiento de los endpoints críticos simulando tráfico realista
 * con distribución porcentual ponderada por rol:
 * - 70% Paciente (usuario_externo)
 * - 20% Odontólogo (odontologo)
 * - 10% Administrador (admin)
 * 
 * Calcula percentiles (p50, p90, p95, p99), evalúa umbrales (thresholds)
 * y genera reportes en formato Markdown y JSON.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const REASSURE_DIR = path.join(ROOT_DIR, '.reassure');
const USERS_FILE = path.join(ROOT_DIR, 'tests', 'performance', 'test-users.json');

// Umbrales de Rendimiento Esperados (SLA / Criterios de Aceptación)
const THRESHOLDS = {
  paciente: { p95: 500, p99: 800 },
  odontologo: { p95: 1200, p99: 2000 },
  admin: { p95: 2500, p99: 3500 },
  maxErrorRate: 0.01, // Máximo 1% de error global
};

const DEFAULT_USERS = {
  paciente: {
    email: process.env.TEST_PATIENT_EMAIL || 'paciente.test@atidental.com',
    password: process.env.TEST_PATIENT_PASSWORD || 'PacienteSecure123!',
    patientId: 'pat-1',
  },
  odontologo: {
    email: process.env.TEST_DENTIST_EMAIL || 'odontologo.test@atidental.com',
    password: process.env.TEST_DENTIST_PASSWORD || 'OdontoSecure123!',
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin.test@atidental.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminSecure123!',
  },
};

function calculatePercentile(sortedArray, percentile) {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
  return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
}

function computeMetrics(latencies, errorsCount) {
  const total = latencies.length + errorsCount;
  if (total === 0) {
    return { count: 0, p50: 0, p90: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0, errorRate: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  return {
    count: total,
    successCount: latencies.length,
    errorsCount,
    errorRate: total > 0 ? (errorsCount / total) : 0,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: latencies.length > 0 ? Math.round(sum / latencies.length) : 0,
    p50: calculatePercentile(sorted, 50),
    p90: calculatePercentile(sorted, 90),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
  };
}

function makeRequest(baseUrl, endpoint, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, baseUrl);
    const bodyStr = options.body ? JSON.stringify(options.body) : null;
    const reqOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {}),
      },
      timeout: options.timeout || 5000,
    };

    const start = process.hrtime.bigint();
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1_000_000;
        let parsed = null;
        try { parsed = JSON.parse(data); } catch { parsed = data; }

        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          latencyMs,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => {
      const end = process.hrtime.bigint();
      const latencyMs = Number(end - start) / 1_000_000;
      resolve({ status: 0, ok: false, latencyMs, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 408, ok: false, latencyMs: options.timeout || 5000, error: 'Timeout' });
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function simulatePatientFlow(baseUrl, credentials, results) {
  // 1. Login
  const loginRes = await makeRequest(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: credentials.email, password: credentials.password },
  });
  recordResult(results, 'paciente', '/auth/login', loginRes);
  const token = loginRes.ok && loginRes.data?.token ? loginRes.data.token : null;

  // 2. Perfil
  const meRes = await makeRequest(baseUrl, '/users/me', { token });
  recordResult(results, 'paciente', '/users/me', meRes);

  // 3. Consulta de citas del paciente
  const apptsRes = await makeRequest(baseUrl, `/patients/${credentials.patientId || 'pat-1'}/appointments`, { token });
  recordResult(results, 'paciente', '/patients/:id/appointments', apptsRes);

  // 4. Solicitud de cita
  const bookRes = await makeRequest(baseUrl, '/agenda/appointments', {
    method: 'POST',
    token,
    body: {
      patientId: credentials.patientId || 'pat-1',
      date: '2026-11-20',
      time: '09:30',
      reason: 'Consulta de rutina',
    },
  });
  recordResult(results, 'paciente', '/agenda/appointments', bookRes);
}

async function simulateDentistFlow(baseUrl, credentials, results) {
  // 1. Login
  const loginRes = await makeRequest(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: credentials.email, password: credentials.password },
  });
  recordResult(results, 'odontologo', '/auth/login', loginRes);
  const token = loginRes.ok && loginRes.data?.token ? loginRes.data.token : null;

  // 2. Búsqueda de pacientes
  const searchRes = await makeRequest(baseUrl, '/patients?search=Carlos', { token });
  recordResult(results, 'odontologo', '/patients?search', searchRes);

  // 3. Consulta de historias clínicas
  const recordsRes = await makeRequest(baseUrl, '/clinical-records?page=1&limit=5', { token });
  recordResult(results, 'odontologo', '/clinical-records', recordsRes);

  // 4. Registro de evolución
  const newRecRes = await makeRequest(baseUrl, '/clinical-records', {
    method: 'POST',
    token,
    body: {
      patientId: 'pat-1',
      diagnosis: 'Caries en pieza 21',
      motivo: 'Molestia',
    },
  });
  recordResult(results, 'odontologo', '/clinical-records (POST)', newRecRes);

  // 5. Guardado de odontograma
  const odoRes = await makeRequest(baseUrl, '/clinical-records/rec-1/odontogram', {
    method: 'POST',
    token,
    body: { patientId: 'pat-1', piecesCount: 32 },
  });
  recordResult(results, 'odontologo', '/clinical-records/:id/odontogram', odoRes);
}

async function simulateAdminFlow(baseUrl, credentials, results) {
  // 1. Login
  const loginRes = await makeRequest(baseUrl, '/auth/login', {
    method: 'POST',
    body: { email: credentials.email, password: credentials.password },
  });
  recordResult(results, 'admin', '/auth/login', loginRes);
  const token = loginRes.ok && loginRes.data?.token ? loginRes.data.token : null;

  // 2. Directorio consolidado completo
  const patientsRes = await makeRequest(baseUrl, '/patients', { token });
  recordResult(results, 'admin', '/patients', patientsRes);

  // 3. Reporte demográfico
  const demoRes = await makeRequest(baseUrl, '/reports/demographics', { token });
  recordResult(results, 'admin', '/reports/demographics', demoRes);

  // 4. Reporte de retención
  const retRes = await makeRequest(baseUrl, '/reports/retention', { token });
  recordResult(results, 'admin', '/reports/retention', retRes);
}

function recordResult(results, role, endpoint, response) {
  if (!results.byRole[role]) {
    results.byRole[role] = { latencies: [], errorsCount: 0 };
  }
  if (!results.byEndpoint[endpoint]) {
    results.byEndpoint[endpoint] = { latencies: [], errorsCount: 0, role };
  }

  if (response.ok) {
    results.byRole[role].latencies.push(response.latencyMs);
    results.byEndpoint[endpoint].latencies.push(response.latencyMs);
    results.global.latencies.push(response.latencyMs);
  } else {
    results.byRole[role].errorsCount++;
    results.byEndpoint[endpoint].errorsCount++;
    results.global.errorsCount++;
  }
}

async function runLoadSimulation(options = {}) {
  const totalIterations = options.iterations || 30; // Número de ciclos
  const concurrency = options.concurrency || 6;
  const baseUrl = options.baseUrl || 'http://127.0.0.1:4040';

  let credentials = DEFAULT_USERS;
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (Array.isArray(data.profiles)) {
        for (const p of data.profiles) {
          if (p.role === 'usuario_externo') credentials.paciente = p;
          if (p.role === 'odontologo') credentials.odontologo = p;
          if (p.role === 'admin') credentials.admin = p;
        }
      }
    } catch {
      // Usar defaults
    }
  }

  const results = {
    global: { latencies: [], errorsCount: 0 },
    byRole: {},
    byEndpoint: {},
  };

  // Construir cola de tareas con distribución porcentual (70% Paciente, 20% Odontólogo, 10% Admin)
  const taskQueue = [];
  for (let i = 0; i < totalIterations; i++) {
    const rand = Math.random();
    if (rand < 0.70) {
      taskQueue.push(() => simulatePatientFlow(baseUrl, credentials.paciente, results));
    } else if (rand < 0.90) {
      taskQueue.push(() => simulateDentistFlow(baseUrl, credentials.odontologo, results));
    } else {
      taskQueue.push(() => simulateAdminFlow(baseUrl, credentials.admin, results));
    }
  }

  // Ejecutar con concurrencia controlada
  let index = 0;
  async function worker() {
    while (index < taskQueue.length) {
      const currentTask = taskQueue[index++];
      await currentTask();
    }
  }

  const workers = [];
  for (let c = 0; c < Math.min(concurrency, taskQueue.length); c++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

function evaluateThresholds(results) {
  const violations = [];
  const roleSummaries = {};

  for (const role of ['paciente', 'odontologo', 'admin']) {
    const data = results.byRole[role] || { latencies: [], errorsCount: 0 };
    const metrics = computeMetrics(data.latencies, data.errorsCount);
    roleSummaries[role] = metrics;

    const threshold = THRESHOLDS[role];
    if (threshold) {
      if (metrics.p95 > threshold.p95) {
        violations.push(`Rol [${role}]: p95 esperado < ${threshold.p95}ms, obtenido ${metrics.p95.toFixed(1)}ms`);
      }
      if (metrics.p99 > threshold.p99) {
        violations.push(`Rol [${role}]: p99 esperado < ${threshold.p99}ms, obtenido ${metrics.p99.toFixed(1)}ms`);
      }
    }
  }

  const globalMetrics = computeMetrics(results.global.latencies, results.global.errorsCount);
  if (globalMetrics.errorRate > THRESHOLDS.maxErrorRate) {
    violations.push(`Tasa de error global esperada < ${(THRESHOLDS.maxErrorRate * 100).toFixed(1)}%, obtenida ${(globalMetrics.errorRate * 100).toFixed(2)}%`);
  }

  return {
    passed: violations.length === 0,
    violations,
    roleSummaries,
    globalMetrics,
  };
}

function generateMarkdownReport(evaluation, results) {
  const now = new Date().toISOString();
  return `# Reporte de Pruebas de Carga y Rendimiento Heterogéneo

- **Fecha de Ejecución**: ${now}
- **Estado Global**: ${evaluation.passed ? 'PASSED ✅' : 'FAILED ❌'}
- **Peticiones Totales**: ${evaluation.globalMetrics.count}
- **Tasa de Error Global**: ${(evaluation.globalMetrics.errorRate * 100).toFixed(2)}%
- **Latencia Promedio Global**: ${evaluation.globalMetrics.avg} ms

---

## 1. Rendimiento por Perfil de Usuario (Distribución Ponderada)

| Perfil / Rol | Peso Carga | Peticiones | p50 (ms) | p90 (ms) | p95 (ms) | p99 (ms) | Umbral p95 | Estado |
|---|---|---|---|---|---|---|---|---|
| **Paciente (usuario_externo)** | 70% | ${evaluation.roleSummaries.paciente?.count || 0} | ${evaluation.roleSummaries.paciente?.p50.toFixed(1)} | ${evaluation.roleSummaries.paciente?.p90.toFixed(1)} | ${evaluation.roleSummaries.paciente?.p95.toFixed(1)} | ${evaluation.roleSummaries.paciente?.p99.toFixed(1)} | < 500 ms | ${(evaluation.roleSummaries.paciente?.p95 <= 500) ? '✅ OK' : '❌ VIOLADO'} |
| **Odontólogo (odontologo)** | 20% | ${evaluation.roleSummaries.odontologo?.count || 0} | ${evaluation.roleSummaries.odontologo?.p50.toFixed(1)} | ${evaluation.roleSummaries.odontologo?.p90.toFixed(1)} | ${evaluation.roleSummaries.odontologo?.p95.toFixed(1)} | ${evaluation.roleSummaries.odontologo?.p99.toFixed(1)} | < 1200 ms | ${(evaluation.roleSummaries.odontologo?.p95 <= 1200) ? '✅ OK' : '❌ VIOLADO'} |
| **Administrador (admin)** | 10% | ${evaluation.roleSummaries.admin?.count || 0} | ${evaluation.roleSummaries.admin?.p50.toFixed(1)} | ${evaluation.roleSummaries.admin?.p90.toFixed(1)} | ${evaluation.roleSummaries.admin?.p95.toFixed(1)} | ${evaluation.roleSummaries.admin?.p99.toFixed(1)} | < 2500 ms | ${(evaluation.roleSummaries.admin?.p95 <= 2500) ? '✅ OK' : '❌ VIOLADO'} |

---

## 2. Desglose Detallado por Endpoint

| Endpoint | Rol Asignado | Muestras | Promedio (ms) | p95 (ms) | Errores |
|---|---|---|---|---|---|
${Object.entries(results.byEndpoint)
  .map(([endpoint, data]) => {
    const m = computeMetrics(data.latencies, data.errorsCount);
    return `| \`${endpoint}\` | ${data.role} | ${m.count} | ${m.avg} | ${m.p95.toFixed(1)} | ${m.errorsCount} |`;
  })
  .join('\n')}

---

## 3. Violaciones de Umbrales
${evaluation.violations.length === 0 ? '- Ninguna. Todos los endpoints y perfiles cumplieron los SLAs de rendimiento.' : evaluation.violations.map(v => `- ⚠️ ${v}`).join('\n')}
`;
}

async function main() {
  console.log('================================================================');
  console.log('  ATI Dental - Suite de Pruebas de Carga y Rendimiento Realista');
  console.log('================================================================');

  let serverInstance = null;
  const targetUrl = process.env.API_BASE_URL || 'http://127.0.0.1:4040';

  // Si apunta a localhost:4040, iniciar automáticamente el mock server enriquecido si no está activo
  if (targetUrl.includes('127.0.0.1:4040') || targetUrl.includes('localhost:4040')) {
    try {
      const { createMockApiServer } = require('./mock-server');
      serverInstance = await createMockApiServer(4040);
      console.log('[Runner] Mock Server local iniciado en http://127.0.0.1:4040');
    } catch (e) {
      console.log('[Runner] Servidor ya activo en puerto 4040 o no se pudo iniciar localmente.');
    }
  }

  try {
    console.log(`[Runner] Iniciando simulación de carga concurrente contra ${targetUrl}...`);
    console.log('[Runner] Distribución: 70% Pacientes | 20% Odontólogos | 10% Administradores');

    const results = await runLoadSimulation({
      baseUrl: targetUrl,
      iterations: 35,
      concurrency: 5,
    });

    const evaluation = evaluateThresholds(results);

    console.log('\n--- Resumen por Perfil de Usuario ---');
    console.table([
      {
        Perfil: 'Paciente (70%)',
        Peticiones: evaluation.roleSummaries.paciente?.count,
        'p50 (ms)': evaluation.roleSummaries.paciente?.p50.toFixed(1),
        'p95 (ms)': evaluation.roleSummaries.paciente?.p95.toFixed(1),
        'p99 (ms)': evaluation.roleSummaries.paciente?.p99.toFixed(1),
        'Umbral p95': '< 500 ms',
        Estado: evaluation.roleSummaries.paciente?.p95 <= 500 ? 'PASSED ✅' : 'FAILED ❌',
      },
      {
        Perfil: 'Odontólogo (20%)',
        Peticiones: evaluation.roleSummaries.odontologo?.count,
        'p50 (ms)': evaluation.roleSummaries.odontologo?.p50.toFixed(1),
        'p95 (ms)': evaluation.roleSummaries.odontologo?.p95.toFixed(1),
        'p99 (ms)': evaluation.roleSummaries.odontologo?.p99.toFixed(1),
        'Umbral p95': '< 1200 ms',
        Estado: evaluation.roleSummaries.odontologo?.p95 <= 1200 ? 'PASSED ✅' : 'FAILED ❌',
      },
      {
        Perfil: 'Administrador (10%)',
        Peticiones: evaluation.roleSummaries.admin?.count,
        'p50 (ms)': evaluation.roleSummaries.admin?.p50.toFixed(1),
        'p95 (ms)': evaluation.roleSummaries.admin?.p95.toFixed(1),
        'p99 (ms)': evaluation.roleSummaries.admin?.p99.toFixed(1),
        'Umbral p95': '< 2500 ms',
        Estado: evaluation.roleSummaries.admin?.p95 <= 2500 ? 'PASSED ✅' : 'FAILED ❌',
      },
    ]);

    // Guardar reportes
    if (!fs.existsSync(REASSURE_DIR)) {
      fs.mkdirSync(REASSURE_DIR, { recursive: true });
    }
    const reportMd = generateMarkdownReport(evaluation, results);
    fs.writeFileSync(path.join(REASSURE_DIR, 'load-report.md'), reportMd, 'utf8');
    fs.writeFileSync(path.join(REASSURE_DIR, 'load-report.json'), JSON.stringify({ evaluation, results }, null, 2), 'utf8');
    console.log(`\n✓ Reportes de carga exportados a:`);
    console.log(`  -> .reassure/load-report.md`);
    console.log(`  -> .reassure/load-report.json`);

    if (!evaluation.passed) {
      console.error('\n❌ Umbrales de rendimiento violados:');
      evaluation.violations.forEach(v => console.error(`  - ${v}`));
      process.exit(1);
    } else {
      console.log('\n✅ Performance Tests: PASSED (todos los endpoints bajo umbrales definidos).\n');
    }
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error fatal durante prueba de carga:', err);
    process.exit(1);
  });
}

module.exports = {
  THRESHOLDS,
  computeMetrics,
  calculatePercentile,
  evaluateThresholds,
  runLoadSimulation,
  generateMarkdownReport,
};
