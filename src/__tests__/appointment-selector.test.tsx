import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AppointmentSelector } from '@/components/consultation/AppointmentSelector';
import { LinkedAppointment } from '@/services/consultation-service';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#F7F6F8',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E0E1E6',
    border: '#DBD4E2',
    cardSeparator: '#D1D5DB',
    text: '#141018',
    textSecondary: '#60646C',
    main: '#5B2D8B',
    pageSubtitle: '#6B7280',
    error: '#BA1A1A',
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('AppointmentSelector', () => {
  const mockAppointments: LinkedAppointment[] = [
    {
      id: 'appt-1',
      patientId: 'p-1',
      date: '2026-10-02',
      time: '10:00 AM',
      treatmentName: 'Control y Limpieza',
      status: 'en progreso',
    },
    {
      id: 'appt-2',
      patientId: 'p-1',
      date: '2026-10-03',
      time: '02:00 PM',
      treatmentName: 'Tratamiento Conducto',
      status: 'en espera',
    },
  ];

  it('renders default independent consultation title when no appointment selected', () => {
    const { getByText } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        onSelectAppointment={jest.fn()}
      />
    );

    expect(getByText('Sin cita previa (Consulta independiente)')).toBeTruthy();
  });

  it('renders selected appointment title and details when appointment is selected', () => {
    const { getByText } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        selectedAppointmentId="appt-1"
        onSelectAppointment={jest.fn()}
      />
    );

    expect(getByText('Control y Limpieza (2026-10-02)')).toBeTruthy();
    expect(getByText(/10:00 AM/)).toBeTruthy();
  });

  it('expands dropdown list when header card is pressed', () => {
    const { getByTestId, queryByTestId } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        onSelectAppointment={jest.fn()}
      />
    );

    expect(queryByTestId('appointment-dropdown-list')).toBeNull();
    fireEvent.press(getByTestId('btn-toggle-appointment-selector'));
    expect(getByTestId('appointment-dropdown-list')).toBeTruthy();
  });

  it('calls onSelectAppointment with null when independent option is selected', () => {
    const mockSelect = jest.fn();
    const { getByTestId } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        selectedAppointmentId="appt-1"
        onSelectAppointment={mockSelect}
      />
    );

    fireEvent.press(getByTestId('btn-toggle-appointment-selector'));
    fireEvent.press(getByTestId('appointment-option-independent'));

    expect(mockSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelectAppointment when a compatible appointment is selected', () => {
    const mockSelect = jest.fn();
    const { getByTestId } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        onSelectAppointment={mockSelect}
      />
    );

    fireEvent.press(getByTestId('btn-toggle-appointment-selector'));
    fireEvent.press(getByTestId('appointment-option-appt-1'));

    expect(mockSelect).toHaveBeenCalledWith(mockAppointments[0]);
  });

  it('restricts selection and shows warning banner when an incompatible appointment is pressed (Escenario 2)', () => {
    const mockSelect = jest.fn();
    const { getByTestId, getByText } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        onSelectAppointment={mockSelect}
      />
    );

    fireEvent.press(getByTestId('btn-toggle-appointment-selector'));
    fireEvent.press(getByTestId('appointment-option-appt-2'));

    expect(mockSelect).not.toHaveBeenCalled();
    expect(getByTestId('incompatible-appointment-warning')).toBeTruthy();
    expect(
      getByText(
        'Solo se pueden generar registros de consulta para citas en progreso o completadas, o en su defecto de forma independiente.'
      )
    ).toBeTruthy();
  });

  it('displays error text when error prop is passed and no warning banner is shown', () => {
    const { getByTestId, getByText } = render(
      <AppointmentSelector
        appointments={mockAppointments}
        onSelectAppointment={jest.fn()}
        error="Campo inválido"
      />
    );

    expect(getByTestId('appointment-error-text')).toBeTruthy();
    expect(getByText('Campo inválido')).toBeTruthy();
  });
});
