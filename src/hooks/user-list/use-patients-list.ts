import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { firestore } from '@/config/firebase';

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