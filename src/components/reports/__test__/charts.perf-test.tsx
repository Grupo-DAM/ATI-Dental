import React from 'react';
import { measureRenders } from 'reassure';
import { CountryBarChart } from '@/components/reports/country-bar-chart';
import { RegionDonutChart } from '@/components/reports/region-donut-chart';
import { GenderDonutChart } from '@/components/reports/gender-donut-chart';
import { AgeBarChart } from '@/components/reports/age-bar-chart';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    text: '#111',
    pageTitle: '#111',
    pageSubtitle: '#666',
    backgroundElement: '#FFF',
    accentBackground: '#F3E8FF',
    logo: '#5B2D8B',
    fieldLabel: '#333',
    reportValueText: '#111',
  }),
}));

const countryData = [
  { key: 'co', count: 35, label: '🇨🇴 Colombia' },
  { key: 'mx', count: 20, label: '🇲🇽 México' },
  { key: 'ar', count: 15, label: '🇦🇷 Argentina' },
  { key: 'pe', count: 10, label: '🇵🇪 Perú' },
  { key: 'ec', count: 8, label: '🇪🇨 Ecuador' },
  { key: 'cl', count: 6, label: '🇨🇱 Chile' },
  { key: 've', count: 4, label: '🇻🇪 Venezuela' },
  { key: 'bo', count: 2, label: '🇧🇴 Bolivia' },
];

const regionData = [
  { key: 'andina' as const, count: 40, percent: 47, label: 'Andina' },
  { key: 'caribe' as const, count: 25, percent: 29, label: 'Caribe' },
  { key: 'pacifica' as const, count: 15, percent: 18, label: 'Pacífica' },
  { key: 'otros' as const, count: 5, percent: 6, label: 'Otros' },
];

const genderData = [
  { key: 'female' as const, count: 45, percent: 53 },
  { key: 'male' as const, count: 35, percent: 41 },
  { key: 'unspecified' as const, count: 5, percent: 6 },
];

const ageData = [
  { key: '18_25' as const, count: 20 },
  { key: '26_35' as const, count: 30 },
  { key: '36_50' as const, count: 25 },
  { key: '50_plus' as const, count: 10 },
  { key: 'unspecified' as const, count: 5 },
];

jest.setTimeout(120_000);

describe('Gráficos SVG - Rendimiento de renderizado', () => {
  it('CountryBarChart con 8 países se renderiza sin regresión', async () => {
    await measureRenders(
      <CountryBarChart data={countryData} />,
      { runs: 10 },
    );
  });

  it('RegionDonutChart (dona SVG) se renderiza sin regresión', async () => {
    await measureRenders(
      <RegionDonutChart data={regionData} total={85} />,
      { runs: 10 },
    );
  });

  it('GenderDonutChart (dona SVG) se renderiza sin regresión', async () => {
    await measureRenders(
      <GenderDonutChart data={genderData} total={85} />,
      { runs: 10 },
    );
  });

  it('AgeBarChart con 5 rangos se renderiza sin regresión', async () => {
    await measureRenders(
      <AgeBarChart data={ageData} />,
      { runs: 10 },
    );
  });
});
