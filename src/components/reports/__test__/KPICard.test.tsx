import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { KPICard } from '@/components/reports/KPICard';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || 'Entendido',
  }),
}));

// Mocking useTheme hook to return predictable style variables
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#FFF',
    backgroundElement: '#F5F5F5',
    logo: '#000',
    breadcrumbSeparator: '#888',
    reportValueText: '#111',
    pageSubtitle: '#444',
    accentBackground: '#EEE',
    positive: '#00FF00',
    border: '#DDD',
    pageTitle: '#111',
    textSecondary: '#666',
    overMain: '#FFF',
  }),
}));

describe('KPICard Component', () => {
  const defaultProps = {
    label: 'Total Active Users',
    value: '1,240',
    iconName: 'people-outline' as const,
    valueTestID: 'kpi-value-id',
    cardTestID: 'kpi-card-id',
  };

  it('renders default large layout correctly (tinyType = false)', () => {
    const { getByText, getByTestId, queryByText } = render(
      <KPICard {...defaultProps} tinyType={false} />
    );

    // Verify main contents are printed
    expect(getByText('Total Active Users')).toBeTruthy();
    expect(getByTestId('kpi-value-id').props.children).toEqual('1,240');
    expect(getByTestId('kpi-card-id')).toBeTruthy();
    
    // Sub-labels shouldn't exist in the default non-tiny view
    expect(queryByText('...')).toBeNull();
  });

  it('renders the loading state gracefully when large', () => {
    const { getByTestId } = render(
      <KPICard {...defaultProps} tinyType={false} loading={true} />
    );

    // Replaces raw text value with '...' ellipsis indicator
    expect(getByTestId('kpi-value-id').props.children).toEqual('...');
  });

  it('renders small layout properly (tinyType = true) alongside default subLabels', () => {
    const { getByText, getByTestId } = render(
      <KPICard {...defaultProps} tinyType={true} hasSubLabel={true} /> 
    )
    expect(getByText('Total Active Users')).toBeTruthy();
    expect(getByTestId('kpi-value-id').props.children).toEqual('1,240');
    
    // It should safely display default sublabel placeholder
    expect(getByText('...')).toBeTruthy();
  });

  it('applies standard text styles to subLabel when accentSubLabel is false', () => {
    const { getByText } = render(
      <KPICard 
        {...defaultProps} 
        tinyType={true} 
        hasSubLabel={true} 
        subLabel="Last 30 days" 
        accentSubLabel={false} 
      />
    );

    const subLabelText = getByText('Last 30 days');
    // Verifies it falls back to standard typography
    expect(subLabelText.props.style.fontWeight).toBeUndefined();
  });

  it('applies positive highlighted styles when accentSubLabel is active', () => {
    const { getByText } = render(
      <KPICard {...defaultProps} tinyType={true} subLabel="+12% growth" accentSubLabel={true} hasSubLabel={true} />
    );

    const subLabelText = getByText('+12% growth');
    // Verifies it loaded the alternative bold/accent layout style properties
    expect(subLabelText.props.style.fontWeight).toEqual('700');
  });

  it('renders infoTooltip icon and opens modal in tinyType layout', () => {
    const { getByTestId } = render(
      <KPICard
        {...defaultProps}
        tinyType={true}
        infoTooltip={{
          title: 'DAU (Daily Active Users)',
          description: 'Usuarios Activos Diarios.',
          calculationNote: 'Stickiness',
        }}
        infoTestID="kpi-dau-info"
      />
    );

    const infoIcon = getByTestId('kpi-dau-info');
    expect(infoIcon).toBeTruthy();

    fireEvent.press(infoIcon);
    expect(getByTestId('kpi-dau-info-title').props.children).toBe('DAU (Daily Active Users)');
    expect(getByTestId('kpi-dau-info-description').props.children).toBe('Usuarios Activos Diarios.');
    expect(getByTestId('kpi-dau-info-note')).toBeTruthy();
  });

  it('renders infoTooltip icon in standard large layout', () => {
    const { getByTestId } = render(
      <KPICard
        {...defaultProps}
        tinyType={false}
        infoTooltip={{
          title: 'MAU (Monthly Active Users)',
          description: 'Usuarios Activos Mensuales.',
        }}
        infoTestID="kpi-mau-info"
      />
    );

    const infoIcon = getByTestId('kpi-mau-info');
    expect(infoIcon).toBeTruthy();
  });
});
