import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AnimatedInteractiveCard } from '../animated-interactive-card';

describe('AnimatedInteractiveCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders card with correct details', () => {
    const renderResult = render(<AnimatedInteractiveCard />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const { getByText } = renderResult;
    expect(getByText('UPCOMING APPOINTMENT')).toBeTruthy();
    expect(getByText('Dental Cleaning & Checkup')).toBeTruthy();
    expect(getByText('Dr. Sofia Rodriguez')).toBeTruthy();
  });

  it('toggles expansion details on press', () => {
    const renderResult = render(<AnimatedInteractiveCard />);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const { getByText } = renderResult;
    
    // Press the card to expand details
    const cardPressable = getByText('Dental Cleaning & Checkup');
    act(() => {
      fireEvent.press(cardPressable);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    expect(getByText('CLINIC LOCATION')).toBeTruthy();
    expect(getByText('ATI Dental - Downtown Suite 302')).toBeTruthy();
  });
});


