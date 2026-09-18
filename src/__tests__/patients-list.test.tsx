import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AdminUserList from '@/app/(tabs)/patients/patients-list';

// Mocks de Hooks
const mockUsePatients = jest.fn();
const mockUseAuth = jest.fn();
const mockUseNetInfo = jest.fn();

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@/hooks/user-list/use-patients-list', () => ({
  usePatients: () => mockUsePatients(),
}));

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => mockUseNetInfo(),
}));

// Mock de roles y constantes exportadas
jest.mock('@/constants/user-roles', () => ({
  isOdontologoUser: (user: any) => user?.role === 'odontologo',
  isAdminUser: (user: any) => user?.role === 'admin',
  USER_ROLES: {
    ADMIN: 'admin',
    ODONTOLOGO: 'odontologo',
    PATIENT: 'patient',
  },
  getRoleLabelKey: (role?: string) => (role ? `roles.${role}` : 'roles.user'),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#6200ee',
    backgroundElement: '#ffffff',
    cardSeparator: '#e0e0e0',
    pageSubtitle: '#757575',
    textNames: '#000000',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'patients-list.title': 'Lista de Pacientes',
        'patients-list.subtitle': 'Gestión de pacientes registrados',
        'patients.path': 'Inicio',
        'patients-list.path': 'Pacientes',
        'patients-list.accessDeniedTitle': 'Acceso Denegado',
        'patients-list.odontologoOnlyView': 'Solo personal autorizado puede ver este listado.',
        'patients-list.odontologoOnlyViewAlert': 'No tienes permisos para ver esta sección.',
        'user-card.lastVisitLabel': 'Última Visita:',
        'user-card.nextVisitLabel': 'Próxima Visita:',
      };
      return translations[key] || key;
    },
  }),
}));

// Mocks de Componentes Secundarios
jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('@/components/breadcrumb', () => ({
  Breadcrumb: () => null,
}));

jest.mock('@/components/offline-banner', () => {
  const { View, Text, Pressable } = require('react-native');
  return {
    OfflineBanner: ({ onRetry }: any) => (
      <View testID="offline-banner">
        <Text>Sin conexión</Text>
        <Pressable testID="retry-button" onPress={onRetry}>
          <Text>Reintentar</Text>
        </Pressable>
      </View>
    ),
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

jest.spyOn(Alert, 'alert');

describe('AdminUserList (Patients List) - Criterios de Aceptación', () => {
  const mockPatientsData = [
    {
      id: 'p1',
      patientCode: '#P-0001',
      fullName: 'Carlos Mendoza',
      email: 'carlos@example.com',
      ultima_visita: '2026-01-10',
      proxima_vista: '2026-03-15',
    },
    {
      id: 'p2',
      patientCode: '#P-0002',
      fullName: 'Ana Gómez',
      email: 'ana@example.com',
      ultima_visita: '2026-02-01',
      proxima_vista: '2026-04-20',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseNetInfo.mockReturnValue({ isConnected: true });

    // Autenticado como odontólogo
    mockUseAuth.mockReturnValue({
      user: { role: 'odontologo' },
      loading: false,
    });
  });

  describe('Escenario 1: Visualización exitosa del listado de pacientes', () => {
    it('muestra el listado de pacientes registrados en Firestore cuando el Odontólogo accede', () => {
      mockUsePatients.mockReturnValue({
        patients: mockPatientsData,
        isRetrying: false,
        handleRetryConnection: jest.fn(),
      });

      const { getByText } = render(<AdminUserList />);

      // Títulos
      expect(getByText('Lista de Pacientes')).toBeTruthy();
      expect(getByText('Gestión de pacientes registrados')).toBeTruthy();

      // Paciente 1
      expect(getByText('Carlos Mendoza')).toBeTruthy();
      expect(getByText('#P-0001')).toBeTruthy();
      expect(getByText('carlos@example.com')).toBeTruthy();

      // Paciente 2
      expect(getByText('Ana Gómez')).toBeTruthy();
      expect(getByText('#P-0002')).toBeTruthy();
      expect(getByText('ana@example.com')).toBeTruthy();
    });
  });

  describe('Escenario 2: Listado sin pacientes registrados', () => {
    it('muestra el estado vacío sin errores cuando la colección de pacientes no devuelve registros', () => {
      mockUsePatients.mockReturnValue({
        patients: [],
        isRetrying: false,
        handleRetryConnection: jest.fn(),
      });

      const { queryByText } = render(<AdminUserList />);

      // No se deben renderizar pacientes
      expect(queryByText('Carlos Mendoza')).toBeNull();
      expect(queryByText('Ana Gómez')).toBeNull();
    });
  });

  describe('Escenario 3: Manejo de error al cargar el listado de pacientes', () => {
    it('muestra el banner offline y habilita la opción de reintentar la conexión cuando falla la red', () => {
      const mockRetry = jest.fn();

      // Simular sin conexión
      mockUseNetInfo.mockReturnValue({ isConnected: false });

      mockUsePatients.mockReturnValue({
        patients: [],
        isRetrying: false,
        handleRetryConnection: mockRetry,
      });

      const { getByTestId } = render(<AdminUserList />);

      // Pulsar el botón de reintento en el banner
      fireEvent.press(getByTestId('retry-button'));

      expect(mockRetry).toHaveBeenCalledTimes(1);
    });

    it('bloquea el acceso si el usuario no tiene rol permitido', async () => {
      // Simular rol no permitido
      mockUseAuth.mockReturnValue({
        user: { role: 'paciente' },
        loading: false,
      });

      mockUsePatients.mockReturnValue({
        patients: [],
        isRetrying: false,
        handleRetryConnection: jest.fn(),
      });

      const { getByText, queryByText } = render(<AdminUserList />);

      // Confirmar vista de acceso denegado
      expect(getByText('Acceso Denegado')).toBeTruthy();
      expect(getByText('Solo personal autorizado puede ver este listado.')).toBeTruthy();
      expect(queryByText('Lista de Pacientes')).toBeNull();

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Acceso Denegado',
          'No tienes permisos para ver esta sección.'
        );
      });
    });
  });
});

describe('Pruebas de cobertura adicional para AdminUserList', () => {
  const mockPatientsData = [
    {
      id: 'p1',
      patientCode: '#P-0001',
      fullName: 'Carlos Mendoza',
      email: 'carlos@example.com',
      ultima_visita: '2026-01-10',
      proxima_vista: '2026-03-15',
    },
  ];

  beforeEach(() => {
    mockPush.mockClear();
    (Alert.alert as jest.Mock).mockClear(); // <--- Limpia los llamados previos de Alert
  });

  it('ejecuta la vista detallada y presionado largo del paciente', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'odontologo' }, loading: false });
    mockUsePatients.mockReturnValue({ 
      patients: mockPatientsData, 
      isRetrying: false, 
      handleRetryConnection: jest.fn() 
    });

    const { UNSAFE_getAllByType } = render(<AdminUserList />);
    const cards = UNSAFE_getAllByType(require('@/components/users-list/user-card').UserCard);

    // Disparar onPress
    cards[0].props.onPress();
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/patient-file',
      params: { patientId: 'p1' },
    });

    // Limpiar spy antes del segundo evento
    (Alert.alert as jest.Mock).mockClear();

    // Disparar onLongPress
    cards[0].props.onLongPress();
    expect(Alert.alert).toHaveBeenCalledWith('Opciones del paciente');
  });
});