import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../use-auth';
import { auth, firestore } from '../../config/firebase';
import * as secureStorage from '../../utils/secure-storage';

// Cast global helpers for TypeScript
const globalAny = globalThis as any;

describe('useAuth Hook', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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

      const spySave = jest.spyOn(secureStorage, 'saveSessionToken').mockResolvedValue(undefined);

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
});
