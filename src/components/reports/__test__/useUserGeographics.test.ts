import { renderHook, act } from '@testing-library/react-native';
import { useUserGeographics } from '../hooks/useUserGeographics';

// Mock de firestore
const mockOnSnapshot = jest.fn();
jest.mock('@react-native-firebase/firestore', () => {
  return () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    onSnapshot: mockOnSnapshot,
  });
});

describe('useUserGeographics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockT = (key: string) => key;

  it('retorna loading inicialmente', () => {
    const { result } = renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'admin', nombre: 'Test' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('procesa correctamente los datos de firestore', () => {
    let snapshotCallback: any;
    mockOnSnapshot.mockImplementation((callback) => {
      snapshotCallback = callback;
      return jest.fn(); // unsubscribe
    });

    const { result } = renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'admin', nombre: 'Test' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    // Simular recepción de datos
    act(() => {
      snapshotCallback({
        exists: true,
        data: () => ({
          totalUsers: 10,
          countries: {
            co: 5,
            ve: 3,
            mx: 2,
          },
        }),
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.totalUsers).toBe(10);
    expect(result.current.data?.totalCities).toBe(3);
    
    // Verifica que haya mapeado los países
    expect(result.current.data?.countryBuckets.length).toBe(3);
    expect(result.current.data?.countryBuckets[0].key).toBe('co'); // El mayor primero
    expect(result.current.data?.mainCountry).toBe('🇨🇴 Colombia'); // asumiendo que el mock lo mapea bien
  });

  it('maneja el caso de documento inexistente', () => {
    let snapshotCallback: any;
    mockOnSnapshot.mockImplementation((callback) => {
      snapshotCallback = callback;
      return jest.fn();
    });

    const { result } = renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'admin', nombre: 'Test' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    act(() => {
      snapshotCallback({
        exists: false,
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });
});
