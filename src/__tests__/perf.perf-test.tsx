import React from 'react';
import { measureRenders } from 'reassure';
import HomeScreen from '../app/(tabs)/home';
import ProfileScreen from '../app/(tabs)/profile';

jest.mock('@react-native-firebase/auth', () => () => ({
  currentUser: {
    email: 'test@test.com',
    displayName: 'Test User',
    uid: '123',
    verifyBeforeUpdateEmail: jest.fn().mockResolvedValue(true),
    updateProfile: jest.fn().mockResolvedValue(true),
    reload: jest.fn().mockResolvedValue(true),
    getIdToken: jest.fn().mockResolvedValue('token'),
  },
}));
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  useNetInfo: () => ({ isConnected: true }),
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'es', changeLanguage: jest.fn() } }),
}));
jest.mock('../hooks/use-auth', () => ({
  useAuth: () => ({ user: { email: 'test@test.com', rol: 'admin', nombre: 'Test' }, loading: false, logout: jest.fn() }),
}));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn().mockResolvedValue(true),
  getItemAsync: jest.fn().mockResolvedValue('token'),
  deleteItemAsync: jest.fn().mockResolvedValue(true),
}));
jest.mock('@react-native-firebase/firestore', () => {
  return jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn().mockResolvedValue(true),
        get: jest.fn().mockResolvedValue({ exists: () => false, data: () => ({}) }),
      })),
    })),
    runTransaction: jest.fn((cb) => cb({
      get: jest.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
      set: jest.fn(),
      update: jest.fn(),
    })),
  }));
});

jest.setTimeout(120_000);

describe('Pantallas principales - Rendimiento de montaje', () => {
  it('HomeScreen se renderiza sin regresión de rendimiento', async () => {
    await measureRenders(<HomeScreen />, { runs: 10 });
  });

  it('ProfileScreen se renderiza sin regresión de rendimiento', async () => {
    await measureRenders(<ProfileScreen />, { runs: 10 });
  });
});
