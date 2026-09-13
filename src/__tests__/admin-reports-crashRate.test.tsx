import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import AdminReportsScreen, { calculateCrashRatePercentage } from '@/app/(tabs)/admin/reports';

// 1. Objeto global mutable para capturar las referencias de los listeners
const firestoreListeners = {
  stability: null as ((doc: any) => void) | null,
};

// 2. Mock de Firebase Firestore controlado
jest.mock('@/config/firebase', () => ({
  firestore: () => {
    const mockCollection = (colName: string) => ({
      doc: (docName: string) => ({
        onSnapshot: jest.fn((callback) => {
          firestoreListeners.stability = callback;
          
          // Emitir estado inicial con 0 fallos
          callback({
            exists: true,
            data: () => ({
              totalCrashes: 0,
              affectedUsers: 0,
              historico: [],
            }),
          });
          return jest.fn();
        }),
      }),
      where: () => ({
        onSnapshot: jest.fn((callback) => {
          // Generamos sesiones asegurando que pasen el filtro de fecha actual del componente
          const nowTimestamp = Date.now();
          callback({
            docs: Array.from({ length: 100 }, (_, i) => ({
              id: `session_${i}`,
              data: () => ({ 
                fecha: nowTimestamp, // Sincronizado en tiempo real absoluto
                tiempoInicio: nowTimestamp,
                tiempoUso: 10 
              }),
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

// Mocks complementarios del entorno nativo
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
        'reports.crashRateTitle': 'Estabilidad',
        'reports.totalCrashes': 'Total Fallos',
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
      
      // 1. Cambiamos el filtro a Tasa de Fallos
      const reportTypeSelect = getByTestId('report-type-select');
      await act(async () => {
        fireEvent.press(reportTypeSelect);
      });

      const crashRateOption = getByTestId('type-option-crash-rate');
      await act(async () => {
        fireEvent.press(crashRateOption);
      });

      // 2. Verificamos el estado inicial óptimo en pantalla (0.00%)
      expect(getByTestId('kpi-crash-rate-val').props.children).toBe('0.00%');

      // 3. --- ACCIÓN DEL ESCENARIO 2 ---
      // Forzamos la actualización reactiva enviando 1 fallo a través del listener capturado.
      // El componente procesará de manera segura: (1 fallo / 100 sesiones válidas) * 100 = 1.00%
      await act(async () => {
        if (firestoreListeners.stability) {
          firestoreListeners.stability({
            exists: true,
            data: () => ({
              totalCrashes: 1,
              affectedUsers: 1,
              historico: [],
            }),
          });
        }
      });

      // 4. VERIFICACIÓN: Comprobamos que los valores calculados se inyectaron exitosamente en las tarjetas del bucle
      expect(getByTestId('kpi-crash-rate-val').props.children).toBe('1.00%');
      expect(getByTestId('kpi-total-crashes-val').props.children).toBe(1);
    });

    it('Escenario 3: retorna 0.00% si hay 0 sesiones y 0 fallos', () => {
      expect(calculateCrashRatePercentage(0, 0)).toBe('0.00%');
    });

    it('Escenario 3: retorna 0.00% si hay sesiones y 0 fallos', () => {
      expect(calculateCrashRatePercentage(0, 150)).toBe('0.00%');
    });
});
