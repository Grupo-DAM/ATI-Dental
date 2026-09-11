import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DropdownSelector } from '@/components/ui/dropdown-selector';

// Mock native hooks and modules that aren't available in Jest node environment
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#000000',
    border: '#cccccc',
    backgroundElement: '#ffffff',
    textNames: '#111111',
  }),
}));

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

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

// Mock react-native-reanimated for testing environment
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
    },
    FadeIn: {
      duration: () => ({}),
    },
  };
});

describe('DropdownSelector Component', () => {
  const mockOptions = ['Name', 'Last Name', 'ID'];
  const mockOnChangeOption = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with the default selected option', () => {
    const { getByText, queryByText } = render(
      <DropdownSelector children={mockOptions} onChangeOption={mockOnChangeOption} />
    );

    // Should render initial selected option (first child)
    expect(getByText('Name')).toBeTruthy();

    // Menu options should be hidden initially
    expect(queryByText('Last Name')).toBeNull();
    expect(queryByText('ID')).toBeNull();
  });

  it('opens options menu when header is pressed', () => {
    const { getByText } = render(
      <DropdownSelector children={mockOptions} onChangeOption={mockOnChangeOption} />
    );

    // Press main trigger to toggle dropdown
    fireEvent.press(getByText('Name'));

    // Should reveal all options in the list
    expect(getByText('Last Name')).toBeTruthy();
    expect(getByText('ID')).toBeTruthy();
  });

  it('calls onChangeOption with correct index and selects option when pressed', () => {
    const { getByText, getAllByText } = render(
      <DropdownSelector children={mockOptions} onChangeOption={mockOnChangeOption} />
    );

    // Open dropdown
    fireEvent.press(getByText('Name'));

    // Press second option ("Last Name")
    fireEvent.press(getByText('Last Name'));

    // Callback should be invoked with index 1
    expect(mockOnChangeOption).toHaveBeenCalledTimes(1);
    expect(mockOnChangeOption).toHaveBeenCalledWith(1);

    // Standard check to verify active option rendered
    expect(getAllByText('Last Name').length).toBeGreaterThan(0);
  });

  it('toggles dropdown closed when header is pressed twice', () => {
    const { getByText, queryByText } = render(
      <DropdownSelector children={mockOptions} onChangeOption={mockOnChangeOption} />
    );

    const trigger = getByText('Name');

    // Open
    fireEvent.press(trigger);
    expect(getByText('Last Name')).toBeTruthy();

    // Close
    fireEvent.press(trigger);
    expect(queryByText('Last Name')).toBeNull();
  });
});