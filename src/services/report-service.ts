/**
 * Servicio corporativo de Reportes para ATI Dental.
 * Expone métodos de alto nivel para compilar, imprimir y exportar documentos PDF
 * interactuando con el motor de plantillas y las APIs nativas de Expo.
 */
import {
  buildAlertBoxHtml,
  buildInfoGridHtml,
  buildMetricCardsHtml,
  buildTableHtml,
  DEFAULT_CLINIC_INFO,
  escapeHtml,
  formatReportDateTime,
  generateAndShareReport,
  generatePdfReport,
  generateReportCode,
  printReport,
  renderReportHtml,
  REPORT_STRINGS,
  REPORT_THEME,
  resolveReportLanguage,
  shareReportPdf,
} from '@/utils/report-template-engine';
import type {
  GenerateAndShareReportResult,
  InfoGridItem,
  MetricCardItem,
  RenderReportOptions,
  ReportFileResult,
  ReportLanguage,
  ReportStrings,
  ShareReportOptions,
  ShareReportResult,
  TableConfig,
} from '@/utils/report-template-engine';

export class ReportService {
  /**
   * Genera el HTML compilado del reporte aplicando la identidad institucional
   */
  static renderHtml(options: RenderReportOptions): string {
    return renderReportHtml(options);
  }

  /**
   * Genera el archivo físico PDF en el almacenamiento local del dispositivo
   */
  static async generatePdf(options: RenderReportOptions): Promise<ReportFileResult> {
    return generatePdfReport(options);
  }

  /**
   * Despliega la hoja nativa de compartir (Share Sheet) de forma segura
   */
  static async sharePdf(uri: string, options?: ShareReportOptions): Promise<ShareReportResult> {
    return shareReportPdf(uri, options);
  }

  /**
   * Envía el reporte a la cola de impresión nativa (AirPrint / Android Print Service / Web Print)
   */
  static async print(options: RenderReportOptions): Promise<void> {
    return printReport(options);
  }

  /**
   * Flujo compuesto: genera el PDF y abre automáticamente el menú de compartir
   */
  static async generateAndShare(
    options: RenderReportOptions,
    shareOptions?: ShareReportOptions
  ): Promise<GenerateAndShareReportResult> {
    return generateAndShareReport(options, shareOptions);
  }

  /**
   * Constructor de tablas corporativas con reglas de paginación A4
   */
  static buildTable(config: TableConfig): string {
    return buildTableHtml(config);
  }

  /**
   * Constructor de tarjetas métricas (KPIs)
   */
  static buildMetrics(cards: MetricCardItem[]): string {
    return buildMetricCardsHtml(cards);
  }

  /**
   * Constructor de fichas de información en cuadrícula
   */
  static buildInfoGrid(items: InfoGridItem[]): string {
    return buildInfoGridHtml(items);
  }

  /**
   * Constructor de bloques de alertas u observaciones destacadas
   */
  static buildAlert(message: string, variant: 'info' | 'warning' | 'success' = 'info'): string {
    return buildAlertBoxHtml(message, variant);
  }

  /**
   * Resuelve el idioma del reporte ('es' o 'en')
   */
  static resolveLanguage(requested?: string): ReportLanguage {
    return resolveReportLanguage(requested);
  }

  static readonly STRINGS = REPORT_STRINGS;
}

export {
  escapeHtml,
  formatReportDateTime,
  generateReportCode,
  resolveReportLanguage,
  DEFAULT_CLINIC_INFO,
  REPORT_THEME,
  REPORT_STRINGS,
};
export type {
  GenerateAndShareReportResult,
  InfoGridItem,
  MetricCardItem,
  RenderReportOptions,
  ReportFileResult,
  ReportLanguage,
  ReportStrings,
  ShareReportOptions,
  ShareReportResult,
  TableConfig,
};
