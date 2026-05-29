/** Datos simulados para el spike de reportes PDF (issue #76). */
const MOCK_ACCESS_LOGS = [
  { usuario: 'dr.martinez', accion: 'Consulta odontograma', paciente: 'P-1042', fecha: '2026-05-27 09:14' },
  { usuario: 'recep.lopez', accion: 'Alta cita', paciente: 'P-0891', fecha: '2026-05-27 10:02' },
  { usuario: 'dr.martinez', accion: 'Presupuesto exportado', paciente: 'P-1042', fecha: '2026-05-27 11:30' },
  { usuario: 'admin.silva', accion: 'Revisión historial', paciente: 'P-0773', fecha: '2026-05-27 14:45' },
] as const;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildLogRows(): string {
  return MOCK_ACCESS_LOGS.map(
    (row) => `
      <tr>
        <td>${escapeHtml(row.usuario)}</td>
        <td>${escapeHtml(row.accion)}</td>
        <td>${escapeHtml(row.paciente)}</td>
        <td>${escapeHtml(row.fecha)}</td>
      </tr>`,
  ).join('');
}

/** Plantilla HTML estática para `expo-print` → PDF. */
export function buildClinicalReportHtml(generatedAt: string): string {
  const safeGeneratedAt = escapeHtml(generatedAt);

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
    />
    <style>
      @page {
        margin: 24px;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: Helvetica, Arial, sans-serif;
        font-size: 12px;
        color: #1a1a1a;
        margin: 0;
        padding: 16px;
      }
      header {
        border-bottom: 2px solid #208aef;
        margin-bottom: 20px;
        padding-bottom: 12px;
      }
      h1 {
        font-size: 20px;
        margin: 0 0 4px;
        color: #208aef;
      }
      .meta {
        font-size: 11px;
        color: #555;
      }
      h2 {
        font-size: 14px;
        margin: 0 0 8px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th,
      td {
        border: 1px solid #ccc;
        padding: 8px 6px;
        text-align: left;
      }
      th {
        background: #e6f4fe;
        font-weight: 600;
      }
      tr:nth-child(even) td {
        background: #f8f9fa;
      }
      footer {
        margin-top: 24px;
        font-size: 10px;
        color: #888;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <header>
      <h1>ATI-Dental — Registro de accesos (PoC)</h1>
      <p class="meta">Generado: ${safeGeneratedAt} · Spike PDF #76 · Datos simulados</p>
    </header>
    <section>
      <h2>Actividad clínica reciente</h2>
      <table>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Paciente</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          ${buildLogRows()}
        </tbody>
      </table>
    </section>
    <footer>
      Documento de prueba — no contiene datos reales de pacientes.
    </footer>
  </body>
</html>`;
}
