import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { firestore } from '@/config/firebase';
import { getVisitDatesByPatient } from '@/services/clinical-record-service';

async function applyAgendaVisitDates(patients: any[]): Promise<any[]> {
  const visits = await getVisitDatesByPatient();
  return patients.map((patient) => {
    const dates = visits.get(patient.id);
    if (!dates?.lastVisit && !dates?.nextAppointment) return patient;
    return {
      ...patient,
      lastVisit: dates.lastVisit ?? patient.lastVisit,
      nextAppointment: dates.nextAppointment ?? patient.nextAppointment,
      ultima_visita: dates.lastVisit ?? patient.ultima_visita ?? patient.lastVisit,
      proxima_visita: dates.nextAppointment ?? patient.proxima_visita ?? patient.nextAppointment,
      proxima_vista: dates.nextAppointment ?? patient.proxima_vista ?? patient.proxima_visita ?? patient.nextAppointment,
    };
  });
}

export function usePatients() {
    const [ patients, setPatients ] = useState<any[]>([]);
    const [ loading, setLoading ] = useState(true);
    const [ isFromCache, setIsFromCache ] = useState(false);
    const [ isRetrying, setIsRetrying ] = useState(false);

    useEffect(() => {
        const userList = firestore().collection('pacientes')
          .onSnapshot(
            (snapshot) => {
              const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setPatients(data);
              setIsFromCache(snapshot.metadata.fromCache);
              setLoading(false);
              void applyAgendaVisitDates(data).then(setPatients).catch(() => undefined);
            },
            (error) => {
              console.error("Error fetching users: ", error);
              setLoading(false);
            }
          );

        return () => userList()
    }, []);

    const handleRetryConnection = async () => {
        setIsRetrying(true);
        try {
            // Force network check
            const state = await NetInfo.refresh();

            if (state.isConnected) {
                // Enable network on Firestore to pull fresh data
                await firestore().enableNetwork();
            } else {
                Alert.alert("Sin Conexión", "Aún no hay acceso a internet.");
            }
        } catch (error) {
            console.error("Error retrying connection: ", error);
        } finally {
            setIsRetrying(false);
        }
    };

    return { patients, loading, isFromCache, isRetrying, handleRetryConnection };
}