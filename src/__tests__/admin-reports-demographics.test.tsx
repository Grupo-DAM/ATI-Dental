import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AdminReportsScreen, { aggregateUserDemographics } from '@/app/(tabs)/admin/reports';

const MOCK_ADMIN_USER = { uid: '123', rol: 'admin' };

let usuariosCallback: ((snap: { docs: unknown[] }) => void) | null = null;
let usuariosErrorCallback: ((err: { code?: string; message?: string }) => void) | null = null;

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: (colName: string) => ({
      doc: () => ({
        onSnapshot: (callback: (doc: unknown) => void) => {
          callback({ exists: () => false, data: () => ({}) });
          return jest.fn();
        },
      }),
      where: () => ({
        onSnapshot: (callback: (snap: { docs: unknown[] }) => void) => {
          callback({ docs: [] });
          return jest.fn();
        },
      }),
      onSnapshot: (
        onNext: (snap: { docs: unknown[] }) => void,
        onError?: (err: { code?: string; message?: string }) => void,
      ) => {
        if (colName === 'usuarios') {
          usuariosCallback = onNext;
          usuariosErrorCallback = onError ?? null;
          onNext({
            docs: [
              { id: 'u1', data: () => ({ genero: 'femenino', edad: 22 }) },
              { id: 'u2', data: () => ({ gender: 'male', edad: 34 }) },
              { id: 'u3', data: () => ({}) },
            ],
          });
        }
        return jest.fn();
      },
    }),
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    overMain: '#fff',
    background: '#fff',
    backgroundElement: '#fff',
    backgroundSecondary: '#f5f5f5',
    pageTitle: '#111',
    pageSubtitle: '#666',
    fieldLabel: '#333',
    textNames: '#333',
    cardSeparator: '#ddd',
    reportValueText: '#111',
    logo: '#5B2D8B',
    accentBackground: '#F3E8FF',
    breadcrumbSeparator: '#999',
    chartLegendText: '#aaa',
    error: '#c00',
  }),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: MOCK_ADMIN_USER,
    loading: false,
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: { name: string }) => React.createElement(Text, props, props.name),
  };
});

jest.mock('@/components/app-header', () => ({ AppHeader: () => null }));
jest.mock('@/components/reports/usage-line-chart', () => ({ UsageLineChart: () => null }));
jest.mock('@/components/reports/dau-mau-line-chart', () => ({ DauMauLineChart: () => null }));

jest.mock('react-i18next', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
  };
});

describe('AdminReportsScreen demografía de usuarios', () => {
  beforeEach(() => {
    usuariosCallback = null;
    usuariosErrorCallback = null;
  });

  it('muestra KPIs, barras de edad y dona de género', async () => {
    const { getByTestId, getByText } = render(<AdminReportsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-demographics'));
    });

    await waitFor(() => {
      expect(getByTestId('kpi-total-users-val').props.children).toBe(3);
      expect(getByTestId('kpi-average-age-val').props.children).toBe(28);
      expect(getByTestId('reports-age-bar-chart')).toBeTruthy();
      expect(getByTestId('reports-gender-donut-chart')).toBeTruthy();
    });

    expect(getByText('reports.reportTypeDemographics')).toBeTruthy();
    expect(getByTestId('gender-donut-total').props.children).toBe(3);
  });

  it('muestra error de permisos al fallar Firestore', async () => {
    const { getByTestId, getAllByText } = render(<AdminReportsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-demographics'));
    });

    await act(async () => {
      usuariosErrorCallback?.({ code: 'firestore/permission-denied' });
    });

    expect(getAllByText('reports.permissionError').length).toBeGreaterThan(0);
  });

  it('reexporta el agregador de demografía', () => {
    expect(aggregateUserDemographics([]).totalUsers).toBe(0);
  });

  it('genera snapshot del layout de demografía', async () => {
    const { getByTestId, toJSON } = render(<AdminReportsScreen />);

    await act(async () => {
      fireEvent.press(getByTestId('report-type-select'));
    });
    await act(async () => {
      fireEvent.press(getByTestId('type-option-demographics'));
    });

    await waitFor(() => {
      expect(getByTestId('reports-age-bar-chart')).toBeTruthy();
    });

    expect(toJSON()).toMatchSnapshot();
  });
});
