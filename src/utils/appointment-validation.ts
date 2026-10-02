export interface AppointmentFormData {
  dentist: string;
  appointmentType: string;
  date: string;
  time: string;
  reason: string;
  duration: string;
  notes: string;
  nextDate: string;
  nextTime: string;
}

export interface AppointmentValidationErrors {
  dentist?: string;
  appointmentType?: string;
  date?: string;
  time?: string;
  reason?: string;
  duration?: string;
  patientId?: string;
}

export function validateAppointmentForm(form: AppointmentFormData, patientId?: string) {
  const errors: AppointmentValidationErrors = {};

  if (!patientId?.trim()) errors.patientId = 'scheduleAppointment.errors.patientRequired';
  if (!form.dentist.trim()) errors.dentist = 'scheduleAppointment.errors.dentistRequired';
  if (!form.appointmentType.trim()) errors.appointmentType = 'scheduleAppointment.errors.typeRequired';
  if (!form.date.trim()) errors.date = 'scheduleAppointment.errors.dateRequired';
  if (!form.time.trim()) errors.time = 'scheduleAppointment.errors.timeRequired';
  if (!form.reason.trim()) errors.reason = 'scheduleAppointment.errors.reasonRequired';
  if (!form.duration.trim()) errors.duration = 'scheduleAppointment.errors.durationRequired';

  return { isValid: Object.keys(errors).length === 0, errors };
}
