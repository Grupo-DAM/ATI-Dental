import { firestore } from '@/config/firebase';

// ─── Unified Patient interfaces ───

export interface PatientInput {
  patientCode?: string;
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

export interface Patient extends PatientInput {
  id: string;
  patientCode: string;
  status: 'activo' | 'inactivo';
  createdAt?: any;
  updatedAt?: any;
  // Extra fields used by patient-file (not in PatientInput)
  medicalHistory?: string[];
  knownAllergies?: string[];
  nextAppointment?: string;
  lastVisit?: string;
}

export const PATIENTS_COLLECTION = 'pacientes';

// ─── Helpers ───

function getServerTimestamp() {
  try {
    if (typeof (firestore as any)?.FieldValue?.serverTimestamp === 'function') {
      return (firestore as any).FieldValue.serverTimestamp();
    }
  } catch (e) {
    console.warn('[patient-service] FieldValue.serverTimestamp unavailable, using Date fallback:', e);
  }
  return new Date();
}

/**
 * Maps raw Firestore data to a Patient object, handling both
 * legacy (Spanish) and new (English) field names gracefully.
 */
function mapDocToPatient(id: string, data: any): Patient {
  // Build fullName from legacy fields if needed
  const fullName = data.fullName
    || `${data.nombre ?? ''} ${data.apellido ?? ''}`.trim()
    || '';

  return {
    id,
    patientCode: data.patientCode || '',
    fullName,
    documentId: data.documentId ?? data.dni ?? '',
    email: data.email ?? '',
    phone: data.phone ?? data.telefono ?? '',
    birthDate: data.birthDate ?? data.fechaNacimiento ?? '',
    gender: data.gender ?? data.genero ?? '',
    photoUri: data.photoUri ?? data.imageUrl ?? null,
    address: data.address ?? data.direccion ?? '',
    bloodType: data.bloodType ?? data.tipoSangre ?? '',
    allergies: data.allergies ?? '',
    conditions: data.conditions ?? '',
    notes: data.notes ?? data.notasAdicionales ?? '',
    status: data.status || 'activo',
    createdAt: data.createdAt ?? data.fechaCreacion ?? '',
    updatedAt: data.updatedAt ?? '',
    // Extra clinical fields
    medicalHistory: data.medicalHistory ?? data.antecedentesMedicos ?? [],
    knownAllergies: data.knownAllergies ?? data.alergiasConocidas ?? [],
    nextAppointment: data.nextAppointment ?? data.proximaCita,
    lastVisit: data.lastVisit ?? data.ultimaVisita,
  };
}

// ─── Create ───

// Registra y persiste un nuevo paciente en Firestore.
export async function createPatient(input: PatientInput): Promise<Patient> {
  try {
    const db = firestore();
    const collectionRef = db.collection(PATIENTS_COLLECTION);
    const timestamp = getServerTimestamp();

    const snapshot = await collectionRef.get();
    const nextNumber = snapshot.size + 1;
    const patientCode = `#P-${String(nextNumber).padStart(4, '0')}`;

    const patientDocument = {
      patientCode,
      fullName: input.fullName.trim(),
      documentId: input.documentId?.trim() || '',
      birthDate: input.birthDate?.trim() || '',
      gender: input.gender || '',
      phone: input.phone?.trim() || '',
      email: input.email?.trim().toLowerCase() || '',
      address: input.address?.trim() || '',
      photoUri: input.photoUri || null,
      bloodType: input.bloodType || '',
      allergies: input.allergies?.trim() || '',
      conditions: input.conditions?.trim() || '',
      notes: input.notes?.trim() || '',
      status: 'activo' as const,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const docRef = await collectionRef.add(patientDocument);

    return {
      id: docRef.id,
      ...patientDocument,
    };
  } catch (error) {
    console.error('[patient-service] createPatient failed:', error);
    throw error;
  }
}

// ─── Read ───

// Obtiene la lista completa de pacientes para su visualización.
export async function getPatients(): Promise<Patient[]> {
  try {
    const snapshot = await firestore()
      .collection(PATIENTS_COLLECTION)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => mapDocToPatient(doc.id, doc.data()));
  } catch (error) {
    console.error('[patient-service] getPatients failed:', error);
    throw error;
  }
}

/**
 * Retrieves a single patient by their Firestore document ID.
 * Throws if the document does not exist or there is a network/permissions error.
 */
export async function getPatientById(patientId: string): Promise<Patient> {
  try {
    const docRef = await firestore()
      .collection(PATIENTS_COLLECTION)
      .doc(patientId)
      .get();

    const exists = typeof docRef.exists === 'function' ? docRef.exists() : docRef.exists;

    if (!exists) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    const data = docRef.data();
    if (!data) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    return mapDocToPatient(docRef.id, data);
  } catch (error) {
    console.error('[patient-service] getPatientById failed:', error);
    throw error;
  }
}

/**
 * Retrieves a single patient by their email.
 * Throws if the document does not exist or there is a network/permissions error.
 */
export async function getPatientByEmail(email: string): Promise<Patient> {
  try {
    const querySnapshot = await firestore()
      .collection(PATIENTS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    const docRef = querySnapshot.docs[0];
    const data = docRef.data();

    return mapDocToPatient(docRef.id, data);
  } catch (error) {
    console.error('[patient-service] getPatientByEmail failed:', error);
    throw error;
  }
}
