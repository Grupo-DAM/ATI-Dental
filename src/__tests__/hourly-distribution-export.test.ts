import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { calculatePeakHoursDistribution } from '@/components/reports/utils/reports-utils';
import {
  buildHourlyDistributionCsv,
  buildHourlyDistributionReportHtml,
  buildHourlyExportBaseName,
  shareHourlyDistributionCsv,
  shareNamedHourlyPdf,
} from '@/services/hourly-distribution-export';

jest.mock('expo-file-system', () => ({
  File: jest.fn(),
  Paths: { cache: 'cache-dir' },
}));

const headers = {
  slot: 'Franja Horaria',
  count: 'Concurrencia',
  percent: 'Porcentaje',
};

describe('exportación de distribución horaria', () => {
  const distribution = calculatePeakHoursDistribution([
    { id: '1', tiempoInicio: new Date(2026, 9, 1, 10, 0, 0) },
    { id: '2', tiempoInicio: new Date(2026, 9, 1, 10, 30, 0) },
  ]);

  it('arma un CSV con BOM UTF-8 y cabeceras de auditoría', () => {
    const csv = buildHourlyDistributionCsv(distribution, headers);
    expect(csv.startsWith('\uFEFFFranja Horaria,Concurrencia,Porcentaje')).toBe(true);
    expect(csv).toContain('\r\n10:00 - 11:00,2,100');
    expect(csv).toContain('00:00 - 01:00,0,0');
  });

  it('arma el HTML institucional con la tabla de franjas', () => {
    const html = buildHourlyDistributionReportHtml(
      distribution,
      { ...headers, peak: 'Hora pico' },
      'es',
    );
    expect(html).toContain('10:00 - 11:00');
    expect(html).toContain('Franja Horaria');
    expect(html).toContain('Hora pico');
  });

  it('escribe el archivo y abre la hoja de compartir', async () => {
    const file = {
      create: jest.fn(),
      write: jest.fn(),
      uri: 'file:///cache/distribucion.csv',
    };
    (File as unknown as jest.Mock).mockImplementation(() => file);

    const csv = buildHourlyDistributionCsv(distribution, headers);
    const shared = await shareHourlyDistributionCsv(csv, 'Exportar distribución horaria');

    expect(file.create).toHaveBeenCalled();
    expect(file.write).toHaveBeenCalledWith(csv);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(file.uri, expect.objectContaining({
      mimeType: 'text/csv',
      dialogTitle: 'Exportar distribución horaria',
    }));
    expect(shared).toBe(true);
  });

  it('nombra el PDF con el día y la ventana de horas', async () => {
    const destination = {
      exists: false,
      delete: jest.fn(),
      uri: 'file:///cache/Accesos-por-hora_2026-10-08_ultimas-4-horas.pdf',
    };
    const source = { copy: jest.fn() };
    (File as unknown as jest.Mock).mockImplementation((location: string, name?: string) => (
      name ? destination : source
    ));

    const baseName = buildHourlyExportBaseName(4, '2026-10-08', new Date(2026, 9, 8));
    expect(baseName).toBe('Accesos-por-hora_2026-10-08_ultimas-4-horas');

    await shareNamedHourlyPdf('file:///tmp/print.pdf', baseName, 'Exportar distribución horaria');

    expect(source.copy).toHaveBeenCalledWith(destination);
    expect(Sharing.shareAsync).toHaveBeenCalledWith(destination.uri, expect.objectContaining({
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar distribución horaria',
    }));
  });
});
