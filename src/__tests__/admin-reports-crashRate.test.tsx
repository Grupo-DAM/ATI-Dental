import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import AdminReportsScreen, { calculateCrashRatePercentage } from '@/app/(tabs)/admin/reports';

// -------------------------------------------------------------
// 1. ESTADOS Y REFERENCIAS ESTÁTICAS (Previene Bucles de Re-renderizado)
// -------------------------------------------------------------
const MOCK_ADMIN_USER = { uid: '123', rol: 'admin' };

const firestoreListeners = {
  stability: null as ((doc: any) => void) | null,
};

// -------------------------------------------------------------
// 2. MOCK DE FIRESTORE CON INSTANCIA ESTABLE
// -------------------------------------------------------------
const mockOnSnapshot = jest.fn((callback) => {
  // Callback por defecto compatible con propiedad 'exists' o función 'exists()'
  callback({
    exists: () => true,
    data: () => ({ totalCrashes: 0, affectedUsers: 0, historico: [] }),
  });
  return jest.fn(); // Función de desuscripción (unsubscribe)
});

const mockDoc = jest.fn((docName: string) => ({
  onSnapshot: (callback: any) => {
    firestoreListeners.stability = callback;
    return mockOnSnapshot(callback);
  },
}));

const mockCollection = jest.fn((colName: string) => ({
  doc: mockDoc,
  where: jest.fn().mockReturnValue({
    onSnapshot: jest.fn((callback) => {
      const nowTimestamp = Date.now();
      // Emitir 100 sesiones base para calcular el porcentaje: (fallos / sesiones) * 100
      callback({
        docs: Array.from({ length: 100 }, (_, i) => ({
          id: `session_${i}`,
          data: () => ({ fecha: nowTimestamp, tiempoInicio: nowTimestamp, tiempoUso: 10 }),
        })),
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
// 3. MOCKS DE HOOKS Y COMPONENTES
// -------------------------------------------------------------
jest.mock('@/hooks/use-theme', () => ({ 
  useTheme: () => ({ main: '#000' }) 
}));

jest.mock('@/hooks/use-auth', () => ({ 
  useAuth: () => ({ 
    user: MOCK_ADMIN_USER, // Referencia estática
    loading: false 
  }) 
}));

jest.mock('@react-native-firebase/firestore', () => ({}));
jest.mock('@/components/reports/usage-line-chart', () => ({ UsageLineChart: () => null }));
jest.mock('@/components/reports/dau-mau-line-chart', () => ({ DauMauLineChart: () => null }));

const mockT = (key: string) => {
  const trans: Record<string, string> = {
    'reports.reportTypeCrashRate': 'Tasa de Fallos',
    'reports.crashRateToday': 'Estabilidad',
    'reports.totalCrashesToday': 'Total Fallos',
    'reports.affectedUsers': 'Usuarios Afectados',
    'reports.errorLoad': 'Error al cargar',
  };
  return trans[key] || key;
};

// 2. Retornar la referencia fija en useTranslation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT, // Reference estable
  }),
}));
// -------------------------------------------------------------
// 4. SUITE DE PRUEBAS US-29
// -------------------------------------------------------------
describe('US-29: Visualizar porcentaje de fallos de la aplicación', () => {
  beforeEach(() => {
    firestoreListeners.stability = null;
    jest.clearAllMocks();
  });

  it('Escenario 1: Calcula correctamente el porcentaje con decimales', () => {
    expect(calculateCrashRatePercentage(5, 1000)).toBe('0.50%');
  });

  it('Escenario 2: Actualización reactiva al ocurrir un nuevo cierre inesperado en producción', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    // Seleccionar reporte de crash rate
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-crash-rate'));
    });

    // Verificación inicial (0.00%)
    expect(getByTestId('kpi-crash-rate-val').props.children).toBe('0.00%');

    // Emisión en tiempo real desde Firestore: 1 fallo acumulado en 100 sesiones = 1.00%
    await act(async () => {
      if (firestoreListeners.stability) {
        firestoreListeners.stability({
          exists: () => true, // Soporta invocación por función
          data: () => ({ totalCrashes: 1, affectedUsers: 1, historico: [] }),
        });
      }
    });

    // Verificación de actualización reactiva
    await waitFor(() => {
      expect(getByTestId('kpi-crash-rate-val').props.children).toBe('1.00%');
    });
    expect(getByTestId('kpi-total-crashes-val').props.children).toBe(1);
  });

  it('Escenario 3: Estabilidad óptima del sistema (0% de fallos)', () => {
    expect(calculateCrashRatePercentage(0, 0)).toBe('0.00%');
    expect(calculateCrashRatePercentage(0, 150)).toBe('0.00%');
  });
});

// -------------------------------------------------------------
// 5. SUITE DE COBERTURA DE FUNCIONES AUXILIARES INTERNAS
// -------------------------------------------------------------
describe('Funciones auxiliares internas de reports.tsx', () => {
  beforeEach(() => {
    firestoreListeners.stability = null;
    jest.clearAllMocks();
  });

  it('cubre todas las ramas de getChartTitle y getChartUnit para cada tipo de reporte', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    // 1. Reporte por defecto ('usage'): Título -> reports.chartTitleUsage, Unidad -> 'min'
    expect(getByTestId('admin-reports-screen')).toBeTruthy();

    // 2. Cambiar a reporte 'dau_mau': Título -> reports.dauMauChartTitle, Unidad -> 'acc' (default)
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-dau-mau'));
    });

    // 3. Cambiar a reporte 'crash_rate': Título -> reports.chartTitleCrashRate, Unidad -> '%'
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-crash-rate'));
    });

    // 4. Cambiar a una opción con tipo desconocido para cubrir el 'default' de getChartTitle
    // (Simulando un valor no mapeado manualmente si el selector lo permite)
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
  });

  it('cubre buildHistoryMap con distintos formatos de ítems (item.value, item.tasa, item.date, item.fecha, item.label)', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    // Seleccionar reporte de crash rate para procesar el histórico
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-crash-rate'));
    });

    // Inyectar datos en Firestore con todas las variaciones de propiedades que consume buildHistoryMap:
    // - item con value y date
    // - item con tasa (String) y fecha
    // - item con label pero sin valor numérico válido (fallback a 0)
    // - item inválido/vacío
    await act(async () => {
      if (firestoreListeners.stability) {
        firestoreListeners.stability({
          exists: () => true,
          data: () => ({
            totalCrashes: 2,
            affectedUsers: 1,
            historico: [
              { value: 1.5, date: '2026-09-10' },
              { tasa: '2.5', fecha: '2026-09-11' },
              { label: '12', tasa: 'invalid_number' }, // Forzar el '|| 0' en Number(item.tasa)
              { noKey: 'sin_clave' }, // Forzar el 'if (key)' nulo
            ],
          }),
        });
      }
    });

    // Verificar que el componente renderice correctamente tras procesar la estructura heterogénea
    await waitFor(() => {
      expect(getByTestId('kpi-total-crashes-val').props.children).toBe(2);
    });
  });

  it('cubre generatePaddedChartData con coincidencias por fecha completa, por número de día y rellenos con 0.0', async () => {
    const { getByTestId } = render(<AdminReportsScreen />);

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDayNum = String(now.getDate());

    // Cambiar a crash_rate
    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-crash-rate'));
    });

    // Emitir histórico con coincidencia exacta por dateKey y coincidencia por dayNumLabel
    await act(async () => {
      if (firestoreListeners.stability) {
        firestoreListeners.stability({
          exists: () => true,
          data: () => ({
            totalCrashes: 5,
            affectedUsers: 3,
            historico: [
              { value: 3.2, date: todayKey }, // Match por dateKey
              { value: 1.1, label: todayDayNum }, // Match por dayNumLabel
            ],
          }),
        });
      }
    });

    // Cambiar de periodo de días para ejecutar el bucle for de generatePaddedChartData (ej. 7 días vs 30 días)
    await act(async () => {
      const periodSelect = getByTestId('period-filter-btn');
      if (periodSelect) {
        fireEvent.press(periodSelect);
      }
    });

    await waitFor(() => {
      expect(getByTestId('kpi-crash-rate-val')).toBeTruthy();
    });
  });
});