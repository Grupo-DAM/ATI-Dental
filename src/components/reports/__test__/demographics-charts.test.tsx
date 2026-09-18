import React from 'react';
import { render } from '@testing-library/react-native';
import { AgeBarChart } from '@/components/reports/age-bar-chart';
import { GenderDonutChart, describeDonutSlice } from '@/components/reports/gender-donut-chart';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    pageSubtitle: '#666',
    reportValueText: '#111',
    accentBackground: '#F3E8FF',
  }),
}));

describe('gráficos de demografía', () => {
  it('renderiza barras de edad', () => {
    const { getByTestId } = render(
      <AgeBarChart
        data={[
          { key: '18_25', count: 2 },
          { key: '26_35', count: 5 },
          { key: '36_50', count: 1 },
          { key: '50_plus', count: 0 },
          { key: 'unspecified', count: 1 },
        ]}
      />,
    );

    expect(getByTestId('reports-age-bar-chart')).toBeTruthy();
    expect(getByTestId('age-bar-26_35')).toBeTruthy();
  });

  it('renderiza la dona y describe un anillo completo', () => {
    const { getByTestId } = render(
      <GenderDonutChart
        total={10}
        data={[
          { key: 'female', count: 10, percent: 100 },
          { key: 'male', count: 0, percent: 0 },
          { key: 'unspecified', count: 0, percent: 0 },
        ]}
      />,
    );

    expect(getByTestId('reports-gender-donut-chart')).toBeTruthy();
    expect(getByTestId('gender-donut-total').props.children).toBe(10);
    expect(describeDonutSlice(80, 80, 60, 40, 0, 360)).toContain('A');
    expect(describeDonutSlice(80, 80, 60, 40, 10, 10)).toBe('');
  });
});
