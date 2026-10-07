import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import i18n from '@/i18n';

/**
 * Paleta corporativa oficial de ATI Dental
 * Sincronizada fielmente con src/constants/theme.ts (Colors.light, BRAND_COLORS y TOOTH_STATES)
 */
export const REPORT_THEME = {
  // Colores principales de marca (BRAND_COLORS / Colors.light.main / header)
  primary: '#5B2D8B',       // Colors.light.main y logo
  primaryDark: '#52287D',   // Colors.light.header
  primaryLight: '#DBB4FF',  // Colors.light.mainGradient[1]
  boldAccent: '#3E1F5C',    // Colors.light.boldAccent
  primarySoft: '#F3E8FF',   // Colors.light.accentBackground
  textDark: '#141018',      // Colors.light.text
  pageTitle: '#1F2937',     // Colors.light.pageTitle
  textMuted: '#6B7280',     // Colors.light.pageSubtitle
  textLight: '#9CA3AF',     // Colors.light.breadcrumbSeparator
  border: '#DBD4E2',        // Colors.light.border
  borderStrong: '#D1D5DB',  // Colors.light.cardSeparator
  background: '#F7F6F8',    // Colors.light.background
  backgroundAlt: '#F9FAFB', // Colors.light.backgroundSecondary
  white: '#FFFFFF',

  // Estados y alertas
  success: '#10B981',       // BRAND_COLORS.positive
  warning: '#D97706',       // BRAND_COLORS.warning
  error: '#DC2626',         // BRAND_COLORS.alert / error
  info: '#2E7CEE',          // BRAND_COLORS.filled / azul clínico

  // Badges de tratamientos (Treatment badges en theme.ts)
  completeBg: '#E8F5E9', completeText: '#2E7D32',
  inProgressBg: '#FFF3E0', inProgressText: '#E65100',
  pendingBg: '#FFF8E1', pendingText: '#F57F17',
  canceledBg: '#FFEBEE', canceledText: '#C62828',
  preventitiveBg: '#E8EAF6', preventitiveText: '#283593',

  // Colores del Odontograma (Tooth states en theme.ts)
  toothStates: {
    cavity: '#F05C5E',
    filled: '#2E7CEE',
    missing: '#A5A8B1',
    implant: '#de8bd0',
    root_canal: '#FCA04B',
    fixed_dental_prosthesis: '#B18DF4',
    retained_root: '#e37c44',
    in_eruption: '#4d814f',
    temporal: '#deed5c',
  },
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
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export type ReportBadgeVariant = 'primary' | 'success' | 'warning' | 'info' | 'neutral';

export type ReportLanguage = 'es' | 'en';

export interface ReportStrings {
  clinicTagline: string;
  page: string;
  taxIdLabel: string;
  phoneLabel: string;
  emailLabel: string;
  webLabel: string;
  emissionDate: string;
  emissionAuthor: string;
  automatedSystem: string;
  observationsTitle: string;
  signatureTitleDefault: string;
  signatureSubtitleDefault: string;
  licensePrefix: string;
  sealText: string;
  sealSubtitle: string;
  confidentialityNotice: string;
  emptyTableMessage: string;
  shareDialogTitle: string;
  shareWebError: string;
  shareUnavailableError: string;
  shareCanceledOrFailed: string;
}

export const REPORT_STRINGS: Record<ReportLanguage, ReportStrings> = {
  es: {
    clinicTagline: 'Clínica Odontológica Especializada',
    page: 'Página',
    taxIdLabel: 'RIF',
    phoneLabel: 'Tel',
    emailLabel: 'Email',
    webLabel: 'Web',
    emissionDate: 'Emisión',
    emissionAuthor: 'Emisor',
    automatedSystem: 'Sistema Automatizado',
    observationsTitle: 'Observaciones y Notas de Control:',
    signatureTitleDefault: 'Dr. Odontólogo Responsable',
    signatureSubtitleDefault: 'Especialista Tratante',
    licensePrefix: 'Colegio Odontológico / Lic:',
    sealText: 'Sello Institucional ATI Dental',
    sealSubtitle: 'Validación Clínica Autorizada',
    confidentialityNotice:
      'Documento oficial emitido por ATI Dental Management Suite. Contiene información clínica o administrativa confidencial amparada por normativas de secreto profesional y protección de datos médicos.',
    emptyTableMessage: 'No hay registros disponibles para mostrar.',
    shareDialogTitle: 'Compartir Reporte - ATI Dental',
    shareWebError: 'En entorno Web, compartir archivos locales por URI no está soportado de forma nativa.',
    shareUnavailableError: 'La función de compartir no está disponible en este dispositivo.',
    shareCanceledOrFailed: 'Compartición cancelada o no completada',
  },
  en: {
    clinicTagline: 'Specialized Dental Clinic',
    page: 'Page',
    taxIdLabel: 'Tax ID',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    webLabel: 'Web',
    emissionDate: 'Issued',
    emissionAuthor: 'Issuer',
    automatedSystem: 'Automated System',
    observationsTitle: 'Observations and Control Notes:',
    signatureTitleDefault: 'Attending Dentist',
    signatureSubtitleDefault: 'Treating Specialist',
    licensePrefix: 'Dental Board / License:',
    sealText: 'ATI Dental Institutional Seal',
    sealSubtitle: 'Authorized Clinical Validation',
    confidentialityNotice:
      'Official document issued by ATI Dental Management Suite. Contains confidential clinical or administrative information protected by professional secrecy and medical data privacy regulations.',
    emptyTableMessage: 'No records available to display.',
    shareDialogTitle: 'Share Report - ATI Dental',
    shareWebError: 'On Web environment, sharing local files by URI is not supported natively.',
    shareUnavailableError: 'The share function is not available on this device.',
    shareCanceledOrFailed: 'Sharing cancelled or incomplete',
  },
};

/**
 * Resuelve el idioma aplicable al reporte ('es' o 'en')
 * Da prioridad a la selección explícita del desarrollador y recurre a i18n activo o 'es' por defecto.
 */
export function resolveReportLanguage(requested?: string): ReportLanguage {
  if (requested === 'en' || requested === 'es') {
    return requested;
  }
  if (typeof requested === 'string') {
    const lower = requested.toLowerCase();
    if (lower.startsWith('en')) return 'en';
    if (lower.startsWith('es')) return 'es';
  }
  try {
    const active = i18n?.language;
    if (typeof active === 'string' && active.toLowerCase().startsWith('en')) {
      return 'en';
    }
  } catch {
    // Si i18n no está disponible en el entorno
  }
  return 'es';
}

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
  language?: ReportLanguage;
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
  language?: ReportLanguage;
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
  language?: ReportLanguage;
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
  language?: ReportLanguage;
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
 * Logo vectorial SVG corporativo oficial de ATI Dental
 * Utiliza la silueta geométrica exacta y proporciones institucionales de la aplicación
 * (correspondiente a assets/expo.icon/Assets/logo-dental.svg y assets/images/ATI-dental-icon.png).
 */
export function getCorporateLogoSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" width="48" height="48" class="corporate-logo-icon">
      <!-- Fondo morado corporativo oficial de ATI Dental -->
      <rect width="54" height="54" rx="14" fill="#5B2D8B" />
      <!-- Isotipo oficial exacto de la muela clínica -->
      <g transform="translate(15, 14.5)">
        <path d="M18.6667 0C20.1333 0 21.3889 0.543227 22.4333 1.62968C23.4778 2.71613 24 4.02219 24 5.54785C24 5.80213 23.9833 6.14309 23.95 6.57074C23.9167 6.99838 23.8667 7.4896 23.8 8.04438L21.9667 22.018C21.8556 22.8964 21.4722 23.613 20.8167 24.1678C20.1611 24.7226 19.4111 25 18.5667 25C18.0556 25 17.5833 24.8844 17.15 24.6533C16.7167 24.4221 16.3556 24.0985 16.0667 23.6824L12.5 18.2732C12.4556 18.1808 12.3833 18.1172 12.2833 18.0825C12.1833 18.0479 12.0778 18.0305 11.9667 18.0305C11.8778 18.0305 11.7 18.1345 11.4333 18.3426L7.96667 23.5784C7.65556 24.0407 7.27222 24.3932 6.81667 24.6359C6.36111 24.8786 5.87778 25 5.36667 25C4.52222 25 3.77778 24.7168 3.13333 24.1505C2.48889 23.5841 2.11111 22.8618 2 21.9834L0.2 8.04438C0.133333 7.4896 0.0833333 6.99838 0.05 6.57074C0.0166667 6.14309 0 5.80213 0 5.54785C0 4.02219 0.522222 2.71613 1.56667 1.62968C2.61111 0.543227 3.86667 0 5.33333 0C6.13333 0 6.77222 0.109802 7.25 0.329405C7.72778 0.549007 8.18889 0.785946 8.63333 1.04022C9.07778 1.2945 9.55 1.53144 10.05 1.75104C10.55 1.97064 11.2 2.08044 12 2.08044C12.8 2.08044 13.45 1.97064 13.95 1.75104C14.45 1.53144 14.9222 1.2945 15.3667 1.04022C15.8111 0.785946 16.2778 0.549007 16.7667 0.329405C17.2556 0.109802 17.8889 0 18.6667 0ZM18.6667 2.77393C18.1556 2.77393 17.7056 2.88373 17.3167 3.10333C16.9278 3.32293 16.5 3.55987 16.0333 3.81415C15.5667 4.06842 15.0222 4.30536 14.4 4.52497C13.7778 4.74457 12.9778 4.85437 12 4.85437C11.0222 4.85437 10.2222 4.74457 9.6 4.52497C8.97778 4.30536 8.43333 4.06842 7.96667 3.81415C7.5 3.55987 7.07222 3.32293 6.68333 3.10333C6.29444 2.88373 5.84444 2.77393 5.33333 2.77393C4.6 2.77393 3.97222 3.04554 3.45 3.58877C2.92778 4.13199 2.66667 4.78502 2.66667 5.54785C2.66667 5.73278 2.67778 5.99861 2.7 6.34535C2.72222 6.69209 2.76667 7.09663 2.83333 7.55895L4.66667 21.6019C4.68889 21.7869 4.76667 21.9313 4.9 22.0354C5.03333 22.1394 5.18889 22.1914 5.36667 22.1914C5.47778 22.1914 5.57778 22.1683 5.66667 22.1221C5.75556 22.0758 5.82222 22.0065 5.86667 21.914L9.23333 16.7822C9.54444 16.3199 9.94444 15.9501 10.4333 15.6727C10.9222 15.3953 11.4444 15.2566 12 15.2566C12.5556 15.2566 13.0778 15.3953 13.5667 15.6727C14.0556 15.9501 14.4556 16.3199 14.7667 16.7822L18.2 22.018C18.2444 22.0874 18.3 22.1394 18.3667 22.1741C18.4333 22.2087 18.5111 22.2261 18.6 22.2261C18.7778 22.2261 18.9389 22.1741 19.0833 22.07C19.2278 21.966 19.3111 21.8215 19.3333 21.6366L21.1667 7.55895C21.2333 7.09663 21.2778 6.69209 21.3 6.34535C21.3222 5.99861 21.3333 5.73278 21.3333 5.54785C21.3333 4.78502 21.0722 4.13199 20.55 3.58877C20.0278 3.04554 19.4 2.77393 18.6667 2.77393Z" fill="#FFFFFF"/>
      </g>
    </svg>
  `;
}

/**
 * Formatea una fecha u objeto Date al formato corporativo estándar de ATI Dental.
 * Soporta formateo según el idioma ('es': DD/MM/YYYY HH:mm, 'en': MM/DD/YYYY HH:mm).
 */
export function formatReportDateTime(date?: string | Date, language?: string): string {
  const lang = resolveReportLanguage(language);
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
  if (Number.isNaN(d.getTime())) {
    return lang === 'en' ? new Date().toLocaleString('en-US') : new Date().toLocaleString('es-ES');
  }
  
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  if (lang === 'en') {
    return `${month}/${day}/${year} ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

let sequenceCounter = 0;

/**
 * Genera el identificador único o código estándar para reportes si no fue provisto
 */
export function generateReportCode(prefix = 'REP'): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  sequenceCounter = (sequenceCounter + 1) % 9000;

  let randomOffset = 0;
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const array = new Uint16Array(1);
    globalThis.crypto.getRandomValues(array);
    randomOffset = array[0] % 9000;
  } else {
    randomOffset = sequenceCounter;
  }

  const randomPart = 1000 + ((randomOffset + sequenceCounter) % 9000);
  return `${prefix}-${datePart}-${randomPart}`;
}

/**
 * Helper para renderizar tablas estilizadas con reglas anti-corte de página
 */
export function buildTableHtml(config: TableConfig): string {
  const lang = resolveReportLanguage(config.language);
  const defaultEmpty = REPORT_STRINGS[lang].emptyTableMessage;
  const { columns, rows, emptyMessage = defaultEmpty, striped = true } = config;

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

  const lang = resolveReportLanguage(options.language || metadata.language);
  const strings = REPORT_STRINGS[lang];

  const clinic = {
    ...DEFAULT_CLINIC_INFO,
    tagline: metadata.clinicInfo?.tagline || strings.clinicTagline,
    ...(metadata.clinicInfo || {}),
  };

  const reportCode = metadata.reportCode || generateReportCode();
  const formattedDate = formatReportDateTime(metadata.generatedAt, lang);
  const userIssuer = metadata.generatedBy || strings.automatedSystem;

  const badgeHtml = metadata.badge
    ? `<span class="report-badge badge-${metadata.badge.variant || 'primary'}">${escapeHtml(metadata.badge.label)}</span>`
    : '';

  const notesHtml = metadata.notes && metadata.notes.length > 0
    ? `
      <div class="report-notes-card keep-together">
        <h4 class="notes-title">${escapeHtml(strings.observationsTitle)}</h4>
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
          <p class="signature-name">${escapeHtml(metadata.signatureTitle || strings.signatureTitleDefault)}</p>
          <p class="signature-meta">${escapeHtml(metadata.signatureSubtitle || strings.signatureSubtitleDefault)}</p>
          ${metadata.licenseNumber ? `<p class="signature-license">${escapeHtml(strings.licensePrefix)} ${escapeHtml(metadata.licenseNumber)}</p>` : ''}
        </div>
        <div class="signature-column seal-column">
          <div class="seal-box">
            <span class="seal-text">${escapeHtml(strings.sealText)}</span>
          </div>
          <p class="signature-meta">${escapeHtml(strings.sealSubtitle)}</p>
        </div>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
  <title>${escapeHtml(metadata.title)} - ${escapeHtml(clinic.name)}</title>
  <style>
    /* Tipografía Institucional Oficial ATI Dental: Open Sans */
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap');

    /* Configuración de Hoja y Márgenes de Impresión A4 / Carta */
    @page {
      size: ${pageSize} ${orientation};
      margin: 12mm 14mm 16mm 14mm;
      @bottom-right {
        content: "${strings.page} " counter(page);
        font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
      font-family: 'Open Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
          <p class="tax-id">${escapeHtml(strings.taxIdLabel)}: ${escapeHtml(clinic.taxId)}</p>
        </div>
      </div>
      <div class="header-clinic-meta">
        <p>${escapeHtml(clinic.address)}</p>
        <p>${escapeHtml(strings.phoneLabel)}: ${escapeHtml(clinic.phone)} · ${escapeHtml(strings.emailLabel)}: ${escapeHtml(clinic.email)}</p>
        <p>${escapeHtml(strings.webLabel)}: ${escapeHtml(clinic.website)}</p>
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
        <span class="emission-date">${escapeHtml(strings.emissionDate)}: ${escapeHtml(formattedDate)}</span>
        <span class="emission-author">${escapeHtml(strings.emissionAuthor)}: ${escapeHtml(userIssuer)}</span>
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
        ${escapeHtml(strings.confidentialityNotice)}
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
  const lang = resolveReportLanguage(options.language);
  const strings = REPORT_STRINGS[lang];

  if (Platform.OS === 'web') {
    return {
      shared: false,
      message: strings.shareWebError,
    };
  }

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    return {
      shared: false,
      message: strings.shareUnavailableError,
    };
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: options.mimeType || 'application/pdf',
      UTI: options.UTI || 'com.adobe.pdf',
      dialogTitle: options.dialogTitle || strings.shareDialogTitle,
    });

    return { shared: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    // El usuario puede cancelar el diálogo de compartir sin que deba considerarse falla de la app
    return {
      shared: false,
      message: `${strings.shareCanceledOrFailed}: ${errorMsg}`,
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
  const effectiveShareOptions: ShareReportOptions = {
    language: options.language || options.metadata.language,
    ...shareOptions,
  };
  const share = await shareReportPdf(file.uri, effectiveShareOptions);

  return {
    file,
    share,
  };
}
