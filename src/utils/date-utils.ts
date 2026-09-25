/**
 * Utilidades para parsing de fechas y cálculo de edad de pacientes.
 */

/**
 * Calcula la edad de un paciente a partir de una cadena de fecha ISO o estándar.
 */
export function calculateAge(dateString?: string): number | null {
  if (!dateString) return null;
  try {
    const birth = new Date(dateString);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

/**
 * Parsea de forma robusta entradas de fecha provenientes de Firestore (Timestamp con toDate),
 * strings ISO, formato DD/MM/YYYY o DD-MM-YYYY, o instancias de Date.
 */
export function parseDateRobustly(dateInput: any): Date | null {
  if (!dateInput) return null;
  try {
    if (typeof dateInput.toDate === 'function') {
      return dateInput.toDate();
    }
    if (typeof dateInput === 'string') {
      const d = new Date(dateInput);
      if (!Number.isNaN(d.getTime())) return d;
      const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(dateInput);
      if (match) {
        return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      }
    }
    const d = new Date(dateInput);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}
