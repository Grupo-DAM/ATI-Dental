import React from 'react';
import { AppState } from 'react-native';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth, fetchUserByEmailFallback, fetchUserDocument, recordUserSession } from '../use-auth';
import { auth, firestore } from '../../config/firebase';
import * as secureStorage from '../../utils/secure-storage';

// Cast global helpers for TypeScript
const globalAny = globalThis as any;

describe('useAuth Hook', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const instance = firestore() as any;
    (instance.collection as jest.Mock).mockImplementation(() => instance);
    (instance.doc as jest.Mock).mockImplementation(() => instance);
    instance.where = jest.fn(() => instance);
    instance.limit = jest.fn(() => instance);
    instance.get = jest.fn(() => Promise.resolve({ docs: [], empty: true, exists: () => false, data: () => ({}) }));
    instance.add = jest.fn(() => Promise.resolve({ id: 'mock-id' }));
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('throws an error when used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth debe utilizarse dentro de un AuthProvider');
    spy.mockRestore();
  });

  it('initializes with loading as true and user as null', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('handles user logged out state correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const spyRemove = jest.spyOn(secureStorage, 'removeSessionToken');
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      globalAny.triggerAuthStateChange(null);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(spyRemove).toHaveBeenCalled();
  });

  it('handles user logged in and profile synchronization successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const spySave = jest.spyOn(secureStorage, 'saveSessionToken');
    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockFirebaseUser = {
      uid: 'user_active_123',
      email: 'active@example.com',
      getIdToken: jest.fn().mockResolvedValue('jwt-session-token-123'),
    };

    await act(async () => {
      globalAny.triggerAuthStateChange(mockFirebaseUser);
    });

    expect(spySave).toHaveBeenCalledWith('jwt-session-token-123');

    // Simular snapshot existente en Firestore
    await act(async () => {
      globalAny.triggerFirestoreSnapshot({
        exists: () => true,
        data: () => ({
          nombre: 'Valeria',
          alias: 'Val',
          rol: 'odontologo',
          estado: 'activo',
          idiomaPreferencia: 'es',
        }),
      });
    });

    expect(result.current.user).toEqual({
      uid: 'user_active_123',
      email: 'active@example.com',
      nombre: 'Valeria',
      alias: 'Val',
      rol: 'odontologo',
      estado: 'activo',
      idiomaPreferencia: 'es',
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles profile snapshot not existing in Firestore', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockFirebaseUser = {
      uid: 'user_active_123',
      email: 'active@example.com',
      getIdToken: jest.fn().mockResolvedValue('jwt-session-token-123'),
    };

    await act(async () => {
      globalAny.triggerAuthStateChange(mockFirebaseUser);
    });

    // Simular snapshot inexistente en Firestore
    await act(async () => {
      globalAny.triggerFirestoreSnapshot({
        exists: () => false,
        data: () => ({}),
      });
    });

    expect(result.current.user).toEqual({
      uid: 'user_active_123',
      email: 'active@example.com',
      estado: 'pendiente',
    });
    expect(result.current.loading).toBe(false);
  });

  it('handles save token errors gracefully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    jest.spyOn(secureStorage, 'saveSessionToken').mockRejectedValueOnce(new Error('Save failed'));
    
    const mockFirebaseUser = {
      uid: 'user_active_123',
      email: 'active@example.com',
      getIdToken: jest.fn().mockResolvedValue('jwt-session-token-123'),
    };

    await act(async () => {
      globalAny.triggerAuthStateChange(mockFirebaseUser);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al guardar token JWT tras cambio de sesión:',
      expect.any(Error)
    );
  });

  it('handles firestore profile loading errors', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockFirebaseUser = {
      uid: 'user_active_123',
      email: 'active@example.com',
      getIdToken: jest.fn().mockResolvedValue('jwt-session-token-123'),
    };

    await act(async () => {
      globalAny.triggerAuthStateChange(mockFirebaseUser);
    });

    auth().currentUser = mockFirebaseUser as any;

    // Simular error de Firestore
    await act(async () => {
      globalAny.triggerFirestoreError(new Error('Permission Denied'));
    });

    expect(result.current.error).toBe('Permission Denied');
    expect(result.current.loading).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error al escuchar el perfil del usuario en Firestore:',
      expect.any(Error)
    );
  });

  it('performs login successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let credential: any;
    await act(async () => {
      credential = await result.current.login('test@example.com', 'password123');
    });

    expect(auth().signInWithEmailAndPassword).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(credential).toBeDefined();
    expect(credential.user.uid).toBe('mock-uid');
  });

  it('rejects login and signs out if the user account is inactive in Firestore', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    (firestore().collection('usuarios').doc('mock-uid').get as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ estado: 'inactivo' }),
    });

    await act(async () => {
      await expect(
        result.current.login('inactive@example.com', 'password123')
      ).rejects.toThrow('ACCOUNT_DEACTIVATED');
    });

    expect(auth().signOut).toHaveBeenCalled();
  });

  it('handles login errors correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockError = new Error('Wrong password');
    (auth().signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

    await act(async () => {
      await expect(result.current.login('test@example.com', 'wrong-pass')).rejects.toThrow('Wrong password');
    });

    expect(result.current.error).toBe('Wrong password');
  });

  it('performs logout successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(auth().signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('handles logout errors correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockError = new Error('Network error');
    (auth().signOut as jest.Mock).mockRejectedValueOnce(mockError);

    await act(async () => {
      await expect(result.current.logout()).rejects.toThrow('Network error');
    });

    expect(result.current.error).toBe('Network error');
  });

  it('performs register successfully', async () => {
    const mockSet = jest.fn(() => Promise.resolve());
    (firestore().collection as jest.Mock).mockReturnValue({
      doc: jest.fn(() => ({
        set: mockSet,
      })),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockSendEmailVerification = jest.fn().mockResolvedValue(undefined);
    (auth().createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: {
        uid: 'new-uid',
        sendEmailVerification: mockSendEmailVerification
      }
    });

    let credential: any;
    await act(async () => {
      credential = await result.current.register('new@example.com', 'password123');
    });

    expect(auth().createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
    expect(mockSendEmailVerification).toHaveBeenCalled();
    expect(firestore().collection).toHaveBeenCalledWith('usuarios');
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@example.com',
        rol: 'usuario_externo',
        estado: 'pendiente',
      })
    );
    expect(credential).toBeDefined();
  });

  it('handles register errors correctly', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const mockError = new Error('Email already in use');
    (auth().createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

    await act(async () => {
      await expect(result.current.register('taken@example.com', 'pass')).rejects.toThrow('Email already in use');
    });

    expect(result.current.error).toBe('Email already in use');
  });

  describe('verifyCode', () => {
    it('throws error if there is no authenticated user', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      // Mock currentUser as null
      (auth as unknown as jest.Mock).mockReturnValueOnce({
        currentUser: null,
      });

      await act(async () => {
        await expect(result.current.verifyCode()).rejects.toThrow('No hay usuario autenticado');
      });
      expect(result.current.error).toBe('No hay usuario autenticado');
    });

    it('throws error if email is not verified', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      const mockUser = {
        uid: 'user-123',
        emailVerified: false,
        reload: jest.fn().mockResolvedValue(undefined),
      };
      (auth as unknown as jest.Mock).mockReturnValueOnce({
        currentUser: mockUser,
      });

      await act(async () => {
        await expect(result.current.verifyCode()).rejects.toThrow('El correo electrónico aún no ha sido verificado');
      });
      expect(result.current.error).toContain('El correo electrónico aún no ha sido verificado');
    });

    it('updates state and saves token if code is valid', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      const mockGetIdToken = jest.fn().mockResolvedValue('fresh-token-123');
      const mockUser = {
        uid: 'user-123',
        emailVerified: true,
        reload: jest.fn().mockResolvedValue(undefined),
        getIdToken: mockGetIdToken,
      };
      
      (auth as unknown as jest.Mock).mockReturnValueOnce({
        currentUser: mockUser,
      });

      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      (firestore().collection as jest.Mock).mockReturnValue({
        doc: jest.fn(() => ({
          update: mockUpdate,
        })),
      });

      const spySave = jest.spyOn(secureStorage, 'saveSessionToken').mockResolvedValue(true as any);

      await act(async () => {
        await result.current.verifyCode();
      });

      expect(mockUser.reload).toHaveBeenCalled();

      expect(mockUpdate).toHaveBeenCalledWith({ estado: 'activo' });
      expect(mockGetIdToken).toHaveBeenCalledWith(true);
      expect(spySave).toHaveBeenCalledWith('fresh-token-123');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Authentication Firestore Helpers', () => {
    it('fetchUserByEmailFallback returns document data when found', async () => {
      const mockDoc = { id: 'doc-123', data: () => ({ estado: 'activo' }) };
      ((firestore() as any).get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [mockDoc],
      });

      const result = await fetchUserByEmailFallback('test@example.com');
      expect(result).not.toBeNull();
      expect(result?.userData).toEqual({ estado: 'activo' });
    });

    it('fetchUserByEmailFallback handles empty query and attempts second query branch', async () => {
      const mockDoc = { id: 'doc-456', data: () => ({ estado: 'activo' }) };
      ((firestore() as any).get as jest.Mock)
        .mockResolvedValueOnce({
          empty: true,
          docs: [],
        })
        .mockResolvedValueOnce({
          empty: false,
          docs: [mockDoc],
        });

      const result = await fetchUserByEmailFallback('UPPER@example.com');
      expect(result).not.toBeNull();
      expect(result?.userData).toEqual({ estado: 'activo' });
    });

    it('fetchUserByEmailFallback returns null on firestore error', async () => {
      ((firestore() as any).get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchUserByEmailFallback('error@example.com');
      expect(result).toBeNull();
    });

    it('fetchUserDocument falls back to default get when server get throws', async () => {
      ((firestore() as any).get as jest.Mock)
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ estado: 'activo' }),
        });

      const result = await fetchUserDocument('user-server-err', 'fallback@example.com');
      expect(result.docExists).toBe(true);
      expect(result.userData.estado).toBe('activo');
    });

    it('recordUserSession catches and logs error gracefully', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      ((firestore() as any).add as jest.Mock).mockRejectedValueOnce(new Error('Quota exceeded'));

      await expect(recordUserSession('user-1', 'test@test.com')).resolves.not.toThrow();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Session Inactivity Timeout (US-191)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    it('cierra la sesión y limpia el almacenamiento si el timestamp ha vencido al iniciar', async () => {
      const expiredTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31 días atrás
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockResolvedValue(expiredTimestamp);
      const spyRemoveToken = jest.spyOn(secureStorage, 'removeSessionToken');
      const spyRemoveTimestamp = jest.spyOn(secureStorage, 'removeLastActiveTimestamp');
      const spySignOut = jest.spyOn(auth(), 'signOut');

      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockFirebaseUser = {
        uid: 'user_expired_123',
        email: 'expired@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-token'),
      };

      await act(async () => {
        globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      expect(spySignOut).toHaveBeenCalled();
      expect(spyRemoveToken).toHaveBeenCalled();
      expect(spyRemoveTimestamp).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('mantiene la sesión y actualiza el timestamp si la sesión no ha expirado', async () => {
      const validTimestamp = Date.now() - (1 * 60 * 60 * 1000); // 1 hora atrás
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockResolvedValue(validTimestamp);
      const spySaveTimestamp = jest.spyOn(secureStorage, 'saveLastActiveTimestamp');
      const spySignOut = jest.spyOn(auth(), 'signOut');

      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockFirebaseUser = {
        uid: 'user_valid_123',
        email: 'valid@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-token'),
      };

      await act(async () => {
        globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      expect(spySignOut).not.toHaveBeenCalled();
      expect(spySaveTimestamp).toHaveBeenCalled();
    });

    it('login guarda la marca de actividad inicial', async () => {
      const spySaveTimestamp = jest.spyOn(secureStorage, 'saveLastActiveTimestamp');
      const { result } = renderHook(() => useAuth(), { wrapper });

      (auth().signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: { uid: 'user-login', email: 'login@test.com' },
      });

      await act(async () => {
        await result.current.login('login@test.com', '123456');
      });

      expect(spySaveTimestamp).toHaveBeenCalled();
    });

    it('logout elimina la marca de actividad y token', async () => {
      const spyRemoveToken = jest.spyOn(secureStorage, 'removeSessionToken');
      const spyRemoveTimestamp = jest.spyOn(secureStorage, 'removeLastActiveTimestamp');
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.logout();
      });

      expect(spyRemoveToken).toHaveBeenCalled();
      expect(spyRemoveTimestamp).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('recordActivity actualiza el timestamp si hay un usuario autenticado', async () => {
      const spySaveTimestamp = jest.spyOn(secureStorage, 'saveLastActiveTimestamp');
      const { result } = renderHook(() => useAuth(), { wrapper });

      (auth as any)().currentUser = { uid: 'u-1', email: 'u1@test.com' };

      await act(async () => {
        await result.current.recordActivity();
      });

      expect(spySaveTimestamp).toHaveBeenCalled();
      (auth as any)().currentUser = null;
    });

    it('checkSessionTimeout detecta timeout y cierra sesión', async () => {
      (auth as any)().currentUser = { uid: 'u-1', email: 'u1@test.com' };
      const expiredTimestamp = Date.now() - (35 * 24 * 60 * 60 * 1000);
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockResolvedValue(expiredTimestamp);
      const spySignOut = jest.spyOn(auth(), 'signOut');
      const spyClear = jest.spyOn(secureStorage, 'clearSessionData');

      const { result } = renderHook(() => useAuth(), { wrapper });

      let wasExpired = false;
      await act(async () => {
        wasExpired = await result.current.checkSessionTimeout();
      });

      expect(wasExpired).toBe(true);
      expect(spySignOut).toHaveBeenCalled();
      expect(spyClear).toHaveBeenCalled();
      (auth as any)().currentUser = null;
    });

    it('checkSessionTimeout retorna false si no hay usuario autenticado', async () => {
      (auth as any)().currentUser = null;
      const { result } = renderHook(() => useAuth(), { wrapper });

      let wasExpired = true;
      await act(async () => {
        wasExpired = await result.current.checkSessionTimeout();
      });

      expect(wasExpired).toBe(false);
    });

    it('reacciona al cambio de estado de AppState a active cerrando sesión si venció', async () => {
      let appStateListener: ((state: string) => void) | null = null;
      jest.spyOn(AppState, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'change') {
          appStateListener = handler;
        }
        return { remove: jest.fn() } as any;
      });

      (auth as any)().currentUser = { uid: 'u-appstate', email: 'appstate@test.com' };
      const expiredTimestamp = Date.now() - (35 * 24 * 60 * 60 * 1000);
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockResolvedValue(expiredTimestamp);
      const spySignOut = jest.spyOn(auth(), 'signOut');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        if (appStateListener) {
          await appStateListener('active');
        }
      });

      expect(spySignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      (auth as any)().currentUser = null;
    });

    it('captura errores al verificar timeout en onAuthStateChanged sin romper el flujo', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockRejectedValueOnce(new Error('Storage failure'));

      renderHook(() => useAuth(), { wrapper });

      const mockFirebaseUser = {
        uid: 'user_err_123',
        email: 'err@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-token'),
      };

      await act(async () => {
        globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useAuth] Error al verificar timeout de sesión:'),
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('checkSessionTimeout captura errores y retorna false', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      (auth as any)().currentUser = { uid: 'u-1', email: 'u1@test.com' };
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockRejectedValueOnce(new Error('Timeout check error'));

      const { result } = renderHook(() => useAuth(), { wrapper });

      let res = true;
      await act(async () => {
        res = await result.current.checkSessionTimeout();
      });

      expect(res).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useAuth] Error al verificar timeout en checkSessionTimeout:'),
        expect.any(Error)
      );
      (auth as any)().currentUser = null;
      warnSpy.mockRestore();
    });

    it('checkSessionTimeout con sesión válida actualiza timestamp y retorna false', async () => {
      (auth as any)().currentUser = { uid: 'u-valid', email: 'v@test.com' };
      const validTimestamp = Date.now() - 5000;
      jest.spyOn(secureStorage, 'getLastActiveTimestamp').mockResolvedValue(validTimestamp);
      const spySave = jest.spyOn(secureStorage, 'saveLastActiveTimestamp');

      const { result } = renderHook(() => useAuth(), { wrapper });

      let res = true;
      await act(async () => {
        res = await result.current.checkSessionTimeout();
      });

      expect(res).toBe(false);
      expect(spySave).toHaveBeenCalled();
      (auth as any)().currentUser = null;
    });

    it('onSnapshot detecta estado inactivo y expulsa al usuario', async () => {
      const spySignOut = jest.spyOn(auth(), 'signOut');
      const spyRemoveToken = jest.spyOn(secureStorage, 'removeSessionToken');
      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockFirebaseUser = {
        uid: 'user_inact_snap',
        email: 'inact@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-token'),
      };

      await act(async () => {
        globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      await act(async () => {
        globalAny.triggerFirestoreSnapshot({
          exists: () => true,
          data: () => ({ estado: 'inactivo' }),
        });
      });

      expect(spySignOut).toHaveBeenCalled();
      expect(spyRemoveToken).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
    });

    it('cancela unsubscribeProfile cuando el usuario cambia a null tras haber estado activo', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockFirebaseUser = {
        uid: 'user_active_logout',
        email: 'active_logout@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-token'),
      };

      await act(async () => {
        globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      await act(async () => {
        globalAny.triggerFirestoreSnapshot({
          exists: () => true,
          data: () => ({ estado: 'activo', nombre: 'Test' }),
        });
      });

      expect(result.current.user).not.toBeNull();

      await act(async () => {
        globalAny.triggerAuthStateChange(null);
      });

      expect(result.current.user).toBeNull();
    });

    it('AppState listener no realiza timeout si el estado no es active o no hay usuario', async () => {
      let appStateListener: ((state: string) => void) | null = null;
      jest.spyOn(AppState, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'change') {
          appStateListener = handler;
        }
        return { remove: jest.fn() } as any;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Caso 1: background
      (auth as any)().currentUser = { uid: 'u-1' };
      const spyCheck = jest.spyOn(result.current, 'checkSessionTimeout');

      await act(async () => {
        if (appStateListener) {
          await appStateListener('background');
        }
      });

      expect(spyCheck).not.toHaveBeenCalled();
      (auth as any)().currentUser = null;
    });

    it('fetchUserDocument usa el fallback por email cuando docExists es falso', async () => {
      ((firestore() as any).get as jest.Mock)
        .mockResolvedValueOnce({ exists: () => false, data: () => ({}) }) // doc por UID
        .mockResolvedValueOnce({ empty: false, docs: [{ id: 'doc-email', data: () => ({ estado: 'activo', nombre: 'Email User' }) }] }); // fallback

      const res = await fetchUserDocument('missing-uid', 'email_user@example.com');
      expect(res.docExists).toBe(true);
      expect(res.userData.nombre).toBe('Email User');
    });

    it('fetchUserByEmailFallback maneja documento donde data no es función', async () => {
      ((firestore() as any).get as jest.Mock).mockResolvedValueOnce({
        empty: false,
        docs: [{ id: 'doc-raw', estado: 'activo', nombre: 'Raw User' }],
      });

      const res = await fetchUserByEmailFallback('raw@test.com');
      expect(res).not.toBeNull();
      expect(res?.userData.nombre).toBe('Raw User');
    });

    it('fetchUserDocument soporta userDoc con exists y data como propiedades en vez de funciones', async () => {
      ((firestore() as any).get as jest.Mock).mockResolvedValueOnce({
        exists: true,
        estado: 'activo',
        nombre: 'Property User',
        metadata: { fromCache: false },
      });

      const res = await fetchUserDocument('user-prop', 'prop@test.com');
      expect(res.docExists).toBe(true);
      expect(res.userData.nombre).toBe('Property User');
    });

    it('verifyActiveStatus tolera errores inesperados en fetchUserDocument sin romper login', async () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      ((firestore() as any).get as jest.Mock).mockRejectedValue(new Error('Random firestore crash'));

      (auth().signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: { uid: 'user-warn', email: 'warn@test.com' },
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.login('warn@test.com', '123456');
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useAuth] Error al verificar estado del usuario en Firestore:'),
        expect.any(Error)
      );
      warnSpy.mockRestore();
    });

    it('recordActivity no hace nada si currentUser es null', async () => {
      (auth as any)().currentUser = null;
      const saveSpy = jest.spyOn(secureStorage, 'saveLastActiveTimestamp');
      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.recordActivity();
      });

      expect(saveSpy).not.toHaveBeenCalled();
      saveSpy.mockRestore();
    });

    it('login completa exitosamente si credential no contiene user con uid', async () => {
      (auth().signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      let cred: any;
      await act(async () => {
        cred = await result.current.login('empty@test.com', '123456');
      });

      expect(cred).toEqual({ user: null });
    });

    it('cancela unsubscribeProfile al detectar sesión expirada en onAuthStateChanged', async () => {
      const mockUnsubProfile = jest.fn();
      const origOnSnapshot = (firestore() as any).onSnapshot;
      (firestore() as any).onSnapshot = jest.fn((onNext, onError) => {
        globalThis.registeredFirestoreOnNext = onNext;
        globalThis.registeredFirestoreOnError = onError;
        return mockUnsubProfile;
      });

      const spyGet = jest.spyOn(secureStorage, 'getLastActiveTimestamp')
        .mockResolvedValueOnce(Date.now())
        .mockResolvedValueOnce(Date.now() - 31 * 24 * 60 * 60 * 1000);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await globalAny.triggerAuthStateChange({
          uid: 'user-active-1',
          email: 'test@active.com',
          getIdToken: jest.fn().mockResolvedValue('token'),
        });
      });

      await act(async () => {
        await globalAny.triggerAuthStateChange({
          uid: 'user-active-1',
          email: 'test@active.com',
          getIdToken: jest.fn().mockResolvedValue('token'),
        });
      });

      expect(mockUnsubProfile).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      spyGet.mockRestore();
      (firestore() as any).onSnapshot = origOnSnapshot;
    });

    it('onSnapshot error callback no registra error si auth().currentUser es null', async () => {
      const mockFirebaseUser = {
        uid: 'user_error_cb',
        email: 'errorcb@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-test'),
      };

      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      (auth as any)().currentUser = null;

      await act(async () => {
        globalAny.triggerFirestoreError(new Error('Permission denied'));
      });
    });

    it('onSnapshot maneja perfil con docSnapshot.data() nulo o sin estado definido', async () => {
      const spyExpired = jest.spyOn(secureStorage, 'isSessionExpired').mockReturnValue(false);
      const mockFirebaseUser = {
        uid: 'user_active_null_data',
        email: 'nulldata@example.com',
        getIdToken: jest.fn().mockResolvedValue('jwt-test'),
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      await act(async () => {
        globalAny.triggerFirestoreSnapshot({
          exists: () => true,
          data: () => null,
          metadata: { fromCache: false },
        });
      });

      expect(result.current.user).toMatchObject({ uid: 'user_active_null_data' });
      spyExpired.mockRestore();
    });

    it('checkSessionTimeout cancela unsubscribeProfileRef si está activo al expirar la sesión', async () => {
      const mockUnsub = jest.fn();
      const origOnSnapshot = (firestore() as any).onSnapshot;
      (firestore() as any).onSnapshot = jest.fn(() => mockUnsub);

      const spyGet = jest.spyOn(secureStorage, 'getLastActiveTimestamp')
        .mockResolvedValueOnce(Date.now())
        .mockResolvedValue(Date.now() - 31 * 24 * 60 * 60 * 1000);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await globalAny.triggerAuthStateChange({
          uid: 'u-unsub-test',
          email: 'unsub@test.com',
          getIdToken: jest.fn().mockResolvedValue('token'),
        });
      });

      (auth as any)().currentUser = { uid: 'u-unsub-test' };

      await act(async () => {
        await result.current.checkSessionTimeout();
      });

      expect(mockUnsub).toHaveBeenCalled();
      (auth as any)().currentUser = null;
      spyGet.mockRestore();
      (firestore() as any).onSnapshot = origOnSnapshot;
    });

    it('intervalo en primer plano ejecuta checkSessionTimeout periódicamente', async () => {
      jest.useFakeTimers();
      const spyGet = jest.spyOn(secureStorage, 'getLastActiveTimestamp');
      const mockFirebaseUser = {
        uid: 'user_timer_active',
        email: 'timer@example.com',
        getIdToken: jest.fn().mockResolvedValue('token'),
      };

      renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await globalAny.triggerAuthStateChange(mockFirebaseUser);
      });

      await act(async () => {
        globalAny.triggerFirestoreSnapshot({
          exists: () => true,
          data: () => ({ estado: 'activo' }),
          metadata: { fromCache: false },
        });
      });

      (auth as any)().currentUser = { uid: 'user_timer_active' };

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(spyGet).toHaveBeenCalled();
      (auth as any)().currentUser = null;
      spyGet.mockRestore();
      jest.useRealTimers();
    });
  });
});
