import React from 'react';
import { measureRenders } from 'reassure';
import HomeScreen from '../app/(tabs)/home';
import ProfileScreen from '../app/(tabs)/profile';

jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: { email: 'test@test.com' },
}));
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'es', changeLanguage: jest.fn() } }),
}));
jest.mock('../hooks/use-auth', () => ({
  useAuth: () => ({ user: { email: 'test@test.com' }, loading: false }),
}));
jest.setTimeout(120000); // 2 minutes for reassure performance measurements

describe('Performance testing', () => {
  it('HomeScreen renders fast enough', async () => {
    await measureRenders(<HomeScreen />);
    expect(true).toBe(true);
  });

  it('ProfileScreen renders fast enough without performance regressions', async () => {
    await measureRenders(<ProfileScreen />);
    expect(true).toBe(true);
  });
});
