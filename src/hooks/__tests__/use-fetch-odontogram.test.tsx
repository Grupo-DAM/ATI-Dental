import { renderHook, act } from '@testing-library/react-native';
import { useFetchOdontogram } from '@/hooks/use-fetch-odontogram';
import { firestore } from '@/config/firebase';

// ── 1. MOCKS DE INFRAESTRUCTURA DE FIREBASE ──

// Declaramos funciones espía mutables para interceptar las llamadas encadenadas de React Native Firebase
const mockUnsubscribe = jest.fn();
const mockOnSnapshot = jest.fn();
const mockLimit = jest.fn().mockReturnThis();
const mockOrderBy = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockCollection = jest.fn().mockReturnThis();

// Inicializamos el mock global de la instancia de Firestore
jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: mockCollection,
  }),
}));

describe('useFetchOdontogram Custom Hook Suite', () => {
  // Datos simulados (Payload) en el formato nativo en español de Firebase
  const mockFirebaseDoc = {
    pacienteId: 'paciente_cova_123',
    fechaRegistro: '2026-06-09T19:00:00.000Z',
    tipo: 'adulto',
    notasGeneral: 'Sensibilidad leve',
    estadoPiezas: {
      16: {
        estado_general: 'obturado',
        caras: {
          mesial: 'caries',
          oclusal: 'obturado',
        },
        notas: 'Vigilar evolución',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Restablecemos la cadena de métodos fluidos de Firestore
    mockCollection.mockReturnValue({
      where: mockWhere,
    });
    mockWhere.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
    });
    mockOrderBy.mockReturnValue({
      limit: mockLimit,
    });
    mockLimit.mockReturnValue({
      onSnapshot: mockOnSnapshot,
    });

    // Por defecto, onSnapshot devuelve la función de limpieza para desuscribirse
    mockOnSnapshot.mockReturnValue(mockUnsubscribe);
  });

  it('debe apagar el estado de carga (loading) de inmediato si no se suministra un patientId', () => {
    const { result } = renderHook(() => useFetchOdontogram({ patientId: '' }));

    expect(result.current.loading).toBe(false);
    expect(result.current.odontogram).toBeUndefined();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('debe consultar por defecto el último odontograma sincronizándolo en tiempo real', async () => {
    // Definimos el snapshot simulado que devolverá Firebase al listener
    const mockSnapshot = {
      empty: false,
      docs: [
        {
          data: () => mockFirebaseDoc,
        },
      ],
    };

    // Simulamos la respuesta asíncrona inmediata disparando el callback de onSnapshot
    mockOnSnapshot.mockImplementation((onNext) => {
      onNext(mockSnapshot);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useFetchOdontogram({ patientId: 'paciente_cova_123' }));

    // Verificaciones de las llamadas encadenadas del Query de Firebase
    expect(mockCollection).toHaveBeenCalledWith('odontogramas');
    expect(mockWhere).toHaveBeenCalledWith('pacienteId', '==', 'paciente_cova_123');
    expect(mockOrderBy).toHaveBeenCalledWith('fechaRegistro', 'desc');
    expect(mockLimit).toHaveBeenCalledWith(1);

    // Verificaciones del mapeado y traducción (español -> inglés) en el estado del hook
    expect(result.current.loading).toBe(false);
    expect(result.current.odontogramError).toBeNull();
    expect(result.current.odontogram).toBeDefined();
    
    const parsed = result.current.odontogram!;
    expect(parsed.patientId).toBe('paciente_cova_123');
    expect(parsed.isAdult).toBe(true);
    expect(parsed.notes).toBe('Sensibilidad leve');
    
    // Verificamos el mapeado atómico de la pieza dental 16
    expect(parsed.teeth?.[16]).toBeDefined();
    expect(parsed.teeth?.[16].generalStates).toEqual(['filled']);
    expect(parsed.teeth?.[16].surfacesStates).toEqual({
      mesial: 'cavity',
      oclusal: 'filled',
    });
    expect(parsed.teeth?.[16].notes).toBe('Vigilar evolución');
  });

  it('debe aplicar filtros por rango de fecha si selectedDate es proporcionado', () => {
    renderHook(() =>
      useFetchOdontogram({
        patientId: 'paciente_cova_123',
        selectedDate: '2026-06-09',
      })
    );

    // Valida que se creen los rangos ISO correctos para abarcar el día completo de la consulta
    expect(mockWhere).toHaveBeenCalledWith('fechaRegistro', '>=', '2026-06-09T00:00:00.000Z');
    expect(mockWhere).toHaveBeenCalledWith('fechaRegistro', '<=', '2026-06-09T23:59:59.999Z');
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it('debe registrar y retornar un error clínico si la suscripción de Firestore falla', () => {
    const mockError = new Error('Permission Denied');
    
    // Forzamos a onSnapshot a disparar el segundo callback (onError)
    mockOnSnapshot.mockImplementation((onNext, onError) => {
      onError(mockError);
      return mockUnsubscribe;
    });

    const { result } = renderHook(() => useFetchOdontogram({ patientId: 'paciente_cova_123' }));

    expect(result.current.loading).toBe(false);
    expect(result.current.odontogram).toBeUndefined();
    expect(result.current.odontogramError).toBe(mockError);
  });

  it('debe ejecutar incondicionalmente la función de desuscripción para mitigar Memory Leaks al desmontarse', () => {
    const { unmount } = renderHook(() => useFetchOdontogram({ patientId: 'paciente_cova_123' }));

    // Desmontamos el hook (simulando que el dentista cambió de pestaña o salió de la ficha)
    unmount();

    // El Websocket continuo de Firebase debe destruirse inmediatamente para salvar batería y datos
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
