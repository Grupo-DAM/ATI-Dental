import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';

describe('LoginScreen', () => {
  it('renders the login form correctly', () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    expect(getByText(/ATI Dental/i)).toBeTruthy();
    expect(getByTestId('email-input')).toBeTruthy();
    expect(getByTestId('password-input')).toBeTruthy();
    expect(getByTestId('login-button')).toBeTruthy();
  });

  it('shows required field errors when submitting empty form', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.press(getByTestId('login-button'));

    expect(getByTestId('email-error')).toBeTruthy();
    expect(getByTestId('password-error')).toBeTruthy();
  });

  it('shows email format error for invalid email', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'correo-invalido');
    fireEvent.changeText(getByTestId('password-input'), '123456');
    fireEvent.press(getByTestId('login-button'));

    expect(getByTestId('email-error').props.children).toContain('formato');
  });

  it('shows password length error for short password', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'test@correo.com');
    fireEvent.changeText(getByTestId('password-input'), '123');
    fireEvent.press(getByTestId('login-button'));

    expect(getByTestId('password-error').props.children).toContain('6 caracteres');
  });

  it('shows success message when form is valid', () => {
    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('email-input'), 'usuario@ati-dental.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('login-button'));

    expect(getByTestId('success-message')).toBeTruthy();
  });

  it('clears email error when user types', () => {
    const { getByTestId, queryByTestId } = render(<LoginScreen />);

    // Submit empty to trigger errors
    fireEvent.press(getByTestId('login-button'));
    expect(getByTestId('email-error')).toBeTruthy();

    // Type in email field — error should clear
    fireEvent.changeText(getByTestId('email-input'), 'a');
    expect(queryByTestId('email-error')).toBeNull();
  });
});
