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
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) {
    return false;
  }
  const domain = trimmed.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex <= 0 || dotIndex === domain.length - 1) {
    return false;
  }
  return !trimmed.includes(' ');
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
    if (form.email && !isValidEmail(form.email)) {
      errors.email = 'registerPatient.alerts.invalidEmail';
    }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}