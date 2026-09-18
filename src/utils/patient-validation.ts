export interface PatientFormData {
  fullName: string;
  documentId?: string;
  birthDate?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  photoUri?: string | null;
  bloodType?: string;
  allergies?: string;
  conditions?: string;
  notes?: string;
}

export interface PatientValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  [key: string]: string | undefined;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || !email.trim()) return true;
  return EMAIL_PATTERN.test(email.trim());
}

export function validatePatientForm(
  form: PatientFormData
): { isValid: boolean; errors: PatientValidationErrors } {
  const errors: PatientValidationErrors = {};

  // Campo obligatorio Nombre completo
  if (!form.fullName || !form.fullName.trim()) {
    errors.fullName = 'registerPatient.alerts.emptyName';
  }

  // Validación de formato de correo si hay
  if (form.email && form.email.trim() && !EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'registerPatient.alerts.invalidEmail';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}