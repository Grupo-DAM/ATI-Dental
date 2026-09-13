import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import AdminReportsScreen, { calculateCrashRatePercentage } from '@/app/(tabs)/admin/reports';

// 1. Registro global mutable para capturar listeners por colección/documento
const firestoreListeners = {
  stability: null as ((doc: any) => void) | null,
};

// 2. Mock de Firestore con ruteo de documento consolidado
jest.mock('@/config/firebase', () => ({
  firestore: () => {
    const mockCollection = (colName: string) => ({
      doc: (docName: string) => ({
        onSnapshot: jest.fn((callback) => {
          if (colName === 'metricas_estabilidad' && docName === 'actual') {
            firestoreListeners.stability = callback;
            // Estado inicial óptimo (0 cierres)
            callback({
              exists: true,
              data: () => ({ totalCrashes: 0, affectedUsers: 0, historico: [] }),
            });
          } else {
            callback({ exists: true, data: () => ({ dau: 0, mau: 0 }) });
          }
          return jest.fn();
        }),
      }),
      where: () => ({
        onSnapshot: jest.fn((callback) => {
          const nowTimestamp = Date.now();
          // Emitir 100 sesiones base para calcular el porcentaje (fallos / sesiones) * 100
          callback({
            docs: Array.from({ length: 100 }, (_, i) => ({
              id: `session_${i}`,
              data: () => ({ fecha: nowTimestamp, tiempoInicio: nowTimestamp, tiempoUso: 10 }),
            })),
          });
          return jest.fn();
        }),
      }),
    });

    const target = mockCollection as any;
    target.collection = mockCollection;
    return target;
  },
}));

// Mocks auxiliares
jest.mock('@/hooks/use-theme', () => ({ useTheme: () => ({ main: '#000' }) }));
jest.mock('@/hooks/use-auth', () => ({ useAuth: () => ({ user: { uid: '123', rol: 'admin' }, loading: false }) }));
jest.mock('@react-native-firebase/firestore', () => ({}));
jest.mock('@/components/reports/usage-line-chart', () => ({ UsageLineChart: () => null }));
jest.mock('@/components/reports/dau-mau-line-chart', () => ({ DauMauLineChart: () => null }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const trans: Record<string, string> = {
        'reports.reportTypeCrashRate': 'Tasa de Fallos',
        'reports.crashRateToday': 'Estabilidad',
        'reports.totalCrashesToday': 'Total Fallos',
        'reports.affectedUsers': 'Usuarios Afectados',
      };
      return trans[key] || key;
    },
  }),
}));

describe('US-29: Visualizar porcentaje de fallos de la aplicación', () => {
  beforeEach(() => {
    firestoreListeners.stability = null;
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
          exists: true,
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