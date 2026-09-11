import React from 'react';
import { render, screen } from '@testing-library/react-native';

import { ComingSoonScreen } from '@/components/navigation/coming-soon-screen';
import AdminReportsScreen from '@/app/(tabs)/admin/reports';
import AdminUsersScreen from '@/app/(tabs)/admin/users';
import RegisterPatientScreen from '@/app/(tabs)/register-patient';
import UpdateContactInfoScreen from '@/app/(tabs)/update-contact-info';

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

  it('reutiliza la pantalla en las rutas placeholder', () => {
    const screens = [
      [RegisterPatientScreen, 'navigation.registerPatient'],
      [AdminReportsScreen, 'navigation.adminReports'],
      [UpdateContactInfoScreen, 'navigation.adminContactInfo'],
    ] as const;

    screens.forEach(([Screen, titleKey]) => {
      const { unmount } = render(<Screen />);
      expect(screen.getByText(titleKey)).toBeTruthy();
      unmount();
    });
  });
});
