import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { usePatients } from '@/hooks/user-list/use-patients-list';
import { firestore } from '@/config/firebase';

// 1. Mocks de dependencias
jest.mock('@react-native-community/netinfo', () => ({
  refresh: jest.fn(),
}));

jest.mock('@/config/firebase', () => ({
  firestore: jest.fn(),
}));

describe('usePatients Hook', () => {
  let mockUnsubscribe: jest.Mock;
  let mockOnSnapshot: jest.Mock;
  let mockEnableNetwork: jest.Mock;
  let alertSpy: jest.SpyInstance;

  const mockDocs = [
    {
      id: 'doc-1',
      data: () => ({ name: 'Juan Pérez', age: 30 }),
    },
    {
      id: 'doc-2',
      data: () => ({ name: 'Maria Gómez', age: 25 }),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUnsubscribe = jest.fn();
    mockOnSnapshot = jest.fn();
    mockEnableNetwork = jest.fn().mockResolvedValue(undefined);

    (firestore as unknown as jest.Mock).mockReturnValue({
      collection: jest.fn().mockReturnValue({
        onSnapshot: mockOnSnapshot,
      }),
      enableNetwork: mockEnableNetwork,
    });

    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('obtiene la lista de pacientes exitosamente desde la red', async () => {
    mockOnSnapshot.mockImplementation((onNext) => {
      onNext({
        docs: mockDocs,
        metadata: { fromCache: false },
      });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePatients());

    expect(result.current.loading).toBe(false);
    expect(result.current.isFromCache).toBe(false);
    expect(result.current.patients).toEqual([
      { id: 'doc-1', name: 'Juan Pérez', age: 30 },
      { id: 'doc-2', name: 'Maria Gómez', age: 25 },
    ]);
  });

  it('identifica correctamente cuando los datos provienen de la caché', async () => {
    mockOnSnapshot.mockImplementation((onNext) => {
      onNext({
        docs: mockDocs,
        metadata: { fromCache: true },
      });
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePatients());

    expect(result.current.loading).toBe(false);
    expect(result.current.isFromCache).toBe(true);
  });

  it('maneja errores en onSnapshot y detiene el loading', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockOnSnapshot.mockImplementation((_onNext, onError) => {
      onError(new Error('Firestore error'));
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => usePatients());

    expect(result.current.loading).toBe(false);
    expect(result.current.patients).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Error fetching users: ', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('reintenta la conexión exitosamente cuando hay internet', async () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
    (NetInfo.refresh as jest.Mock).mockResolvedValue({ isConnected: true });

    const { result } = renderHook(() => usePatients());

    await act(async () => {
      await result.current.handleRetryConnection();
    });

    expect(NetInfo.refresh).toHaveBeenCalled();
    expect(mockEnableNetwork).toHaveBeenCalled();
    expect(result.current.isRetrying).toBe(false);
  });

  it('muestra una alerta si no hay conexión al reintentar', async () => {
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);
    (NetInfo.refresh as jest.Mock).mockResolvedValue({ isConnected: false });

    const { result } = renderHook(() => usePatients());

    await act(async () => {
      await result.current.handleRetryConnection();
    });

    expect(NetInfo.refresh).toHaveBeenCalled();
    expect(mockEnableNetwork).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Sin Conexión', 'Aún no hay acceso a internet.');
    expect(result.current.isRetrying).toBe(false);
  });

  it('cancela la suscripción a Firestore al desmarcar/desmontar el hook', () => {
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => usePatients());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});