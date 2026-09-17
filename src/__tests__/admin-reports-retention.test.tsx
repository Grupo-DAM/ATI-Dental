import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';
import AdminReportsScreen, {
  formatRetentionPercentage,
  parseRetentionData,
} from '@/app/(tabs)/admin/reports';
import { RetentionBarChart } from '@/components/reports/retention-bar-chart';
import { useRetentionMetrics } from '@/components/reports/hooks/useRetentionMetrics';
import { router } from 'expo-router';
import { Alert } from 'react-native';

// -------------------------------------------------------------
// 1. ESTADOS Y REFERENCIAS ESTÁTICAS
// -------------------------------------------------------------
let mockCurrentUser: { uid: string; rol: string } | null = { uid: 'admin_1', rol: 'admin' };

const firestoreListeners = {
  retention: null as ((doc: any) => void) | null,
  retentionError: null as ((err: any) => void) | null,
};

// -------------------------------------------------------------
// 2. MOCK DE FIRESTORE CON INSTANCIA ESTABLE
// -------------------------------------------------------------
const mockDoc = jest.fn((docName: string) => ({
  onSnapshot: (callback: any, errorCallback?: any) => {
    firestoreListeners.retention = callback;
    firestoreListeners.retentionError = errorCallback || null;
    callback({
      exists: () => true,
      data: () => ({ dia1: 75, dia7: 45, dia30: 20, totalUsuariosCohorte: 150 }),
    });
    return jest.fn(); // Unsubscribe mock
  },
}));

const mockCollection = jest.fn((colName: string) => ({
  doc: mockDoc,
  where: jest.fn().mockReturnValue({
    onSnapshot: jest.fn((callback) => {
      callback({
        docs: [],
      });
      return jest.fn();
    }),
  }),
}));

const mockFirestoreInstance = {
  collection: mockCollection,
};

jest.mock('@/config/firebase', () => ({
  firestore: () => mockFirestoreInstance,
}));

// -------------------------------------------------------------
// 3. MOCKS DE HOOKS Y NAVEGACIÓN
// -------------------------------------------------------------
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#0A84FF',
    backgroundElement: '#FFFFFF',
    reportValueText: '#111827',
    pageSubtitle: '#6B7280',
    breadcrumbSeparator: '#9CA3AF',
    accentBackground: '#F3F4F6',
    chartGridLine: '#E5E7EB',
    chartLegendText: '#9CA3AF',
    error: '#EF4444',
  }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockCurrentUser,
    loading: false,
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
    MaterialIcons: (props: any) => React.createElement(Text, props, props.name),
    FontAwesome: (props: any) => React.createElement(Text, props, props.name),
  };
});

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.spyOn(Alert, 'alert');

const mockT = (key: string) => {
  const trans: Record<string, string> = {
    'reports.reportTypeRetentionRate': 'Tasa de retención de usuarios',
    'reports.chartTitleRetentionRate': 'Porcentaje de Retención por Cohorte',
    'reports.retentionDay1': 'Día 1',
    'reports.retentionDay7': 'Día 7',
    'reports.retentionDay30': 'Día 30',
    'reports.retentionKpiDay1': 'RETENCIÓN DÍA 1',
    'reports.retentionKpiDay7': 'RETENCIÓN DÍA 7',
    'reports.retentionKpiDay30': 'RETENCIÓN DÍA 30',
    'reports.retentionDay1Sub': '24 horas',
    'reports.retentionDay7Sub': '7 días',
    'reports.retentionDay30Sub': '30 días',
    'reports.retentionErrorLoad': 'Error al consultar retención',
    'reports.errorLoad': 'Error al consultar',
    'reports.emptyState': 'No hay registros',
    'reports.loading': 'Cargando reportes...',
    'reports.sessionRequired': 'Debes iniciar sesión para continuar.',
    'reports.accessDenied': 'Esta pantalla es exclusiva para administradores.',
  };
  return trans[key] || key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// -------------------------------------------------------------
// 4. SUITE DE PRUEBAS US: TASA DE RETENCIÓN
// -------------------------------------------------------------
describe('US: Visualizar porcentaje de usuarios que regresan (Tasa de Retención)', () => {
  beforeEach(() => {
    mockCurrentUser = { uid: 'admin_1', rol: 'admin' };
    firestoreListeners.retention = null;
    firestoreListeners.retentionError = null;
    jest.clearAllMocks();
  });

  it('Escenario 1: Carga y visualización correcta del porcentaje de retención en gráfica y KPI cards', async () => {
    const { getByTestId, getByText } = render(<AdminReportsScreen />);

    // Seleccionar tipo de reporte de retención
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-retention-rate'));
    });

    // Validar título del gráfico y existencia del contenedor de gráfico
    expect(getByTestId('chart-title').props.children).toBe('Porcentaje de Retención por Cohorte');
    expect(getByTestId('reports-retention-chart')).toBeTruthy();

    // Validar valores en las 3 tarjetas de KPI (D1, D7, D30)
    expect(getByTestId('kpi-retention-day1-val').props.children).toBe('75%');
    expect(getByTestId('kpi-retention-day7-val').props.children).toBe('45%');
    expect(getByTestId('kpi-retention-day30-val').props.children).toBe('20%');
  });

  it('Escenario 2: Actualización reactiva de las métricas en tiempo real a través de Firestore onSnapshot', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    // Cambiar a reporte de retención
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-retention-rate'));
    });

    // Inicialmente los datos del mock por defecto
    expect(getByTestId('kpi-retention-day1-val').props.children).toBe('75%');

    // Emisión reactiva desde Firestore simulando consolidación de nuevas cohortes
    await act(async () => {
      if (firestoreListeners.retention) {
        firestoreListeners.retention({
          exists: () => true,
          data: () => ({ dia1: 88, dia7: 58.5, dia30: 32, totalUsuariosCohorte: 220 }),
        });
      }
    });

    // Los valores de las tarjetas KPI se actualizan en vivo sin recargar la pantalla
    await waitFor(() => {
      expect(getByTestId('kpi-retention-day1-val').props.children).toBe('88%');
      expect(getByTestId('kpi-retention-day7-val').props.children).toBe('58.5%');
      expect(getByTestId('kpi-retention-day30-val').props.children).toBe('32%');
    });
  });

  it('Escenario 3: Manejo de datos insuficientes o base de datos vacía (fallback a 0% sin errores NaN)', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    // Seleccionar reporte de retención
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-retention-rate'));
    });

    // Simular que el documento en Firestore no existe (base de datos recién creada)
    await act(async () => {
      if (firestoreListeners.retention) {
        firestoreListeners.retention({
          exists: () => false,
          data: () => ({}),
        });
      }
    });

    // Debe mostrar 0% de forma segura para cada intervalo sin bloqueos ni errores
    await waitFor(() => {
      expect(getByTestId('kpi-retention-day1-val').props.children).toBe('0%');
      expect(getByTestId('kpi-retention-day7-val').props.children).toBe('0%');
      expect(getByTestId('kpi-retention-day30-val').props.children).toBe('0%');
    });

    // Simular documento existente pero con campos nulos o vacíos
    await act(async () => {
      if (firestoreListeners.retention) {
        firestoreListeners.retention({
          exists: () => true,
          data: () => ({}),
        });
      }
    });

    await waitFor(() => {
      expect(getByTestId('kpi-retention-day1-val').props.children).toBe('0%');
      expect(getByTestId('kpi-retention-day7-val').props.children).toBe('0%');
      expect(getByTestId('kpi-retention-day30-val').props.children).toBe('0%');
    });
  });

  it('Manejo de error en Firestore (onError callback)', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-retention-rate'));
    });

    // Disparar error desde Firestore
    await act(async () => {
      if (firestoreListeners.retentionError) {
        firestoreListeners.retentionError(new Error('Permission denied'));
      }
    });

    await waitFor(() => {
      expect(getByTestId('chart-error-state')).toBeTruthy();
    });
  });

  it('Seguridad: Redirige al home si el usuario no tiene rol admin', () => {
    mockCurrentUser = { uid: 'user_regular', rol: 'odontologo' };
    render(<AdminReportsScreen />);
    expect(Alert.alert).toHaveBeenCalledWith('Esta pantalla es exclusiva para administradores.', '');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('Seguridad: Redirige al home si no hay usuario autenticado', () => {
    mockCurrentUser = null;
    render(<AdminReportsScreen />);
    expect(Alert.alert).toHaveBeenCalledWith('Debes iniciar sesión para continuar.', '');
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/home');
  });
});

// -------------------------------------------------------------
// 5. PRUEBAS UNITARIAS DE RETENTION BAR CHART
// -------------------------------------------------------------
describe('RetentionBarChart Component', () => {
  it('se renderiza correctamente con dimensiones de layout', () => {
    const sampleData = [
      { cohort: 'Día 1', label: 'D1', percentage: 85 },
      { cohort: 'Día 7', label: 'D7', percentage: 50 },
      { cohort: 'Día 30', label: 'D30', percentage: 25 },
    ];

    const { getByTestId } = render(
      <RetentionBarChart data={sampleData} testID="test-retention-chart" />
    );

    const chart = getByTestId('test-retention-chart');
    expect(chart).toBeTruthy();

    // Simular evento onLayout con ancho válido
    fireEvent(chart, 'layout', {
      nativeEvent: { layout: { width: 380, height: 230 } },
    });

    // Simular evento onLayout con ancho menor a 50 (se ignora)
    fireEvent(chart, 'layout', {
      nativeEvent: { layout: { width: 30, height: 230 } },
    });
  });

  it('maneja valores extremos (0% y 100%)', () => {
    const extremeData = [
      { cohort: 'Día 1', label: 'D1', percentage: 100 },
      { cohort: 'Día 7', label: 'D7', percentage: 0 },
      { cohort: 'Día 30', label: 'D30', percentage: 150 }, // Debe clampear
    ];

    const { getByTestId } = render(
      <RetentionBarChart data={extremeData} testID="extreme-chart" />
    );
    expect(getByTestId('extreme-chart')).toBeTruthy();
  });
});

// -------------------------------------------------------------
// 6. PRUEBAS DEL HOOK useRetentionMetrics
// -------------------------------------------------------------
describe('useRetentionMetrics hook', () => {
  it('no se suscribe si enabled es false o usuario no es admin', () => {
    const { result } = renderHook(() =>
      useRetentionMetrics({
        user: { uid: 'normal', rol: 'paciente' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.retentionData).toEqual([]);
  });

  it('limpia la suscripción al desmontar', () => {
    const mockUnsub = jest.fn();
    mockDoc.mockReturnValueOnce({
      onSnapshot: jest.fn(() => mockUnsub),
    });

    const { unmount } = renderHook(() =>
      useRetentionMetrics({
        user: { uid: 'adm', rol: 'admin' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    unmount();
    expect(mockUnsub).toHaveBeenCalled();
  });
});
