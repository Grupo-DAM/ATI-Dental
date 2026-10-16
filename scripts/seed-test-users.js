#!/usr/bin/env node
/**
 * ATI Dental - Script de Creación y Siembra de Usuarios de Prueba
 * 
 * Genera credenciales y perfiles de usuario diferenciados por rol:
 * - Paciente / Usuario Externo (70% tráfico en pruebas de carga)
 * - Odontólogo Especialista (20% tráfico)
 * - Administrador (10% tráfico)
 * - Asistente Dental
 * 
 * Modos de ejecución:
 * - Local / Offline / Dry-run: Genera el catálogo estructurado en tests/performance/test-users.json
 * - Remoto (Firebase): Si existe API Key en google-services.json o FIREBASE_API_KEY, registra
 *   las cuentas en Firebase Auth y siembra sus documentos en Firestore (usuarios y pacientes).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const USERS_OUTPUT_PATH = path.join(ROOT_DIR, 'tests', 'performance', 'test-users.json');
const ENV_TEST_PATH = path.join(ROOT_DIR, '.env.test');

// Definición de perfiles heterogéneos según la arquitectura de roles de ATI Dental
const DEFAULT_TEST_PROFILES = [
  {
    role: 'usuario_externo',
    roleLabel: 'Paciente / Usuario Externo',
    email: process.env.TEST_PATIENT_EMAIL || 'paciente.test@atidental.com',
    password: process.env.TEST_PATIENT_PASSWORD || 'PacienteSecure123!',
    nombre: 'Juan Paciente de Prueba',
    alias: 'JuanP',
    gender: 'masculino',
    trafficWeight: 0.70, // 70% del tráfico
    patientData: {
      patientCode: 'PAC-TEST-001',
      fullName: 'Juan Paciente de Prueba',
      documentId: 'V-11223344',
      phone: '+584121112233',
      email: 'paciente.test@atidental.com',
      status: 'activo',
      medicalHistory: ['alergia_penicilina'],
      lastVisit: '2026-09-15',
      nextAppointment: '2026-10-25',
    },
  },
  {
    role: 'odontologo',
    roleLabel: 'Odontólogo Especialista',
    email: process.env.TEST_DENTIST_EMAIL || 'odontologo.test@atidental.com',
    password: process.env.TEST_DENTIST_PASSWORD || 'OdontoSecure123!',
    nombre: 'Dra. María Odontóloga de Prueba',
    alias: 'DraMaria',
    phone: '+584149998877',
    trafficWeight: 0.20, // 20% del tráfico
  },
  {
    role: 'admin',
    roleLabel: 'Administrador del Sistema',
    email: process.env.TEST_ADMIN_EMAIL || 'admin.test@atidental.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminSecure123!',
    nombre: 'Carlos Administrador de Prueba',
    alias: 'AdminCarlos',
    phone: '+584165554433',
    trafficWeight: 0.10, // 10% del tráfico
  },
  {
    role: 'asistente',
    roleLabel: 'Asistente Dental',
    email: process.env.TEST_ASSISTANT_EMAIL || 'asistente.test@atidental.com',
    password: process.env.TEST_ASSISTANT_PASSWORD || 'AsistenteSecure123!',
    nombre: 'Laura Asistente de Prueba',
    alias: 'LauraA',
    phone: '+584241119988',
    trafficWeight: 0.0,
  },
];

function extractFirebaseConfig() {
  if (process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID) {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
    };
  }

  const googleServicesPath = path.join(ROOT_DIR, 'google-services.json');
  if (fs.existsSync(googleServicesPath)) {
    try {
      const content = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
      const apiKey = content.client?.[0]?.api_key?.[0]?.current_key;
      const projectId = content.project_info?.project_id || 'ati-dental';
      if (apiKey) {
        return { apiKey, projectId };
      }
    } catch {
      // Ignorar error de lectura
    }
  }

  return null;
}

function requestJson(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function registerFirebaseUser(profile, config) {
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.apiKey}`;
  try {
    const res = await requestJson(signUpUrl, { method: 'POST' }, {
      email: profile.email,
      password: profile.password,
      returnSecureToken: true,
    });

    let uid = res.data?.localId;
    if (res.status === 200 && uid) {
      console.log(`  ✓ Usuario Auth creado: ${profile.email} (UID: ${uid})`);
    } else if (res.data?.error?.message === 'EMAIL_EXISTS') {
      console.log(`  ℹ Usuario Auth ya existente: ${profile.email}. Autenticando para obtener UID...`);
      const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.apiKey}`;
      const loginRes = await requestJson(signInUrl, { method: 'POST' }, {
        email: profile.email,
        password: profile.password,
        returnSecureToken: true,
      });
      uid = loginRes.data?.localId;
    } else {
      console.warn(`  ⚠ Aviso al registrar en Firebase Auth (${profile.email}):`, res.data?.error?.message || res.status);
    }

    // Siembra de documento en colección 'usuarios' de Firestore
    if (uid && config.projectId) {
      const docUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/usuarios?documentId=${uid}`;
      const firestoreBody = {
        fields: {
          email: { stringValue: profile.email.toLowerCase().trim() },
          nombre: { stringValue: profile.nombre },
          alias: { stringValue: profile.alias },
          rol: { stringValue: profile.role },
          estado: { stringValue: 'activo' },
          idiomaPreferencia: { stringValue: 'es' },
          fechaCreacion: { stringValue: new Date().toISOString() },
        },
      };
      await requestJson(docUrl, { method: 'POST' }, firestoreBody);
      console.log(`  ✓ Perfil sembrado en Firestore 'usuarios/${uid}' (Rol: ${profile.role})`);
    }

    // Siembra en colección 'pacientes' si corresponde
    if (profile.patientData && config.projectId) {
      const patientDocId = `pat_${profile.patientData.patientCode.toLowerCase()}`;
      const patientUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/pacientes?documentId=${patientDocId}`;
      const patientBody = {
        fields: {
          patientCode: { stringValue: profile.patientData.patientCode },
          fullName: { stringValue: profile.patientData.fullName },
          documentId: { stringValue: profile.patientData.documentId },
          phone: { stringValue: profile.patientData.phone },
          email: { stringValue: profile.patientData.email },
          status: { stringValue: 'activo' },
          lastVisit: { stringValue: profile.patientData.lastVisit },
          nextAppointment: { stringValue: profile.patientData.nextAppointment },
          fechaCreacion: { stringValue: new Date().toISOString() },
        },
      };
      await requestJson(patientUrl, { method: 'POST' }, patientBody);
      console.log(`  ✓ Expediente sembrado en Firestore 'pacientes/${patientDocId}' (Código: ${profile.patientData.patientCode})`);
    }

    return uid;
  } catch (error) {
    console.warn(`  ⚠ No se pudo sincronizar ${profile.email} con Firebase REST (${error.message}). Continuando en modo local.`);
    return null;
  }
}

async function main() {
  console.log('===========================================================');
  console.log('   ATI Dental - Generador de Usuarios de Prueba (Seed)     ');
  console.log('===========================================================');

  const isDryRun = process.argv.includes('--dry-run');
  const firebaseConfig = isDryRun ? null : extractFirebaseConfig();

  if (firebaseConfig) {
    console.log(`[Config] Proyecto Firebase detectado: ${firebaseConfig.projectId}`);
    console.log('[Config] Sincronizando perfiles contra Firebase Authentication & Firestore...');
    for (const profile of DEFAULT_TEST_PROFILES) {
      await registerFirebaseUser(profile, firebaseConfig);
    }
  } else {
    console.log('[Config] Modo Offline/Mock activado (sin conexión directa a Firebase).');
  }

  // 1. Guardar archivo tests/performance/test-users.json
  const outputDir = path.dirname(USERS_OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const exportPayload = {
    generatedAt: new Date().toISOString(),
    description: 'Catálogo de usuarios y perfiles diferenciados para pruebas de carga y rendimiento',
    profiles: DEFAULT_TEST_PROFILES,
  };

  fs.writeFileSync(USERS_OUTPUT_PATH, JSON.stringify(exportPayload, null, 2), 'utf8');
  console.log(`\n✓ Catálogo de usuarios generado con éxito en:`);
  console.log(`  -> ${path.relative(ROOT_DIR, USERS_OUTPUT_PATH)}`);

  // 2. Generar/Actualizar .env.test con variables tipificadas por rol
  const envContent = `# Entorno de Pruebas de Carga y Rendimiento - ATI Dental
API_BASE_URL=${process.env.API_BASE_URL || 'http://127.0.0.1:4040'}
SERVERLESS_WORKER_URL=${process.env.SERVERLESS_WORKER_URL || 'https://secure-proxy.ati-dental-retention.workers.dev'}

# Perfil Paciente (70% tráfico)
TEST_PATIENT_EMAIL=${DEFAULT_TEST_PROFILES[0].email}
TEST_PATIENT_PASSWORD=${DEFAULT_TEST_PROFILES[0].password}

# Perfil Odontólogo (20% tráfico)
TEST_DENTIST_EMAIL=${DEFAULT_TEST_PROFILES[1].email}
TEST_DENTIST_PASSWORD=${DEFAULT_TEST_PROFILES[1].password}

# Perfil Administrador (10% tráfico)
TEST_ADMIN_EMAIL=${DEFAULT_TEST_PROFILES[2].email}
TEST_ADMIN_PASSWORD=${DEFAULT_TEST_PROFILES[2].password}

# Perfil Asistente
TEST_ASSISTANT_EMAIL=${DEFAULT_TEST_PROFILES[3].email}
TEST_ASSISTANT_PASSWORD=${DEFAULT_TEST_PROFILES[3].password}

# Umbrales Máximos de Latencia
MAX_LATENCY_MS=1500
`;

  fs.writeFileSync(ENV_TEST_PATH, envContent, 'utf8');
  console.log(`✓ Variables de entorno actualizadas en:`);
  console.log(`  -> ${path.relative(ROOT_DIR, ENV_TEST_PATH)}`);

  console.log('\n--- Resumen de Perfiles Configurados ---');
  console.table(
    DEFAULT_TEST_PROFILES.map((p) => ({
      Rol: p.role,
      Nombre: p.nombre,
      Email: p.email,
      'Peso Carga': `${Math.round(p.trafficWeight * 100)}%`,
    }))
  );
  console.log('===========================================================\n');
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error fatal al sembrar usuarios:', err);
    process.exit(1);
  });
}

module.exports = {
  DEFAULT_TEST_PROFILES,
  extractFirebaseConfig,
};
