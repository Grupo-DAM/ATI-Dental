import * as SecureStore from 'expo-secure-store';
import { saveSecureToken, getSecureToken } from '../test-secure';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

describe('Secure Store Helper functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('saveSecureToken sets item correctly', async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce();
    const result = await saveSecureToken();
    expect(result).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('token', 'mi_clave_secreta_123');
  });

  it('getSecureToken retrieves item correctly', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce('mi_clave_secreta_123');
    const token = await getSecureToken();
    expect(token).toBe('mi_clave_secreta_123');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('token');
  });
});
