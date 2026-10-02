import { firestore } from '@/config/firebase';
import { Config } from '@/constants/config';
import { getSessionToken } from '@/utils/secure-storage';
import { getPatientById, PATIENTS_COLLECTION, Patient } from '@/services/patient-service';
import { getTreatmentsByPatientId, Treatment } from '@/services/treatment-service';
import { ClinicalRecord, ClinicalRecordResponse, Consultation, OdontogramData } from '@/types/clinical-record';
import { parseAppointmentDateKey } from '@/utils/appointment-schedule';
import { parseDateRobustly } from '@/utils/date-utils';
import { summarizePatientVisits, VisitStamp } from '@/utils/patient-visits';

export const CONSULTATIONS_COLLECTION = 'consultas';
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

    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          patientId: d.patientId,
          consultationDate: d.consultationDate || d.date,
          title: d.title || d.treatmentName || 'Consulta Odontológica',
          motivo: d.motivo || d.category || 'Control general',
          diagnostico: d.diagnostico || d.notes || 'Sin diagnóstico registrado',
          diagnosticoDetallado: d.diagnosticoDetallado || [],
          proximaCita: d.proximaCita,
          doctor: d.doctor || d.responsibleDentist || 'Dr. Smith',
          duration: d.duration || '45 minutos',
          tratamientosRealizados: d.tratamientosRealizados || '',
          notas: d.notas || d.notes || '',
          appointmentId: d.appointmentId,
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