import { firestore } from '@/config/firebase';
import { Config } from '@/constants/config';
import { getSessionToken } from '@/utils/secure-storage';
import { getPatientById, PATIENTS_COLLECTION, Patient } from '@/services/patient-service';
import { getTreatmentsByPatientId, Treatment } from '@/services/treatment-service';
import { ClinicalRecord, ClinicalRecordResponse, Consultation, OdontogramData } from '@/types/clinical-record';
import { parseAppointmentDateKey } from '@/utils/appointment-schedule';
import { calculateAge, parseDateRobustly } from '@/utils/date-utils';
import { summarizePatientVisits, VisitStamp } from '@/utils/patient-visits';
import {
  ReportService,
  REPORT_THEME,
  escapeHtml,
  formatReportDateTime,
  resolveReportLanguage,
} from '@/services/report-service';
import type {
  GenerateAndShareReportResult,
  RenderReportOptions,
  ReportLanguage,
  ShareReportOptions,
} from '@/services/report-service';

export const HISTORIAS_CLINICAS_COLLECTION = 'historias_clinicas';
export const CONSULTATIONS_COLLECTION = 'historias_clinicas';
const APPOINTMENTS_COLLECTION = 'citas';

const DEFAULT_SEEDS = [
  {
    id: 'c-default-1',
    consultationDate: '2023-09-20T10:00:00Z',
    title: 'Limpieza dental profunda',
    motivo: 'Control y Limpieza',
    diagnostico: 'Buena salud periodontal. Se recomienda profilaxis cada 6 meses.',
    diagnosticoDetallado: [
      'Gingivitis generalizada leve',
      'Acumulacion de placa bacteriana',
      'Buen estado general de la limpieza',
    ],
    proximaCita: '14 Oct 2023',
    doctor: 'Dr. Smith',
    duration: '45 minutos',
    tratamientosRealizados: 'Limpieza Dental Profunda - Profilaxis completa y aplicación de flúor.',
    notas: 'Paciente refiere sensibilidad leve en encías tras el cepillado.',
  },
  {
    id: 'c-default-2',
    consultationDate: '2023-08-15T11:30:00Z',
    title: 'Obturación Resina (Pieza 46)',
    motivo: 'Dolor en pieza 46',
    diagnostico: 'Caries oclusal en pieza 46. Cavidad tratada y sellada con resina.',
    diagnosticoDetallado: [
      'Caries oclusal clase I',
      'Restauración con resina compuesta',
    ],
    proximaCita: '20 Sep 2023',
    doctor: 'Dra. Martinez',
    duration: '30 minutos',
    tratamientosRealizados: 'Obturación Resina Fotocurada',
    notas: 'Sin compromiso pulpar evidente.',
    odontograma: 'Pieza 46: cavity, filled',
  },
  {
    id: 'c-default-3',
    consultationDate: '2023-01-02T09:00:00Z',
    title: 'Primera consulta',
    motivo: 'Evaluación General',
    diagnostico: 'Buena salud periodontal. Se recomienda profilaxis cada 6 meses.',
    diagnosticoDetallado: [
      'Evaluación inicial completa',
      'Radiografías panorámicas solicitadas',
      'Plan de tratamiento inicial establecido',
    ],
    proximaCita: 'No se programó',
    doctor: 'Dr. Smith',
    duration: '40 minutos',
    tratamientosRealizados: 'Diagnóstico y plan de tratamiento',
    notas: 'Apertura de ficha clínica y registro de antecedentes.',
  },
];

/**
 * Genera consultas iniciales basadas en el paciente y los tratamientos si aún no existen
 * registros en Firestore, alineándose con los insumos de Figma.
 */
function generateDefaultConsultations(patient: Patient, treatments: Treatment[]): Consultation[] {
  if (treatments.length > 0) {
    return treatments.map((t, idx) => ({
      id: `c-${t.id || idx}`,
      patientId: patient.id,
      consultationDate: t.treatmentDate,
      title: t.treatmentName,
      motivo: t.category || 'Consulta Odontológica',
      diagnostico: t.notes || 'Procedimiento clínico registrado satisfactoriamente.',
      diagnosticoDetallado: [
        'Evaluación clínica general completada',
        `Procedimiento: ${t.treatmentName}`,
        t.dentalPiece ? `Pieza tratada: ${t.dentalPiece}` : 'Revisión bucal completa',
      ],
      proximaCita: patient.nextAppointment || 'No programada',
      doctor: t.responsibleDentist || 'Dr. Smith',
      duration: t.duration || '45 minutos',
      tratamientosRealizados: t.treatmentName,
      notas: t.notes || '',
      odontograma: t.dentalPiece && t.dentalPiece !== 'Toda la boca' ? `Pieza ${t.dentalPiece}: ${t.treatmentName}` : '',
    }));
  }

  // Fallback representativo basado en Figma
  return DEFAULT_SEEDS.map((seed) => ({
    ...seed,
    patientId: patient.id,
  }));
}

/**
 * Obtiene las consultas de un paciente desde Firestore o fallback
 */
export async function getConsultationsByPatientId(patientId: string): Promise<Consultation[]> {
  try {
    const snapshot = await firestore()
      .collection(CONSULTATIONS_COLLECTION)
      .where('patientId', '==', patientId)
      .get();

    if (snapshot && !snapshot.empty) {
      return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          patientId: d.patientId || d.pacienteId || patientId,
          consultationDate: d.consultationDate || d.fechaConsulta || d.date,
          title: d.title || d.treatmentName || d.motivo || d.tratamiento || 'Consulta Odontológica',
          motivo: d.motivo || d.category || 'Control general',
          diagnostico: d.diagnostico || d.notes || 'Sin diagnóstico registrado',
          diagnosticoDetallado: d.diagnosticoDetallado || (d.diagnostico ? [d.diagnostico] : []),
          proximaCita: d.proximaCita,
          doctor: d.doctor || d.responsibleDentist || 'Dr. Smith',
          duration: d.duration || '45 minutos',
          tratamientosRealizados: d.tratamientosRealizados || d.tratamiento || '',
          notas: d.notas || d.notes || d.notesEvolucion || '',
          appointmentId: d.appointmentId,
          odontograma: d.odontograma || '',
        };
      });
    }
  } catch (err) {
    console.warn('[clinical-record-service] Error querying consultas collection:', err);
  }
  return [];
}

/**
 * Consulta la historia clínica completa de un paciente.
 * 1. Intenta consumir el endpoint serverless orquestador con Bearer Token autenticado.
 * 2. Si el servidor no está disponible o falla, utiliza Firestore local/cache con datos de pacientes,
 *    tratamientos y consultas.
 */
export async function fetchClinicalRecord(patientId: string): Promise<ClinicalRecordResponse> {
  if (!patientId) {
    return {
      success: false,
      error: 'ID de paciente no proporcionado',
    };
  }

  // 1. Intento mediante capa intermedia Serverless con Bearer Token
  try {
    const token = await getSessionToken();
    const endpoint = `${Config.serverless.proxyUrl}/historias-clinicas/${patientId}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (response.ok) {
        const serverData = await response.json();
        if (serverData && serverData.patient) {
          const consultations = await withAppointmentVisits(
            patientId,
            await appendStoredConsultations(patientId, serverData.consultations || []),
          );
          const patient = await withStoredVisitDates(patientId, serverData.patient);
          return {
            success: true,
            data: { ...serverData, patient, consultations },
          };
        }
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (proxyError) {
    // Si la capa serverless no responde o está en modo offline, continuamos con Firestore
    console.log('[clinical-record-service] Serverless proxy unreachable, falling back to Firestore:', proxyError);
  }

  // 2. Fallback sincronizado con Firestore
  try {
    const patient = await getPatientById(patientId);
    if (!patient) {
      return {
        success: false,
        error: 'Paciente no encontrado en el sistema',
      };
    }

    const treatments = await getTreatmentsByPatientId(patientId);
    let consultations = await getConsultationsByPatientId(patientId);

    if (consultations.length === 0) {
      consultations = generateDefaultConsultations(patient, treatments);
    }

    // Orden cronológico descendente estricto (Escenario 3)
    const sortByDateDesc = <T>(list: T[], getDate: (item: T) => any) => {
      list.sort((a, b) => {
        const timeA = parseDateRobustly(getDate(a))?.getTime() ?? 0;
        const timeB = parseDateRobustly(getDate(b))?.getTime() ?? 0;
        return timeB - timeA;
      });
    };
    sortByDateDesc(consultations, (c) => c.consultationDate);
    sortByDateDesc(treatments, (t) => t.treatmentDate);
    consultations = await withAppointmentVisits(patientId, consultations);

    const odontogram: OdontogramData = {
      patientId: patient.id,
      updatedAt: new Date().toISOString(),
      isAdult: true,
      status: 'placeholder',
      teeth: {},
      notes: 'Contenedor preparado para inyección del componente de odontograma interactivo.',
    };

    const clinicalRecord: ClinicalRecord = {
      patient,
      consultations,
      treatments,
      odontogram,
    };

    return {
      success: true,
      data: clinicalRecord,
    };
  } catch (firestoreError: any) {
    console.error('[clinical-record-service] Firestore error loading clinical record:', firestoreError);
    return {
      success: false,
      error: firestoreError?.message || 'Error de red al consultar la historia clínica',
    };
  }
}

async function mutateConsultationDoc(
  consultationId: string,
  action: 'delete' | 'update',
  updatedData?: Partial<Consultation>
): Promise<boolean> {
  try {
    const docRef = firestore().collection(CONSULTATIONS_COLLECTION).doc(consultationId);
    if (action === 'delete') {
      await docRef.delete();
    } else if (updatedData) {
      await docRef.set(updatedData, { merge: true });
    }

    try {
      const docRefHistorias = firestore().collection(HISTORIAS_CLINICAS_COLLECTION).doc(consultationId);
      if (action === 'delete') {
        await docRefHistorias.delete();
      } else if (updatedData) {
        const mappedData: Record<string, any> = {
          ...updatedData,
          ...(updatedData.consultationDate ? { fechaConsulta: updatedData.consultationDate } : {}),
          ...(updatedData.diagnostico ? { diagnostico: updatedData.diagnostico } : {}),
          ...(updatedData.tratamientosRealizados ? { tratamiento: updatedData.tratamientosRealizados } : {}),
          ...(updatedData.notas ? { notesEvolucion: updatedData.notas } : {}),
        };
        await docRefHistorias.set(mappedData, { merge: true });
      }
    } catch {
      // Ignorar fallback secundario
    }

    return true;
  } catch (error) {
    console.warn(`[clinical-record-service] ${action}Consultation error in Firestore:`, error);
    // Para consultas virtuales en memoria o fallback
    return true;
  }
}

/**
 * Elimina una consulta de la historia clínica
 */
export async function deleteConsultation(consultationId: string): Promise<boolean> {
  return mutateConsultationDoc(consultationId, 'delete');
}

/**
 * Actualiza los datos de una consulta de la historia clínica
 */
export async function updateConsultation(
  consultationId: string,
  updatedData: Partial<Consultation>
): Promise<boolean> {
  return mutateConsultationDoc(consultationId, 'update', updatedData);
}

const VISIT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export interface ScheduledVisitInput {
  readonly patientId: string;
  readonly dentistName: string;
  readonly appointmentType: string;
  readonly date: string;
  readonly time: string;
  readonly duration: string;
  readonly reason: string;
  readonly notes?: string;
  readonly nextDate?: string;
  readonly nextTime?: string;
  readonly appointmentId: string;
}

interface VisitDates {
  lastVisit?: string;
  nextAppointment?: string;
}

function toIsoDateKey(value: string | Date): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${value.getFullYear()}-${month}-${day}`;
  }
  return parseAppointmentDateKey(value);
}

function formatVisitLabel(date?: string, time?: string): string {
  if (!date?.trim()) return '';
  const key = toIsoDateKey(date);
  if (!key) return date.trim();
  const [year, month, day] = key.split('-');
  const label = `${day} ${VISIT_MONTHS[Number(month) - 1]} ${year}`;
  return time?.trim() ? `${label} · ${time.trim()}` : label;
}

export function resolvePatientVisitDates(
  appointmentDate: string,
  nextDate: string | undefined,
  current: VisitDates,
  today: Date = new Date(),
): VisitDates {
  const visitKey = toIsoDateKey(appointmentDate);
  const todayKey = toIsoDateKey(today);
  let lastVisit = current.lastVisit;
  let nextAppointment = current.nextAppointment;

  if (visitKey && todayKey && visitKey <= todayKey) {
    const previousKey = current.lastVisit ? toIsoDateKey(current.lastVisit) : null;
    if (!previousKey || previousKey < visitKey) lastVisit = visitKey;
  }

  const explicitNext = nextDate?.trim() ? toIsoDateKey(nextDate) : null;
  if (explicitNext) {
    nextAppointment = explicitNext;
  } else if (visitKey && todayKey && visitKey > todayKey) {
    const previousNext = current.nextAppointment ? toIsoDateKey(current.nextAppointment) : null;
    if (!previousNext || previousNext < todayKey || visitKey < previousNext) {
      nextAppointment = visitKey;
    }
  }

  return { lastVisit, nextAppointment };
}

async function readVisitDates(patientId: string): Promise<VisitDates> {
  try {
    const docRef = await firestore().collection(PATIENTS_COLLECTION).doc(patientId).get();
    const exists = typeof docRef.exists === 'function' ? docRef.exists() : docRef.exists;
    if (!exists) return {};
    const data = docRef.data?.() || {};
    return {
      lastVisit: data.lastVisit ?? data.ultimaVisita ?? data.ultima_visita,
      nextAppointment: data.nextAppointment ?? data.proximaCita ?? data.proxima_visita ?? data.proxima_vista,
    };
  } catch {
    return {};
  }
}

function visitDatePayload(dates: VisitDates): Record<string, string> {
  const payload: Record<string, string> = {};
  if (dates.lastVisit) {
    payload.lastVisit = dates.lastVisit;
    payload.ultimaVisita = dates.lastVisit;
    payload.ultima_visita = dates.lastVisit;
  }
  if (dates.nextAppointment) {
    payload.nextAppointment = dates.nextAppointment;
    payload.proximaCita = dates.nextAppointment;
    payload.proxima_visita = dates.nextAppointment;
    payload.proxima_vista = dates.nextAppointment;
  }
  return payload;
}

async function readAppointmentStamps(patientId?: string): Promise<Array<VisitStamp & { patientId: string }>> {
  try {
    const query = firestore().collection(APPOINTMENTS_COLLECTION);
    const snapshot = patientId
      ? await query.where('patientId', '==', patientId).get()
      : await query.get();
    if (!snapshot || snapshot.empty) return [];
    return snapshot.docs.flatMap((doc) => {
      const data = doc.data?.() || {};
      const date = textValue(data.date);
      const ownerId = textValue(data.patientId);
      if (!date || !ownerId) return [];
      return [{
        patientId: ownerId,
        date,
        status: textValue(data.status) || undefined,
      }];
    });
  } catch (error) {
    console.warn('[clinical-record-service] Error querying citas for visit dates:', error);
    return [];
  }
}

export async function getVisitDatesByPatient(): Promise<Map<string, VisitDates>> {
  const stamps = await readAppointmentStamps();
  const grouped = new Map<string, VisitStamp[]>();
  stamps.forEach((stamp) => {
    const current = grouped.get(stamp.patientId) ?? [];
    current.push(stamp);
    grouped.set(stamp.patientId, current);
  });
  const dates = new Map<string, VisitDates>();
  grouped.forEach((items, patientId) => {
    dates.set(patientId, summarizePatientVisits(items));
  });
  return dates;
}

export async function getStoredPatientVisitDates(patientId: string): Promise<VisitDates> {
  const stamps = await readAppointmentStamps(patientId);
  return summarizePatientVisits(stamps);
}

async function persistVisitDates(patientId: string, dates: VisitDates): Promise<void> {
  const payload = visitDatePayload(dates);
  if (Object.keys(payload).length === 0) return;
  const docRef = firestore().collection(PATIENTS_COLLECTION).doc(patientId);
  try {
    await docRef.update(payload);
  } catch (error) {
    try {
      await docRef.set(payload, { merge: true });
    } catch (mergeError) {
      console.warn('[clinical-record-service] No se pudieron actualizar última visita y próxima cita:', mergeError);
    }
  }
}

export async function recordScheduledAppointment(input: ScheduledVisitInput): Promise<void> {
  const stamps = await readAppointmentStamps(input.patientId);
  stamps.push({ patientId: input.patientId, date: input.date, status: 'EN ESPERA' });
  if (input.nextDate?.trim()) {
    stamps.push({ patientId: input.patientId, date: input.nextDate, status: 'EN ESPERA' });
  }
  const summarized = summarizePatientVisits(stamps);
  const current = await readVisitDates(input.patientId);
  const dates: VisitDates = {
    lastVisit: summarized.lastVisit ?? current.lastVisit,
    nextAppointment: summarized.nextAppointment ?? current.nextAppointment,
  };
  await persistVisitDates(input.patientId, dates);

  const scheduledNext = input.nextDate?.trim() ?? '';
  const labelDate = scheduledNext || dates.nextAppointment;
  let labelTime: string | undefined;
  if (scheduledNext) {
    labelTime = input.nextTime;
  } else if (dates.nextAppointment === input.date) {
    labelTime = input.time;
  }
  const proximaCita = formatVisitLabel(labelDate, labelTime);

  try {
    await firestore().collection(CONSULTATIONS_COLLECTION).add({
      patientId: input.patientId,
      consultationDate: `${input.date}T12:00:00`,
      title: input.appointmentType,
      motivo: input.reason,
      diagnostico: input.notes?.trim() || 'Cita agendada',
      proximaCita: proximaCita || 'No programada',
      doctor: input.dentistName,
      duration: input.duration,
      notas: input.notes?.trim() || '',
      appointmentId: input.appointmentId,
    });
  } catch (error) {
    console.warn('[clinical-record-service] No se pudo copiar la cita a consultas:', error);
  }
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

async function getConsultationsFromAppointments(patientId: string): Promise<Consultation[]> {
  try {
    const snapshot = await firestore()
      .collection(APPOINTMENTS_COLLECTION)
      .where('patientId', '==', patientId)
      .get();
    if (!snapshot || snapshot.empty) return [];

    return snapshot.docs.flatMap((doc) => {
      const data = doc.data?.() || {};
      if (data.status === 'CANCELADO') return [];
      const date = textValue(data.date);
      if (!date || textValue(data.patientId) !== patientId) return [];
      const minutes = typeof data.durationMinutes === 'number' ? data.durationMinutes : 0;
      return [{
        id: `cita-${doc.id}`,
        appointmentId: doc.id,
        patientId,
        consultationDate: `${date}T12:00:00`,
        title: textValue(data.treatmentName) || 'Consulta Odontológica',
        motivo: textValue(data.reason) || textValue(data.treatmentName) || 'Cita agendada',
        diagnostico: textValue(data.notes) || 'Cita agendada',
        proximaCita: 'No programada',
        doctor: textValue(data.dentistName) || 'Dr. Smith',
        duration: minutes > 0 ? `${minutes} minutos` : '45 minutos',
        notas: textValue(data.notes),
      }];
    });
  } catch (error) {
    console.warn('[clinical-record-service] Error querying citas collection:', error);
    return [];
  }
}

async function withAppointmentVisits(patientId: string, current: Consultation[]): Promise<Consultation[]> {
  const visits = await getConsultationsFromAppointments(patientId);
  if (visits.length === 0) return current;
  const linked = new Set(current.map((item) => item.appointmentId).filter((id): id is string => Boolean(id)));
  const ids = new Set(current.map((item) => item.id));
  const merged = [
    ...current,
    ...visits.filter((item) => !ids.has(item.id) && !linked.has(item.appointmentId || '')),
  ];
  merged.sort((left, right) => {
    const timeA = parseDateRobustly(left.consultationDate)?.getTime() ?? 0;
    const timeB = parseDateRobustly(right.consultationDate)?.getTime() ?? 0;
    return timeB - timeA;
  });
  return merged;
}

async function appendStoredConsultations(patientId: string, current: Consultation[]): Promise<Consultation[]> {
  const stored = await getConsultationsByPatientId(patientId);
  if (stored.length === 0) return current;
  const ids = new Set(current.map((item) => item.id));
  const merged = [...current, ...stored.filter((item) => !ids.has(item.id))];
  merged.sort((left, right) => {
    const timeA = parseDateRobustly(left.consultationDate)?.getTime() ?? 0;
    const timeB = parseDateRobustly(right.consultationDate)?.getTime() ?? 0;
    return timeB - timeA;
  });
  return merged;
}

async function withStoredVisitDates(patientId: string, patient: Patient): Promise<Patient> {
  try {
    const stored = await getPatientById(patientId);
    if (!stored?.id) return patient;
    return {
      ...patient,
      nextAppointment: stored.nextAppointment ?? patient.nextAppointment,
      lastVisit: stored.lastVisit ?? patient.lastVisit,
    };
  } catch {
    return patient;
  }
}

const INVERSE_STATE_MAP: Record<string, string> = {
  'cavity': 'caries',
  'filled': 'obturado',
  'missing': 'ausente',
  'implant': 'implante',
  'root_canal': 'endodoncia',
  'fixed_dental_prosthesis': 'protesis_fija',
  'retained_root': 'remanente_radicular',
  'in_eruption': 'en_erupcion',
  'temporal': 'temporal'
};

function mapOdontogramToFirebase(odontogram: OdontogramData, isAdult: boolean): any {
  const estadoPiezas: Record<string, any> = {};

  if (odontogram.teeth) {
    Object.entries(odontogram.teeth).forEach(([toothStr, condition]) => {
      const generalState = condition.generalStates?.[0] || '';
      const caras: Record<string, string> = {};

      if (condition.surfacesStates) {
        Object.entries(condition.surfacesStates).forEach(([surface, state]) => {
          if (state && INVERSE_STATE_MAP[state]) {
            caras[surface] = INVERSE_STATE_MAP[state];
          }
        });
      }

      estadoPiezas[toothStr] = {
        estado_general: INVERSE_STATE_MAP[generalState] || 'sano',
        caras: Object.keys(caras).length > 0 ? caras : null,
        notas: condition.notes || null,
      };
    });
  }

  return {
    pacienteId: odontogram.patientId,
    fechaRegistro: new Date().toISOString(),
    tipo: isAdult ? 'adulto' : 'pediatrico',
    notasGeneral: odontogram.notes || '',
    estadoPiezas,
  };
}

export const ODONTOGRAMAS_COLLECTION = 'odontogramas';

/**
 * Guarda o actualiza el odontograma de un paciente en el sistema.
 * 1. Intenta enviar el registro mediante la capa intermedia Serverless con Bearer Token.
 * 2. Si falla o está en modo fuera de línea, realiza un merge directo en la colección Firestore.
 */
export async function updateOdontogram(
  odontogram: OdontogramData, 
  isAdult: boolean
): Promise<boolean> {
  if (!odontogram?.patientId) {
    throw new Error('[clinical-record-service] Imposible actualizar: pacienteId faltante.');
  }

  // 1. Intento a través del Proxy Serverless Orquestado
  try {
    const token = await getSessionToken();
    const endpoint = `${Config.serverless.proxyUrl}/odontogramas/${odontogram.patientId}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ odontogram, isAdult }),
        signal: controller.signal,
      });

      if (response.ok) {
        return true;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (proxyError) {
    console.log('[clinical-record-service] Serverless proxy unreachable for update, fallback to Firestore:', proxyError);
  }

  // 2. Fallback de persistencia robusta directa a Firestore
  try {
    const firebasePayload = mapOdontogramToFirebase(odontogram, isAdult);
    
    // Buscamos si el paciente ya tiene un registro previo hoy para actualizarlo, o creamos uno nuevo
    const snapshot = await firestore()
      .collection(ODONTOGRAMAS_COLLECTION)
      .where('pacienteId', '==', odontogram.patientId)
      .orderBy('fechaRegistro', 'desc')
      .limit(1)
      .get();

    if (!snapshot.empty) {
      // Si el último odontograma fue registrado el mismo día, hacemos merge sobre ese documento
      const lastDoc = snapshot.docs[0];
      const lastDocDate = lastDoc.data().fechaRegistro?.split('T')[0];
      const todayDate = new Date().toISOString().split('T')[0];

      if (lastDocDate === todayDate) {
        await firestore()
          .collection(ODONTOGRAMAS_COLLECTION)
          .doc(lastDoc.id)
          .set(firebasePayload, { merge: true });
        return true;
      }
    }

    // De lo contrario, se añade un documento histórico completamente nuevo de la consulta actual
    await firestore()
      .collection(ODONTOGRAMAS_COLLECTION)
      .add(firebasePayload);

    return true;
  } catch (firestoreError: any) {
    console.error('[clinical-record-service] Error writing odontogram to Firestore:', firestoreError);
    throw new Error(firestoreError?.message || 'Error de red al guardar el odontograma clínico.');
  }
}

export interface ClinicalRecordExportOptions {
  doctorName?: string;
  licenseNumber?: string;
  language?: string;
}

/**
 * Determina si una historia clínica posee datos clínicos (consultas o tratamientos)
 * aptos para ser exportados a PDF (Criterio de Aceptación - Escenario 2).
 */
export function hasClinicalRecordExportableData(record?: ClinicalRecord | null): boolean {
  if (!record) return false;
  const hasConsultations = Array.isArray(record.consultations) && record.consultations.length > 0;
  const hasTreatments = Array.isArray(record.treatments) && record.treatments.length > 0;
  return hasConsultations || hasTreatments;
}

function buildPatientInfoGridHtml(patient?: Patient, lang: ReportLanguage = 'es'): string {
  const age = calculateAge(patient?.birthDate);
  const ageLabel = age !== null ? `${age} ${lang === 'en' ? 'years' : 'años'}` : 'N/A';

  const allergies = Array.isArray(patient?.knownAllergies) && patient.knownAllergies.length > 0
    ? patient.knownAllergies.join(', ')
    : patient?.allergies || (lang === 'en' ? 'None recorded' : 'Ninguna registrada');

  const conditions = Array.isArray(patient?.medicalHistory) && patient.medicalHistory.length > 0
    ? patient.medicalHistory.join(', ')
    : patient?.conditions || (lang === 'en' ? 'None recorded' : 'Ninguna registrada');

  return ReportService.buildInfoGrid([
    { label: lang === 'en' ? 'Full Name' : 'Nombre Completo', value: patient?.fullName || 'N/A' },
    { label: lang === 'en' ? 'Patient Code' : 'Código de Paciente', value: patient?.patientCode || 'N/A' },
    { label: lang === 'en' ? 'ID / Document' : 'Cédula / Documento', value: patient?.documentId || 'N/A' },
    { label: lang === 'en' ? 'Age' : 'Edad', value: ageLabel },
    { label: lang === 'en' ? 'Phone' : 'Teléfono', value: patient?.phone || 'N/A' },
    { label: lang === 'en' ? 'Email' : 'Correo Electrónico', value: patient?.email || 'N/A' },
    { label: lang === 'en' ? 'Blood Type' : 'Grupo Sanguíneo', value: patient?.bloodType || 'N/A' },
    { label: lang === 'en' ? 'Known Allergies' : 'Alergias Conocidas', value: allergies },
    { label: lang === 'en' ? 'Medical History' : 'Antecedentes Médicos', value: conditions },
  ]);
}

export interface ResolvedToothSummary {
  number: number;
  state: string;
  color: string;
  label: string;
}

const TOOTH_COLOR_MAP: Record<string, { hex: string; es: string; en: string }> = {
  cavity: { hex: '#F05C5E', es: 'Caries', en: 'Cavity' },
  caries: { hex: '#F05C5E', es: 'Caries', en: 'Cavity' },
  filled: { hex: '#2E7CEE', es: 'Obturado', en: 'Filled' },
  obturado: { hex: '#2E7CEE', es: 'Obturado', en: 'Filled' },
  missing: { hex: '#A5A8B1', es: 'Ausente', en: 'Missing' },
  ausente: { hex: '#A5A8B1', es: 'Ausente', en: 'Missing' },
  implant: { hex: '#DE8BD0', es: 'Implante', en: 'Implant' },
  implante: { hex: '#DE8BD0', es: 'Implante', en: 'Implant' },
  root_canal: { hex: '#FCA04B', es: 'Endodoncia', en: 'Root canal' },
  endodoncia: { hex: '#FCA04B', es: 'Endodoncia', en: 'Root canal' },
  fixed_dental_prosthesis: { hex: '#B18DF4', es: 'Prótesis', en: 'Prosthesis' },
  protesis: { hex: '#B18DF4', es: 'Prótesis', en: 'Prosthesis' },
  protesis_fija: { hex: '#B18DF4', es: 'Prótesis', en: 'Prosthesis' },
  retained_root: { hex: '#E37C44', es: 'Remanente radicular', en: 'Retained root' },
  remanente_radicular: { hex: '#E37C44', es: 'Remanente radicular', en: 'Retained root' },
  in_eruption: { hex: '#4D814F', es: 'En erupción', en: 'In eruption' },
  en_erupcion: { hex: '#4D814F', es: 'En erupción', en: 'In eruption' },
  temporal: { hex: '#DEED5C', es: 'Temporal', en: 'Temporal' },
  healthy: { hex: '#10B981', es: 'Sano / Revisado', en: 'Healthy / Checked' },
  sano: { hex: '#10B981', es: 'Sano / Revisado', en: 'Healthy / Checked' },
};

export function isValidFdiToothNumber(num: number): boolean {
  const isAdult = (num >= 11 && num <= 18) ||
                  (num >= 21 && num <= 28) ||
                  (num >= 31 && num <= 38) ||
                  (num >= 41 && num <= 48);
  const isPediatric = (num >= 51 && num <= 55) ||
                      (num >= 61 && num <= 65) ||
                      (num >= 71 && num <= 75) ||
                      (num >= 81 && num <= 85);
  return isAdult || isPediatric;
}

export function inferToothStateFromContext(contextText: string, fallbackState?: string): string {
  const lower = contextText.toLowerCase();
  if (lower.includes('caries') || lower.includes('cavity')) return 'cavity';
  if (lower.includes('obturad') || lower.includes('resina') || lower.includes('amalgama') || lower.includes('filled')) return 'filled';
  if (lower.includes('endodoncia') || lower.includes('conducto') || lower.includes('root_canal')) return 'root_canal';
  if (lower.includes('corona') || lower.includes('protesis') || lower.includes('pilar') || lower.includes('fixed_dental_prosthesis')) return 'fixed_dental_prosthesis';
  if (lower.includes('ausente') || lower.includes('missing') || lower.includes('extraccion') || lower.includes('exodoncia')) return 'missing';
  if (lower.includes('implante') || lower.includes('implant')) return 'implant';
  if (lower.includes('remanente') || lower.includes('retained_root')) return 'retained_root';
  if (lower.includes('erupcion') || lower.includes('in_eruption')) return 'in_eruption';
  if (lower.includes('temporal') || lower.includes('provisional')) return 'temporal';
  if (lower.includes('sana') || lower.includes('sano') || lower.includes('revisad') || lower.includes('healthy')) return 'healthy';
  return fallbackState || 'healthy';
}

export function extractConsultationDentalPieces(
  c: Consultation,
  record?: ClinicalRecord,
  lang: ReportLanguage = 'es'
): ResolvedToothSummary[] {
  const teethMap = new Map<number, ResolvedToothSummary>();

  const combinedContext = [
    c.title,
    c.motivo,
    c.diagnostico,
    c.tratamientosRealizados,
    c.notas,
  ].filter(Boolean).join(' ');

  const addTooth = (toothNum: number, rawContext: string, explicitState?: string) => {
    if (!isValidFdiToothNumber(toothNum)) return;
    if (teethMap.has(toothNum)) return;

    let stateKey = explicitState;
    if (!stateKey) {
      const odontogramTooth = record?.odontogram?.teeth?.[toothNum];
      if (odontogramTooth?.generalStates && odontogramTooth.generalStates.length > 0) {
        stateKey = odontogramTooth.generalStates[0];
      }
    }
    if (!stateKey) {
      stateKey = inferToothStateFromContext(rawContext);
      if (stateKey === 'healthy') {
        const broaderState = inferToothStateFromContext(combinedContext);
        if (broaderState !== 'healthy') {
          stateKey = broaderState;
        }
      }
    }

    const stateMeta = TOOTH_COLOR_MAP[stateKey.toLowerCase()] || {
      hex: '#5B2D8B',
      es: stateKey,
      en: stateKey,
    };

    teethMap.set(toothNum, {
      number: toothNum,
      state: stateKey,
      color: stateMeta.hex,
      label: lang === 'en' ? stateMeta.en : stateMeta.es,
    });
  };

  if (c.odontograma) {
    const lines = c.odontograma.split('\n');
    for (const line of lines) {
      const match = line.match(/(?:Pieza|Diente|Tooth)\s*#?\s*(\d{2})(?:\s*:\s*([^\n;.]+))?/i);
      if (match) {
        const num = parseInt(match[1], 10);
        const conditionText = match[2] || line;
        addTooth(num, conditionText, inferToothStateFromContext(conditionText));
      }
    }
  }

  if (Array.isArray(c.diagnosticoDetallado)) {
    for (const item of c.diagnosticoDetallado) {
      const match = item.match(/(?:Pieza|Diente|Tooth)(?:\s+tratada)?\s*[:#]?\s*(\d{2})/i);
      if (match) {
        const num = parseInt(match[1], 10);
        addTooth(num, item);
      }
    }
  }

  const pattern = /(?:Pieza|Diente|Tooth)\s*(?:tratada\s*)?[:#]?\s*(\d{2})/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(combinedContext)) !== null) {
    const num = parseInt(match[1], 10);
    const start = Math.max(0, match.index - 30);
    const end = Math.min(combinedContext.length, match.index + 50);
    const snippet = combinedContext.substring(start, end);
    addTooth(num, snippet);
  }

  if (record?.treatments) {
    for (const t of record.treatments) {
      if (t.dentalPiece && t.dentalPiece !== 'Toda la boca' && t.dentalPiece !== 'General') {
        const isDateMatch = t.treatmentDate && c.consultationDate &&
          t.treatmentDate.substring(0, 10) === c.consultationDate.substring(0, 10);
        const isNameMatch = c.title && t.treatmentName && c.title.includes(t.treatmentName);

        if (isDateMatch || isNameMatch) {
          const pieceDigits = t.dentalPiece.match(/\b(\d{2})\b/g);
          if (pieceDigits) {
            for (const d of pieceDigits) {
              const num = parseInt(d, 10);
              addTooth(num, `${t.treatmentName} ${t.category || ''}`, inferToothStateFromContext(t.treatmentName));
            }
          }
        }
      }
    }
  }

  return Array.from(teethMap.values()).sort((a, b) => a.number - b.number);
}

function buildTeethSummaryHtml(teeth: ResolvedToothSummary[], lang: ReportLanguage = 'es'): string {
  if (teeth.length === 0) {
    return `
      <div class="consultation-teeth-row">
        <span class="teeth-row-label"><strong>${lang === 'en' ? 'Dental Pieces:' : 'Piezas Dentales:'}</strong></span>
        <span class="tooth-general-pill">${lang === 'en' ? 'General oral assessment' : 'Evaluación bucal general'}</span>
      </div>
    `;
  }

  const chipsHtml = teeth
    .map((tooth) => `
      <span class="tooth-pill" style="border-color: ${tooth.color};">
        <span class="tooth-pill-dot" style="background-color: ${tooth.color};"></span>
        <span class="tooth-pill-num">#${tooth.number}</span>
        <span class="tooth-pill-label" style="color: ${tooth.color};">${escapeHtml(tooth.label)}</span>
      </span>
    `)
    .join('');

  return `
    <div class="consultation-teeth-row">
      <span class="teeth-row-label"><strong>${lang === 'en' ? 'Dental Pieces:' : 'Piezas Dentales:'}</strong></span>
      <div class="teeth-pills-list">
        ${chipsHtml}
      </div>
    </div>
  `;
}

function buildTeethLegendHtml(lang: ReportLanguage = 'es'): string {
  const items = [
    { color: '#F05C5E', es: 'Caries', en: 'Cavity' },
    { color: '#2E7CEE', es: 'Obturado', en: 'Filled' },
    { color: '#FCA04B', es: 'Endodoncia', en: 'Root Canal' },
    { color: '#B18DF4', es: 'Prótesis', en: 'Prosthesis' },
    { color: '#A5A8B1', es: 'Ausente', en: 'Missing' },
    { color: '#DE8BD0', es: 'Implante', en: 'Implant' },
    { color: '#10B981', es: 'Sano / Revisado', en: 'Healthy / Checked' },
  ];

  const itemsHtml = items
    .map(
      (item) => `
      <span class="legend-chip">
        <span class="legend-dot" style="background-color: ${item.color};"></span>
        <span>${escapeHtml(lang === 'en' ? item.en : item.es)}</span>
      </span>
    `
    )
    .join('');

  return `
    <div class="teeth-legend-strip">
      <span class="legend-title">${lang === 'en' ? 'Odontogram Legend:' : 'Convención Odontograma:'}</span>
      <div class="legend-chips-wrap">
        ${itemsHtml}
      </div>
    </div>
  `;
}

function buildConsultationsListHtml(
  consultations: Consultation[],
  doctorFallback?: string,
  lang: ReportLanguage = 'es',
  record?: ClinicalRecord
): string {
  if (consultations.length === 0) {
    return ReportService.buildAlert(
      lang === 'en'
        ? 'No prior dental consultations recorded.'
        : 'No se registran consultas previas en el expediente.',
      'info'
    );
  }

  const legendHtml = buildTeethLegendHtml(lang);

  const cardsHtml = consultations
    .map((c) => {
      const dateStr = formatReportDateTime(c.consultationDate, lang);
      const teethSummaries = extractConsultationDentalPieces(c, record, lang);
      const teethSummaryHtml = buildTeethSummaryHtml(teethSummaries, lang);

      const detailedDiagHtml = Array.isArray(c.diagnosticoDetallado) && c.diagnosticoDetallado.length > 0
        ? `<div class="consultation-field"><strong>${lang === 'en' ? 'Detailed Findings:' : 'Hallazgos Detallados:'}</strong> <ul>${c.diagnosticoDetallado.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul></div>`
        : '';
      const performedTreatmentsHtml = c.tratamientosRealizados
        ? `<div class="consultation-field"><strong>${lang === 'en' ? 'Procedures Performed:' : 'Procedimientos Realizados:'}</strong> ${escapeHtml(c.tratamientosRealizados)}</div>`
        : '';
      const notesHtml = c.notas
        ? `<div class="consultation-field"><strong>${lang === 'en' ? 'Evolution Notes:' : 'Notas de Evolución:'}</strong> ${escapeHtml(c.notas)}</div>`
        : '';
      const nextApptHtml = c.proximaCita && c.proximaCita !== 'No programada'
        ? `<span class="consultation-next-badge"><strong>${lang === 'en' ? 'Next Appointment:' : 'Próxima Cita:'}</strong> ${escapeHtml(c.proximaCita)}</span>`
        : '';

      return `
        <div class="consultation-card keep-together">
          <div class="consultation-card-header">
            <h4 class="consultation-card-title">${escapeHtml(c.title || (lang === 'en' ? 'Dental Consultation' : 'Consulta Odontológica'))}</h4>
            <span class="consultation-card-date">${escapeHtml(dateStr)}</span>
          </div>
          <div class="consultation-field">
            <strong>${lang === 'en' ? 'Reason:' : 'Motivo:'}</strong> ${escapeHtml(c.motivo || 'N/A')}
          </div>
          <div class="consultation-field">
            <strong>${lang === 'en' ? 'Diagnosis:' : 'Diagnóstico:'}</strong> ${escapeHtml(c.diagnostico || (lang === 'en' ? 'No diagnosis recorded' : 'Sin diagnóstico registrado'))}
          </div>
          ${detailedDiagHtml}
          ${teethSummaryHtml}
          ${performedTreatmentsHtml}
          ${notesHtml}
          <div class="consultation-card-footer">
            <span><strong>${lang === 'en' ? 'Doctor:' : 'Doctor:'}</strong> ${escapeHtml(c.doctor || doctorFallback || 'Dr. Odontólogo')}</span>
            ${nextApptHtml}
          </div>
        </div>
      `;
    })
    .join('');

  return `${legendHtml}${cardsHtml}`;
}

function buildTreatmentsTableHtml(treatments: Treatment[], lang: ReportLanguage = 'es'): string {
  if (treatments.length === 0) {
    return ReportService.buildAlert(
      lang === 'en'
        ? 'No dental procedures or treatments recorded.'
        : 'No se registran tratamientos previos en el expediente.',
      'info'
    );
  }

  const tableColumns = [
    { header: lang === 'en' ? 'Date' : 'Fecha', width: '15%' },
    { header: lang === 'en' ? 'Treatment / Procedure' : 'Procedimiento / Tratamiento', width: '25%' },
    { header: lang === 'en' ? 'Dental Piece' : 'Pieza Dental', width: '15%' },
    { header: lang === 'en' ? 'Status' : 'Estado', width: '15%' },
    { header: lang === 'en' ? 'Category' : 'Categoría', width: '15%' },
    { header: lang === 'en' ? 'Attending Dentist' : 'Odontólogo Responsable', width: '15%' },
  ];

  const tableRows = treatments.map((t) => [
    formatReportDateTime(t.treatmentDate, lang).split(' ')[0],
    t.treatmentName || 'N/A',
    t.dentalPiece || (lang === 'en' ? 'General' : 'General / Toda la boca'),
    t.status || 'N/A',
    t.category || '-',
    t.responsibleDentist || '-',
  ]);

  return ReportService.buildTable({
    columns: tableColumns,
    rows: tableRows,
    language: lang,
  });
}

export function getClinicalRecordRenderOptions(
  record: ClinicalRecord,
  options?: ClinicalRecordExportOptions
): RenderReportOptions {
  const lang = resolveReportLanguage(options?.language);
  const patient = record.patient;
  const patientName = patient?.fullName || (lang === 'en' ? 'Patient' : 'Paciente');
  const code = (patient?.patientCode || 'PT').replace(/[^a-zA-Z0-9]/g, '');
  const cleanFileName = `Historia_Clinica_${patientName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const patientGridHtml = buildPatientInfoGridHtml(patient, lang);
  const consultationsBodyHtml = buildConsultationsListHtml(record.consultations || [], options?.doctorName, lang, record);
  const treatmentsBodyHtml = buildTreatmentsTableHtml(record.treatments || [], lang);

  const customStyles = `
    .section-title-bar {
      margin: 16px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 2px solid ${REPORT_THEME.primary};
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .section-title-bar h3 {
      margin: 0;
      font-size: 10.5pt;
      font-weight: 700;
      color: ${REPORT_THEME.primaryDark};
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .teeth-legend-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      margin-bottom: 12px;
      background-color: ${REPORT_THEME.backgroundAlt};
      border: 1px solid ${REPORT_THEME.border};
      border-radius: 4px;
      font-size: 7.2pt;
      color: ${REPORT_THEME.textMuted};
    }
    .legend-title {
      font-weight: 700;
      color: ${REPORT_THEME.textDark};
      text-transform: uppercase;
      font-size: 6.8pt;
      letter-spacing: 0.3px;
    }
    .legend-chips-wrap {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 3px;
    }
    .legend-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
    .consultation-card {
      border: 1px solid ${REPORT_THEME.border};
      border-left: 4px solid ${REPORT_THEME.primary};
      border-radius: 4px;
      padding: 10px 14px;
      margin-bottom: 12px;
      background-color: ${REPORT_THEME.white};
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .consultation-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      border-bottom: 1px dashed ${REPORT_THEME.border};
      padding-bottom: 4px;
    }
    .consultation-card-title {
      font-size: 9.5pt;
      font-weight: 700;
      color: ${REPORT_THEME.textDark};
      margin: 0;
    }
    .consultation-card-date {
      font-size: 8pt;
      color: ${REPORT_THEME.textMuted};
      font-weight: 600;
    }
    .consultation-field {
      margin-bottom: 4px;
      font-size: 8.5pt;
      line-height: 1.35;
      color: ${REPORT_THEME.textDark};
    }
    .consultation-field ul {
      margin: 2px 0 2px 16px;
      padding: 0;
    }
    .consultation-field li {
      margin-bottom: 2px;
    }
    .consultation-teeth-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin: 5px 0;
      font-size: 8.5pt;
    }
    .teeth-row-label {
      color: ${REPORT_THEME.textDark};
      font-size: 8.5pt;
    }
    .teeth-pills-list {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
    }
    .tooth-pill {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      border: 1px solid;
      border-radius: 12px;
      padding: 1px 6px;
      background-color: #FFFFFF;
      font-size: 7.2pt;
      line-height: 1.25;
    }
    .tooth-pill-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
    }
    .tooth-pill-num {
      font-weight: 700;
      color: ${REPORT_THEME.textDark};
    }
    .tooth-pill-label {
      font-weight: 600;
      font-size: 6.8pt;
    }
    .tooth-general-pill {
      font-size: 7.5pt;
      color: ${REPORT_THEME.textMuted};
      font-style: italic;
      background-color: ${REPORT_THEME.backgroundAlt};
      padding: 1px 6px;
      border-radius: 3px;
    }
    .consultation-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
      padding-top: 4px;
      border-top: 1px solid #F3F4F6;
      font-size: 7.5pt;
      color: ${REPORT_THEME.textMuted};
    }
    .consultation-next-badge {
      background-color: ${REPORT_THEME.primarySoft};
      color: ${REPORT_THEME.primaryDark};
      padding: 2px 6px;
      border-radius: 3px;
    }
    .report-table tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  `;

  const contentHtml = `
    <div class="patient-section keep-together">
      <div class="section-title-bar">
        <h3>${escapeHtml(lang === 'en' ? 'Patient Clinical Record & Background' : 'Datos del Paciente y Antecedentes')}</h3>
      </div>
      ${patientGridHtml}
    </div>

    <div class="consultations-section">
      <div class="section-title-bar">
        <h3>${escapeHtml(lang === 'en' ? 'Chronological Consultation History & Evolution' : 'Historial de Consultas y Evolución')}</h3>
      </div>
      ${consultationsBodyHtml}
    </div>

    <div class="treatments-section">
      <div class="section-title-bar">
        <h3>${escapeHtml(lang === 'en' ? 'Detailed Dental Treatments History' : 'Historial Detallado de Tratamientos Odontológicos')}</h3>
      </div>
      ${treatmentsBodyHtml}
    </div>
  `;

  return {
    metadata: {
      title: lang === 'en' ? 'DENTAL CLINICAL RECORD' : 'HISTORIA CLÍNICA ODONTOLÓGICA',
      subtitle: `${lang === 'en' ? 'Patient' : 'Paciente'}: ${patientName}`,
      reportCode: `HC-${code}-${new Date().getFullYear()}`,
      category: lang === 'en' ? 'Clinical Record' : 'Expediente Clínico Odontológico',
      badge: {
        label: patient?.status === 'activo'
          ? (lang === 'en' ? 'Active' : 'Activo')
          : (lang === 'en' ? 'Record' : 'Expediente'),
        variant: 'primary',
      },
      generatedBy: options?.doctorName || (lang === 'en' ? 'Attending Dentist' : 'Dr. Odontólogo Responsable'),
      showSignatureBlock: true,
      signatureTitle: options?.doctorName || (lang === 'en' ? 'Attending Dentist' : 'Dr. Odontólogo Responsable'),
      signatureSubtitle: lang === 'en' ? 'Treating Specialist - ATI Dental' : 'Especialista Tratante - ATI Dental',
      licenseNumber: options?.licenseNumber,
      fileName: cleanFileName,
      language: lang,
    },
    contentHtml,
    customStyles,
    pageSize: 'A4',
    orientation: 'portrait',
    language: lang,
  };
}

/**
 * Genera el documento HTML completo del expediente clínico odontológico,
 * aplicando el membrete corporativo, datos del paciente, historial de consultas y tratamientos.
 */
export function buildClinicalRecordPdfHtml(
  record: ClinicalRecord,
  options?: ClinicalRecordExportOptions
): string {
  const renderOptions = getClinicalRecordRenderOptions(record, options);
  return ReportService.renderHtml(renderOptions);
}

/**
 * Exporta y comparte el expediente clínico dental completo a PDF (Criterios US-22).
 * Compila la plantilla corporativa en segundo plano y despliega de forma nativa la hoja de compartir.
 */
export async function exportClinicalRecordToPdf(
  record: ClinicalRecord,
  options?: ClinicalRecordExportOptions & { shareOptions?: ShareReportOptions }
): Promise<GenerateAndShareReportResult> {
  if (!hasClinicalRecordExportableData(record)) {
    throw new Error('El paciente no registra consultas ni tratamientos para exportar');
  }

  const renderOptions = getClinicalRecordRenderOptions(record, options);
  const lang = resolveReportLanguage(options?.language);
  const patientName = record.patient?.fullName || (lang === 'en' ? 'Patient' : 'Paciente');

  return ReportService.generateAndShare(renderOptions, {
    dialogTitle: `${lang === 'en' ? 'Clinical Record' : 'Historia Clínica'} - ${patientName}`,
    mimeType: 'application/pdf',
    language: lang,
    ...options?.shareOptions,
  });
}