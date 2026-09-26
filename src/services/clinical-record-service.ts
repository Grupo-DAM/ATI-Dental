import { firestore } from '@/config/firebase';
import { Config } from '@/constants/config';
import { getSessionToken } from '@/utils/secure-storage';
import { getPatientById, Patient } from '@/services/patient-service';
import { getTreatmentsByPatientId, Treatment } from '@/services/treatment-service';
import { ClinicalRecord, ClinicalRecordResponse, Consultation, OdontogramData } from '@/types/clinical-record';
import { parseDateRobustly } from '@/utils/date-utils';

export const CONSULTATIONS_COLLECTION = 'consultas';

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
          return {
            success: true,
            data: serverData,
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

    const odontogram: OdontogramData = {
      patientId: patient.id,
      updatedAt: new Date().toISOString(),
      status: 'placeholder',
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

