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

  // ========================================================
  // TESTS ADICIONALES PARA COBERTURA DE CONDICIONES
  // ========================================================

  it('no ejecuta el efecto si authLoading es true', () => {
    renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'admin', nombre: 'Test' },
        authLoading: true,
        enabled: true,
        t: mockT,
      })
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('no ejecuta el efecto si user es null', () => {
    renderHook(() =>
      useUserGeographics({
        user: null,
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('no ejecuta el efecto si enabled es false', () => {
    renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'admin', nombre: 'Test' },
        authLoading: false,
        enabled: false,
        t: mockT,
      })
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('no ejecuta el efecto si el usuario no es admin', () => {
    renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'paciente', nombre: 'Test' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('maneja doc.exists como función booleana (true)', () => {
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
        exists: () => true,
        data: () => ({ totalUsers: 5, countries: { co: 5 } }),
      });
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.totalUsers).toBe(5);
  });

  it('maneja doc.exists como propiedad booleana directa (false)', () => {
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

    // exists como booleano false (no como función)
    act(() => {
      snapshotCallback({ exists: false });
    });

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('maneja doc.data como propiedad directa (no función)', () => {
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

    // doc.data como propiedad directa, no como función
    act(() => {
      snapshotCallback({
        exists: () => true,
        data: { totalUsers: 3, countries: { mx: 3 } },
      });
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.totalUsers).toBe(3);
  });

  it('maneja error de permisos en el snapshot', () => {
    let errorCallback: any;
    mockOnSnapshot.mockImplementation((_success: any, error: any) => {
      errorCallback = error;
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
      errorCallback({ code: 'firestore/permission-denied', message: 'Permission denied' });
    });

    expect(result.current.queryError).toBe('reports.permissionError');
    expect(result.current.loading).toBe(false);
  });

  it('maneja error genérico en el snapshot', () => {
    let errorCallback: any;
    mockOnSnapshot.mockImplementation((_success: any, error: any) => {
      errorCallback = error;
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
      errorCallback({ message: 'Network error' });
    });

    expect(result.current.queryError).toBe('reports.errorLoad');
    expect(result.current.loading).toBe(false);
  });

  it('maneja error como string sin message ni code', () => {
    let errorCallback: any;
    mockOnSnapshot.mockImplementation((_success: any, error: any) => {
      errorCallback = error;
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
      errorCallback({});
    });

    expect(result.current.queryError).toBe('reports.errorLoad');
  });

  it('maneja error con message que contiene permission-denied', () => {
    let errorCallback: any;
    mockOnSnapshot.mockImplementation((_success: any, error: any) => {
      errorCallback = error;
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
      errorCallback({ message: 'Error: permission-denied for resource' });
    });

    expect(result.current.queryError).toBe('reports.permissionError');
  });

  it('procesa regiones correctamente (andina, caribe, pacifica, otros)', () => {
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
        exists: () => true,
        data: () => ({
          totalUsers: 20,
          countries: {
            co: 8,   // andina
            ec: 4,   // andina
            cu: 3,   // caribe
            cl: 3,   // pacifica
            de: 2,   // otros
          },
        }),
      });
    });

    expect(result.current.data?.regionSlices).toBeDefined();
    const regionKeys = result.current.data?.regionSlices.map(r => r.key) || [];
    expect(regionKeys).toContain('andina');
    expect(regionKeys).toContain('caribe');
    expect(regionKeys).toContain('pacifica');
    expect(regionKeys).toContain('otros');
  });

  it('procesa países con conteo cero y los filtra', () => {
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
        exists: () => true,
        data: () => ({
          totalUsers: 5,
          countries: { co: 5, mx: 0, ar: 0 },
        }),
      });
    });

    expect(result.current.data?.countryBuckets.length).toBe(1);
    expect(result.current.data?.totalCities).toBe(1);
  });

  it('muestra código de país cuando getCountryByCode no lo encuentra', () => {
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
        exists: () => true,
        data: () => ({
          totalUsers: 3,
          countries: { zz: 3 }, // código que no existe
        }),
      });
    });

    expect(result.current.data?.countryBuckets[0].label).toBe('zz');
  });

  it('calcula mainCountryPercent como 0 cuando totalUsers es 0', () => {
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
        exists: () => true,
        data: () => ({
          totalUsers: 0,
          countries: {},
        }),
      });
    });

    expect(result.current.data?.mainCountryPercent).toBe(0);
    expect(result.current.data?.mainCountry).toBe('');
  });

  it('limpia la suscripción al desmontar', () => {
    const mockUnsubscribe = jest.fn();
    mockOnSnapshot.mockImplementation(() => mockUnsubscribe);

    const { unmount } = renderHook(() =>
      useUserGeographics({
        user: { uid: '123', email: 'test@test.com', rol: 'admin', nombre: 'Test' },
        authLoading: false,
        enabled: true,
        t: mockT,
      })
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
