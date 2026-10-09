import { DOCUMENT_CONFIGS, DocumentType } from '@/constants/patient';
export interface PatientFormData {
  fullName: string;
  documentId?: string;
  documentType?: DocumentType | '';
  documentNumber?: string;
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
  documentId?: string;
  phone?: string;
  birthDate?: string;
  [key: string]: string | undefined;
}

export function isValidEmail(email: string): boolean {
  if (!email?.trim()) return true;
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

export function validateDocument(
  type?: DocumentType | '',
  number?: string
): { isValid: boolean; errorKey?: string } {
  // Si ambos están vacíos, no se valida (es opcional si el formulario lo permite)
  if (!type && !number) return { isValid: true };
  // Si tiene número pero no seleccionó tipo
  if (!type && number) {
    return { isValid: false, errorKey: 'registerPatient.alerts.missingDocumentType' };
  }
  // Si seleccionó tipo pero no puso número
  if (type && !number) {
    return { isValid: false, errorKey: 'registerPatient.alerts.emptyDocumentNumber' };
  }
  const config = type ? DOCUMENT_CONFIGS[type] : null;
  if (!config) {
    return { isValid: false, errorKey: 'registerPatient.alerts.invalidDocumentType' };
  }
  if (config.isNumericOnly && !/^\d+$/.test(number!)) {
    return { isValid: false, errorKey: 'registerPatient.alerts.documentMustBeNumeric' };
  }
  if (number!.length < config.minLength || number!.length > config.maxLength) {
    return { isValid: false, errorKey: 'registerPatient.alerts.invalidDocumentLength' };
  }
  return { isValid: true };
}

export function validatePatientForm(
  form: PatientFormData
): { isValid: boolean; errors: PatientValidationErrors } {
  const errors: PatientValidationErrors = {};

  // Campo obligatorio Nombre completo
  if (!form.fullName?.trim()) {
    errors.fullName = 'registerPatient.alerts.emptyName';
  }

  // Validación de formato de correo si hay
  if (form.email && !isValidEmail(form.email)) {
    errors.email = 'registerPatient.alerts.invalidEmail';
  }

// Validación condicional del documento
  const docValidation = validateDocument(form.documentType, form.documentNumber);
  if (!docValidation.isValid && docValidation.errorKey) {
    errors.documentId = docValidation.errorKey;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}