import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';

import AdminReportsScreen from '@/app/(tabs)/admin/reports';
import { UsageLineChart } from '@/components/reports/usage-line-chart';

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
    'reports.exportPdf': 'Exportar PDF',
    'reports.pdfExportSuccess': 'Reporte generado con éxito',
    'reports.pdfExportMessage': 'El archivo PDF ha sido preparado para su descarga.',
    'reports.printTriggered': 'Enviando reporte a la impresora...',
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
  };
  return translations[key] || key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
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

    // Chart container is visible and loading is gone
    expect(queryByTestId('chart-loading')).toBeNull();
    expect(getByTestId('chart-active-container')).toBeTruthy();
    expect(getByTestId('reports-usage-chart')).toBeTruthy();

    // Verify Title and KPI numbers
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

    // Simulate new session arrival in real-time
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

    // KPI values increment dynamically
    expect(getByTestId('kpi-total-access-val').props.children).toBe(3);
    expect(getByTestId('kpi-active-users-val').props.children).toBe(3);
  });

  it('Escenario 3: Manejo de gráfico vacío sin datos históricos', async () => {
    mockOnSnapshot = jest.fn((onNext) => {
      onNext({ docs: [], empty: true });
      return jest.fn();
    });

    const { getByTestId, getByText, queryByTestId } = render(<AdminReportsScreen />);

    // Chart container is hidden, friendly empty state is displayed
    expect(queryByTestId('chart-active-container')).toBeNull();
    expect(getByTestId('chart-empty-state')).toBeTruthy();
    expect(
      getByText('No hay registros de tiempo de uso en este rango de fechas')
    ).toBeTruthy();
  });

  it('Manejo de error de permisos en Firestore', () => {
    mockOnSnapshot = jest.fn((onNext, onError) => {
      if (onError) {
        onError({ code: 'firestore/permission-denied', message: 'The caller does not have permission' });
      }
      return jest.fn();
    });

    const { getByTestId, getByText } = render(<AdminReportsScreen />);

    expect(getByTestId('chart-error-state')).toBeTruthy();
    expect(
      getByText('No tienes permisos en Firestore para consultar las sesiones del sistema.')
    ).toBeTruthy();
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

  it('Ejecuta acciones de Imprimir y Exportar a PDF', () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    fireEvent.press(getByTestId('print-btn'));
    expect(alertSpy).toHaveBeenCalledWith('Imprimir', 'Enviando reporte a la impresora...');

    fireEvent.press(getByTestId('export-pdf-btn'));
    expect(alertSpy).toHaveBeenCalledWith(
      'Reporte generado con éxito',
      'El archivo PDF ha sido preparado para su descarga.'
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

    // Press point 1
    fireEvent.press(getByTestId('chart-point-1'));
    expect(getByTestId('chart-tooltip')).toBeTruthy();
  });
});

describe('US-27: Visualizar relación DAU/MAU', () => {
  it('Escenario 1: Consume Firestore reactivamente, calcula ratio y muestra las 3 tarjetas y la gráfica', () => {
    // Simulamos respuesta con datos de Firestore
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

    // Cambiar a reporte DAU/MAU
    fireEvent.press(getByTestId('report-type-select'));
    fireEvent.press(getByTestId('type-option-dau-mau'));

    // Verificar las 3 tarjetas con datos calculados desde Firestore
    expect(getByTestId('kpi-dau-mau-container')).toBeTruthy();
    expect(getByTestId('kpi-ratio-value').props.children).toEqual([32, '%']);
    expect(getByTestId('kpi-dau-value').props.children).toBe(45);
    expect(getByTestId('kpi-mau-value').props.children).toBe(142);
    expect(getByTestId('reports-dau-mau-chart')).toBeTruthy();
  });
    it('Escenario 2: Actualización reactiva automática cuando un nuevo usuario incrementa DAU', () => {
      let snapshotCallback: any;
      mockDocSnapshot.mockImplementation((onNext) => {
        snapshotCallback = onNext;
        // Estado inicial: DAU 45, MAU 142 -> 32%
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
      expect(getByTestId('kpi-ratio-value').props.children).toEqual([32, '%']);

      // Simulamos que entra un nuevo usuario único y Firestore emite la actualización reactiva
      act(() => {
        snapshotCallback({
          exists: () => true,
          data: () => ({ dau: 46, mau: 142, historico: [] }),
        });
      });

      // La UI se actualizó en tiempo real
      expect(getByTestId('kpi-dau-value').props.children).toBe(46);
    });
  it('Escenario 3: Manejo seguro en UI ante 0 actividad (división por cero)', () => {
    // Simulamos que no hay actividad en la base de datos
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

    // Debe mostrar 0% en la interfaz sin romperse
    expect(getByTestId('kpi-ratio-value').props.children).toEqual([0, '%']);
    expect(getByTestId('kpi-dau-value').props.children).toBe(0);
    expect(getByTestId('kpi-mau-value').props.children).toBe(0);
    expect(getByTestId('reports-dau-mau-chart')).toBeTruthy();
  });

  it('Función pura: calculateDauMauRatio realiza el cálculo y protege contra MAU = 0', () => {
    const { calculateDauMauRatio } = require('@/app/(tabs)/admin/reports');
    expect(calculateDauMauRatio(45, 142)).toBe(32);
    expect(calculateDauMauRatio(10, 20)).toBe(50);
    expect(calculateDauMauRatio(0, 0)).toBe(0);
    expect(calculateDauMauRatio(5, 0)).toBe(0);
  });
});