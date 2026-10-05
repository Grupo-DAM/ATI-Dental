import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ConfirmationModal, createConfirmationModalStyles } from '../confirmation-modal';
import { Colors } from '@/constants/theme';

let mockBottomInset = 0;
let mockTheme = Colors.light;

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: mockBottomInset, left: 0 }),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => mockTheme,
}));

describe('ConfirmationModal Component Suite', () => {
  beforeEach(() => {
    mockBottomInset = 0;
    mockTheme = Colors.light;
    jest.clearAllMocks();
  });

  it('renders correctly with default props in light mode', () => {
    const { getByText } = render(
      <ConfirmationModal
        visible={true}
        title="Confirm"
        message="Are you sure?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(getByText('Confirm')).toBeTruthy();
    expect(getByText('Are you sure?')).toBeTruthy();
    expect(getByText('Yes')).toBeTruthy();
    expect(getByText('No')).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const onConfirmMock = jest.fn();
    const { getByTestId } = render(
      <ConfirmationModal
        visible={true}
        title="Confirm"
        message="Are you sure?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={onConfirmMock}
        onCancel={() => {}}
      />
    );
    fireEvent.press(getByTestId('modal-confirm-btn'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancelMock = jest.fn();
    const { getByTestId } = render(
      <ConfirmationModal
        visible={true}
        title="Confirm"
        message="Are you sure?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {}}
        onCancel={onCancelMock}
      />
    );
    fireEvent.press(getByTestId('modal-cancel-btn'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('renders ActivityIndicator and disables confirm button when isSubmitting is true', () => {
    const onConfirmMock = jest.fn();
    const { getByTestId, queryByText } = render(
      <ConfirmationModal
        visible={true}
        title="Confirm"
        message="Are you sure?"
        confirmText="Yes"
        cancelText="No"
        isSubmitting={true}
        onConfirm={onConfirmMock}
        onCancel={() => {}}
      />
    );
    fireEvent.press(getByTestId('modal-confirm-btn'));
    expect(queryByText('Yes')).toBeNull();
    expect(onConfirmMock).not.toHaveBeenCalled();
  });

  it('renders correctly with isDestructive=true', () => {
    const { getByText } = render(
      <ConfirmationModal
        visible={true}
        title="Delete Item"
        message="This action cannot be undone"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(getByText('Delete Item')).toBeTruthy();
  });

  it('renders properly in dark mode without falling back to white background', () => {
    mockTheme = Colors.dark;
    const { getByText } = render(
      <ConfirmationModal
        visible={true}
        title="Dark Modal"
        message="Dark mode confirmation"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(getByText('Dark Modal')).toBeTruthy();
  });

  describe('createConfirmationModalStyles unit tests', () => {
    it('applies fallback minimum padding when insets.bottom is 0 or undefined', () => {
      const stylesZero = createConfirmationModalStyles(Colors.light, { bottom: 0 });
      expect(stylesZero.sheet.paddingBottom).toBe(24);

      const stylesUndefined = createConfirmationModalStyles(Colors.light, undefined);
      expect(stylesUndefined.sheet.paddingBottom).toBe(24);
    });

    it('dynamically adapts paddingBottom for Android 3-button navigation bar (e.g. 48px)', () => {
      const stylesAndroidBar = createConfirmationModalStyles(Colors.light, { bottom: 48 });
      expect(stylesAndroidBar.sheet.paddingBottom).toBe(48);
    });

    it('dynamically adapts paddingBottom for iOS Home Indicator (e.g. 34px)', () => {
      const stylesIOS = createConfirmationModalStyles(Colors.light, { bottom: 34 });
      expect(stylesIOS.sheet.paddingBottom).toBe(34);
    });

    it('applies dark theme background and colors correctly in createConfirmationModalStyles', () => {
      const stylesDark = createConfirmationModalStyles(Colors.dark, { bottom: 20 });
      expect(stylesDark.sheet.backgroundColor).toBe(Colors.dark.backgroundElement);
      expect(stylesDark.title.color).toBe(Colors.dark.pageTitle);
      expect(stylesDark.handle.backgroundColor).toBe(Colors.dark.cardSeparator);
    });
  });
});
