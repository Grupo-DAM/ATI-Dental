import { firestore } from '@/config/firebase';
import { OdontogramData, ToothState, ToothCondition, ToothSurface } from '@/types/clinical-record';
import { useState, useEffect } from 'react';


//Map nomber de firebase con tipos en clinical-record
const STATE_MAP: Record<string, ToothState> = {
  'caries': 'cavity',
  'obturado': 'filled',
  'ausente': 'missing',
  'implante': 'implant',
  'endodoncia': 'root_canal',
  'protesis_fija': 'fixed_dental_prosthesis',
  'remanente_radicular': 'retained_root',
  'en_erupcion': 'in_eruption',
  'temporal': 'temporal'
};

function mapFirebaseToOdontogram(docData: any): OdontogramData {
  const teethRecord: Record<number, ToothCondition> = {};

  if (docData.estadoPiezas) {
    Object.entries(docData.estadoPiezas).forEach(([toothStr, data]: [string, any]) => {
      const toothNumber = parseInt(toothStr, 10);
      
      // 1. Convertir el estado_general a tu arreglo de ToothState[]
      const generalStates: ToothState[] = [];
      if (data.estado_general && STATE_MAP[data.estado_general]) {
        generalStates.push(STATE_MAP[data.estado_general]);
      }

      // 2. Convertir las caras/superficies mapeando el string en español al inglés
      const surfacesStates: ToothCondition['surfacesStates'] = {};
      if (data.caras) {
        Object.entries(data.caras).forEach(([surface, stateStr]: [string, any]) => {
          const mappedState = STATE_MAP[stateStr];
          if (mappedState === 'cavity' || mappedState === 'filled' || mappedState === 'temporal') {
            surfacesStates[surface as ToothSurface] = mappedState as 'caries' | 'obturado' | 'temporal';
          }
        });
      }

      teethRecord[toothNumber] = {
        number: toothNumber,
        generalStates,
        surfacesStates: Object.keys(surfacesStates).length > 0 ? surfacesStates : undefined,
        notes: data.notas || undefined
      };
    });
  }

  return {
    patientId: docData.pacienteId,
    updatedAt: docData.fechaRegistro,
    status: 'ready',
    isAdult: docData.tipo === 'adulto',
    teeth: teethRecord,
    notes: docData.notasGeneral || ''
  };
}

interface UseFetchOdontogramProps {
  patientId: string;
  selectedDate?: string | null; // Ej: "2026-06-09" o undefined para traer el último
}

const ODONTOGRAM_COLLECTION = 'odontogramas';

export function useFetchOdontogram({ patientId, selectedDate }: UseFetchOdontogramProps) {
  const [odontogram, setOdontogram] = useState<OdontogramData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [odontogramError, setError] = useState<Error | null>(null);

    useEffect(() => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let baseQuery = firestore()
        .collection(ODONTOGRAM_COLLECTION)
        .where('pacienteId', '==', patientId);

      if (selectedDate) {
        baseQuery = baseQuery
          .where('fechaRegistro', '>=', `${selectedDate}T00:00:00.000Z`)
          .where('fechaRegistro', '<=', `${selectedDate}T23:59:59.999Z`);
      }

      // Escucha en tiempo real de Firebase (sin problemas de caché ni necesidad de reiniciar sesión)
      const unsubscribe = baseQuery.onSnapshot(
        (querySnapshot) => {
          if (querySnapshot && !querySnapshot.empty) {
            // Ordenamos en memoria el más reciente para evitar error de índice
            const docs = [...querySnapshot.docs];
            docs.sort((a, b) => {
              const timeA = new Date(a.data().fechaRegistro || 0).getTime();
              const timeB = new Date(b.data().fechaRegistro || 0).getTime();
              return timeB - timeA;
            });

            const docData = docs[0].data();
            const parsedOdontogram = mapFirebaseToOdontogram(docData);
            setOdontogram(parsedOdontogram);
          } else {
            setOdontogram(undefined);
          }
          setLoading(false);
        },
        (err) => {
          console.error('Error escuchando el odontograma:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }, [patientId, selectedDate]);

  return { odontogram, loading, odontogramError };
}
