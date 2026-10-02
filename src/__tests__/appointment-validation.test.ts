import { validateAppointmentForm, AppointmentFormData } from '@/utils/appointment-validation';

const validForm: AppointmentFormData = {
  dentist: 'Dr. Smith',
  appointmentType: 'Consulta general',
  date: '12/10/2026',
  time: '09:30 AM',
  reason: 'Control',
  duration: '45 minutos',
  notes: '',
  nextDate: '',
  nextTime: '09:30 AM',
};

describe('validateAppointmentForm', () => {
  it('acepta un formulario completo', () => {
    const result = validateAppointmentForm(validForm, 'patient-1');
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('exige odontólogo, tipo, fecha, hora, motivo y duración', () => {
    const result = validateAppointmentForm(
      {
        ...validForm,
        dentist: ' ',
        appointmentType: '',
        date: '',
        time: '',
        reason: '',
        duration: '',
      },
      '',
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.patientId).toBe('scheduleAppointment.errors.patientRequired');
    expect(result.errors.dentist).toBe('scheduleAppointment.errors.dentistRequired');
    expect(result.errors.appointmentType).toBe('scheduleAppointment.errors.typeRequired');
    expect(result.errors.date).toBe('scheduleAppointment.errors.dateRequired');
    expect(result.errors.time).toBe('scheduleAppointment.errors.timeRequired');
    expect(result.errors.reason).toBe('scheduleAppointment.errors.reasonRequired');
    expect(result.errors.duration).toBe('scheduleAppointment.errors.durationRequired');
  });
});
