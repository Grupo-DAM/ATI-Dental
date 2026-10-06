import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

/**
 * Paleta corporativa oficial de ATI Dental
 */
export const REPORT_THEME = {
  primary: '#5B2D8B',
  primaryDark: '#52287D',
  primaryLight: '#DBB4FF',
  primarySoft: '#F4EEFB',
  textDark: '#141018',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  borderStrong: '#CBD5E1',
  backgroundAlt: '#F9FAFB',
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

/**
 * Datos corporativos institucionales por defecto de ATI Dental
 */
export const DEFAULT_CLINIC_INFO = {
  name: 'ATI DENTAL',
  tagline: 'Clínica Odontológica Especializada',
  taxId: 'J-50183920-1',
  address: 'Av. Francisco de Miranda, Centro Odontológico ATI, Piso 3, Caracas',
  phone: '+58 (212) 555-0199',
  email: 'contacto@atidental.com',
  website: 'www.atidental.com',
};

/**
 * Sanitiza valores de texto para evitar vulnerabilidades XSS en el HTML inyectado
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type ReportBadgeVariant = 'primary' | 'success' | 'warning' | 'info' | 'neutral';

export interface ReportBadge {
  label: string;
  variant?: ReportBadgeVariant;
}

export interface ReportMetadata {
  title: string;
  subtitle?: string;
  reportCode?: string;
  category?: string;
  badge?: ReportBadge;
  generatedAt?: string | Date;
  generatedBy?: string;
  clinicInfo?: Partial<typeof DEFAULT_CLINIC_INFO>;
  showSignatureBlock?: boolean;
  signatureTitle?: string;
  signatureSubtitle?: string;
  licenseNumber?: string;
  notes?: string[];
}

export interface TableColumn {
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  rows: (string | number | boolean | null | undefined)[][];
  emptyMessage?: string;
  striped?: boolean;
}

export interface MetricCardItem {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  variant?: ReportBadgeVariant;
}

export interface InfoGridItem {
  label: string;
  value: string | number;
}

export interface RenderReportOptions {
  metadata: ReportMetadata;
  contentHtml: string;
  customStyles?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'A4' | 'letter';
}

export interface ReportFileResult {
  uri: string;
  numberOfPages: number;
  base64?: string;
}

export interface ShareReportOptions {
  dialogTitle?: string;
  mimeType?: string;
  UTI?: string;
}

export interface ShareReportResult {
  shared: boolean;
  message?: string;
}

export interface GenerateAndShareReportResult {
  file: ReportFileResult;
  share: ShareReportResult;
}

/**
 * Logo vectorial SVG corporativo de ATI Dental
 */
export function getCorporateLogoSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="48" height="48" class="corporate-logo-icon">
      <defs>
        <linearGradient id="atiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#5B2D8B" />
          <stop offset="100%" stop-color="#8F6BB3" />
        </linearGradient>
      </defs>
      <rect width="160" height="160" rx="36" fill="url(#atiGradient)" />
      <!-- Silueta estilizada de muela dental con cruz clínica -->
      <path d="M48 42 C38 42, 30 52, 30 68 C30 88, 44 116, 56 128 C64 136, 72 136, 76 120 C80 104, 80 104, 84 120 C88 136, 96 136, 104 128 C116 116, 130 88, 130 68 C130 52, 122 42, 112 42 C98 42, 92 50, 80 50 C68 50, 62 42, 48 42 Z" fill="#FFFFFF" fill-opacity="0.95" />
      <!-- Cruz central en tono corporativo -->
      <rect x="74" y="66" width="12" height="32" rx="3" fill="#5B2D8B" />
      <rect x="64" y="76" width="32" height="12" rx="3" fill="#5B2D8B" />
    </svg>
  `;
}

/**
 * Formatea una fecha u objeto Date al formato corporativo estándar de ATI Dental
 */
export function formatReportDateTime(date?: string | Date): string {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toLocaleString('es-ES');
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Genera el identificador único o código estándar para reportes si no fue provisto
 */
export function generateReportCode(prefix = 'REP'): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Helper para renderizar tablas estilizadas con reglas anti-corte de página
 */
export function buildTableHtml(config: TableConfig): string {
  const { columns, rows, emptyMessage = 'No hay registros disponibles para mostrar.', striped = true } = config;

  if (!rows || rows.length === 0) {
    return `
      <div class="empty-table-box">
        <p>${escapeHtml(emptyMessage)}</p>
      </div>
    `;
  }

  const theadHtml = columns
    .map((col) => {
      const align = col.align || 'left';
      const widthStyle = col.width ? `style="width: ${col.width}; text-align: ${align};"` : `style="text-align: ${align};"`;
      return `<th ${widthStyle}>${escapeHtml(col.header)}</th>`;
    })
    .join('');

  const tbodyHtml = rows
    .map((row) => {
      const cellsHtml = row
        .map((cell, idx) => {
          const col = columns[idx];
          const align = col?.align || 'left';
          return `<td style="text-align: ${align};">${escapeHtml(cell)}</td>`;
        })
        .join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .join('');

  return `
    <div class="table-responsive keep-together">
      <table class="report-table ${striped ? 'table-striped' : ''}">
        <thead>
          <tr>${theadHtml}</tr>
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Helper para renderizar tarjetas métricas de indicadores clave
 */
export function buildMetricCardsHtml(cards: MetricCardItem[]): string {
  if (!cards || cards.length === 0) return '';

  const cardsHtml = cards
    .map((card) => {
      const variantClass = card.variant ? `metric-${card.variant}` : 'metric-primary';
      const hintHtml = card.hint ? `<span class="metric-hint">${escapeHtml(card.hint)}</span>` : '';
      const trendHtml = card.trend ? `<span class="metric-trend">${escapeHtml(card.trend)}</span>` : '';

      return `
        <div class="metric-card ${variantClass} keep-together">
          <span class="metric-label">${escapeHtml(card.label)}</span>
          <span class="metric-value">${escapeHtml(card.value)}</span>
          <div class="metric-footer">
            ${hintHtml}
            ${trendHtml}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="metric-cards-grid keep-together">
      ${cardsHtml}
    </div>
  `;
}

/**
 * Helper para renderizar un grid de información clave (ej. datos del paciente o sesión)
 */
export function buildInfoGridHtml(items: InfoGridItem[]): string {
  if (!items || items.length === 0) return '';

  const itemsHtml = items
    .map((item) => `
      <div class="info-item">
        <span class="info-label">${escapeHtml(item.label)}:</span>
        <span class="info-value">${escapeHtml(item.value)}</span>
      </div>
    `)
    .join('');

  return `
    <div class="info-grid-container keep-together">
      ${itemsHtml}
    </div>
  `;
}

/**
 * Helper para renderizar bloques de alerta o notas destacadas
 */
export function buildAlertBoxHtml(message: string, variant: 'info' | 'warning' | 'success' = 'info'): string {
  return `
    <div class="alert-box alert-${variant} keep-together">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Genera el documento HTML completo con membrete, cuerpo dinámico, reglas CSS A4 y pie corporativo
 */
export function renderReportHtml(options: RenderReportOptions): string {
  const {
    metadata,
    contentHtml,
    customStyles = '',
    orientation = 'portrait',
    pageSize = 'A4',
  } = options;

  const clinic = {
    ...DEFAULT_CLINIC_INFO,
    ...(metadata.clinicInfo || {}),
  };

  const reportCode = metadata.reportCode || generateReportCode();
  const formattedDate = formatReportDateTime(metadata.generatedAt);
  const userIssuer = metadata.generatedBy || 'Sistema Automatizado';

  const badgeHtml = metadata.badge
    ? `<span class="report-badge badge-${metadata.badge.variant || 'primary'}">${escapeHtml(metadata.badge.label)}</span>`
    : '';

  const notesHtml = metadata.notes && metadata.notes.length > 0
    ? `
      <div class="report-notes-card keep-together">
        <h4 class="notes-title">Observaciones y Notas de Control:</h4>
        <ul class="notes-list">
          ${metadata.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  const showSignature = metadata.showSignatureBlock ?? true;
  const signatureHtml = showSignature
    ? `
      <div class="signature-section keep-together">
        <div class="signature-column">
          <div class="signature-line"></div>
          <p class="signature-name">${escapeHtml(metadata.signatureTitle || 'Dr. Odontólogo Responsable')}</p>
          <p class="signature-meta">${escapeHtml(metadata.signatureSubtitle || 'Especialista Tratante')}</p>
          ${metadata.licenseNumber ? `<p class="signature-license">Colegio Odontológico / Lic: ${escapeHtml(metadata.licenseNumber)}</p>` : ''}
        </div>
        <div class="signature-column seal-column">
          <div class="seal-box">
            <span class="seal-text">Sello Institucional ATI Dental</span>
          </div>
          <p class="signature-meta">Validación Clínica Autorizada</p>
        </div>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(metadata.title)} - ${escapeHtml(clinic.name)}</title>
  <style>
    /* Configuración de Hoja y Márgenes de Impresión A4 / Carta */
    @page {
      size: ${pageSize} ${orientation};
      margin: 12mm 14mm 16mm 14mm;
      @bottom-right {
        content: "Página " counter(page);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 8pt;
        color: #6B7280;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: ${REPORT_THEME.textDark};
      background-color: ${REPORT_THEME.white};
    }

    .report-container {
      width: 100%;
      margin: 0 auto;
      padding: 0;
    }

    /* Reglas Anti-Corte de Página */
    .keep-together {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Membrete Oficial */
    .report-header {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid ${REPORT_THEME.primary};
      padding-bottom: 12px;
      margin-bottom: 16px;
    }

    .header-brand {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }

    .brand-titles h1 {
      margin: 0;
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: ${REPORT_THEME.primary};
      line-height: 1.1;
    }

    .brand-titles .tagline {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      font-weight: 600;
      color: ${REPORT_THEME.textMuted};
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .brand-titles .tax-id {
      margin: 2px 0 0 0;
      font-size: 8pt;
      color: ${REPORT_THEME.textLight};
    }

    .header-clinic-meta {
      text-align: right;
      font-size: 8pt;
      color: ${REPORT_THEME.textMuted};
      line-height: 1.35;
    }

    /* Franja de Título del Reporte y Metadatos */
    .report-title-card {
      background-color: ${REPORT_THEME.primarySoft};
      border-left: 4px solid ${REPORT_THEME.primary};
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 18px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .title-content h2 {
      margin: 0;
      font-size: 13pt;
      font-weight: 700;
      color: ${REPORT_THEME.primaryDark};
      line-height: 1.2;
    }

    .title-content .subtitle {
      margin: 3px 0 0 0;
      font-size: 8.5pt;
      color: ${REPORT_THEME.textMuted};
    }

    .meta-box {
      text-align: right;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }

    .code-badge {
      font-family: monospace;
      font-size: 8pt;
      font-weight: 700;
      color: ${REPORT_THEME.primary};
      background-color: #EDE4F7;
      padding: 2px 6px;
      border-radius: 3px;
    }

    .emission-date {
      font-size: 7.5pt;
      color: ${REPORT_THEME.textMuted};
    }

    .emission-author {
      font-size: 7.5pt;
      color: ${REPORT_THEME.textLight};
    }

    /* Badges */
    .report-badge {
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-top: 4px;
    }

    .badge-primary { background-color: #E9D5FF; color: #581C87; }
    .badge-success { background-color: #D1FAE5; color: #065F46; }
    .badge-warning { background-color: #FEF3C7; color: #92400E; }
    .badge-info { background-color: #DBEAFE; color: #1E40AF; }
    .badge-neutral { background-color: #F3F4F6; color: #374151; }

    /* Grids de Información */
    .info-grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 8px 16px;
      background-color: ${REPORT_THEME.backgroundAlt};
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      font-size: 8.5pt;
    }

    .info-label {
      color: ${REPORT_THEME.textMuted};
      font-weight: 500;
      font-size: 7.5pt;
      text-transform: uppercase;
    }

    .info-value {
      color: ${REPORT_THEME.textDark};
      font-weight: 600;
      margin-top: 1px;
    }

    /* Tarjetas de Métricas */
    .metric-cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
      margin-bottom: 18px;
    }

    .metric-card {
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 6px;
      padding: 10px 12px;
      background-color: ${REPORT_THEME.white};
      display: flex;
      flex-direction: column;
    }

    .metric-card.metric-primary { border-top: 3px solid ${REPORT_THEME.primary}; }
    .metric-card.metric-success { border-top: 3px solid ${REPORT_THEME.success}; }
    .metric-card.metric-warning { border-top: 3px solid ${REPORT_THEME.warning}; }
    .metric-card.metric-info { border-top: 3px solid ${REPORT_THEME.info}; }

    .metric-label {
      font-size: 7.5pt;
      font-weight: 600;
      text-transform: uppercase;
      color: ${REPORT_THEME.textMuted};
    }

    .metric-value {
      font-size: 16pt;
      font-weight: 800;
      color: ${REPORT_THEME.primaryDark};
      margin: 4px 0 2px 0;
    }

    .metric-footer {
      display: flex;
      justify-content: space-between;
      font-size: 7pt;
      color: ${REPORT_THEME.textLight};
    }

    /* Tablas Corporativas */
    .table-responsive {
      width: 100%;
      margin-bottom: 18px;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      page-break-inside: auto;
    }

    .report-table thead {
      display: table-header-group;
    }

    .report-table tfoot {
      display: table-footer-group;
    }

    .report-table th {
      background-color: ${REPORT_THEME.primarySoft};
      color: ${REPORT_THEME.primaryDark};
      font-weight: 700;
      border: 1px solid #D8B4FE;
      padding: 7px 8px;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .report-table td {
      border: 1px solid ${REPORT_THEME.border};
      padding: 6px 8px;
      color: ${REPORT_THEME.textDark};
    }

    .report-table.table-striped tbody tr:nth-child(even) {
      background-color: #FAF5FF;
    }

    .report-table tbody tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    .empty-table-box {
      border: 1px dashed ${REPORT_THEME.borderStrong};
      border-radius: 6px;
      padding: 16px;
      text-align: center;
      color: ${REPORT_THEME.textMuted};
      font-size: 9pt;
      margin-bottom: 18px;
      background-color: ${REPORT_THEME.backgroundAlt};
    }

    /* Bloques de Alerta */
    .alert-box {
      border-radius: 5px;
      padding: 8px 12px;
      font-size: 8.5pt;
      margin-bottom: 14px;
      border-left: 3px solid;
    }

    .alert-info {
      background-color: #EFF6FF;
      border-color: #3B82F6;
      color: #1E3A8A;
    }

    .alert-warning {
      background-color: #FFFBEB;
      border-color: #F59E0B;
      color: #78350F;
    }

    .alert-success {
      background-color: #ECFDF5;
      border-color: #10B981;
      color: #064E3B;
    }

    /* Notas de Control */
    .report-notes-card {
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 6px;
      background-color: ${REPORT_THEME.backgroundAlt};
      padding: 8px 12px;
      margin-top: 14px;
      margin-bottom: 16px;
    }

    .notes-title {
      margin: 0 0 4px 0;
      font-size: 8pt;
      font-weight: 700;
      color: ${REPORT_THEME.textDark};
      text-transform: uppercase;
    }

    .notes-list {
      margin: 0;
      padding-left: 16px;
      font-size: 8pt;
      color: ${REPORT_THEME.textMuted};
    }

    .notes-list li {
      margin-bottom: 2px;
    }

    /* Sección de Firma y Sello */
    .signature-section {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 30px;
      margin-top: 26px;
      margin-bottom: 16px;
    }

    .signature-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .signature-line {
      width: 80%;
      border-bottom: 1.5px solid ${REPORT_THEME.textDark};
      margin-bottom: 6px;
      height: 35px;
    }

    .signature-name {
      margin: 0;
      font-size: 9pt;
      font-weight: 700;
      color: ${REPORT_THEME.textDark};
    }

    .signature-meta {
      margin: 2px 0 0 0;
      font-size: 7.5pt;
      color: ${REPORT_THEME.textMuted};
    }

    .signature-license {
      margin: 2px 0 0 0;
      font-size: 7pt;
      color: ${REPORT_THEME.textLight};
    }

    .seal-box {
      width: 110px;
      height: 50px;
      border: 1.5px dashed ${REPORT_THEME.primaryLight};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
      background-color: #FAF5FF;
    }

    .seal-text {
      font-size: 6.5pt;
      text-align: center;
      color: ${REPORT_THEME.primary};
      font-weight: 600;
      text-transform: uppercase;
      padding: 4px;
    }

    /* Pie de Página Institucional */
    .report-footer {
      border-top: 1px solid ${REPORT_THEME.border};
      padding-top: 8px;
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7pt;
      color: ${REPORT_THEME.textLight};
    }

    .footer-left {
      max-width: 75%;
    }

    .footer-right {
      text-align: right;
    }

    /* Estilos Personalizados Inyectados */
    ${customStyles}
  </style>
</head>
<body>
  <div class="report-container">
    <!-- Membrete Institucional -->
    <header class="report-header">
      <div class="header-brand">
        ${getCorporateLogoSvg()}
        <div class="brand-titles">
          <h1>${escapeHtml(clinic.name)}</h1>
          <p class="tagline">${escapeHtml(clinic.tagline)}</p>
          <p class="tax-id">RIF: ${escapeHtml(clinic.taxId)}</p>
        </div>
      </div>
      <div class="header-clinic-meta">
        <p>${escapeHtml(clinic.address)}</p>
        <p>Tel: ${escapeHtml(clinic.phone)} · Email: ${escapeHtml(clinic.email)}</p>
        <p>Web: ${escapeHtml(clinic.website)}</p>
      </div>
    </header>

    <!-- Franja de Identificación del Reporte -->
    <section class="report-title-card">
      <div class="title-content">
        <h2>${escapeHtml(metadata.title)}</h2>
        ${metadata.subtitle ? `<p class="subtitle">${escapeHtml(metadata.subtitle)}</p>` : ''}
        ${badgeHtml}
      </div>
      <div class="meta-box">
        <span class="code-badge">${escapeHtml(reportCode)}</span>
        <span class="emission-date">Emisión: ${escapeHtml(formattedDate)}</span>
        <span class="emission-author">Emisor: ${escapeHtml(userIssuer)}</span>
      </div>
    </section>

    <!-- Contenido Dinámico Principal del Módulo -->
    <main class="report-body">
      ${contentHtml}
    </main>

    <!-- Notas Adicionales -->
    ${notesHtml}

    <!-- Espacio para Firma y Sello Profesional -->
    ${signatureHtml}

    <!-- Pie Institucional de Confidencialidad -->
    <footer class="report-footer">
      <div class="footer-left">
        Documento oficial emitido por ATI Dental Management Suite. Contiene información clínica o administrativa confidencial amparada por normativas de secreto profesional y protección de datos médicos.
      </div>
      <div class="footer-right">
        ${escapeHtml(reportCode)} · ${escapeHtml(formattedDate)}
      </div>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Compila y renderiza el reporte a un archivo PDF físico utilizando expo-print
 */
export async function generatePdfReport(options: RenderReportOptions): Promise<ReportFileResult> {
  const html = renderReportHtml(options);
  
  // Dimensiones A4 estándar en puntos a 72 DPI (595 x 842 pt)
  const isLandscape = options.orientation === 'landscape';
  const width = isLandscape ? 842 : 595;
  const height = isLandscape ? 595 : 842;

  const result = await Print.printToFileAsync({
    html,
    width,
    height,
  });

  return {
    uri: result.uri,
    numberOfPages: result.numberOfPages,
    base64: result.base64,
  };
}

/**
 * Dispara el menú nativo de compartición (Share Sheet) de forma segura para un PDF generado
 */
export async function shareReportPdf(
  uri: string,
  options: ShareReportOptions = {},
): Promise<ShareReportResult> {
  if (Platform.OS === 'web') {
    return {
      shared: false,
      message: 'En entorno Web, compartir archivos locales por URI no está soportado de forma nativa.',
    };
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return {
      shared: false,
      message: 'La función de compartir no está disponible en este dispositivo.',
    };
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: options.mimeType || 'application/pdf',
      UTI: options.UTI || 'com.adobe.pdf',
      dialogTitle: options.dialogTitle || 'Compartir Reporte - ATI Dental',
    });

    return { shared: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // El usuario puede cancelar el diálogo de compartir sin que deba considerarse falla de la app
    return {
      shared: false,
      message: `Compartición cancelada o no completada: ${errorMsg}`,
    };
  }
}

/**
 * Envía el reporte directamente al servicio nativo de impresión (AirPrint / Android Print Service / Web Print)
 */
export async function printReport(options: RenderReportOptions): Promise<void> {
  const html = renderReportHtml(options);
  await Print.printAsync({ html });
}

/**
 * Helper unificado que genera el archivo PDF y abre fluidamente la hoja nativa de compartir
 */
export async function generateAndShareReport(
  options: RenderReportOptions,
  shareOptions?: ShareReportOptions,
): Promise<GenerateAndShareReportResult> {
  const file = await generatePdfReport(options);
  const share = await shareReportPdf(file.uri, shareOptions);

  return {
    file,
    share,
  };
}
