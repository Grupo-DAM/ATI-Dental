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