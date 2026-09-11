import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { UserCard } from '@/components/users-list/user-card';

// Mock native hooks and modules
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    cardSeparator: '#cccccc',
    backgroundElement: '#ffffff',
    textNames: '#111111',
    pageSubtitle: '#666666',
    main: '#6200ee',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'admin-users.activeStatus': 'Active',
        'admin-users.inactiveStatus': 'Inactive',
        'admin-users.statusLabel': 'Status:',
        'admin-users.roleLabel': 'Role:',
        'user-card.lastVisitLabel': 'Last Visit:',
        'user-card.nextVisitLabel': 'Next Visit:',
        'roles.admin': 'Administrator',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('@/constants/user-roles', () => ({
  getRoleLabelKey: (role?: string) => (role ? `roles.${role.toLowerCase()}` : 'roles.user'),
}));

// Mock sub-components
jest.mock('@/components/themed-text', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, style }: any) => <Text style={style}>{children}</Text>,
  };
});

jest.mock('@/components/themed-view', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, style }: any) => <View style={style}>{children}</View>,
  };
});

jest.mock('@/components/ui/switch.tsx', () => {
  const { Pressable, Text } = require('react-native');
  return {
    Switch: ({ value, onSwitch }: any) => (
      <Pressable testID="mock-switch" onPress={onSwitch}>
        <Text>{value ? 'ON' : 'OFF'}</Text>
      </Pressable>
    ),
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

// Spy on Alert
jest.spyOn(Alert, 'alert');

describe('UserCard Component', () => {
  const mockSwitchStatus = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user details and initials correctly for general type', () => {
    const { getByText, queryByTestId } = render(
      <UserCard
        ID="#U-101"
        name="John Doe"
        email="john@example.com"
        type="general"
        status={true}
        switchStatus={mockSwitchStatus}
        role="admin"
      />
    );

    // Verify user info and generated initials (JD)
    expect(getByText('#U-101')).toBeTruthy();
    expect(getByText('JD')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();

    // Verify general status and role translations
    expect(getByText('Status:')).toBeTruthy();
    expect(getByText('Active')).toBeTruthy();
    expect(getByText('Role:')).toBeTruthy();

    // Verify Switch is rendered for general users
    expect(queryByTestId('mock-switch')).toBeTruthy();
  });

  it('renders patient specific visit dates when type is patient', () => {
    const { getByText, queryByTestId } = render(
      <UserCard
        ID="#P-202"
        name="Jane Smith"
        email="jane@example.com"
        type="patient"
        lastVisit="2026-08-01"
        nextVisit="2026-09-15"
      />
    );

    // Verify patient visit details
    expect(getByText('Last Visit:')).toBeTruthy();
    expect(getByText('2026-08-01')).toBeTruthy();
    expect(getByText('Next Visit:')).toBeTruthy();
    expect(getByText('2026-09-15')).toBeTruthy();

    // Switch should NOT render for patients
    expect(queryByTestId('mock-switch')).toBeNull();
  });

  it('triggers switchStatus callback when switch is toggled', () => {
    const { getByTestId } = render(
      <UserCard
        name="Alice"
        type="general"
        status={false}
        switchStatus={mockSwitchStatus}
      />
    );

    fireEvent.press(getByTestId('mock-switch'));

    expect(mockSwitchStatus).toHaveBeenCalledTimes(1);
  });

  it('triggers Alert on press and long press', () => {
    const { getByText } = render(
      <UserCard name="Bob Ross" type="general" switchStatus={mockSwitchStatus} />
    );

    const cardTrigger = getByText('Bob Ross');

    // Test Press
    fireEvent.press(cardTrigger);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Press',
      'Card de paciente presionada',
      expect.any(Array)
    );

    // Test Long Press
    fireEvent(cardTrigger, 'longPress');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Long Press',
      'Card de paciente presionada por más tiempo',
      expect.any(Array)
    );
  });
});