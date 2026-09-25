import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { UserGeographicsReportView } from '../views/UserGeographicsReportView';
import { useUserGeographics } from '../hooks/useUserGeographics';

jest.mock('../hooks/useUserGeographics');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    pageSubtitle: '#666',
    reportValueText: '#111',
    accentBackground: '#F3E8FF',
    backgroundElement: '#FFF',
  }),
}));

const mockUser = {
  uid: '123',
  email: 'admin@test.com',
  rol: 'admin',
  nombre: 'Admin',
};

describe('UserGeographicsReportView', () => {
  const onOpenPeriodModalMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra el estado de carga correctamente', () => {
    (useUserGeographics as jest.Mock).mockReturnValue({
      loading: true,
      data: null,
      queryError: null,
    });

    const { getByText } = render(
      <UserGeographicsReportView
        user={mockUser as any}
        authLoading={false}
        periodLabel="Este mes"
        onOpenPeriodModal={onOpenPeriodModalMock}
      />
    );

    expect(getByText('Cargando datos geográficos...')).toBeTruthy();
  });

  it('muestra estado vacío cuando no hay usuarios', () => {
    (useUserGeographics as jest.Mock).mockReturnValue({
      loading: false,
      data: { totalUsers: 0 }, // hasData es false
      queryError: null,
    });

    const { getByText } = render(
      <UserGeographicsReportView
        user={mockUser as any}
        authLoading={false}
        periodLabel="Este mes"
        onOpenPeriodModal={onOpenPeriodModalMock}
      />
    );

    expect(getByText('reports.geoDataUnavailable')).toBeTruthy();
  });

  it('renderiza los gráficos si hay datos', () => {
    (useUserGeographics as jest.Mock).mockReturnValue({
      loading: false,
      data: {
        totalUsers: 10,
        totalCities: 3,
        mainCountry: 'Colombia',
        mainCountryPercent: 50,
        countryBuckets: [{ key: 'co', count: 5, label: 'Colombia' }],
        regionSlices: [{ key: 'andina', count: 5, percent: 50 }],
      },
      queryError: null,
    });

    const { getByTestId, getAllByText } = render(
      <UserGeographicsReportView
        user={mockUser as any}
        authLoading={false}
        periodLabel="Este mes"
        onOpenPeriodModal={onOpenPeriodModalMock}
      />
    );

    expect(getByTestId('kpi-cards-container')).toBeTruthy();
    expect(getAllByText('Colombia')[0]).toBeTruthy();
  });
});
