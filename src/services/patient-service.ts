import { firestore } from '@/config/firebase';

/**
 * Represents a patient record stored in the 'pacientes' Firestore collection.
 * Fields marked as optional may not yet exist in the database but are
 * included so the UI can display placeholders and be ready when they are added.
 */
export interface Patient {
  id: string;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  antecedentesMedicos: string[];
  fechaCreacion: string;
  // Optional fields — not yet present in Firestore
  genero?: string;
  imageUrl?: string;
  direccion?: string;
  tipoSangre?: string;
  alergiasConocidas?: string[];
  condicionesMedicas?: string[];
  notasAdicionales?: string;
  proximaCita?: string;
  ultimaVisita?: string;
}

export const PATIENTS_COLLECTION = 'pacientes';

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

    return {
      id: docRef.id,
      nombre: data.nombre ?? '',
      apellido: data.apellido ?? '',
      dni: data.dni ?? '',
      email: data.email ?? '',
      telefono: data.telefono ?? '',
      fechaNacimiento: data.fechaNacimiento ?? '',
      antecedentesMedicos: data.antecedentesMedicos ?? [],
      fechaCreacion: data.fechaCreacion ?? '',
      // Optional fields
      genero: data.genero,
      imageUrl: data.imageUrl,
      direccion: data.direccion,
      tipoSangre: data.tipoSangre,
      alergiasConocidas: data.alergiasConocidas ?? [],
      condicionesMedicas: data.condicionesMedicas ?? [],
      notasAdicionales: data.notasAdicionales,
      proximaCita: data.proximaCita,
      ultimaVisita: data.ultimaVisita,
    };
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

    return {
      id: docRef.id,
      nombre: data.nombre ?? '',
      apellido: data.apellido ?? '',
      dni: data.dni ?? '',
      email: data.email ?? '',
      telefono: data.telefono ?? '',
      fechaNacimiento: data.fechaNacimiento ?? '',
      antecedentesMedicos: data.antecedentesMedicos ?? [],
      fechaCreacion: data.fechaCreacion ?? '',
      // Optional fields
      genero: data.genero,
      imageUrl: data.imageUrl,
      direccion: data.direccion,
      tipoSangre: data.tipoSangre,
      alergiasConocidas: data.alergiasConocidas ?? [],
      condicionesMedicas: data.condicionesMedicas ?? [],
      notasAdicionales: data.notasAdicionales,
      proximaCita: data.proximaCita,
      ultimaVisita: data.ultimaVisita,
    };
  } catch (error) {
    console.error('[patient-service] getPatientByEmail failed:', error);
    throw error;
  }
}
