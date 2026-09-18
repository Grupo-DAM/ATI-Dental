import { firestore } from '@/config/firebase';

export interface PendingExam {
  id: string;
  name: string;
  date: string;
}

export interface TreatmentInput {
  patientId: string;
  patientName?: string;
  category: string;
  treatmentName: string;
  dentalPiece?: string;
  treatmentDate: string;
  duration?: string;
  responsibleDentist: string;
  status: string;
  notes?: string;
  estimatedCost: number;
  pendingExams: PendingExam[];
}

export interface Treatment extends TreatmentInput {
  id: string;
  createdAt?: any;
  updatedAt?: any;
}

export const TREATMENTS_COLLECTION = 'tratamientos';

function getServerTimestamp() {
  try {
    if (typeof (firestore as any)?.FieldValue?.serverTimestamp === 'function') {
      return (firestore as any).FieldValue.serverTimestamp();
    }
  } catch (e) {
    console.warn('[treatment-service] FieldValue.serverTimestamp unavailable, using Date fallback:', e);
  }
  return new Date();
}

/**
 * Creates and persists a new treatment associated with a patient in Firestore.
 */
export async function createTreatment(input: TreatmentInput): Promise<Treatment> {
  try {
    const db = firestore();
    const collectionRef = db.collection(TREATMENTS_COLLECTION);
    const timestamp = getServerTimestamp();
    
    const treatmentDocument = {
      patientId: input.patientId,
      patientName: input.patientName || '',
      category: input.category,
      treatmentName: input.treatmentName,
      dentalPiece: input.dentalPiece || 'Toda la boca',
      treatmentDate: input.treatmentDate,
      responsibleDentist: input.responsibleDentist,
      status: input.status,
      notes: input.notes || '',
      estimatedCost: Number(input.estimatedCost),
      pendingExams: input.pendingExams || [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const docRef = await collectionRef.add(treatmentDocument);

    return {
      id: docRef.id,
      ...treatmentDocument,
    };
  } catch (error) {
    console.error('[treatment-service] createTreatment failed:', error);
    throw error;
  }
}

/**
 * Retrieves all treatments associated with a specific patient, ordered by creation date.
 * Makes treatment history available for the patient's record / chart.
 */
export async function getTreatmentsByPatientId(patientId: string): Promise<Treatment[]> {
  const snapshot = await firestore()
    .collection(TREATMENTS_COLLECTION)
    .where('patientId', '==', patientId)
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      patientId: data.patientId,
      patientName: data.patientName,
      category: data.category,
      treatmentName: data.treatmentName,
      dentalPiece: data.dentalPiece,
      treatmentDate: data.treatmentDate,
      responsibleDentist: data.responsibleDentist,
      status: data.status,
      notes: data.notes,
      estimatedCost: data.estimatedCost,
      pendingExams: data.pendingExams || [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  });
}

/**
 * Retrieves a single treatment by its unique document ID.
 */
export async function getTreatmentById(treatmentId: string): Promise<Treatment | null> {
  const docRef = await firestore()
    .collection(TREATMENTS_COLLECTION)
    .doc(treatmentId)
    .get();

  if (!docRef.exists()) {
    return null;
  }

  const data = docRef.data();
  if (!data) return null;

  return {
    id: docRef.id,
    patientId: data.patientId,
    patientName: data.patientName,
    category: data.category,
    treatmentName: data.treatmentName,
    dentalPiece: data.dentalPiece,
    treatmentDate: data.treatmentDate,
    responsibleDentist: data.responsibleDentist,
    status: data.status,
    notes: data.notes,
    estimatedCost: data.estimatedCost,
    pendingExams: data.pendingExams || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Updates an existing treatment document.
 */
export async function updateTreatment(treatmentId: string, updates: Partial<TreatmentInput>): Promise<void> {
  await firestore()
    .collection(TREATMENTS_COLLECTION)
    .doc(treatmentId)
    .update({
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
}

/**
 * Deletes a treatment document.
 */
export async function deleteTreatment(treatmentId: string): Promise<void> {
  await firestore()
    .collection(TREATMENTS_COLLECTION)
    .doc(treatmentId)
    .delete();
}
