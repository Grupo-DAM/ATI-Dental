import { firestore } from '@/config/firebase';
import { PatientGender, PatientBloodType } from '@/constants/patient';

export interface PatientInput {
  patientCode?: string;
  fullName: string;
  documentId?: string;
  birthDate?: string;
  gender?: PatientGender | string;
  phone?: string;
  email?: string;
  address?: string;
  photoUri?: string | null;
  bloodType?: PatientBloodType | string;
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
  // Fallbacks for the UI to prevent complete breakage
  proximaCita?: string;
  ultimaVisita?: string;
}

export const PATIENTS_COLLECTION = 'pacientes';

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

// Obtiene la lista completa de pacientes activos para su visualización.
export async function getPatients(): Promise<Patient[]> {
  try {
    const snapshot = await firestore()
      .collection(PATIENTS_COLLECTION)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        patientCode: data.patientCode || `#P-${doc.id.slice(0, 4).toUpperCase()}`,
        fullName: data.fullName,
        documentId: data.documentId,
        birthDate: data.birthDate,
        gender: data.gender,
        phone: data.phone,
        email: data.email,
        address: data.address,
        photoUri: data.photoUri,
        bloodType: data.bloodType,
        allergies: data.allergies,
        conditions: data.conditions,
        notes: data.notes,
        status: data.status || 'activo',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });
  } catch (error) {
    console.error('[patient-service] getPatients failed:', error);
    throw error;
  }
}

// Obtiene un paciente por su ID.
export async function getPatientById(patientId: string): Promise<Patient> {
  try {
    const docRef = await firestore()
      .collection(PATIENTS_COLLECTION)
      .doc(patientId)
      .get();

    if (!docRef.exists) {
      throw new Error('PATIENT_NOT_FOUND');
    }

    const data = docRef.data();
    if (!data) throw new Error('PATIENT_NOT_FOUND');

    return {
      id: docRef.id,
      patientCode: data.patientCode || `#P-${docRef.id.slice(0, 4).toUpperCase()}`,
      fullName: data.fullName || data.nombre || '',
      documentId: data.documentId || data.dni || '',
      birthDate: data.birthDate || data.fechaNacimiento || '',
      gender: data.gender || data.genero || '',
      phone: data.phone || data.telefono || '',
      email: data.email || '',
      address: data.address || data.direccion || '',
      photoUri: data.photoUri || data.imageUrl || null,
      bloodType: data.bloodType || data.tipoSangre || '',
      allergies: data.allergies || (data.alergiasConocidas ? data.alergiasConocidas.join(', ') : ''),
      conditions: data.conditions || (data.antecedentesMedicos ? data.antecedentesMedicos.join(', ') : ''),
      notes: data.notes || data.notasAdicionales || '',
      status: data.status || 'activo',
      createdAt: data.createdAt || data.fechaCreacion,
      updatedAt: data.updatedAt,
      proximaCita: data.proximaCita,
      ultimaVisita: data.ultimaVisita,
    };
  } catch (error) {
    console.error('[patient-service] getPatientById failed:', error);
    throw error;
  }
}

// Obtiene un paciente por su correo electrónico.
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

    return {
      id: docRef.id,
      patientCode: data.patientCode || `#P-${docRef.id.slice(0, 4).toUpperCase()}`,
      fullName: data.fullName || data.nombre || '',
      documentId: data.documentId || data.dni || '',
      birthDate: data.birthDate || data.fechaNacimiento || '',
      gender: data.gender || data.genero || '',
      phone: data.phone || data.telefono || '',
      email: data.email || '',
      address: data.address || data.direccion || '',
      photoUri: data.photoUri || data.imageUrl || null,
      bloodType: data.bloodType || data.tipoSangre || '',
      allergies: data.allergies || (data.alergiasConocidas ? data.alergiasConocidas.join(', ') : ''),
      conditions: data.conditions || (data.antecedentesMedicos ? data.antecedentesMedicos.join(', ') : ''),
      notes: data.notes || data.notasAdicionales || '',
      status: data.status || 'activo',
      createdAt: data.createdAt || data.fechaCreacion,
      updatedAt: data.updatedAt,
      proximaCita: data.proximaCita,
      ultimaVisita: data.ultimaVisita,
    };
  } catch (error) {
    console.error('[patient-service] getPatientByEmail failed:', error);
    throw error;
  }
}
