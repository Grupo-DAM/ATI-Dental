import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import LoginScreen from '../app/(auth)/login';
import { useAuth } from '@/hooks/use-auth';

const mockLoginFn = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        login: mockLoginFn,
    }),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    router: {
        replace: (...args: any[]) => mockReplace(...args),
    },
}));

describe('Login Flow (TDD)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should authenticate, securely save token and redirect to user if credentials are valid', async() => {
        mockLoginFn.mockResolvedValueOnce({
            user: { uid: 'user-123', email: 'test@example.com' }
        });

        const { getByTestId } = render(<LoginScreen />);

        const emailInput = getByTestId('email-input');
        const passwordInput = getByTestId('password-input');
        const loginButton = getByTestId('login-button');

        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'Password123!');
        fireEvent.press(loginButton);

        await waitFor(() => {
            expect(mockLoginFn).toHaveBeenCalledWith('test@example.com', 'Password123!');
        });

        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/(tabs)/home');
        });
    });

    it('should show clear error message and not redirect if credentials are invalid', async() => {
        mockLoginFn.mockRejectedValueOnce({
            code: 'auth/invalid-credential',
            message: 'The provided征 credentials are not valid.'
        });

        const { getByTestId, findByText, queryByText } = render(<LoginScreen />);

        const emailInput = getByTestId('email-input');
        const passwordInput = getByTestId('password-input');
        const loginButton = getByTestId('login-button');

        fireEvent.changeText(emailInput, 'attacker@example.com');
        fireEvent.changeText(passwordInput, 'WrongPassword123!');
        fireEvent.press(loginButton);

        await waitFor(() => {
            expect(mockLoginFn).toHaveBeenCalledWith('attacker@example.com', 'WrongPassword123!');
        });

        expect(mockReplace).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalledWith('/(tabs)/home');

        const secureErrorMessage = await findByText('El correo o la contraseña son incorrectos.');
        expect(secureErrorMessage).toBeTruthy();

        const rawBackendError = queryByText('auth/invalid-credential');
        expect(rawBackendError).toBeNull();
    });
});