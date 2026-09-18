import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import { NoResultSearch } from '@/components/users-list/no-results';

// --- Mocks ---

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    pageSubtitle: '#666666',
    main: '#6200ee',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'admin-users.noResults': 'No users found',
        'admin-users.noResultsQuestion': 'Would you like to add a new user?',
        'admin-users.registerUser': 'Register New User',
        'patients-list.noResults': 'No patients found',
        'patients-list.noResultsQuestion': 'Would you like to add a new patient?',
        'patients-list.registerPatient': 'Register New Patient',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

describe('NoResultSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1. General / Admin Mode (Default & Explicit) ---

  it('renders correctly with default props (general mode)', () => {
    const { getByTestId, getByText } = render(<NoResultSearch />);

    expect(getByTestId('no-search-result-message')).toBeTruthy();
    expect(getByText('No users found')).toBeTruthy();
    expect(getByText('Would you like to add a new user?')).toBeTruthy();
    expect(getByText('Register New User')).toBeTruthy();
  });

  it('renders correctly when general is explicitly set to true', () => {
    const { getByText } = render(<NoResultSearch general={true} />);

    expect(getByText('No users found')).toBeTruthy();
    expect(getByText('Register New User')).toBeTruthy();
  });

  // --- 2. Patient List Mode (general = false) ---

  it('renders correctly when general is false (patient mode)', () => {
    const { getByText, queryByText } = render(<NoResultSearch general={false} />);

    expect(getByText('No patients found')).toBeTruthy();
    expect(getByText('Would you like to add a new patient?')).toBeTruthy();
    expect(getByText('Register New Patient')).toBeTruthy();

    expect(queryByText('No users found')).toBeNull();
    expect(queryByText('Register New User')).toBeNull();
  });

  // --- 3. Functional / Navigation Branch Testing ---

  it('navigates to patient registration when general is false and button is pressed', () => {
    const { getByTestId } = render(<NoResultSearch general={false} />);

    const button = getByTestId('no-result-search-users');
    fireEvent.press(button);

    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith('/(tabs)/patients/register-patient');
  });

  it('does NOT navigate when general is true and button is pressed', () => {
    const { getByTestId } = render(<NoResultSearch general={true} />);

    const button = getByTestId('no-result-search-users');
    fireEvent.press(button);

    expect(router.replace).not.toHaveBeenCalled();
  });

  // --- 4. Fallback i18n Branch Testing ---

  it('returns translation key if key is not found in i18n fallback', () => {
    const { useTranslation } = require('react-i18next');
    const t = useTranslation().t;

    expect(t('unmapped.key')).toBe('unmapped.key');
  });

  // --- 5. UI Assets ---

  it('renders search and register icons', () => {
    const { getAllByTestId } = render(<NoResultSearch />);

    const images = getAllByTestId('expo-image');
    expect(images.length).toBe(2);
  });
});