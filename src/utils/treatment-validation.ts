export interface TreatmentFormData {
  category: string;
  treatmentName: string;
  dentalPiece?: string;
  treatmentDate: string;
  responsibleDentist: string;
  status: string;
  notes?: string;
  estimatedCost: string;
}

export interface ValidationErrors {
  category?: string;
  treatmentName?: string;
  treatmentDate?: string;
  responsibleDentist?: string;
  status?: string;
  estimatedCost?: string;
  patientId?: string;
  [key: string]: string | undefined;
}

/**
 * Validates whether the given cost string represents a valid, non-negative number.
 */
export function isValidCost(cost: string): boolean {
  if (cost === undefined || cost === null || cost.trim() === '') {
    return false;
  }
  const parsed = Number(cost);
  return !Number.isNaN(parsed) && parsed >= 0;
}

/**
 * Validates the treatment form data against the business requirements.
 * Returns an object with `isValid` and any error messages keyed by field name.
 */
export function validateTreatmentForm(
  form: TreatmentFormData,
  patientId?: string
): { isValid: boolean; errors: ValidationErrors } {
  const errors: ValidationErrors = {};

  if (!patientId || !patientId.trim()) {
    errors.patientId = 'errors.patientRequired';
  }

  if (!form.category || !form.category.trim()) {
    errors.category = 'errors.categoryRequired';
  }

  if (!form.treatmentName || !form.treatmentName.trim()) {
    errors.treatmentName = 'errors.treatmentNameRequired';
  }

  if (!form.treatmentDate || !form.treatmentDate.trim()) {
    errors.treatmentDate = 'errors.treatmentDateRequired';
  }

  if (!form.responsibleDentist || !form.responsibleDentist.trim()) {
    errors.responsibleDentist = 'errors.dentistRequired';
  }

  if (!form.status || !form.status.trim()) {
    errors.status = 'errors.statusRequired';
  }

  // Cost validation: required, numeric, and non-negative
  if (form.estimatedCost === undefined || form.estimatedCost === null || form.estimatedCost.trim() === '') {
    errors.estimatedCost = 'errors.costRequired';
  } else if (!isValidCost(form.estimatedCost)) {
    errors.estimatedCost = 'errors.costInvalid';
  }

  // dentalPiece is optional by design
  // notes is optional by design

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
