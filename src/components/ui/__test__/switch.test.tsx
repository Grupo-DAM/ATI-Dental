import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Switch } from '@/components/ui/switch';

// Mock native hooks and modules
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    breadcrumbSeparator: '#cccccc',
    main: '#6200ee',
  }),
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    dark: {
      logo: '#ffffff',
    },
  },
  Spacing: {},
}));

// Mock react-native-reanimated for testing environment
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
    },
    useAnimatedStyle: (fn: Function) => fn(),
    useDerivedValue: (fn: Function) => ({ value: fn() }),
    withTiming: (val: number) => val,
    interpolateColor: (val: number, [from, to]: [number, number], colors: [string, string]) =>
      val === 1 ? colors[1] : colors[0],
  };
});

describe('Switch Component', () => {
  const mockOnSwitch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByRole, UNSAFE_getByType } = render(
      <Switch value={true} onSwitch={mockOnSwitch} />
    );

    expect(UNSAFE_getByType(Switch)).toBeTruthy();
  });

  it('calls onSwitch callback when pressed', () => {
    const { getByTestId } = render(
        <Switch value={false} onSwitch={mockOnSwitch} />
    );

    // Get the Pressable root component and trigger press
    fireEvent.press(getByTestId('switch-pressable'));

    expect(mockOnSwitch).toHaveBeenCalledTimes(1);
  });

  it('accepts custom boolean value prop without crashing', () => {
    const { rerender, UNSAFE_getByType } = render(
      <Switch value={true} onSwitch={mockOnSwitch} />
    );

    expect(UNSAFE_getByType(Switch)).toBeTruthy();

    // Rerender with toggled state
    rerender(<Switch value={false} onSwitch={mockOnSwitch} />);
    expect(UNSAFE_getByType(Switch)).toBeTruthy();
  });
});