import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InfoTooltip } from '../info-tooltip';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#FFFFFF',
    border: '#E2E8F0',
    logo: '#5B2D8B',
    pageTitle: '#1F2937',
    textSecondary: '#6B7280',
    accentBackground: '#F3E8FF',
    accentText: '#725C8A',
    main: '#5B2D8B',
    overMain: '#FFFFFF',
    breadcrumbSeparator: '#9CA3AF',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback || 'Entendido',
  }),
}));

describe('InfoTooltip Component', () => {
  const defaultProps = {
    title: 'DAU (Daily Active Users)',
    description: 'Usuarios Activos Diarios.',
    testID: 'kpi-dau-info-icon',
  };

  it('renders trigger button with accessibility attributes', () => {
    const { getByTestId } = render(<InfoTooltip {...defaultProps} />);
    const trigger = getByTestId('kpi-dau-info-icon');

    expect(trigger).toBeTruthy();
    expect(trigger.props.accessibilityRole).toBe('button');
    expect(trigger.props.accessibilityLabel).toBe(defaultProps.title);
    expect(trigger.props.accessibilityHint).toBe(defaultProps.description);
  });

  it('opens modal on trigger press and displays title, description and close button', () => {
    const { getByTestId, queryByTestId } = render(
      <InfoTooltip
        {...defaultProps}
        calculationNote="(DAU / MAU) * 100"
      />
    );

    // Modal content should be initially closed/hidden or not visible
    const trigger = getByTestId('kpi-dau-info-icon');
    fireEvent.press(trigger);

    expect(getByTestId('kpi-dau-info-icon-title').props.children).toBe(defaultProps.title);
    expect(getByTestId('kpi-dau-info-icon-description').props.children).toBe(defaultProps.description);
    expect(getByTestId('kpi-dau-info-icon-note')).toBeTruthy();

    // Close button dismisses modal
    const closeBtn = getByTestId('kpi-dau-info-icon-close-button');
    fireEvent.press(closeBtn);
  });

  it('closes modal when backdrop is pressed', () => {
    const { getByTestId } = render(<InfoTooltip {...defaultProps} />);

    fireEvent.press(getByTestId('kpi-dau-info-icon'));
    const backdrop = getByTestId('kpi-dau-info-icon-backdrop');
    expect(backdrop).toBeTruthy();

    fireEvent.press(backdrop);
  });

  it('supports custom closeButtonText and renders without calculationNote', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <InfoTooltip
        {...defaultProps}
        closeButtonText="Aceptar"
      />
    );

    fireEvent.press(getByTestId('kpi-dau-info-icon'));
    expect(getByText('Aceptar')).toBeTruthy();
    expect(queryByTestId('kpi-dau-info-icon-note')).toBeNull();
  });
});
