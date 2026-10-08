import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import HourlyDistributionScreen from '@/app/(tabs)/admin/hourly-distribution';
import { ReportService } from '@/services/report-service';
import { shareHourlyDistributionCsv } from '@/services/hourly-distribution-export';

jest.mock('@expo/vector-icons', () => {
  const ReactLib = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => ReactLib.createElement(Text, props, props.name),
  };
});

jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), push: jest.fn() },
}));

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const ReactLib = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: { testID?: string }) => ReactLib.createElement(View, { testID: props.testID }),
  };
});

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((_location?: string, name?: string) => ({
    create: jest.fn(),
    write: jest.fn(),
    copy: jest.fn(),
    delete: jest.fn(),
    exists: false,
    uri: name ? `file:///cache/${name}` : String(_location ?? 'file:///cache/source.pdf'),
  })),
  Paths: { cache: 'cache-dir' },
}));

jest.mock('@/services/hourly-distribution-export', () => {
  const actual = jest.requireActual('@/services/hourly-distribution-export');
  return {
    ...actual,
    shareHourlyDistributionCsv: jest.fn(() => Promise.resolve(true)),
  };
});

let mockUser: any = { uid: 'admin-1', email: 'admin@atidental.com', rol: 'admin' };
let mockAuthLoading = false;
let mockSessions: { id: string; tiempoInicio: Date }[] = [];

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser, loading: mockAuthLoading }),
}));

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: (name?: string) => ({
      doc: () => ({ onSnapshot: () => jest.fn() }),
      where: () => ({
        onSnapshot: (onNext: (snap: any) => void) => {
          onNext({
            docs: mockSessions.map((session) => ({
              id: session.id,
              data: () => session,
            })),
          });
          return jest.fn();
        },
      }),
      onSnapshot: () => {
        if (name === 'usuarios') return jest.fn();
        return jest.fn();
      },
    }),
  }),
}));

const translations: Record<string, string> = {
  'reports.breadcrumbCurrent': 'Reportes',
  'reports.hourlyTitle': 'Distribución horaria',
  'reports.hourlySubtitle': 'Identifique las franjas de mayor concurrencia.',
  'reports.hourlyBreadcrumb': 'Distribución horaria',
  'reports.hourlyChartTitle': 'Accesos por hora',
  'reports.totalAccessToday': 'TOTAL ACCESOS (HOY)',
  'reports.activeUsers': 'USUARIOS ACTIVOS',
  'reports.print': 'Imprimir',
  'reports.printTriggered': 'Enviando reporte a la impresora...',
  'reports.hourlyPeakTitle': 'Hora pico',
  'reports.hourlyPeaksTitle': 'Horas pico',
  'reports.hourlyAccesses': 'accesos',
  'reports.hourlyEmpty': 'Sin concurrencia registrada en el período',
  'reports.hourlyAllDays': 'Todo el período',
  'reports.hourlyWindow4': 'Últimas 4 horas',
  'reports.hourlyWindow12': 'Últimas 12 horas',
  'reports.hourlyWindow24': 'Últimas 24 horas',
  'reports.hourlyWindowTitle': 'Período',
  'reports.hourlyDayLabel': 'Día',
  'reports.hourlyCsvSlot': 'Franja Horaria',
  'reports.hourlyCsvCount': 'Concurrencia',
  'reports.hourlyCsvPercent': 'Porcentaje',
  'reports.hourlyExportDialog': 'Exportar distribución horaria',
  'reports.hourlyPdfTitle': 'Distribución horaria de accesos',
  'reports.hourlyPdfCategory': 'Reportes administrativos',
  'reports.hourlyExportError': 'No se pudo generar el reporte. Intente de nuevo.',
  'reports.period7Days': 'Últimos 7 días',
  'reports.period15Days': 'Últimos 15 días',
  'reports.period30Days': 'Últimos 30 días',
  'reports.loading': 'Cargando reportes...',
  'reports.accessDenied': 'Esta pantalla es exclusiva para administradores.',
  'reports.sessionRequired': 'Debes iniciar sesión para continuar.',
  'reports.download': 'Descargar',
  'reports.exportPdf': 'Exportar PDF',
  'reports.exportCsv': 'Exportar CSV',
  'reports.reportTypeLabel': 'Tipo de reporte',
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] || key,
    i18n: { language: 'es' },
  }),
  initReactI18next: { type: '3rdParty', init: () => undefined },
}));

function hoursBack(hours: number, minute = 10): Date {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(minute);
  date.setHours(date.getHours() - hours);
  return date;
}

function hourRangeLabel(date: Date): string {
  const start = String(date.getHours()).padStart(2, '0');
  const end = String((date.getHours() + 1) % 24).padStart(2, '0');
  return `${start}:00 - ${end}:00`;
}

describe('HourlyDistributionScreen', () => {
  let alertSpy: jest.SpyInstance;
  let pdfSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { uid: 'admin-1', email: 'admin@atidental.com', rol: 'admin' };
    mockAuthLoading = false;
    mockSessions = [];
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    pdfSpy = jest.spyOn(ReportService, 'generatePdf').mockResolvedValue({
      uri: 'file:///report.pdf',
      numberOfPages: 1,
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    pdfSpy.mockRestore();
  });

  it('muestra la hora pico y el gráfico de 24 columnas', async () => {
    const peak = hoursBack(2);
    const other = hoursBack(6);
    mockSessions = [
      { id: '1', tiempoInicio: peak },
      { id: '2', tiempoInicio: new Date(peak.getTime() + 15 * 60000) },
      { id: '3', tiempoInicio: other },
    ];
    const view = render(<HourlyDistributionScreen />);

    expect(await view.findByTestId('hourly-peak-insight')).toBeTruthy();
    expect(view.getByText('Hora pico')).toBeTruthy();
    expect(view.getByText('Últimas 24 horas')).toBeTruthy();
    expect(view.getByTestId(`hourly-peak-${peak.getHours()}`)).toBeTruthy();
    expect(view.getByText(`${hourRangeLabel(peak)} (2 accesos)`)).toBeTruthy();
    expect(view.getByTestId('kpi-cards-container')).toBeTruthy();
    expect(view.getByTestId('hourly-distribution-chart')).toBeTruthy();
    expect(view.getByTestId('chart-point-0')).toBeTruthy();
    expect(view.getByTestId('chart-point-23')).toBeTruthy();
    expect(view.toJSON()).toMatchSnapshot();
  });

  it('muestra todas las franjas empatadas', async () => {
    const first = hoursBack(2);
    const second = hoursBack(8);
    mockSessions = [
      { id: '1', tiempoInicio: first },
      { id: '2', tiempoInicio: second },
    ];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByText('Horas pico')).toBeTruthy();
    expect(view.getByTestId(`hourly-peak-${first.getHours()}`)).toBeTruthy();
    expect(view.getByTestId(`hourly-peak-${second.getHours()}`)).toBeTruthy();
  });

  it('recorta la serie a las últimas 4 horas', async () => {
    const recent = hoursBack(1);
    const older = hoursBack(10);
    mockSessions = [
      { id: '1', tiempoInicio: recent },
      { id: '2', tiempoInicio: new Date(recent.getTime() + 10 * 60000) },
      { id: '3', tiempoInicio: older },
    ];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId(`hourly-peak-${recent.getHours()}`)).toBeTruthy();

    fireEvent.press(view.getByTestId('period-filter-btn'));
    fireEvent.press(view.getByTestId('hourly-window-4'));

    await waitFor(() => {
      expect(view.getByText('Últimas 4 horas')).toBeTruthy();
      expect(view.getByTestId('chart-point-3')).toBeTruthy();
      expect(view.queryByTestId('chart-point-23')).toBeNull();
      expect(view.queryByTestId(`hourly-peak-${older.getHours()}`)).toBeNull();
    });
  });

  it('bloquea la exportación cuando no hay sesiones', async () => {
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId('hourly-empty-state')).toBeTruthy();
    expect(view.getByText('Sin concurrencia registrada en el período')).toBeTruthy();

    fireEvent.press(view.getByTestId('download-menu-btn'));
    expect(view.queryByTestId('export-menu-popover')).toBeNull();
    expect(view.getByTestId('download-menu-btn').props.accessibilityState.disabled).toBe(true);
  });

  it('exporta PDF y CSV desde el menú de descarga', async () => {
    const recent = hoursBack(1);
    mockSessions = [{ id: '1', tiempoInicio: recent }];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId(`hourly-peak-${recent.getHours()}`)).toBeTruthy();

    fireEvent.press(view.getByTestId('download-menu-btn'));
    expect(view.getByTestId('export-menu-popover')).toBeTruthy();
    expect(view.toJSON()).toMatchSnapshot();

    await act(async () => {
      fireEvent.press(view.getByTestId('export-pdf-btn'));
    });
    expect(ReportService.generatePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        pageSize: 'A4',
        metadata: expect.objectContaining({
          title: 'Distribución horaria de accesos',
          showSignatureBlock: false,
          language: 'es',
        }),
      }),
    );
    const pdfOptions = (ReportService.generatePdf as jest.Mock).mock.calls[0][0];
    expect(pdfOptions.contentHtml).toContain(hourRangeLabel(recent));
    expect(pdfOptions.contentHtml).toContain('Franja Horaria');

    fireEvent.press(view.getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(view.getByTestId('export-csv-btn'));
    });
    expect(shareHourlyDistributionCsv).toHaveBeenCalledWith(
      expect.stringContaining('\uFEFFFranja Horaria,Concurrencia,Porcentaje'),
      'Exportar distribución horaria',
      expect.stringMatching(/^Accesos-por-hora_\d{4}-\d{2}-\d{2}_ultimas-24-horas\.csv$/),
    );
  });

  it('niega la pantalla a quien no es administrador', async () => {
    mockUser = { uid: 'user-1', email: 'user@atidental.com', rol: 'odontologo' };
    render(<HourlyDistributionScreen />);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Esta pantalla es exclusiva para administradores.', '');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
    });
    expect(ReportService.generatePdf).not.toHaveBeenCalled();
  });
});
