import React from 'react';
import { render, act } from '@testing-library/react-native';
import { NotificationToast } from '../notification-toast';

describe('NotificationToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders correctly when visible is true', () => {
    const { getByText } = render(
      <NotificationToast
        visible={true}
        title="Test Title"
        message="Test Message"
        onDismiss={() => {}}
      />
    );
    expect(getByText('Test Title')).toBeTruthy();
    expect(getByText('Test Message')).toBeTruthy();
  });

  it('returns null when visible is false', () => {
    const { queryByText } = render(
      <NotificationToast
        visible={false}
        title="Test Title"
        message="Test Message"
        onDismiss={() => {}}
      />
    );
    expect(queryByText('Test Title')).toBeNull();
  });

  it('calls onDismiss after 3500ms', () => {
    const onDismissMock = jest.fn();
    render(
      <NotificationToast
        visible={true}
        title="Success"
        message="Saved"
        onDismiss={onDismissMock}
      />
    );

    act(() => {
      jest.advanceTimersByTime(3500);
    });

    // Animate out duration
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(onDismissMock).toHaveBeenCalled();
  });
});
