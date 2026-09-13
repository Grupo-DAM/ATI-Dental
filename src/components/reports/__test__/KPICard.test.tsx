import React from 'react';
import { render } from '@testing-library/react-native';
import { KPICard } from '@/components/reports/KPICard'; // Adjust path based on your layout

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
      <KPICard {...defaultProps} tinyType={true} />
    );

    expect(getByText('Total Active Users')).toBeTruthy();
    expect(getByTestId('kpi-value-id').props.children).toEqual('1,240');
    
    // It should safely display default sublabel placeholder
    expect(getByText('...')).toBeTruthy();
  });

  it('applies standard text styles to subLabel when accentSubLabel is false', () => {
    const { getByText } = render(
      <KPICard {...defaultProps} tinyType={true} subLabel="Last 30 days" accentSubLabel={false} />
    );

    const subLabelText = getByText('Last 30 days');
    // Verifies it falls back to standard typography (font weight isn't modified to 700)
    expect(subLabelText.props.style.fontWeight).toBeUndefined();
  });

  it('applies positive highlighted styles when accentSubLabel is active', () => {
    const { getByText } = render(
      <KPICard {...defaultProps} tinyType={true} subLabel="+12% growth" accentSubLabel={true} />
    );

    const subLabelText = getByText('+12% growth');
    // Verifies it loaded the alternative bold/accent layout style properties
    expect(subLabelText.props.style.fontWeight).toEqual('700');
  });
});
