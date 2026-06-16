import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import renderer, { act } from 'react-test-renderer';
import LoginScreen from '../app/(auth)/login';
import { useAuth } from '@/hooks/use-auth';

const mockLoginFn = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        login: mockLoginFn,
    }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
    router: {
        replace: (...args: any[]) => mockReplace(...args),
    },
}));

const mockNetInfoFetch = jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
}));

jest.mock('@react-native-community/netinfo', () => ({
    fetch: () => mockNetInfoFetch(),
}));

describe('Login Flow (TDD)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockNetInfoFetch.mockResolvedValue({
            isConnected: true,
            isInternetReachable: true,
        });
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
            message: 'The provided credentials are not valid.'
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

        const secureErrorMessage = await findByText('login.errors.wrongCredentials');
        expect(secureErrorMessage).toBeTruthy();

        const rawBackendError = queryByText('auth/invalid-credential');
        expect(rawBackendError).toBeNull();
    });

    it('should block API request and set visual warning if input fields are empty', async () => {
        const { getByTestId, findByText } = render(<LoginScreen />);

        const loginButton = getByTestId('login-button');

        fireEvent.press(loginButton);
        expect(mockLoginFn).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();

        const validationMessage = await findByText('login.errors.empty');
        expect(validationMessage).toBeTruthy();
    });

    it('should block API request and show format error if email structure is invalid', async () => {
        const { getByTestId, findByText } = render(<LoginScreen />);

        const emailInput = getByTestId('email-input');
        const passwordInput = getByTestId('password-input');
        const loginButton = getByTestId('login-button');

        fireEvent.changeText(emailInput, 'invalidemail.com');
        fireEvent.changeText(passwordInput, 'Password123!');
        fireEvent.press(loginButton);

        expect(mockLoginFn).not.toHaveBeenCalled();
        expect(mockReplace).not.toHaveBeenCalled();

        const validationMessage = await findByText('login.errors.invalidEmail');
        expect(validationMessage).toBeTruthy();
    });

    it('should detect offline status, block API request and show a connection error message', async () => {
        mockNetInfoFetch.mockResolvedValueOnce({
            isConnected: false,
            isInternetReachable: false,
        });

        const { getByTestId, findByText } = render(<LoginScreen />);

        const emailInput = getByTestId('email-input');
        const passwordInput = getByTestId('password-input');
        const loginButton = getByTestId('login-button');

        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'Password123!');
        fireEvent.press(loginButton);

        await waitFor(() => {
            expect(mockLoginFn).not.toHaveBeenCalled();
        });
        expect(mockReplace).not.toHaveBeenCalled();

        const networkErrorMessage = await findByText('login.errors.networkMessage');
        expect(networkErrorMessage).toBeTruthy();
    });

    it('should redirect to register page', async () => {
        const { getByTestId } = render(<LoginScreen />);

        const sigInLink = getByTestId('signIn-link');

        fireEvent.press(sigInLink);
        await waitFor(() => {
            expect(mockReplace).toHaveBeenCalledWith('/register');
        });
    });

    it('should match the baseline visual snapshot of the login screen', async () => {
        let tree;

        await act(async () => {
            tree = renderer.create(<LoginScreen />).toJSON();
        });

        expect(tree).toMatchSnapshot();
    });
});