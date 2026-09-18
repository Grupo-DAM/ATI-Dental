import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ComingSoonScreen } from '@/components/navigation/coming-soon-screen';

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ComingSoonScreen', () => {
  it('muestra título y mensaje de próximamente', () => {
    render(<ComingSoonScreen titleKey="navigation.registerPatient" />);
    expect(screen.getByTestId('coming-soon-screen')).toBeTruthy();
    expect(screen.getByText('navigation.registerPatient')).toBeTruthy();
    expect(screen.getByText('navigation.comingSoon')).toBeTruthy();
  });
});
