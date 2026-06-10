import { saveSessionToken, getSessionToken, removeSessionToken } from '../secure-storage';
import * as SecureStore from 'expo-secure-store';

describe('Secure Storage Helper', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('saves token correctly and returns true', async () => {
    const success = await saveSessionToken('my-test-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      'ati_dental_jwt_token',
      'my-test-token',
      { keychainAccessible: SecureStore.WHEN_UNLOCKED }
    );
    expect(success).toBe(true);
  });

  it('returns false if saving fails', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('SecureStore failure'));
    const success = await saveSessionToken('my-test-token');
    expect(success).toBe(false);
  });

  it('retrieves token correctly', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('my-retrieved-token');
    const token = await getSessionToken();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('ati_dental_jwt_token');
    expect(token).toBe('my-retrieved-token');
  });

  it('returns null if retrieval fails', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('SecureStore read error'));
    const token = await getSessionToken();
    expect(token).toBeNull();
  });

  it('removes token correctly and returns true', async () => {
    const success = await removeSessionToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('ati_dental_jwt_token');
    expect(success).toBe(true);
  });

  it('returns false if removal fails', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('SecureStore delete error'));
    const success = await removeSessionToken();
    expect(success).toBe(false);
  });
});
