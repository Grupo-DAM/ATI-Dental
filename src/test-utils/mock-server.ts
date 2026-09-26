import http from 'node:http';

// --- Handlers / Controladores por Endpoint ---
function handleAuthLogin(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      if (!parsed.email?.includes('@')) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Email inválido o incompleto' }));
      }
      if (parsed.email === 'usuario.invalido@atidental.com' || parsed.password === 'ClaveErronea_999!') {
        res.writeHead(401);
        return res.end(JSON.stringify({ error: 'Credenciales inválidas' }));
      }
      res.writeHead(200);
      return res.end(JSON.stringify({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken123',
        user: { id: 'usr-1', email: parsed.email, role: 'dentist' },
      }));
    } catch {
      res.writeHead(400);
      return res.end(JSON.stringify({ error: 'JSON malformado' }));
    }
  });
}

function handleUsersMe(req, res, authHeader) {
  if (!authHeader) {
    res.writeHead(401);
    return res.end(JSON.stringify({ error: 'No autorizado: Falta cabecera Authorization' }));
  }
  if (authHeader.includes('falso') || authHeader.includes('invalido')) {
    res.writeHead(403);
    return res.end(JSON.stringify({ error: 'Token inválido o expirado' }));
  }
  res.writeHead(200);
  return res.end(JSON.stringify({
    id: 'usr-1',
    email: 'dentist@atidental.com',
    fullName: 'Dr. Roberto Dentista',
    role: 'dentist',
  }));
}

function handleClinicalRecords(req, res, method) {
  if (method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify({
      page: 1,
      limit: 5,
      total: 1,
      items: [
        { id: 'rec-1', patientId: 'pat-1', diagnosis: 'Caries oclusal molar 16', date: '2026-09-20' },
      ],
    }));
  }

  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (!parsed.diagnosis || !parsed.patientId) {
          res.writeHead(400);
          return res.end(JSON.stringify({ error: 'patientId y diagnosis son obligatorios' }));
        }
        res.writeHead(201);
        return res.end(JSON.stringify({ id: 'rec-new', ...parsed, status: 'creado' }));
      } catch {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'JSON malformado' }));
      }
    });
  }
}

function handlePatients(req, res, method) {
  if (method === 'GET') {
    res.writeHead(200);
    return res.end(JSON.stringify([
      { id: 'pat-1', patientCode: 'PAC-001', fullName: 'Carlos Pérez', status: 'activo' },
      { id: 'pat-2', patientCode: 'PAC-002', fullName: 'Ana Gómez', status: 'activo' },
    ]));
  }

  if (method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      if (!parsed.fullName || !parsed.documentId) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'fullName y documentId son requeridos' }));
      }
      res.writeHead(201);
      return res.end(JSON.stringify({ id: 'pat-new', patientCode: 'PAC-003', ...parsed, status: 'activo' }));
    });
  }
}

function handleAppointments(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    const parsed = JSON.parse(body || '{}');
    if (parsed.time === '10:00' && parsed.date === '2026-10-01') {
      res.writeHead(409);
      return res.end(JSON.stringify({ error: 'Horario no disponible para este odontólogo' }));
    }
    res.writeHead(201);
    return res.end(JSON.stringify({ id: 'apt-1', ...parsed, status: 'confirmada' }));
  });
}

export function createMockApiServer(port = 4040): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const { pathname } = url;
    const method = req.method;
    const authHeader = req.headers['authorization'];

    res.setHeader('Content-Type', 'application/json');

    if (pathname === '/auth/login' && method === 'POST') {
      return handleAuthLogin(req, res);
    }

    if (pathname === '/users/me' && method === 'GET') {
      return handleUsersMe(req, res, authHeader);
    }

    if (pathname === '/clinical-records') {
      return handleClinicalRecords(req, res, method);
    }

    if (pathname.startsWith('/patients')) {
      return handlePatients(req, res, method);
    }

    if (pathname === '/agenda/appointments' && method === 'POST') {
      return handleAppointments(req, res);
    }

    if (pathname === '/system/simulate-error') {
      res.writeHead(500);
      return res.end(JSON.stringify({
        status: 'error',
        message: 'Internal Server Error: Conexión rechazada por la base de datos',
      }));
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: `Ruta no encontrada: ${pathname}` }));
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      resolve(server);
    });
  });
}