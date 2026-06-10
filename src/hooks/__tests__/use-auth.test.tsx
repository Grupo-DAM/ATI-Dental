import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../use-auth';
import { auth, firestore } from '../../config/firebase';

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
    // Para evitar que React grite en el test por el error esperado
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

  it('performs register successfully', async () => {
    // Configurar el mock de firestore set
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

    let credential: any;
    await act(async () => {
      credential = await result.current.register('new@example.com', 'password123');
    });

    expect(auth().createUserWithEmailAndPassword).toHaveBeenCalledWith('new@example.com', 'password123');
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
});
