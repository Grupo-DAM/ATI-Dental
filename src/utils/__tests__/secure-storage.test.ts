import {
  saveSessionToken,
  getSessionToken,
  removeSessionToken,
  saveLastActiveTimestamp,
  getLastActiveTimestamp,
  removeLastActiveTimestamp,
  clearSessionData,
  isSessionExpired,
  DEFAULT_SESSION_TIMEOUT_MS,
  LAST_ACTIVE_KEY,
  JWT_TOKEN_KEY,
} from '../secure-storage';
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

  describe('JWT Token operations', () => {
    it('saves token correctly and returns true', async () => {
      const success = await saveSessionToken('my-test-token');
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        JWT_TOKEN_KEY,
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
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(JWT_TOKEN_KEY);
      expect(token).toBe('my-retrieved-token');
    });

    it('returns null if retrieval fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('SecureStore read error'));
      const token = await getSessionToken();
      expect(token).toBeNull();
    });

    it('removes token correctly and returns true', async () => {
      const success = await removeSessionToken();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(JWT_TOKEN_KEY);
      expect(success).toBe(true);
    });

    it('returns false if removal fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('SecureStore delete error'));
      const success = await removeSessionToken();
      expect(success).toBe(false);
    });
  });

  describe('Last Active Timestamp operations', () => {
    it('saves timestamp correctly with provided value', async () => {
      const ts = 1700000000000;
      const success = await saveLastActiveTimestamp(ts);
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        LAST_ACTIVE_KEY,
        String(ts),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED }
      );
      expect(success).toBe(true);
    });

    it('saves timestamp using current time if none provided', async () => {
      const success = await saveLastActiveTimestamp();
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        LAST_ACTIVE_KEY,
        expect.any(String),
        { keychainAccessible: SecureStore.WHEN_UNLOCKED }
      );
      expect(success).toBe(true);
    });

    it('returns false if saving timestamp fails', async () => {
      (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Write error'));
      const success = await saveLastActiveTimestamp(12345);
      expect(success).toBe(false);
    });

    it('retrieves timestamp correctly as number', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('1700000000000');
      const ts = await getLastActiveTimestamp();
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(LAST_ACTIVE_KEY);
      expect(ts).toBe(1700000000000);
    });

    it('returns null if no timestamp is found', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);
      const ts = await getLastActiveTimestamp();
      expect(ts).toBeNull();
    });

    it('returns null if stored timestamp is not a finite number', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('invalid_number');
      const ts = await getLastActiveTimestamp();
      expect(ts).toBeNull();
    });

    it('returns null if retrieving timestamp throws an error', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Read error'));
      const ts = await getLastActiveTimestamp();
      expect(ts).toBeNull();
    });

    it('removes timestamp correctly and returns true', async () => {
      const success = await removeLastActiveTimestamp();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(LAST_ACTIVE_KEY);
      expect(success).toBe(true);
    });

    it('returns false if removing timestamp throws an error', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Delete error'));
      const success = await removeLastActiveTimestamp();
      expect(success).toBe(false);
    });
  });

  describe('clearSessionData', () => {
    it('removes both token and timestamp returning true when both succeed', async () => {
      (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(true);
      const result = await clearSessionData();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(JWT_TOKEN_KEY);
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(LAST_ACTIVE_KEY);
      expect(result).toBe(true);
    });

    it('returns false if one of the removals fails', async () => {
      (SecureStore.deleteItemAsync as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Delete fail'));
      const result = await clearSessionData();
      expect(result).toBe(false);
    });
  });

  describe('isSessionExpired', () => {
    const NOW = 1700000000000;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    it('returns true if lastActive is null or undefined or invalid', () => {
      expect(isSessionExpired(null)).toBe(true);
      expect(isSessionExpired(undefined as any)).toBe(true);
      expect(isSessionExpired(0)).toBe(true);
      expect(isSessionExpired(-100)).toBe(true);
      expect(isSessionExpired(NaN)).toBe(true);
    });

    it('returns false if elapsed time is within DEFAULT_SESSION_TIMEOUT_MS', () => {
      const recent = NOW - (5 * ONE_DAY_MS); // 5 days ago (less than 30 days)
      expect(isSessionExpired(recent, DEFAULT_SESSION_TIMEOUT_MS, NOW)).toBe(false);
    });

    it('returns true if elapsed time exceeds timeout', () => {
      const old = NOW - (31 * ONE_DAY_MS); // 31 days ago (exceeds 30 days)
      expect(isSessionExpired(old, DEFAULT_SESSION_TIMEOUT_MS, NOW)).toBe(true);
    });

    it('supports custom timeout threshold', () => {
      const customTimeoutMs = 15 * 60 * 1000; // 15 minutes
      const active10MinsAgo = NOW - (10 * 60 * 1000);
      const active20MinsAgo = NOW - (20 * 60 * 1000);

      expect(isSessionExpired(active10MinsAgo, customTimeoutMs, NOW)).toBe(false);
      expect(isSessionExpired(active20MinsAgo, customTimeoutMs, NOW)).toBe(true);
    });
  });
});
