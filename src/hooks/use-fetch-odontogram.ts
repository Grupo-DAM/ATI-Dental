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

    if (!patientId) return;

    const fetchOdontogramData = async () => {
      setLoading(true);
      setError(null);
      try {
        let baseQuery = firestore()
          .collection(ODONTOGRAM_COLLECTION)
          .where('pacienteId', '==', patientId);

         if (selectedDate) {
          // Filtramos las consultas pertenecientes estrictamente al día seleccionado
          baseQuery = baseQuery
            .where('fechaRegistro', '>=', `${selectedDate}T00:00:00.000Z`)
            .where('fechaRegistro', '<=', `${selectedDate}T23:59:59.999Z`)
            .limit(1);
        } else {
          // Si no hay fecha especificada, recuperamos el documento más reciente del paciente
          baseQuery = baseQuery
            .orderBy('fechaRegistro', 'desc')
            .limit(1);
        }

        const querySnapshot = await baseQuery.get();

        if (!querySnapshot.empty) {
          // En React Native Firebase, los documentos se acceden directamente por índice en .docs
          const docData = querySnapshot.docs[0].data();
          const parsedOdontogram = mapFirebaseToOdontogram(docData);
          setOdontogram(parsedOdontogram);
        } else {
          setOdontogram(undefined);
        }
      } catch (err) {
        console.error("Error obteniendo el odontograma:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchOdontogramData();
  }, [patientId, selectedDate]);

  return { odontogram, loading, odontogramError };
}
