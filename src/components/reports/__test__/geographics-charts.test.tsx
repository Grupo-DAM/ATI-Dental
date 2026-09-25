import React from 'react';
import renderer from 'react-test-renderer';
import { render } from '@testing-library/react-native';
import { CountryBarChart } from '@/components/reports/country-bar-chart';
import { RegionDonutChart } from '@/components/reports/region-donut-chart';
import { describeDonutSlice } from '@/components/reports/utils/donut-utils';

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

describe('gráficos de geografía', () => {
  it('renderiza barras de país', () => {
    const { getByTestId } = render(
      <CountryBarChart
        data={[
          { key: 'co', count: 10, label: '🇨🇴 Colombia' },
          { key: 've', count: 5, label: '🇻🇪 Venezuela' },
          { key: 'mx', count: 2, label: '🇲🇽 México' },
        ]}
      />,
    );

    expect(getByTestId('reports-country-bar-chart')).toBeTruthy();
    expect(getByTestId('country-bar-co')).toBeTruthy();
  });

  it('renderiza la dona de regiones y describe un anillo', () => {
    const { getByTestId } = render(
      <RegionDonutChart
        total={17}
        data={[
          { key: 'andina', count: 10, percent: 58.8 },
          { key: 'caribe', count: 5, percent: 29.4 },
          { key: 'pacifica', count: 2, percent: 11.8 },
          { key: 'otros', count: 0, percent: 0 },
        ]}
      />,
    );

    expect(getByTestId('reports-region-donut-chart')).toBeTruthy();
    expect(getByTestId('region-donut-total').props.children).toBe(17);
    expect(describeDonutSlice(80, 80, 60, 40, 0, 360)).toContain('A');
    expect(describeDonutSlice(80, 80, 60, 40, 10, 10)).toBe('');
  });

  it('genera snapshot de barras y dona de geografía sin regresiones de layout', () => {
    let countryTree: any;
    let regionTree: any;
    renderer.act(() => {
      countryTree = renderer
        .create(
          <CountryBarChart
            data={[
              { key: 'co', count: 10, label: '🇨🇴 Colombia' },
              { key: 've', count: 5, label: '🇻🇪 Venezuela' },
            ]}
          />,
        )
        .toJSON();
        
      regionTree = renderer
        .create(
          <RegionDonutChart
            total={15}
            data={[
              { key: 'andina', count: 10, percent: 66.6 },
              { key: 'caribe', count: 5, percent: 33.3 },
            ]}
          />,
        )
        .toJSON();
    });

    expect(countryTree).toMatchSnapshot();
    expect(regionTree).toMatchSnapshot();
  });

  it('RegionDonutChart usa color fallback para clave desconocida', () => {
    const { getByTestId } = render(
      <RegionDonutChart
        total={5}
        data={[
          { key: 'desconocido' as any, count: 5, percent: 100, label: 'Desconocido' },
        ]}
      />,
    );

    expect(getByTestId('reports-region-donut-chart')).toBeTruthy();
    // La leyenda también debe renderizar el item con color fallback
    expect(getByTestId('region-legend-desconocido')).toBeTruthy();
  });

  it('describeDonutSlice genera arco completo (>= 359.99°)', () => {
    const path = describeDonutSlice(80, 80, 60, 40, 0, 360);
    // Full circle: should contain two arcs (split at 180°)
    expect(path).toContain('A');
    expect(path.length).toBeGreaterThan(50);
  });

  it('describeDonutSlice retorna vacío para sweep negativo', () => {
    const path = describeDonutSlice(80, 80, 60, 40, 90, 50);
    expect(path).toBe('');
  });

  it('describeDonutSlice genera arco mayor a 180°', () => {
    const path = describeDonutSlice(80, 80, 60, 40, 0, 270);
    expect(path).toContain('A');
    // largeArc should be 1 for sweep > 180
    expect(path).toContain('1 1');
  });

  it('RegionDonutChart con datos vacíos (todos count=0)', () => {
    const { getByTestId } = render(
      <RegionDonutChart
        total={0}
        data={[
          { key: 'andina', count: 0, percent: 0, label: 'Andina' },
          { key: 'caribe', count: 0, percent: 0, label: 'Caribe' },
        ]}
      />,
    );

    expect(getByTestId('reports-region-donut-chart')).toBeTruthy();
    expect(getByTestId('region-donut-total').props.children).toBe(0);
  });
});

