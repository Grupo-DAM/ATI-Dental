import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { ReportService } from '@/services/report-service';

describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderHtml compila el reporte con la plantilla base', () => {
    const html = ReportService.renderHtml({
      metadata: { title: 'Reporte Clínico' },
      contentHtml: '<p>Contenido</p>',
    });

    expect(html).toContain('Reporte Clínico');
    expect(html).toContain('ATI DENTAL');
  });

  it('generatePdf invoca Print.printToFileAsync', async () => {
    const result = await ReportService.generatePdf({
      metadata: { title: 'Expediente' },
      contentHtml: '<p>Datos</p>',
    });

    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(result.uri).toBeDefined();
  });

  it('sharePdf invoca Sharing.shareAsync', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

    const shareResult = await ReportService.sharePdf('file:///test.pdf');

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///test.pdf', expect.any(Object));
    expect(shareResult.shared).toBe(true);
  });

  it('print invoca Print.printAsync', async () => {
    await ReportService.print({
      metadata: { title: 'Imprimir Citas' },
      contentHtml: '<p>Citas</p>',
    });

    expect(Print.printAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Imprimir Citas'),
      })
    );
  });

  it('generateAndShare ejecuta ambos pasos de generación y compartición', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);

    const result = await ReportService.generateAndShare({
      metadata: { title: 'Resumen Mensual' },
      contentHtml: '<p>KPIs</p>',
    });

    expect(Print.printToFileAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalled();
    expect(result.file.uri).toBeDefined();
    expect(result.share.shared).toBe(true);
  });

  it('expone helpers de construcción de componentes visuales', () => {
    const tableHtml = ReportService.buildTable({
      columns: [{ header: 'Col' }],
      rows: [['Val']],
    });
    expect(tableHtml).toContain('report-table');

    const metricsHtml = ReportService.buildMetrics([
      { label: 'Pacientes', value: '50' },
    ]);
    expect(metricsHtml).toContain('metric-card');

    const infoGridHtml = ReportService.buildInfoGrid([
      { label: 'Doctor', value: 'Dra. Ana' },
    ]);
    expect(infoGridHtml).toContain('info-grid-container');

    const alertHtml = ReportService.buildAlert('Mensaje importante', 'warning');
    expect(alertHtml).toContain('alert-warning');
  });

  it('soporta internacionalización (i18n) en español e inglés', () => {
    expect(ReportService.resolveLanguage('en')).toBe('en');
    expect(ReportService.resolveLanguage('es')).toBe('es');
    expect(ReportService.STRINGS.es.clinicTagline).toBe('Clínica Odontológica Especializada');
    expect(ReportService.STRINGS.en.clinicTagline).toBe('Specialized Dental Clinic');

    const htmlEn = ReportService.renderHtml({
      metadata: { title: 'Clinical Summary', language: 'en' },
      contentHtml: '<p>Details</p>',
    });

    expect(htmlEn).toContain('<html lang="en">');
    expect(htmlEn).toContain('Specialized Dental Clinic');
    expect(htmlEn).toContain('Issued:');
    expect(htmlEn).toContain('ATI Dental Institutional Seal');

    const tableEn = ReportService.buildTable({
      columns: [{ header: 'Items' }],
      rows: [],
      language: 'en',
    });
    expect(tableEn).toContain('No records available to display.');
  });
});
