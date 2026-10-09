import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';

import AdminReportsScreen from '@/app/(tabs)/admin/reports';
import { UsageLineChart } from '@/components/reports/usage-line-chart';

// Mock de @expo/vector-icons para evitar advertencias de act(...) por carga asíncrona de fuentes
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
    MaterialIcons: (props: any) => React.createElement(Text, props, props.name),
    FontAwesome: (props: any) => React.createElement(Text, props, props.name),
  };
});

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((_location?: string, name?: string) => ({
    create: jest.fn(),
    write: jest.fn(),
    copy: jest.fn(),
    delete: jest.fn(),
    exists: false,
    uri: name ? `file:///cache/${name}` : 'file:///tmp/print.pdf',
  })),
  Paths: { cache: 'cache-dir' },
}));

let mockUser: any = {
  uid: 'admin-123',
  email: 'admin@atidental.com',
  rol: 'admin',
};
let mockAuthLoading = false;

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

let mockOnSnapshot = jest.fn((onNext: any, onError?: any) => {
  onNext({ docs: [], empty: true });
  return jest.fn();
});

let mockDocSnapshot = jest.fn((onNext: any) => {
  onNext({
    exists: () => true,
    data: () => ({
      dau: 45,
      mau: 142,
      historico: [
        { label: 'Abr', mau: 125, dau: 35 },
        { label: 'May', mau: 140, dau: 42 },
        { label: 'Jun', mau: 135, dau: 40 },
        { label: 'Jul', mau: 152, dau: 46 },
        { label: 'Ago', mau: 160, dau: 50 },
        { label: 'Sep', mau: 142, dau: 45 },
      ],
    }),
  });
  return jest.fn();
});

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: (col?: string) => ({
      doc: () => ({
        onSnapshot: (...args: any[]) => mockDocSnapshot(args[0]),
      }),
      where: () => ({
        onSnapshot: (...args: any[]) => mockOnSnapshot(args[0], args[1]),
      }),
      onSnapshot: (...args: any[]) => {
        if (col === 'usuarios') {
          return jest.fn();
        }
        return mockOnSnapshot(args[0], args[1]);
      },
    }),
  }),
}));

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'reports.breadcrumbParent': 'Administración',
    'reports.breadcrumbCurrent': 'Reportes',
    'reports.title': 'Generar Reportes',
    'reports.subtitle': 'Consulte y exporte reportes de usuarios, pacientes, citas, y actvidad del sistema',
    'reports.reportTypeLabel': 'Tipo de reporte',
    'reports.reportTypeUsage': 'Visualizar tiempo de uso por usuario',
    'reports.totalAccessToday': 'TOTAL ACCESOS (HOY)',
    'reports.activeUsers': 'USUARIOS ACTIVOS',
    'reports.chartTitle': 'Accesos Diarios al Sistema',
    'reports.chartTitleUsage': 'Tiempo de Uso Diario',
    'reports.period30Days': 'Últimos 30 días',
    'reports.period15Days': 'Últimos 15 días',
    'reports.period7Days': 'Últimos 7 días',
    'reports.emptyState': 'No hay registros de tiempo de uso en este rango de fechas',
    'reports.print': 'Imprimir',
    'reports.download': 'Descargar',
    'reports.exportPdf': 'Exportar PDF',
    'reports.exportCsv': 'Exportar CSV',
    'reports.pdfExportSuccess': 'Reporte generado con éxito',
    'reports.pdfExportMessage': 'El archivo PDF ha sido preparado para su descarga.',
    'reports.csvExportSuccess': 'Archivo CSV generado',
    'reports.csvExportMessage': 'Los datos tabulares han sido preparados para su descarga.',
    'reports.printTriggered': 'Enviando reporte a la impresora...',
    'reports.exportNoData': 'No hay datos disponibles para exportar o imprimir en este reporte.',
    'reports.exportError': 'Ocurrió un error al generar o compartir el reporte.',
    'reports.printError': 'Ocurrió un error al enviar el reporte a imprimir.',
    'reports.accessDenied': 'Esta pantalla es exclusiva para administradores.',
    'reports.sessionRequired': 'Debes iniciar sesión para continuar.',
    'reports.loading': 'Cargando reportes...',
    'reports.permissionError': 'No tienes permisos en Firestore para consultar las sesiones del sistema.',
    'reports.reportTypeDauMau': 'Usuarios activos diarios vs mensuales',
    'reports.dauMauChartTitle': 'DAU VS MAU',
    'reports.kpiRatio': 'RATIO',
    'reports.kpiDau': 'DAU (DIARIOS)',
    'reports.kpiMau': 'MAU (MENS.)',
    'reports.kpiDailyAvg': 'Prom. diario',
    'reports.kpiThisMonth': 'Este mes',
    'reports.mauLegend': 'MAU (Activos Mensuales)',
    'reports.dauLegend': 'DAU (Diarios)',
    'reports.viewHourlyDistribution': 'Ver Distribución Horaria',
    'reports.reportTypeHourly': 'Visualizar tiempo de uso por hora',
  };
  return translations[key] || key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'es' },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('@/services/report-service', () => ({
  ReportService: {
    generateAndShare: jest.fn(() => Promise.resolve({
      file: { uri: 'mock-uri', numberOfPages: 1 },
      share: { shared: true },
    })),
    print: jest.fn(() => Promise.resolve()),
    renderHtml: jest.fn(() => '<html>mock</html>'),
    generatePdf: jest.fn(() => Promise.resolve({ uri: 'mock-uri', numberOfPages: 1 })),
    sharePdf: jest.fn(() => Promise.resolve({ shared: true })),
    buildTable: jest.fn(() => '<table>mock</table>'),
    buildMetrics: jest.fn(() => '<div>metrics</div>'),
    buildSvgLineChart: jest.fn(() => '<div>line-chart</div>'),
    buildBarChart: jest.fn(() => '<div>bar-chart</div>'),
    buildDonutChart: jest.fn(() => '<div>donut-chart</div>'),
    buildInfoGrid: jest.fn(() => '<div>grid</div>'),
    buildAlert: jest.fn(() => '<div>alert</div>'),
    resolveLanguage: jest.fn((lang?: string) => (lang?.startsWith('en') ? 'en' : 'es')),
  },
}));

jest.mock('@/components/reports/views/UserDemographicsReportView', () => ({
  UserDemographicsReportView: ({ onDataReady }: any) => {
    const React = require('react');
    React.useEffect(() => {
      onDataReady({
        totalUsers: 15,
        averageAge: 29,
        ageBuckets: [{ key: '25-34', count: 15 }],
        genderSlices: [{ key: 'Femenino', count: 10, percent: 66 }],
      });
    }, [onDataReady]);
    return null;
  },
}));

jest.mock('@/components/reports/views/UserGeographicsReportView', () => ({
  UserGeographicsReportView: ({ onDataReady }: any) => {
    const React = require('react');
    React.useEffect(() => {
      onDataReady({
        totalCities: 1,
        mainCountry: 'Venezuela',
        mainCountryPercent: 100,
        totalUsers: 15,
        countryBuckets: [{ key: 'Venezuela', count: 15 }],
        regionSlices: [{ key: 'Caracas', count: 15 }],
      });
    }, [onDataReady]);
    return null;
  },
}));

jest.mock('@/components/reports/views/CrashRateReportView', () => ({
  CrashRateReportView: ({ onDataReady }: any) => {
    const React = require('react');
    React.useEffect(() => {
      onDataReady({
        totalCrashesValue: 2,
        affectedUsersValue: 1,
        calculatedCrashRateString: '0.5%',
        crashRateData: [{ label: '2026-10-08', value: 0.5 }],
      });
    }, [onDataReady]);
    return null;
  },
}));

jest.mock('@/components/reports/views/RetentionReportView', () => ({
  RetentionReportView: ({ onDataReady }: any) => {
    const React = require('react');
    React.useEffect(() => {
      onDataReady({
        retentionData: [{ cohort: '2026-10-01', label: 'Día 1', percentage: 80 }],
        day1String: '80%',
        day7String: '60%',
        day30String: '40%',
      });
    }, [onDataReady]);
    return null;
  },
}));

describe('AdminReportsScreen (US-26: Visualizar tiempo de uso por usuario)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      uid: 'admin-123',
      email: 'admin@atidental.com',
      rol: 'admin',
    };
    mockAuthLoading = false;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    mockOnSnapshot = jest.fn((onNext) => {
      onNext({ docs: [], empty: true });
      return jest.fn();
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('Escenario 1: Carga y visualización correcta del gráfico de tiempo de uso con datos de Firestore', async () => {
    const now = Date.now();
    const mockSessions = [
      {
        id: 's1',
        data: () => ({
          userId: 'user-1',
          fecha: now,
          tiempoInicio: now - 30 * 60000,
          tiempoFin: now,
          tiempoUso: 30,
        }),
      },
      {
        id: 's2',
        data: () => ({
          userId: 'user-2',
          fecha: now,
          tiempoInicio: now - 45 * 60000,
          tiempoFin: now,
          duracion: 45,
        }),
      },
      {
        id: 's3',
        data: () => ({
          userId: 'user-1',
          fecha: now - 24 * 3600 * 1000,
          tiempoInicio: now - 24 * 3600 * 1000 - 60 * 60000,
          tiempoFin: now - 24 * 3600 * 1000,
          duracion: 60,
        }),
      },
    ];

    mockOnSnapshot = jest.fn((onNext) => {
      onNext({ docs: mockSessions, empty: false });
      return jest.fn();
    });

    const { getByTestId, getByText, queryByTestId } = render(<AdminReportsScreen />);

    await waitFor(() => {
      expect(queryByTestId('chart-loading')).toBeNull();
      expect(getByTestId('chart-active-container')).toBeTruthy();
      expect(getByTestId('reports-usage-chart')).toBeTruthy();
    });

    expect(getByText('Generar Reportes')).toBeTruthy();
    expect(getByTestId('kpi-total-access-val').props.children).toBe(2);
    expect(getByTestId('kpi-active-users-val').props.children).toBe(2);
  });

  it('Escenario 2: Actualización reactiva automática de los datos en tiempo real', async () => {
    const now = Date.now();
    const initialSessions = [
      {
        id: 's1',
        data: () => ({
          userId: 'user-1',
          fecha: now,
          tiempoUso: 20,
        }),
      },
    ];

    let listener: any;
    mockOnSnapshot = jest.fn((onNext) => {
      listener = onNext;
      onNext({ docs: initialSessions, empty: false });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);

    expect(getByTestId('kpi-total-access-val').props.children).toBe(1);

    const updatedSessions = [
      ...initialSessions,
      {
        id: 's2',
        data: () => ({
          userId: 'user-2',
          fecha: now,
          tiempoUso: 40,
        }),
      },
      {
        id: 's3',
        data: () => ({
          userId: 'user-3',
          fecha: now,
          tiempoUso: 50,
        }),
      },
    ];

    await act(async () => {
      listener({ docs: updatedSessions, empty: false });
    });

    expect(getByTestId('kpi-total-access-val').props.children).toBe(3);
    expect(getByTestId('kpi-active-users-val').props.children).toBe(3);
  });

  it('Escenario 3: Manejo de gráfico vacío sin datos históricos', async () => {
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({ docs: [], empty: true });
      return jest.fn();
    });

    const { getByTestId, getByText, queryByTestId } = render(<AdminReportsScreen />);

    await waitFor(() => {
      expect(queryByTestId('chart-active-container')).toBeNull();
      expect(getByTestId('chart-empty-state')).toBeTruthy();
    });

    expect(
      getByText('No hay registros de tiempo de uso en este rango de fechas')
    ).toBeTruthy();
  });

  it('Manejo de error de permisos en Firestore', async () => {
    const spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const spyConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    mockOnSnapshot = jest.fn((onNext, onError) => {
      if (onError) {
        onError({ code: 'firestore/permission-denied', message: 'The caller does not have permission' });
      }
      return jest.fn();
    });

    const { getByTestId, getByText } = render(<AdminReportsScreen />);

    await waitFor(() => {
      expect(getByTestId('chart-error-state')).toBeTruthy();
    });

    expect(
      getByText('No tienes permisos en Firestore para consultar las sesiones del sistema.')
    ).toBeTruthy();

    spyConsoleError.mockRestore();
    spyConsoleWarn.mockRestore();
  });

  it('Seguridad: Redirige si el usuario no es administrador', () => {
    mockUser = {
      uid: 'user-regular',
      email: 'regular@atidental.com',
      rol: 'odontologo',
    };

    render(<AdminReportsScreen />);

    expect(alertSpy).toHaveBeenCalledWith('Esta pantalla es exclusiva para administradores.', '');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('Seguridad: Redirige si no hay sesión activa', () => {
    mockUser = null;

    render(<AdminReportsScreen />);

    expect(alertSpy).toHaveBeenCalledWith('Debes iniciar sesión para continuar.', '');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('Permite cambiar el filtro de período (7, 15, 30 días)', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('period-filter-btn'));
    fireEvent.press(getByTestId('period-option-7'));

    expect(getByTestId('period-filter-btn')).toBeTruthy();
  });

  it('Permite cambiar el tipo de reporte entre tiempo de uso y accesos', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-access'));

    expect(getByTestId('chart-title').props.children).toBe('Accesos Diarios al Sistema');
  });

  it('Ejecuta acciones de Imprimir y Exportar con menú de selección (PDF y CSV)', async () => {
    const now = Date.now();
    const mockSessions = [
      {
        id: 's1',
        data: () => ({
          userId: 'user-1',
          fecha: now,
          tiempoInicio: now - 30 * 60000,
          tiempoFin: now,
          duracion: 30,
        }),
      },
    ];

    mockOnSnapshot = jest.fn((onNext) => {
      onNext({ docs: mockSessions, empty: false });
      return jest.fn();
    });

    const { getByTestId, queryByTestId } = render(<AdminReportsScreen />);

    // Imprimir
    await act(async () => {
      fireEvent.press(getByTestId('print-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Imprimir', 'Enviando reporte a la impresora...');

    // Popover inicialmente cerrado
    expect(queryByTestId('export-menu-popover')).toBeNull();

    // Abrir menú de descarga
    fireEvent.press(getByTestId('download-menu-btn'));
    expect(getByTestId('export-menu-popover')).toBeTruthy();

    // Exportar a PDF
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Reporte generado con éxito',
      'El archivo PDF ha sido preparado para su descarga.'
    );
    expect(queryByTestId('export-menu-popover')).toBeNull();

    // Abrir menú y Exportar a CSV
    fireEvent.press(getByTestId('download-menu-btn'));
    expect(getByTestId('export-menu-popover')).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Archivo CSV generado',
      'Los datos tabulares han sido preparados para su descarga.'
    );
    expect(queryByTestId('export-menu-popover')).toBeNull();

    // Abrir y cerrar al tocar el backdrop
    fireEvent.press(getByTestId('download-menu-btn'));
    expect(getByTestId('export-menu-popover')).toBeTruthy();
    fireEvent.press(getByTestId('export-menu-backdrop'));
    expect(queryByTestId('export-menu-popover')).toBeNull();
  });

  it('Muestra alerta de sin datos al intentar Imprimir o Exportar PDF cuando no hay registros', async () => {
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({ docs: [], empty: true });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);

    // Intentar imprimir sin datos
    await act(async () => {
      fireEvent.press(getByTestId('print-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Generar Reportes',
      'No hay datos disponibles para exportar o imprimir en este reporte.'
    );

    // Intentar exportar PDF sin datos
    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Generar Reportes',
      'No hay datos disponibles para exportar o imprimir en este reporte.'
    );
  });

  it('US-02: Exporta reporte PDF para DAU/MAU cuando se activa esa vista', async () => {
    const { ReportService } = require('@/services/report-service');
    mockDocSnapshot.mockImplementation((onNext) => {
      onNext({
        exists: () => true,
        data: () => ({
          dau: 45,
          mau: 142,
          historico: [
            { label: 'Abr', mau: 125, dau: 35 },
            { label: 'Sep', mau: 142, dau: 45 },
          ],
        }),
      });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);
    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-dau-mau'));

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });

    expect(ReportService.generateAndShare).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          category: 'Módulo Administrativo · Métricas de Producto',
          showSignatureBlock: false,
        }),
      })
    );
  });

  it('Snapshot: verifica la estructura visual sin regresiones', () => {
    const { toJSON } = render(<AdminReportsScreen />);
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('UsageLineChart Component', () => {
  it('renderiza correctamente los puntos y permite seleccionar un punto para ver tooltip', () => {
    const testData = [
      { label: '1', value: 20, date: '1' },
      { label: '4', value: 60, date: '4' },
      { label: '7', value: 40, date: '7' },
    ];

    const { getByTestId, queryByTestId } = render(
      <UsageLineChart data={testData} unit="min" />
    );

    expect(getByTestId('usage-line-chart')).toBeTruthy();
    expect(queryByTestId('chart-tooltip')).toBeNull();

    fireEvent.press(getByTestId('chart-point-1'));
    expect(getByTestId('chart-tooltip')).toBeTruthy();
  });
});

describe('US-27: Visualizar relación DAU/MAU', () => {
  it('Escenario 1: Consume Firestore reactivamente, calcula ratio y muestra las 3 tarjetas y la gráfica', async () => {
    mockDocSnapshot.mockImplementation((onNext) => {
      onNext({
        exists: () => true,
        data: () => ({
          dau: 45,
          mau: 142,
          historico: [
            { label: 'Abr', mau: 125, dau: 35 },
            { label: 'Sep', mau: 142, dau: 45 },
          ],
        }),
      });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-dau-mau'));

    await waitFor(() => {
      expect(getByTestId('kpi-cards-container')).toBeTruthy();
      expect(getByTestId('kpi-ratio-value').props.children).toEqual('32%');
      expect(getByTestId('kpi-dau-value').props.children).toBe(45);
      expect(getByTestId('kpi-mau-value').props.children).toBe(142);
      expect(getByTestId('reports-dau-mau-chart')).toBeTruthy();
    });
  });

  it('Escenario 2: Actualización reactiva automática cuando un nuevo usuario incrementa DAU', async () => {
    let snapshotCallback: any;
    mockDocSnapshot.mockImplementation((onNext) => {
      snapshotCallback = onNext;
      onNext({
        exists: () => true,
        data: () => ({ dau: 45, mau: 142, historico: [] }),
      });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);
    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-dau-mau'));

    expect(getByTestId('kpi-dau-value').props.children).toBe(45);
    expect(getByTestId('kpi-ratio-value').props.children).toEqual('32%');

    await act(async () => {
      snapshotCallback({
        exists: () => true,
        data: () => ({ dau: 46, mau: 142, historico: [] }),
      });
    });

    expect(getByTestId('kpi-dau-value').props.children).toBe(46);
  });

  it('Escenario 3: Manejo seguro en UI ante 0 actividad (división por cero)', async () => {
    mockDocSnapshot.mockImplementation((onNext) => {
      onNext({
        exists: () => true,
        data: () => ({ dau: 0, mau: 0, historico: [] }),
      });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-dau-mau'));

    await waitFor(() => {
      expect(getByTestId('kpi-ratio-value').props.children).toEqual('0%');
      expect(getByTestId('kpi-dau-value').props.children).toBe(0);
      expect(getByTestId('kpi-mau-value').props.children).toBe(0);
      expect(getByTestId('reports-dau-mau-chart')).toBeTruthy();
    });
  });

  it('ofrece el reporte de tiempo de uso por hora en el selector', () => {
    const { getByTestId, getByText } = render(<AdminReportsScreen />);
    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-hourly'));
    expect(getByText('Visualizar tiempo de uso por hora')).toBeTruthy();
    expect(getByTestId('hourly-empty-state')).toBeTruthy();
  });

  it('exporta PDF y CSV del reporte por hora', async () => {
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({
        docs: [{ id: 's1', data: () => ({ id: 's1', tiempoInicio: new Date() }) }],
        empty: false,
      });
      return jest.fn();
    });

    const { getByTestId, findByTestId } = render(<AdminReportsScreen />);
    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-hourly'));
    expect(await findByTestId('hourly-distribution-chart')).toBeTruthy();

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });
    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringMatching(/Accesos-por-hora_\d{4}-\d{2}-\d{2}_ultimas-24-horas\.pdf$/),
        expect.objectContaining({ mimeType: 'application/pdf' }),
      );
    });

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });
    await waitFor(() => {
      expect(Sharing.shareAsync).toHaveBeenCalledWith(
        expect.stringMatching(/Accesos-por-hora_.*_ultimas-24-horas\.csv$/),
        expect.objectContaining({ mimeType: 'text/csv' }),
      );
    });
  });

  it('avisa cuando falla la exportación del reporte por hora', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { File } = require('expo-file-system');
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({
        docs: [{ id: 's1', data: () => ({ id: 's1', tiempoInicio: new Date() }) }],
        empty: false,
      });
      return jest.fn();
    });
    (File as jest.Mock).mockImplementation(() => {
      throw new Error('disk');
    });

    const { getByTestId, findByTestId } = render(<AdminReportsScreen />);
    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-hourly'));
    expect(await findByTestId('hourly-distribution-chart')).toBeTruthy();

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('reports.hourlyExportError', '');
    });

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('reports.hourlyExportError', '');
    });
  });

  it('Función pura: calculateDauMauRatio realiza el cálculo y protege contra MAU = 0', () => {
    const { calculateDauMauRatio } = require('@/app/(tabs)/admin/reports');
    expect(calculateDauMauRatio(45, 142)).toBe(32);
    expect(calculateDauMauRatio(10, 20)).toBe(50);
    expect(calculateDauMauRatio(0, 0)).toBe(0);
    expect(calculateDauMauRatio(5, 0)).toBe(0);
  });
});

describe('Pruebas de Exportación y Cambio de Vistas para Cobertura Completa', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('Exporta correctamente a CSV y PDF en vista de Demografía', async () => {
    const { getByTestId, findByTestId } = render(<AdminReportsScreen />);

    // 1. Abrir selector de tipo de reporte
    fireEvent.press(getByTestId('report-type-select'));

    // 2. Esperar y presionar la opción de Demografía
    const demoOption = await findByTestId('type-option-demographics');
    await act(async () => {
      fireEvent.press(demoOption);
    });

    // 3. Exportar CSV
    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Archivo CSV generado',
      'Los datos tabulares han sido preparados para su descarga.'
    );

    // 4. Exportar PDF
    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Reporte generado con éxito',
      'El archivo PDF ha sido preparado para su descarga.'
    );
  });

  it('Exporta correctamente a CSV en vistas de Geografía, Crash Rate y Retención', async () => {
    const { getByTestId, findByTestId } = render(<AdminReportsScreen />);

    // --- 1. Vista de Geografía ---
    fireEvent.press(getByTestId('report-type-select'));
    const geoOption = await findByTestId('type-option-geographics');
    await act(async () => {
      fireEvent.press(geoOption);
    });

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Archivo CSV generado',
      'Los datos tabulares han sido preparados para su descarga.'
    );

    // --- 2. Vista de Tasa de fallos (Crash Rate) ---
    fireEvent.press(getByTestId('report-type-select'));
    const crashOption = await findByTestId('type-option-crash-rate');
    await act(async () => {
      fireEvent.press(crashOption);
    });

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Archivo CSV generado',
      'Los datos tabulares han sido preparados para su descarga.'
    );

    // --- 3. Vista de Tasa de retención ---
    fireEvent.press(getByTestId('report-type-select'));
    const retentionOption = await findByTestId('type-option-retention-rate');
    await act(async () => {
      fireEvent.press(retentionOption);
    });

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });
    expect(alertSpy).toHaveBeenCalledWith(
      'Archivo CSV generado',
      'Los datos tabulares han sido preparados para su descarga.'
    );
  });
  
  it('Maneja excepciones durante la generación de CSV mostrando alerta de error', async () => {
    const reportsUtils = require('@/components/reports/utils/reports-utils');
    const spyExport = jest
      .spyOn(reportsUtils, 'exportChartDataToCsv')
      .mockRejectedValueOnce(new Error('FileSystem Write Error'));

    const now = Date.now();
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({
        docs: [{ id: 's1', data: () => ({ userId: 'u1', fecha: now, tiempoUso: 20 }) }],
        empty: false,
      });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-csv-btn'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Generar Reportes',
      'Ocurrió un error al generar o compartir el reporte.'
    );

    spyExport.mockRestore();
  });

  it('Maneja excepciones durante la generación de PDF mostrando alerta de error', async () => {
    const { ReportService } = require('@/services/report-service');
    const spyPdf = jest
      .spyOn(ReportService, 'generateAndShare')
      .mockRejectedValueOnce(new Error('PDF Build Failure'));

    const now = Date.now();
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({
        docs: [{ id: 's1', data: () => ({ userId: 'u1', fecha: now, tiempoUso: 20 }) }],
        empty: false,
      });
      return jest.fn();
    });

    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('download-menu-btn'));
    await act(async () => {
      fireEvent.press(getByTestId('export-pdf-btn'));
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Generar Reportes',
      'Ocurrió un error al generar o compartir el reporte.'
    );

    spyPdf.mockRestore();
  });

  it('Permite cambiar las opciones de período a 15 días y 30 días', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('period-filter-btn'));
    fireEvent.press(getByTestId('period-option-15'));

    expect(getByTestId('period-filter-btn')).toBeTruthy();

    fireEvent.press(getByTestId('period-filter-btn'));
    fireEvent.press(getByTestId('period-option-30'));

    expect(getByTestId('period-filter-btn')).toBeTruthy();
  });
});