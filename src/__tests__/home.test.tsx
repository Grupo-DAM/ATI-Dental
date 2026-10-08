import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../app/(tabs)/home';
import { USER_ROLES } from '@/constants/user-roles';
import * as DashboardService from '@/services/dashboard-service';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

let mockUser: any = {
  uid: 'user-1',
  email: 'dentist@atidental.com',
  nombre: 'Dr. Ramirez',
  rol: USER_ROLES.ODONTOLOGO,
  estado: 'activo',
};

jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    logout: jest.fn(),
  }),
}));

let mockIsConnected: boolean = true;
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: mockIsConnected }),
  fetch: jest.fn(() => Promise.resolve({ isConnected: mockIsConnected })),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'es' },
    t: (key: string, options?: any) => {
      if (key === 'home.greeting') return `¡Hola ${options?.name || 'Dr. Ramirez'}!`;
      if (key === 'home.defaultName') return 'Dr. Ramirez';
      if (key === 'home.welcomeBack') return 'Bienvenida de nuevo';
      if (key === 'home.searchPlaceholder') return 'Buscar pacientes, citas o tratamientos';
      if (key === 'home.todaySummary') return 'Resumen de hoy';
      if (key === 'home.viewAgenda') return 'Ver agenda';
      if (key === 'home.pendingAppointments') return 'Citas pendientes';
      if (key === 'home.pendingPatients') return 'Pacientes pendientes';
      if (key === 'home.pendingExams') return 'Exámenes pendientes';
      if (key === 'home.quickAccess') return 'Accesos rápidos';
      if (key === 'home.agenda') return 'Agenda';
      if (key === 'home.patients') return 'Pacientes';
      if (key === 'home.treatments') return 'Tratamientos';
      if (key === 'home.notifications') return 'Notificaciones';
      if (key === 'home.offlineDesc') return 'Mostrando datos en caché. Verifica tu conexión.';
      if (key === 'home.retry') return 'Reintentar';
      if (key === 'home.searchResults') return 'Resultados de búsqueda';
      if (key === 'home.noResults') return `No se encontraron resultados para "${options?.query}"`;
      if (key === 'home.customizeQuickAccess') return 'Personalizar accesos rápidos';
      if (key === 'home.close') return 'Cerrar';
      if (key === 'home.save') return 'Guardar';
      return key;
    },
  }),
}));

describe('HomeScreen (US-38)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected = true;
    mockUser = {
      uid: 'user-1',
      email: 'dentist@atidental.com',
      nombre: 'Dr. Ramirez',
      rol: USER_ROLES.ODONTOLOGO,
      estado: 'activo',
    };
  });

  it('Escenario 1: Carga del Home con saludo, resumen del día y widgets según el rol de Odontólogo', async () => {
    const { getByTestId, getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('greeting-title')).toBeTruthy();
      expect(getByText(/Dr\. Ramirez/)).toBeTruthy();
      expect(getByText('Bienvenida de nuevo')).toBeTruthy();
    });

    // Resumen de hoy
    await waitFor(() => {
      expect(getByTestId('metric-citas')).toBeTruthy();
      expect(getByTestId('metric-pacientes')).toBeTruthy();
      expect(getByTestId('metric-examenes')).toBeTruthy();
    });

    // Accesos rápidos por rol Odontólogo
    await waitFor(() => {
      expect(getByTestId('quick-access-agenda')).toBeTruthy();
      expect(getByTestId('quick-access-patients')).toBeTruthy();
      expect(getByTestId('quick-access-treatments')).toBeTruthy();
    });

    // Notificaciones
    await waitFor(() => {
      expect(getByTestId('notification-item-notif-1')).toBeTruthy();
      expect(getByText('Recordatorio de citas')).toBeTruthy();
    });
  });

  it('Escenario 1: Al presionar "Ver agenda" redirige a la pantalla de agenda', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('view-agenda-link')).toBeTruthy();
      expect(getByTestId('metric-citas')).toBeTruthy();
    });

    fireEvent.press(getByTestId('view-agenda-link'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/agenda');
  });

  it('Escenario 2: Uso del buscador general con debounce y filtrado por permisos', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('home-search-input')).toBeTruthy();
    });

    // Escribir en el buscador
    fireEvent.changeText(getByTestId('home-search-input'), 'Ana');

    await waitFor(() => {
      expect(getByTestId('search-results-container')).toBeTruthy();
      expect(getByTestId('search-result-patient-pat-1')).toBeTruthy();
    });

    // Al presionar un resultado, redirige a la ficha del paciente
    fireEvent.press(getByTestId('search-result-patient-pat-1'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/patient-file?patientId=pat-1');
  });

  it('Escenario 2: El buscador no expone pacientes ni tratamientos a un usuario externo', async () => {
    mockUser = {
      uid: 'user-ext',
      email: 'external@user.com',
      nombre: 'Juan Externo',
      rol: USER_ROLES.USUARIO_EXTERNO,
      estado: 'activo',
    };

    const { getByTestId, queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('home-search-input')).toBeTruthy();
    });

    // Buscar "Ana" siendo usuario externo
    fireEvent.changeText(getByTestId('home-search-input'), 'Ana');

    await waitFor(() => {
      // No debe encontrar a Ana como paciente
      expect(queryByTestId('search-result-patient-pat-1')).toBeNull();
      expect(getByTestId('no-search-results')).toBeTruthy();
    });
  });

  it('Escenario 3: Personalización de Accesos Rápidos (maquetado interactivo)', async () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('customize-quick-access-btn')).toBeTruthy();
    });

    // Abrir modal de personalización
    fireEvent.press(getByTestId('customize-quick-access-btn'));

    await waitFor(() => {
      expect(getByTestId('close-customize-modal')).toBeTruthy();
      expect(getByTestId('save-customization-btn')).toBeTruthy();
    });

    // Guardar cambios
    fireEvent.press(getByTestId('save-customization-btn'));

    await waitFor(() => {
      expect(queryByTestId('close-customize-modal')).toBeNull();
    });
  });

  it('Escenario 4: Interacción con Notificaciones abre el detalle y permite navegar', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('notification-item-notif-1')).toBeTruthy();
    });

    // Presionar la notificación
    fireEvent.press(getByTestId('notification-item-notif-1'));

    await waitFor(() => {
      expect(getByTestId('close-notification-modal')).toBeTruthy();
      expect(getByTestId('go-to-notification-target-btn')).toBeTruthy();
    });

    // Presionar botón de ver agenda desde la notificación
    fireEvent.press(getByTestId('go-to-notification-target-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/agenda');
  });

  it('Escenario 5: Manejo de estado de red cuando no hay conexión a internet', async () => {
    mockIsConnected = false;
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('offline-banner')).toBeTruthy();
      expect(getByTestId('retry-load-button')).toBeTruthy();
    });

    // Al presionar reintentar se ejecuta la carga
    await act(async () => {
      fireEvent.press(getByTestId('retry-load-button'));
    });
  });

  it('Escenario 2: Permite limpiar la búsqueda y enfocar/desenfocar el input', async () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('home-search-input')).toBeTruthy();
    });

    const searchInput = getByTestId('home-search-input');
    fireEvent(searchInput, 'focus');
    fireEvent.changeText(searchInput, 'Ana');

    await waitFor(() => {
      expect(getByTestId('clear-search-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('clear-search-btn'));
    fireEvent(searchInput, 'blur');

    await waitFor(() => {
      expect(queryByTestId('search-results-container')).toBeNull();
    });
  });

  it('Escenario 3: Permite alternar opciones en el modal de accesos rápidos y cerrarlo sin guardar', async () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('customize-quick-access-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('customize-quick-access-btn'));

    await waitFor(() => {
      expect(getByTestId('toggle-quick-agenda')).toBeTruthy();
    });

    // Alternar selección
    fireEvent.press(getByTestId('toggle-quick-agenda'));
    fireEvent.press(getByTestId('toggle-quick-agenda'));

    // Cerrar con la X
    fireEvent.press(getByTestId('close-customize-modal'));

    await waitFor(() => {
      expect(queryByTestId('close-customize-modal')).toBeNull();
    });
  });

  it('Escenario 4: Permite cerrar el modal de notificaciones directamente con el botón de cerrar', async () => {
    const { getByTestId, queryByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('notification-item-notif-1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('notification-item-notif-1'));

    await waitFor(() => {
      expect(getByTestId('close-notification-modal')).toBeTruthy();
    });

    fireEvent.press(getByTestId('close-notification-modal'));

    await waitFor(() => {
      expect(queryByTestId('close-notification-modal')).toBeNull();
    });
  });

  it('Escenario 5: Manejo de error al cargar el dashboard muestra banner de error y reintento', async () => {
    const fetchSpy = jest.spyOn(DashboardService, 'fetchDashboardSummary').mockRejectedValueOnce(new Error('Fallo del servidor'));

    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('error-banner')).toBeTruthy();
      expect(getByTestId('retry-error-button')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('retry-error-button'));
    });

    fetchSpy.mockRestore();
  });

  it('Al presionar un acceso rápido navega a la ruta asignada', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('quick-access-agenda')).toBeTruthy();
    });

    fireEvent.press(getByTestId('quick-access-agenda'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/agenda');
  });

  it('Al presionar una notificación ya leída no vuelve a llamar a markNotificationAsRead', async () => {
    jest.spyOn(DashboardService, 'fetchNotifications').mockResolvedValueOnce([
      { id: 'notif-read', title: 'Leída', subtitle: 'Ya revisada', read: true, targetRoute: '/(tabs)/agenda' }
    ]);

    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('notification-item-notif-read')).toBeTruthy();
    });

    const markSpy = jest.spyOn(DashboardService, 'markNotificationAsRead');
    fireEvent.press(getByTestId('notification-item-notif-read'));
    expect(markSpy).not.toHaveBeenCalled();
  });

  it('Coincide con la instantánea estructural (Snapshot Test)', async () => {
    const { toJSON, getByTestId } = render(<HomeScreen />);
    await waitFor(() => {
      expect(getByTestId('metric-citas')).toBeTruthy();
    });
    expect(toJSON()).toMatchSnapshot();
  });

  it('limita los textos largos de las tarjetas al ancho del contenedor', async () => {
    const longName = 'María Fernanda de los Ángeles Contreras Villanueva';
    mockUser = { ...mockUser, nombre: longName };
    jest.spyOn(DashboardService, 'fetchNotifications').mockResolvedValueOnce([
      {
        id: 'notif-long',
        title: 'Cita confirmada con el paciente de nombre extremadamente largo',
        subtitle: 'Estado: reprogramada por el consultorio principal de la sede norte durante la mañana',
        read: false,
      },
    ]);
    jest.spyOn(DashboardService, 'performGlobalSearch').mockResolvedValueOnce([
      {
        id: 'patient-long',
        category: 'patients',
        title: longName,
        subtitle: 'Historia clínica pendiente de actualización por el odontólogo tratante',
        route: '/(tabs)/patient-file?patientId=patient-long',
      },
    ]);

    const { getByTestId, getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('greeting-title').props.numberOfLines).toBe(2);
      expect(getByTestId('greeting-title').props.ellipsizeMode).toBe('tail');
      expect(getByText('Citas pendientes').props.numberOfLines).toBeUndefined();
      expect(getByTestId('metric-examenes').props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ width: '100%' })]),
      );
      expect(getByTestId('notification-item-notif-long')).toBeTruthy();
    });

    expect(getByText('Cita confirmada con el paciente de nombre extremadamente largo').props.numberOfLines).toBe(2);
    expect(getByText('Estado: reprogramada por el consultorio principal de la sede norte durante la mañana').props.numberOfLines).toBe(3);

    fireEvent.changeText(getByTestId('home-search-input'), longName);

    await waitFor(() => {
      expect(getByText(longName).props.numberOfLines).toBe(2);
      expect(getByText(longName).props.ellipsizeMode).toBe('tail');
    });
  });
});
