import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import ScheduleAppointmentScreen from '../app/(tabs)/patients/schedule-appointment';
import { resetAppointmentStore } from '@/services/agenda-service';
import { getPatients } from '@/services/patient-service';
import { firestore } from '@/config/firebase';

jest.mock('@/services/patient-service', () => ({
  getPatients: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const { Pressable, View } = require('react-native');
  const DateTimePicker = (props: {
    testID?: string;
    onChange?: (event: { type?: string }, date?: Date) => void;
  }) => (
    <View testID={props.testID ?? 'appointment-date-picker'}>
      <Pressable
        testID="confirm-appointment-date"
        onPress={() => props.onChange?.({ type: 'set' }, globalThis.__appointmentPickerDate || new Date(2026, 5, 20))}
      />
    </View>
  );
  return { __esModule: true, default: DateTimePicker };
});

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
    globalThis.__appointmentPickerDate = new Date(2026, 5, 20);
    (getPatients as jest.Mock).mockResolvedValue([]);
  });

  const chooseAppointmentDate = (getByTestId: (id: string) => any) => {
    fireEvent.press(getByTestId('appointment-date'));
    fireEvent.press(getByTestId('confirm-appointment-date'));
  };

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
    const { getByTestId, getByText, queryByText, findByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));

    expect(await findByText('scheduleAppointment.modal.title')).toBeTruthy();
    fireEvent.press(getByTestId('modal-confirm-btn'));

    await waitFor(() => {
      expect(getByTestId('appointment-reason').props.value).toBe('');
      expect(getByTestId('save-appointment-btn').props.accessibilityState.disabled).toBe(false);
    });
    expect(queryByText('20/06/2026')).toBeNull();

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Limpieza dental'));
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-time'), '11:00 AM');
    fireEvent.changeText(getByTestId('appointment-reason'), 'Segunda cita');
    fireEvent.press(getByTestId('save-appointment-btn'));
    expect(await findByText('scheduleAppointment.modal.title')).toBeTruthy();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/(tabs)/agenda',
          params: expect.objectContaining({ date: '2026-06-20' }),
        }),
      );
    }, { timeout: 3000 });
  });

  it('bloquea un horario que ya tiene el paciente', async () => {
    mockLocalSearchParams = {
      patientId: 'pat-mariana',
      patientName: 'Mariana López',
    };
    const { getByTestId, getByText, findAllByText, queryByText } = render(<ScheduleAppointmentScreen />);

    globalThis.__appointmentPickerDate = new Date(2026, 5, 16);
    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-time'), '09:30 AM');
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));

    expect((await findAllByText('scheduleAppointment.errors.conflictPatient')).length).toBeGreaterThan(0);
    expect(queryByText('scheduleAppointment.modal.title')).toBeNull();
    expect(getByTestId('appointment-date-error')).toBeTruthy();
    expect(getByTestId('appointment-time-error')).toBeTruthy();
  });

  it('bloquea al odontólogo si la cita ya está en la agenda', async () => {
    mockLocalSearchParams = {
      patientId: 'pat-2',
      patientName: 'Pedro Ramírez',
    };
    const { firestore } = require('@/config/firebase');
    firestore().collection('citas').get.mockResolvedValueOnce({
      empty: false,
      docs: [{
        id: 'cita-remota',
        data: () => ({
          date: '2026-06-20',
          time: '09:30',
          period: 'AM',
          patientName: 'Ana Gómez',
          patientId: 'pat-1',
          dentistName: 'Dr. Smith',
          status: 'EN ESPERA',
          durationMinutes: 45,
          treatmentName: 'Consulta general',
        }),
      }],
    });
    const { getByTestId, getByText, findByTestId, queryByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));

    expect(await findByTestId('appointment-conflict')).toBeTruthy();
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
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));
    expect(await findByText('scheduleAppointment.modal.title')).toBeTruthy();
    fireEvent.press(getByTestId('modal-confirm-btn'));

    expect(await findByText('scheduleAppointment.toast.errorTitle')).toBeTruthy();
    expect(getByTestId('appointment-reason').props.value).toBe('Control');
    expect(getByText('20/06/2026')).toBeTruthy();
  });

  it('cancela hacia la agenda cuando la cita no viene de una ficha', () => {
    const { getByTestId } = render(<ScheduleAppointmentScreen />);
    fireEvent.press(getByTestId('cancel-appointment-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/agenda');
  });

  it('cancela hacia la ficha cuando el paciente viene bloqueado', () => {
    mockLocalSearchParams = { patientId: 'pat-1', patientName: 'Ana Gómez' };
    const { getByTestId } = render(<ScheduleAppointmentScreen />);
    fireEvent.press(getByTestId('cancel-appointment-btn'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/patient-file',
      params: { patientId: 'pat-1' },
    });
  });

  it('permite elegir paciente, odontólogo, duración, notas y próxima fecha', async () => {
    (getPatients as jest.Mock).mockResolvedValue([
      { id: 'p-empty', fullName: 'Sin Datos' },
      { id: 'p-bad', fullName: 'Fecha Mala', birthDate: 'no-es-fecha' },
      { id: 'p-future', fullName: 'Futuro', birthDate: '2030-01-01' },
      {
        id: 'p-1',
        fullName: 'Ana Gómez',
        documentId: 'V-1',
        gender: 'Mujer',
        birthDate: '2010-12-31',
        phone: '0412',
        photoUri: 'http://img',
      },
    ]);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { getByTestId, findByText, getByText, getAllByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-patient'));
    fireEvent.press(await findByText('Ana Gómez'));
    fireEvent.press(getByTestId('appointment-dentist'));
    fireEvent.press(getByText('Dra. García'));
    fireEvent.press(getByTestId('appointment-duration'));
    fireEvent.press(getByText('60 minutos'));
    fireEvent.changeText(getByTestId('appointment-notes'), 'Traer estudios');
    fireEvent.changeText(getByTestId('next-appointment-time'), '10:00 AM');
    fireEvent.press(getByTestId('next-appointment-date'));
    fireEvent.press(getByTestId('confirm-appointment-date'));
    fireEvent.press(getByTestId('update-odontogram-btn'));

    expect(getAllByText('Ana Gómez').length).toBeGreaterThan(0);
    expect(getAllByText('Dra. García').length).toBeGreaterThan(0);
    expect(getAllByText('60 minutos').length).toBeGreaterThan(0);
    expect(getByTestId('appointment-notes').props.value).toBe('Traer estudios');
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('limpia el error del campo al corregirlo', () => {
    mockLocalSearchParams = { patientId: 'pat-1', patientName: 'Ana Gómez' };
    const { getByTestId, getByText, queryByText } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('save-appointment-btn'));
    expect(getByText('scheduleAppointment.errors.typeRequired')).toBeTruthy();

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    expect(queryByText('scheduleAppointment.errors.typeRequired')).toBeNull();
  });

  it('marca el conflicto que aparece al confirmar', async () => {
    mockLocalSearchParams = { patientId: 'pat-1', patientName: 'Ana Gómez' };
    firestore().collection('citas').get
      .mockResolvedValueOnce({ empty: true, docs: [] })
      .mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'cita-remota',
          data: () => ({
            date: '2026-06-20',
            time: '09:30',
            period: 'AM',
            patientName: 'Otra',
            patientId: 'otra',
            dentistName: 'Dr. Smith',
            status: 'EN ESPERA',
            durationMinutes: 45,
            treatmentName: 'Control',
          }),
        }],
      });
    const { getByTestId, getByText, findByTestId } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));
    fireEvent.press(await findByTestId('modal-confirm-btn'));

    expect(await findByTestId('appointment-conflict')).toBeTruthy();
  });

  it('cierra el aviso de error', async () => {
    mockLocalSearchParams = { patientId: 'pat-1', patientName: 'Ana Gómez' };
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false });
    const { getByTestId, getByText, findByText, findByTestId } = render(<ScheduleAppointmentScreen />);

    fireEvent.press(getByTestId('appointment-type'));
    fireEvent.press(getByText('Consulta general'));
    chooseAppointmentDate(getByTestId);
    fireEvent.changeText(getByTestId('appointment-reason'), 'Control');
    fireEvent.press(getByTestId('save-appointment-btn'));
    fireEvent.press(await findByTestId('modal-confirm-btn'));

    expect(await findByText('scheduleAppointment.toast.errorTitle')).toBeTruthy();
    fireEvent.press(await findByTestId('btn-dismiss-toast'));
  });
});
