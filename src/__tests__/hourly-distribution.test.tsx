import React from 'react';
import { Alert, Platform } from 'react-native';
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
  const { Pressable } = require('react-native');
  return {
    __esModule: true,
    default: (props: {
      testID?: string;
      locale?: string;
      onChange?: (event: { type?: string }, date?: Date) => void;
    }) => ReactLib.createElement(Pressable, {
      testID: props.testID,
      accessibilityLabel: props.locale,
      onPress: () => props.onChange?.({ type: 'set' }, new Date(2026, 9, 7, 12, 0, 0)),
    }),
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
let mockLanguage = 'es';
let mockSessionError: { code?: string; message?: string } | null = null;
let mockSessions: { id: string; tiempoInicio: Date }[] = [];

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: mockUser, loading: mockAuthLoading }),
}));

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: (name?: string) => ({
      doc: () => ({ onSnapshot: () => jest.fn() }),
      where: () => ({
        onSnapshot: (onNext: (snap: any) => void, onError?: (error: unknown) => void) => {
          if (mockSessionError && onError) {
            onError(mockSessionError);
            return jest.fn();
          }
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
  'reports.permissionError': 'No tienes permisos en Firestore para consultar las sesiones del sistema.',
  'reports.errorLoad': 'Error al cargar',
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
    i18n: { get language() { return mockLanguage; } },
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

const FIXED_NOW = new Date(2026, 9, 8, 15, 30, 0);

describe('HourlyDistributionScreen', () => {
  let alertSpy: jest.SpyInstance;
  let pdfSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers({
      now: FIXED_NOW,
      doNotFake: [
        'nextTick',
        'queueMicrotask',
        'setImmediate',
        'clearImmediate',
        'setInterval',
        'clearInterval',
        'setTimeout',
        'clearTimeout',
      ],
    });
    jest.clearAllMocks();
    mockUser = { uid: 'admin-1', email: 'admin@atidental.com', rol: 'admin' };
    mockAuthLoading = false;
    mockLanguage = 'es';
    mockSessionError = null;
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
    jest.useRealTimers();
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

  it('pide sesión cuando no hay usuario', async () => {
    mockUser = null;
    render(<HourlyDistributionScreen />);
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Debes iniciar sesión para continuar.', '');
      expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
    });
  });

  it('no redirige mientras la sesión todavía carga', () => {
    mockAuthLoading = true;
    mockUser = null;
    render(<HourlyDistributionScreen />);
    expect(alertSpy).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('filtra un día con el calendario y vuelve a todo el período', async () => {
    mockSessions = [{ id: '1', tiempoInicio: hoursBack(1) }];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByText('Todo el período')).toBeTruthy();

    fireEvent.press(view.getByTestId('hourly-day-select'));
    fireEvent.press(view.getByTestId('hourly-day-picker'));
    expect(view.getByText('07/10/2026')).toBeTruthy();
    fireEvent.press(view.getByTestId('hourly-day-confirm'));

    fireEvent.press(view.getByTestId('hourly-day-calendar'));
    expect(view.getByTestId('hourly-day-picker')).toBeTruthy();
    fireEvent.press(view.getByTestId('hourly-day-confirm'));

    fireEvent.press(view.getByTestId('hourly-day-clear'));
    expect(view.getByText('Todo el período')).toBeTruthy();
  });

  it('abre el calendario en inglés', async () => {
    mockLanguage = 'en';
    mockSessions = [{ id: '1', tiempoInicio: hoursBack(1) }];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId('hourly-day-select')).toBeTruthy();
    fireEvent.press(view.getByTestId('hourly-day-select'));
    expect(view.getByTestId('hourly-day-picker').props.accessibilityLabel).toBe('en-US');
  });

  it('recorta la serie a las últimas 12 horas', async () => {
    const recent = hoursBack(1);
    mockSessions = [{ id: '1', tiempoInicio: recent }];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId(`hourly-peak-${recent.getHours()}`)).toBeTruthy();

    fireEvent.press(view.getByTestId('period-filter-btn'));
    fireEvent.press(view.getByTestId('hourly-window-12'));

    await waitFor(() => {
      expect(view.getByText('Últimas 12 horas')).toBeTruthy();
      expect(view.getByTestId('chart-point-11')).toBeTruthy();
      expect(view.queryByTestId('chart-point-23')).toBeNull();
    });
  });

  it('bloquea la exportación cuando Firestore rechaza la consulta', async () => {
    mockSessionError = { code: 'firestore/permission-denied', message: 'permission-denied' };
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByText('No tienes permisos en Firestore para consultar las sesiones del sistema.')).toBeTruthy();
    expect(view.getByTestId('download-menu-btn').props.accessibilityState.disabled).toBe(true);
  });

  it('muestra el error genérico de carga', async () => {
    mockSessionError = { message: 'unavailable' };
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByText('Error al cargar')).toBeTruthy();
  });

  it('avisa al imprimir y cierra el menú de descarga', async () => {
    const recent = hoursBack(1);
    mockSessions = [{ id: '1', tiempoInicio: recent }];
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId(`hourly-peak-${recent.getHours()}`)).toBeTruthy();

    fireEvent.press(view.getByTestId('print-btn'));
    expect(alertSpy).toHaveBeenCalledWith('Imprimir', 'Enviando reporte a la impresora...');

    fireEvent.press(view.getByTestId('download-menu-btn'));
    expect(view.getByTestId('export-menu-popover')).toBeTruthy();
    fireEvent.press(view.getByTestId('export-menu-backdrop'));
    expect(view.queryByTestId('export-menu-popover')).toBeNull();
    fireEvent.press(view.getByTestId('download-menu-btn'));
    fireEvent.press(view.getByTestId('download-menu-btn'));
    expect(view.queryByTestId('export-menu-popover')).toBeNull();
  });

  it('imprime con window.print en web', async () => {
    const print = jest.fn();
    const previousOs = Platform.OS;
    const previousWindow = globalThis.window;
    Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'web' });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { print } });
    try {
      mockSessions = [{ id: '1', tiempoInicio: hoursBack(1) }];
      const view = render(<HourlyDistributionScreen />);
      expect(await view.findByTestId('print-btn')).toBeTruthy();
      fireEvent.press(view.getByTestId('print-btn'));
      expect(print).toHaveBeenCalled();
    } finally {
      Object.defineProperty(Platform, 'OS', { configurable: true, get: () => previousOs });
      Object.defineProperty(globalThis, 'window', { configurable: true, value: previousWindow });
    }
  });

  it('avisa si el PDF o el CSV no se pueden generar', async () => {
    const recent = hoursBack(1);
    mockSessions = [{ id: '1', tiempoInicio: recent }];
    pdfSpy.mockRejectedValueOnce(new Error('pdf'));
    (shareHourlyDistributionCsv as jest.Mock).mockRejectedValueOnce(new Error('csv'));
    const view = render(<HourlyDistributionScreen />);
    expect(await view.findByTestId(`hourly-peak-${recent.getHours()}`)).toBeTruthy();

    fireEvent.press(view.getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(view.getByTestId('export-pdf-btn'));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No se pudo generar el reporte. Intente de nuevo.', '');
    });

    fireEvent.press(view.getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(view.getByTestId('export-csv-btn'));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No se pudo generar el reporte. Intente de nuevo.', '');
    });
  });
});
