import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AgendaScreen from '@/app/(tabs)/agenda';
import * as agendaService from '@/services/agenda-service';

// Mock router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock safe area
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Mock auth
const mockUseAuth = jest.fn();
jest.mock('@/hooks/use-auth', () => ({
  useAuth: () => mockUseAuth(),
}));

// Mock user roles
jest.mock('@/constants/user-roles', () => ({
  isOdontologoUser: (user: any) => user?.rol === 'odontologo',
  isAdminUser: (user: any) => user?.rol === 'admin',
}));

// Mock theme
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#141018',
    textSecondary: '#60646C',
    main: '#5B2D8B',
    background: '#F7F6F8',
    backgroundElement: '#ffffff',
    backgroundSecondary: '#F9FAFB',
    border: '#DBD4E2',
    cardSeparator: '#D1D5DB',
    error: '#BA1A1A',
  }),
}));

// Mock translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'agenda.title': 'Agenda Semanal',
        'agenda.weeklySchedule': 'Agenda Semanal',
        'agenda.noAppointments': 'Sin consultas programadas',
        'agenda.noAppointmentsMessage': 'No hay citas agendadas para este día.',
        'agenda.errorLoading': 'No se pudo cargar la agenda',
        'agenda.errorLoadingSubtitle': 'Ocurrió un error al obtener las citas de la semana.',
        'agenda.retry': 'Reintentar',
        'agenda.confirmed': 'CONFIRMADO',
        'agenda.pending': 'EN ESPERA',
        'agenda.cancelled': 'CANCELADO',
        'agenda.lunchBreak': 'HORA DE ALMUERZO',
        'agenda.minutes': 'MIN',
        'agenda.chair': `SILLÓN ${params?.number ?? ''}`,
        'agenda.accessDeniedTitle': 'Acceso Denegado',
        'agenda.accessDeniedMessage': 'Esta sección está restringida únicamente a odontólogos.',
        'agenda.options': 'Opciones',
        'agenda.optionsMessage': `Opciones para la cita de ${params?.name ?? ''}`,
        'agenda.viewDetails': 'Ver detalles',
        'agenda.close': 'Cerrar',
        'agenda.months.0': 'ENERO',
        'agenda.months.1': 'FEBRERO',
        'agenda.months.2': 'MARZO',
        'agenda.months.3': 'ABRIL',
        'agenda.months.4': 'MAYO',
        'agenda.months.5': 'JUNIO',
        'agenda.months.6': 'JULIO',
        'agenda.months.7': 'AGOSTO',
        'agenda.months.8': 'SEPTIEMBRE',
        'agenda.months.9': 'OCTUBRE',
        'agenda.months.10': 'NOVIEMBRE',
        'agenda.months.11': 'DICIEMBRE',
        'agenda.days.0': 'DOM',
        'agenda.days.1': 'LUN',
        'agenda.days.2': 'MAR',
        'agenda.days.3': 'MIÉ',
        'agenda.days.4': 'JUE',
        'agenda.days.5': 'VIE',
        'agenda.days.6': 'SÁB',
      };
      return translations[key] ?? params?.defaultValue ?? key;
    },
  }),
}));

// Mock AppHeader
jest.mock('@/components/app-header', () => ({
  AppHeader: () => {
    const { View, Text } = require('react-native');
    return (
      <View testID="app-header">
        <Text>ATI Dental</Text>
      </View>
    );
  },
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('AgendaScreen (US-36: Visualizar Agenda)', () => {
  const monday = agendaService.getMondayOfWeek(new Date());
  const mondayKey = agendaService.formatDateKey(monday);

  const tuesday = new Date(monday);
  tuesday.setDate(monday.getDate() + 1);
  const tuesdayKey = agendaService.formatDateKey(tuesday);

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const saturdayKey = agendaService.formatDateKey(saturday);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('renders loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    const { queryByTestId } = render(<AgendaScreen />);
    expect(queryByTestId('agenda-screen')).toBeNull();
  });

  it('renders access denied message when user is not an odontologist or admin', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u1', rol: 'paciente' },
      loading: false,
    });

    const { getByText } = render(<AgendaScreen />);
    expect(getByText('Acceso Denegado')).toBeTruthy();
    expect(getByText('Esta sección está restringida únicamente a odontólogos.')).toBeTruthy();
  });

  it('renders weekly agenda for authorized odontologist and allows selecting Tuesday', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'dentist1', rol: 'odontologo' },
      loading: false,
    });

    const { getByText, getByTestId } = render(<AgendaScreen />);

    await waitFor(() => {
      expect(getByTestId('agenda-screen')).toBeTruthy();
      expect(getByText('Agenda Semanal')).toBeTruthy();
    });

    // Select Tuesday
    await waitFor(() => {
      expect(getByTestId(`day-item-${tuesdayKey}`)).toBeTruthy();
    });
    fireEvent.press(getByTestId(`day-item-${tuesdayKey}`));

    // Check mockup patient names for Tuesday
    await waitFor(() => {
      expect(getByText('Mariana López')).toBeTruthy();
      expect(getByText('Limpieza Profunda')).toBeTruthy();
      expect(getByText('Carlos Mendoza')).toBeTruthy();
      expect(getByText('Extracción Molar')).toBeTruthy();
      expect(getByText('Elena Rojas')).toBeTruthy();
      expect(getByText('Ajuste Ortodoncia')).toBeTruthy();
    });

    // Check badges
    expect(getByText('HORA DE ALMUERZO')).toBeTruthy();
    expect(getByText('SILLÓN 1')).toBeTruthy();
    expect(getByText('SILLÓN 3')).toBeTruthy();
    expect(getByText('SILLÓN 2')).toBeTruthy();
  });

  it('allows navigating between weeks using chevron buttons', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'dentist1', rol: 'odontologo' },
      loading: false,
    });

    const fetchSpy = jest.spyOn(agendaService, 'fetchWeeklyAgenda');

    const { getByTestId } = render(<AgendaScreen />);

    await waitFor(() => {
      expect(getByTestId('agenda-screen')).toBeTruthy();
    });

    const nextWeekBtn = getByTestId('next-week-btn');
    fireEvent.press(nextWeekBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    const prevWeekBtn = getByTestId('prev-week-btn');
    fireEvent.press(prevWeekBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  it('switches selected day when tapping Monday in the selector strip', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'dentist1', rol: 'odontologo' },
      loading: false,
    });

    const { getByTestId, getByText } = render(<AgendaScreen />);

    await waitFor(() => {
      expect(getByTestId(`day-item-${mondayKey}`)).toBeTruthy();
    });

    // Tap Monday item
    const dayBtn = getByTestId(`day-item-${mondayKey}`);
    fireEvent.press(dayBtn);

    await waitFor(() => {
      expect(getByText('Pedro Ramírez')).toBeTruthy();
      expect(getByText('Consulta Diagnóstica')).toBeTruthy();
    });
  });

  it('renders friendly empty state when a day has no appointments (Saturday)', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'dentist1', rol: 'odontologo' },
      loading: false,
    });

    const { getByTestId, getByText } = render(<AgendaScreen />);

    await waitFor(() => {
      expect(getByTestId(`day-item-${saturdayKey}`)).toBeTruthy();
    });

    // Tap Saturday item
    const satBtn = getByTestId(`day-item-${saturdayKey}`);
    fireEvent.press(satBtn);

    await waitFor(() => {
      expect(getByTestId('agenda-empty-state')).toBeTruthy();
      expect(getByText('Sin consultas programadas')).toBeTruthy();
      expect(getByText('No hay citas agendadas para este día.')).toBeTruthy();
    });
  });

  it('opens appointment options menu when 3-dots button is pressed on Tuesday', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'dentist1', rol: 'odontologo' },
      loading: false,
    });

    const { getByTestId } = render(<AgendaScreen />);

    await waitFor(() => {
      expect(getByTestId(`day-item-${tuesdayKey}`)).toBeTruthy();
    });
    fireEvent.press(getByTestId(`day-item-${tuesdayKey}`));

    await waitFor(() => {
      expect(getByTestId(`appointment-menu-${tuesdayKey}-1`)).toBeTruthy();
    });

    const menuBtn = getByTestId(`appointment-menu-${tuesdayKey}-1`);
    fireEvent.press(menuBtn);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Opciones',
      'Opciones para la cita de Mariana López',
      expect.any(Array)
    );
  });

  it('renders error state and retries successfully when fetch fails', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'dentist1', rol: 'odontologo' },
      loading: false,
    });

    const fetchSpy = jest.spyOn(agendaService, 'fetchWeeklyAgenda');
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    const { getByTestId, getByText } = render(<AgendaScreen />);

    await waitFor(() => {
      expect(getByTestId('agenda-error-state')).toBeTruthy();
      expect(getByText('No se pudo cargar la agenda')).toBeTruthy();
    });

    // Press retry
    const retryBtn = getByTestId('retry-agenda-btn');
    fireEvent.press(retryBtn);

    await waitFor(() => {
      expect(getByTestId('agenda-screen')).toBeTruthy();
    });
  });
});
