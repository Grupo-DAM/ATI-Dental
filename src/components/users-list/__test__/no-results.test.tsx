import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NoResultSearch } from '@/components/users-list/no-results';

// --- Mocks ---

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

// Mock expo-image to prevent native image loading errors
jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

describe('NoResultSearch Component', () => {
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

    // Verify general strings are not rendered
    expect(queryByText('No users found')).toBeNull();
    expect(queryByText('Register New User')).toBeNull();
  });

  // --- 3. UI Assets & Pressable Interactions ---

  it('renders search and register icons', () => {
    const { getAllByTestId } = render(<NoResultSearch />);

    // Should render two expo-image components (SearchIcon and NewUserIcon)
    const images = getAllByTestId('expo-image');
    expect(images.length).toBe(2);
  });

  it('handles button press without crashing', () => {
    const { getByText } = render(<NoResultSearch />);

    const registerBtn = getByText('Register New User');
    expect(() => fireEvent.press(registerBtn)).not.toThrow();
  });
});