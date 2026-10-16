const http = require('http');

function resolveRoleFromEmail(email = '') {
  const normalized = email.toLowerCase();
  if (normalized.includes('admin')) {
    return { role: 'admin', id: 'usr-admin', fullName: 'Carlos Administrador' };
  }
  if (normalized.includes('paciente')) {
    return { role: 'usuario_externo', id: 'usr-paciente', fullName: 'Juan Paciente' };
  }
  if (normalized.includes('asistente')) {
    return { role: 'asistente', id: 'usr-asistente', fullName: 'Laura Asistente' };
  }
  return { role: 'dentist', id: 'usr-1', fullName: 'Dr. Roberto Dentista' };
}

function handleAuthLogin(req, res) {
  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      if (!parsed.email || !parsed.email.includes('@')) {
        res.writeHead(400);
        return res.end(JSON.stringify({ error: 'Email inválido o incompleto' }));
      }
      if (parsed.email === 'usuario.invalido@atidental.com' || parsed.password === 'ClaveErronea_999!') {
        res.writeHead(401);
        return res.end(JSON.stringify({ error: 'Credenciales inválidas' }));
      }
      const roleMeta = resolveRoleFromEmail(parsed.email);
      res.writeHead(200);
      return res.end(JSON.stringify({
        token: `mockToken-${roleMeta.role}`,
        user: { id: roleMeta.id, email: parsed.email, role: roleMeta.role, fullName: roleMeta.fullName },
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

  let roleMeta = { role: 'dentist', id: 'usr-1', fullName: 'Dr. Roberto Dentista', email: 'dentist@atidental.com' };
  if (authHeader.includes('admin')) {
    roleMeta = { role: 'admin', id: 'usr-admin', fullName: 'Carlos Administrador', email: 'admin.test@atidental.com' };
  } else if (authHeader.includes('paciente') || authHeader.includes('usuario_externo')) {
    roleMeta = { role: 'usuario_externo', id: 'usr-paciente', fullName: 'Juan Paciente', email: 'paciente.test@atidental.com' };
  } else if (authHeader.includes('asistente')) {
    roleMeta = { role: 'asistente', id: 'usr-asistente', fullName: 'Laura Asistente', email: 'asistente.test@atidental.com' };
  }

  res.writeHead(200);
  return res.end(JSON.stringify({
    id: roleMeta.id,
    email: roleMeta.email,
    fullName: roleMeta.fullName,
    role: roleMeta.role,
  }));
}

function handleClinicalRecords(req, res, method, pathname = '') {
  if (pathname.includes('/odontogram') && method === 'POST') {
    res.writeHead(201);
    return res.end(JSON.stringify({ status: 'saved', piecesCount: 32 }));
  }

  if (pathname !== '/clinical-records') {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: `Expediente clínico no encontrado: ${pathname}` }));
  }

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

function handlePatients(req, res, method, pathname = '') {
  if (pathname.includes('/appointments')) {
    res.writeHead(200);
    return res.end(JSON.stringify([
      { id: 'apt-1', date: '2026-10-25', time: '10:00', doctor: 'Dr. Roberto', status: 'confirmada' },
      { id: 'apt-2', date: '2026-09-15', time: '11:30', doctor: 'Dr. Roberto', status: 'completada' },
    ]));
  }

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

function handleReports(req, res, pathname) {
  if (pathname.includes('demographics')) {
    res.writeHead(200);
    return res.end(JSON.stringify({
      totalUsers: 150,
      byGender: { femenino: 85, masculino: 65 },
      byCountry: { VE: 110, ES: 25, US: 15 },
    }));
  }
  if (pathname.includes('retention')) {
    res.writeHead(200);
    return res.end(JSON.stringify({
      retentionRate: 88.4,
      dau: 42,
      mau: 135,
    }));
  }
  res.writeHead(200);
  return res.end(JSON.stringify({ status: 'ok', generatedAt: new Date().toISOString() }));
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

function createMockApiServer(port = 4040) {
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

    if (pathname.startsWith('/clinical-records')) {
      return handleClinicalRecords(req, res, method, pathname);
    }

    if (pathname.startsWith('/patients')) {
      return handlePatients(req, res, method, pathname);
    }

    if (pathname.startsWith('/reports')) {
      return handleReports(req, res, pathname);
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

module.exports = {
  createMockApiServer,
  resolveRoleFromEmail,
};
