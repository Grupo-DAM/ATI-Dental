import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import ScheduleAppointmentScreen from '../app/(tabs)/patients/schedule-appointment';
import { resetAppointmentStore } from '@/services/agenda-service';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, props, props.name),
  };
});

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

const mockPush = jest.fn();
let mockLocalSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => mockLocalSearchParams,
}));

jest.mock('@/components/app-header', () => ({
  AppHeader: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ScheduleAppointmentScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAppointmentStore();
    mockLocalSearchParams = {};
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  it('muestra la cita con el paciente recibido por navegación', () => {
    mockLocalSearchParams = {
      patientId: 'pat-9',
      patientName: 'Carlos Mendoza',
      patientCedula: 'V-98.765.432',
      patientGender: 'Hombre',
      patientAge: '45',
      patientPhone: '+58 414 111 22 33',
    };

    const { getAllByText, getByTestId, getByText } = render(<ScheduleAppointmentScreen />);

    expect(getByTestId('schedule-appointment-screen')).toBeTruthy();
    expect(getByText('scheduleAppointment.title')).toBeTruthy();
    expect(getAllByText('Carlos Mendoza').length).toBeGreaterThan(0);
    expect(getByTestId('appointment-patient').props.accessibilityState.disabled).toBe(true);
    expect(getByText('scheduleAppointment.sections.details')).toBeTruthy();
    expect(getByText('scheduleAppointment.sections.notes')).toBeTruthy();
    expect(getByText('scheduleAppointment.sections.next')).toBeTruthy();
  });

  it('muestra errores si faltan tipo, fecha y motivo', () => {
    const { getByTestId, getByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('save-appointment-btn'));

    expect(getByText('scheduleAppointment.errors.typeRequired')).toBeTruthy();
    expect(getByText('scheduleAppointment.errors.dateRequired')).toBeTruthy();
    expect(getByText('scheduleAppointment.errors.reasonRequired')).toBeTruthy();
  });

  it('guarda la cita en espera y abre la agenda del odontólogo', async () => {
    mockLocalSearchParams = {
      patientId: 'pat-1',
      patientName: 'Ana Gómez',
    };
    const { getByTestId, getByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    fireEvent.changeText(getByTestId('appointment-date'), '20/06/2026');
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));

    expect(getByText('scheduleAppointment.modal.title')).toBeTruthy();
    fireEvent.press(getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/agenda',
          params: expect.objectContaining({ date: '2026-06-20' }),
        }),
      );
    }, { timeout: 3000 });
  });

  it('bloquea un horario que ya tiene el paciente', () => {
    mockLocalSearchParams = {
      patientId: 'pat-mariana',
      patientName: 'Mariana López',
    };
    const { getByTestId, getByText, getAllByText, queryByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    fireEvent.changeText(getByTestId('appointment-date'), '16/06/2026');
    fireEvent.changeText(getByTestId('appointment-time'), '09:30 AM');
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));

    expect(getAllByText('scheduleAppointment.errors.conflictPatient').length).toBeGreaterThan(0);
    expect(queryByText('scheduleAppointment.modal.title')).toBeNull();
  });

  it('conserva el formulario cuando no hay conexión', async () => {
    mockLocalSearchParams = {
      patientId: 'pat-1',
      patientName: 'Ana Gómez',
    };
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });
    const { getByTestId, getByText, findByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    fireEvent.changeText(getByTestId('appointment-date'), '20/06/2026');
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));
    fireEvent.press(getByTestId('modal-confirm-btn'));

    expect(await findByText('scheduleAppointment.toast.errorTitle')).toBeTruthy();
    expect(getByTestId('appointment-reason').props.value).toBe('Control');
    expect(getByTestId('appointment-date').props.value).toBe('20/06/2026');
  });

  it('cancela hacia la agenda cuando la cita no viene de una ficha', () => {
    const { getByTestId } = render(<ScheduleAppointmentScreen />);
    fireEvent.press(getByTestId('cancel-appointment-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/agenda');
  });
});
