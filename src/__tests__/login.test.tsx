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
            expect(mockReplace).toHaveBeenCalledWith('/home');
        });
    });


});