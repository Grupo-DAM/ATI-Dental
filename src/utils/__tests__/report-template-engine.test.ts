import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

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
  REPORT_THEME,
  shareReportPdf,
} from '../report-template-engine';

describe('report-template-engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('escapeHtml', () => {
    it('sanitiza caracteres especiales para prevenir inyecciones XSS', () => {
      const input = '<script>alert("XSS & test")</script>\'';
      const output = escapeHtml(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;XSS &amp; test&quot;)&lt;/script&gt;&#39;');
    });

    it('maneja valores nulos o indefinidos retornando cadena vacía', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    it('convierte números y booleanos a cadenas de texto de forma segura', () => {
      expect(escapeHtml(1234)).toBe('1234');
      expect(escapeHtml(true)).toBe('true');
    });
  });

  describe('formatReportDateTime y generateReportCode', () => {
    it('formatea fechas al patrón institucional DD/MM/YYYY HH:mm', () => {
      const fixedDate = new Date(2026, 4, 15, 14, 30);
      const formatted = formatReportDateTime(fixedDate);
      expect(formatted).toBe('15/05/2026 14:30');
    });

    it('maneja fechas inválidas retornando fallback sin lanzar error', () => {
      const result = formatReportDateTime('fecha-invalida');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('genera códigos de reporte únicos con el prefijo especificado', () => {
      const code1 = generateReportCode('REP');
      const code2 = generateReportCode('CLI');
      expect(code1).toMatch(/^REP-\d{8}-\d{4}$/);
      expect(code2).toMatch(/^CLI-\d{8}-\d{4}$/);
      expect(code1).not.toBe(code2);
    });
  });

  describe('Helper Builders de Componentes HTML', () => {
    it('buildTableHtml genera tabla con thead, tbody y estilos de alineación', () => {
      const html = buildTableHtml({
        columns: [
          { header: 'ID', align: 'center', width: '20%' },
          { header: 'Paciente', align: 'left' },
          { header: 'Monto', align: 'right' },
        ],
        rows: [
          ['001', 'Juan Pérez', '$120.00'],
          ['002', 'María Gómez', '$85.00'],
        ],
        striped: true,
      });

      expect(html).toContain('class="report-table table-striped"');
      expect(html).toContain('style="width: 20%; text-align: center;">ID</th>');
      expect(html).toContain('Juan Pérez');
      expect(html).toContain('María Gómez');
      expect(html).toContain('<td style="text-align: right;">$85.00</td>');
    });

    it('buildTableHtml maneja casos sin registros mostrando mensaje amigable', () => {
      const html = buildTableHtml({
        columns: [{ header: 'Columna' }],
        rows: [],
        emptyMessage: 'Sin datos disponibles.',
      });

      expect(html).toContain('class="empty-table-box"');
      expect(html).toContain('Sin datos disponibles.');
    });

    it('buildMetricCardsHtml renderiza tarjetas de indicadores y variantes', () => {
      const html = buildMetricCardsHtml([
        { label: 'Total Pacientes', value: '142', hint: '+12% este mes', variant: 'primary' },
        { label: 'Citas Completadas', value: '98', variant: 'success' },
      ]);

      expect(html).toContain('class="metric-cards-grid keep-together"');
      expect(html).toContain('metric-primary');
      expect(html).toContain('metric-success');
      expect(html).toContain('Total Pacientes');
      expect(html).toContain('142');
      expect(html).toContain('+12% este mes');
    });

    it('buildMetricCardsHtml retorna cadena vacía si no hay tarjetas', () => {
      expect(buildMetricCardsHtml([])).toBe('');
    });

    it('buildInfoGridHtml renderiza elementos clave en estructura de grid', () => {
      const html = buildInfoGridHtml([
        { label: 'Especialidad', value: 'Ortodoncia' },
        { label: 'Consultorio', value: 'Box 02' },
      ]);

      expect(html).toContain('class="info-grid-container keep-together"');
      expect(html).toContain('Especialidad:');
      expect(html).toContain('Ortodoncia');
    });

    it('buildAlertBoxHtml renderiza cajas de mensaje con clases de color adecuadas', () => {
      const html = buildAlertBoxHtml('Aviso de confidencialidad', 'warning');
      expect(html).toContain('class="alert-box alert-warning keep-together"');
      expect(html).toContain('Aviso de confidencialidad');
    });
  });

  describe('renderReportHtml (Plantilla Base Corporativa)', () => {
    it('integra el membrete oficial, logotipo SVG, datos fiscales y contacto de ATI Dental', () => {
      const html = renderReportHtml({
        metadata: {
          title: 'Reporte General de Actividad',
        },
        contentHtml: '<p>Contenido de prueba</p>',
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain(DEFAULT_CLINIC_INFO.name);
      expect(html).toContain(DEFAULT_CLINIC_INFO.taxId);
      expect(html).toContain(DEFAULT_CLINIC_INFO.email);
      expect(html).toContain(REPORT_THEME.primary);
      expect(html).toContain('class="corporate-logo-icon"');
      expect(html).toContain('Reporte General de Actividad');
      expect(html).toContain('Contenido de prueba');
    });

    it('incluye reglas CSS de paginación A4 y anti-corte de página (@page y break-inside)', () => {
      const html = renderReportHtml({
        metadata: {
          title: 'Agenda Semanal',
        },
        contentHtml: '<p>Citas</p>',
        pageSize: 'A4',
        orientation: 'portrait',
      });

      expect(html).toContain('size: A4 portrait');
      expect(html).toContain('margin: 12mm 14mm 16mm 14mm');
      expect(html).toContain('page-break-inside: avoid !important');
      expect(html).toContain('break-inside: avoid !important');
      expect(html).toContain('table-header-group');
    });

    it('renderiza badges, observaciones y sección de firma y sello profesional', () => {
      const html = renderReportHtml({
        metadata: {
          title: 'Historial Clínico Odontológico',
          subtitle: 'Expediente Integral de Tratamientos',
          badge: { label: 'CONFIDENCIAL', variant: 'warning' },
          notes: ['Paciente alérgico a la penicilina', 'Seguimiento cada 6 meses'],
          signatureTitle: 'Dr. Alejandro Morales',
          signatureSubtitle: 'Cirujano Maxilofacial',
          licenseNumber: 'MPPS-78491',
          showSignatureBlock: true,
        },
        contentHtml: '<p>Detalles clínicos</p>',
      });

      expect(html).toContain('CONFIDENCIAL');
      expect(html).toContain('badge-warning');
      expect(html).toContain('Paciente alérgico a la penicilina');
      expect(html).toContain('Dr. Alejandro Morales');
      expect(html).toContain('Cirujano Maxilofacial');
      expect(html).toContain('MPPS-78491');
      expect(html).toContain('Sello Institucional ATI Dental');
    });

    it('permite ocultar el bloque de firmas cuando showSignatureBlock es false', () => {
      const html = renderReportHtml({
        metadata: {
          title: 'Reporte Administrativo',
          showSignatureBlock: false,
        },
        contentHtml: '<p>Métricas</p>',
      });

      expect(html).not.toContain('class="signature-section');
    });
  });

  describe('Generación de PDF y Servicio Nativo', () => {
    it('generatePdfReport invoca Print.printToFileAsync con dimensiones estándar A4 (595x842)', async () => {
      const result = await generatePdfReport({
        metadata: { title: 'Reporte de Sesiones' },
        contentHtml: '<p>Horas pico</p>',
      });

      expect(Print.printToFileAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 595,
          height: 842,
          html: expect.stringContaining('Reporte de Sesiones'),
        })
      );
      expect(result.uri).toBeDefined();
      expect(result.numberOfPages).toBeGreaterThanOrEqual(1);
    });

    it('generatePdfReport ajusta dimensiones cuando la orientación es apaisada (landscape)', async () => {
      await generatePdfReport({
        metadata: { title: 'Gráficos Detallados' },
        contentHtml: '<p>Gráficos</p>',
        orientation: 'landscape',
      });

      expect(Print.printToFileAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 842,
          height: 595,
        })
      );
    });

    it('printReport invoca Print.printAsync con el HTML renderizado', async () => {
      await printReport({
        metadata: { title: 'Impresión de Agenda' },
        contentHtml: '<p>Agenda</p>',
      });

      expect(Print.printAsync).toHaveBeenCalledWith({
        html: expect.stringContaining('Impresión de Agenda'),
      });
    });

    it('shareReportPdf abre la hoja nativa de compartir en plataformas soportadas', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

      const shareResult = await shareReportPdf('file:///test/report.pdf', {
        dialogTitle: 'Compartir Ficha Clínica',
      });

      expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///test/report.pdf', {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Compartir Ficha Clínica',
      });
      expect(shareResult.shared).toBe(true);
    });

    it('shareReportPdf retorna mensaje informativo en entorno Web', async () => {
      const originalOS = Platform.OS;
      Platform.OS = 'web';
      try {
        const result = await shareReportPdf('file:///test/report.pdf');
        expect(result.shared).toBe(false);
        expect(result.message).toContain('Web');
      } finally {
        Platform.OS = originalOS;
      }
    });

    it('shareReportPdf maneja de forma segura dispositivos sin soporte de compartir', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);

      const shareResult = await shareReportPdf('file:///test/report.pdf');

      expect(shareResult.shared).toBe(false);
      expect(shareResult.message).toContain('no está disponible');
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('shareReportPdf maneja cancelaciones o excepciones sin congelar la app', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
      (Sharing.shareAsync as jest.Mock).mockRejectedValueOnce(new Error('User dismissed share dialog'));

      const shareResult = await shareReportPdf('file:///test/report.pdf');

      expect(shareResult.shared).toBe(false);
      expect(shareResult.message).toContain('User dismissed share dialog');
    });

    it('generateAndShareReport ejecuta el flujo completo de generación y compartición', async () => {
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

      const fullResult = await generateAndShareReport({
        metadata: { title: 'Directorio de Pacientes' },
        contentHtml: '<p>Lista</p>',
      });

      expect(Print.printToFileAsync).toHaveBeenCalled();
      expect(Sharing.shareAsync).toHaveBeenCalled();
      expect(fullResult.file.uri).toBeDefined();
      expect(fullResult.share.shared).toBe(true);
    });
  });

  describe('Criterio de Aceptación: Rendimiento (< 2 segundos)', () => {
    it('renderReportHtml y generatePdfReport compilan en menos de 2 segundos', async () => {
      const start = Date.now();

      // Generamos un reporte volumétrico con 100 filas
      const rows = Array.from({ length: 100 }, (_, i) => [
        `P-${1000 + i}`,
        `Paciente Ejemplo ${i + 1}`,
        'Limpieza Dental',
        '2026-10-06',
        'Completado',
      ]);

      const tableHtml = buildTableHtml({
        columns: [
          { header: 'Código' },
          { header: 'Nombre' },
          { header: 'Procedimiento' },
          { header: 'Fecha' },
          { header: 'Estado' },
        ],
        rows,
      });

      const metricsHtml = buildMetricCardsHtml([
        { label: 'Total', value: '100' },
        { label: 'Completados', value: '100', variant: 'success' },
      ]);

      const result = await generatePdfReport({
        metadata: {
          title: 'Reporte Volumétrico de Rendimiento',
          notes: ['Prueba de estrés de generación de documento'],
        },
        contentHtml: `${metricsHtml}${tableHtml}`,
      });

      const durationMs = Date.now() - start;
      expect(durationMs).toBeLessThan(2000);
      expect(result.uri).toBeDefined();
    });
  });
});
