import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DauMauReportView } from '../views/DauMauReportView';
import { useDauMauMetrics } from '../hooks/useDauMauMetrics';

jest.mock('../hooks/useDauMauMetrics');

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'reports.kpiRatio': 'RATIO',
        'reports.kpiDau': 'DAU (DIARIOS)',
        'reports.kpiMau': 'MAU (MENS.)',
        'reports.kpiDailyAvg': 'Prom. diario',
        'reports.kpiThisMonth': 'Este mes',
        'reports.dauMauChartTitle': 'DAU VS MAU',
        'reports.kpiDauTooltipTitle': 'DAU (Daily Active Users)',
        'reports.kpiDauTooltipDesc': 'Usuarios Activos Diarios.',
        'reports.kpiMauTooltipTitle': 'MAU (Monthly Active Users)',
        'reports.kpiMauTooltipDesc': 'Usuarios Activos Mensuales.',
        'reports.kpiRatioTooltipTitle': 'Ratio DAU / MAU',
        'reports.kpiRatioTooltipDesc': 'Indicador de adopción y recurrencia.',
        'reports.tooltipClose': 'Entendido',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    overMain: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    logo: '#5B2D8B',
    breadcrumbSeparator: '#9CA3AF',
    reportValueText: '#111827',
    pageSubtitle: '#6B7280',
    pageTitle: '#1F2937',
    textSecondary: '#6B7280',
    accentBackground: '#F3E8FF',
    accentText: '#725C8A',
    positive: '#10B981',
    border: '#E2E8F0',
    chartLegendText: '#A0AEC0',
    lineChartBottomLine: '#CBD5E0',
  }),
}));

const mockUser = {
  uid: 'admin-1',
  email: 'admin@atidental.com',
  rol: 'admin',
  nombre: 'Admin',
};

describe('DauMauReportView Component', () => {
  const onOpenPeriodModalMock = jest.fn();
  const onDataReadyMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDauMauMetrics as jest.Mock).mockReturnValue({
      dauValue: 42,
      mauValue: 120,
      dauMauRatio: 35,
      dauMauData: [
        { label: 'Lun', dau: 40, mau: 120 },
        { label: 'Mar', dau: 42, mau: 120 },
      ],
    });
  });

  it('renders DAU, MAU and Ratio cards with their values and info icons', () => {
    const { getByTestId, getByText } = render(
      <DauMauReportView
        user={mockUser as any}
        authLoading={false}
        systemActiveUsersCount={120}
        activeUsersCount={42}
        periodLabel="Últimos 30 días"
        onOpenPeriodModal={onOpenPeriodModalMock}
        onDataReady={onDataReadyMock}
      />
    );

    expect(getByTestId('kpi-cards-container')).toBeTruthy();
    expect(getByTestId('kpi-ratio-value').props.children).toBe('35%');
    expect(getByTestId('kpi-dau-value').props.children).toBe(42);
    expect(getByTestId('kpi-mau-value').props.children).toBe(120);

    // Verify info tooltip icons exist
    expect(getByTestId('kpi-ratio-info-icon')).toBeTruthy();
    expect(getByTestId('kpi-dau-info-icon')).toBeTruthy();
    expect(getByTestId('kpi-mau-info-icon')).toBeTruthy();
  });

  it('opens DAU tooltip modal when pressing DAU info icon', () => {
    const { getByTestId } = render(
      <DauMauReportView
        user={mockUser as any}
        authLoading={false}
        systemActiveUsersCount={120}
        activeUsersCount={42}
        periodLabel="Últimos 30 días"
        onOpenPeriodModal={onOpenPeriodModalMock}
        onDataReady={onDataReadyMock}
      />
    );

    fireEvent.press(getByTestId('kpi-dau-info-icon'));
    expect(getByTestId('kpi-dau-info-icon-title').props.children).toBe('DAU (Daily Active Users)');
    expect(getByTestId('kpi-dau-info-icon-description').props.children).toBe('Usuarios Activos Diarios.');

    // Dismiss modal
    fireEvent.press(getByTestId('kpi-dau-info-icon-close-button'));
  });

  it('opens Ratio tooltip modal and displays calculation formula note', () => {
    const { getByTestId } = render(
      <DauMauReportView
        user={mockUser as any}
        authLoading={false}
        systemActiveUsersCount={120}
        activeUsersCount={42}
        periodLabel="Últimos 30 días"
        onOpenPeriodModal={onOpenPeriodModalMock}
        onDataReady={onDataReadyMock}
      />
    );

    fireEvent.press(getByTestId('kpi-ratio-info-icon'));
    expect(getByTestId('kpi-ratio-info-icon-title').props.children).toBe('Ratio DAU / MAU');
    expect(getByTestId('kpi-ratio-info-icon-note')).toBeTruthy();

    // Dismiss modal via backdrop
    fireEvent.press(getByTestId('kpi-ratio-info-icon-backdrop'));
  });

  it('calls onDataReady when metrics change', () => {
    render(
      <DauMauReportView
        user={mockUser as any}
        authLoading={false}
        systemActiveUsersCount={120}
        activeUsersCount={42}
        periodLabel="Últimos 30 días"
        onOpenPeriodModal={onOpenPeriodModalMock}
        onDataReady={onDataReadyMock}
      />
    );

    expect(onDataReadyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        dauValue: 42,
        mauValue: 120,
        dauMauRatio: 35,
      })
    );
  });
});
