import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Tipo de Paciente para Firestore
interface Paciente {
  id: string;
  nombre: string;
  tratamiento: string;
  fechaCreacion: string;
  hasPendingWrites?: boolean;
}

export default function FirebasePocScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };

  // Estados de Firestore
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [errorFirestore, setErrorFirestore] = useState<string | null>(null);

  // Estados de Storage
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorStorage, setErrorStorage] = useState<string | null>(null);

  // 1. Escuchar a Firestore en tiempo real (Soporta Offline por defecto)
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('pacientes')
      .orderBy('fechaCreacion', 'desc')
      .limit(10)
      .onSnapshot(
        (querySnapshot) => {
          const listaPacientes: Paciente[] = [];
          
          // Verificar si los datos provienen del caché local (offline mode)
          setIsFromCache(querySnapshot.metadata.fromCache);

          querySnapshot.forEach((doc) => {
            listaPacientes.push({
              id: doc.id,
              nombre: doc.data().nombre || 'Sin nombre',
              tratamiento: doc.data().tratamiento || 'Sin tratamiento',
              fechaCreacion: doc.data().fechaCreacion || '',
              // metadata.hasPendingWrites nos dice si hay escrituras locales sin sincronizar
              hasPendingWrites: doc.metadata.hasPendingWrites,
            });
          });

          setPacientes(listaPacientes);
          setLoadingPacientes(false);
          setErrorFirestore(null);
        },
        (error) => {
          console.error('Error en Firestore snapshot: ', error);
          setErrorFirestore(error.message);
          setLoadingPacientes(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // 2. Agregar un Paciente (Escritura en Firestore)
  const handleAddPaciente = async () => {
    try {
      const nombresDemo = ['María Delgado', 'Carlos Cova', 'Valeria Ciccolella', 'Jesús Carios', 'Sofía Marcano', 'Carlos Cao'];
      const tratamientosDemo = ['Limpieza Dental', 'Ortodoncia', 'Endodoncia', 'Implante Dental', 'Extracción'];
      
      const randomNombre = nombresDemo[Math.floor(Math.random() * nombresDemo.length)];
      const randomTratamiento = tratamientosDemo[Math.floor(Math.random() * tratamientosDemo.length)];

      await firestore().collection('pacientes').add({
        nombre: randomNombre,
        tratamiento: randomTratamiento,
        fechaCreacion: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error al agregar paciente: ', error);
      setErrorFirestore(error.message);
    }
  };

  // 3. Subir archivo a Cloud Storage (Simulación de reporte/historia clínica)
  const handleUploadFile = async () => {
    setIsUploading(true);
    setErrorStorage(null);
    setUploadProgress(0);
    setDownloadUrl(null);

    try {
      const timestamp = Date.now();
      const content = `Reporte Clínico ATI-Dental\nFecha: ${new Date().toLocaleString()}\nDetalle: Simulación de historia clínica cargada desde el dispositivo móvil en el Spike de Firebase.`;
      
      const reference = storage().ref(`pruebas/reporte_${timestamp}.txt`);

      // Usar putString para subir un texto plano directamente sin usar archivos físicos locales
      const task = reference.putString(content, 'raw', {
        contentType: 'text/plain',
      });

      // Observar el progreso de la subida
      task.on('state_changed', (taskSnapshot) => {
        const progress = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      });

      await task;

      // Obtener URL de descarga
      const url = await reference.getDownloadURL();
      setDownloadUrl(url);
      setIsUploading(false);
      setUploadProgress(null);
    } catch (error: any) {
      console.error('Error al subir archivo a Storage: ', error);
      setErrorStorage(error.message);
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        
        {/* Cabecera */}
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">Firebase Spike PoC</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Validando Firestore Offline y Cloud Storage
          </ThemedText>
        </ThemedView>

        {/* Sección 1: Firestore y Persistencia Offline */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            🔥 Firestore (Pacientes)
          </ThemedText>
          
          {/* Status de Red / Cache */}
          <ThemedView style={styles.statusBadgeWrapper}>
            <ThemedView 
              style={[
                styles.statusBadge, 
                { backgroundColor: isFromCache ? '#EF4444' : '#10B981' }
              ]}>
              <ThemedText style={styles.statusText}>
                {isFromCache ? '🔌 MODO OFFLINE (Caché)' : '🌐 CONECTADO A FIREBASE'}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {errorFirestore && (
            <ThemedText style={styles.errorText}>Error: {errorFirestore}</ThemedText>
          )}

          {/* Botón agregar paciente */}
          <Pressable style={styles.button} onPress={handleAddPaciente}>
            <ThemedText style={styles.buttonText}>+ Registrar Paciente Demo</ThemedText>
          </Pressable>

          <ThemedText type="smallBold" style={styles.listTitle}>
            Últimos registros (Límite 10):
          </ThemedText>

          {loadingPacientes ? (
            <ActivityIndicator color={theme.text} style={styles.loader} />
          ) : pacientes.length === 0 ? (
            <ThemedText type="small" style={styles.emptyText}>
              No hay pacientes registrados.
            </ThemedText>
          ) : (
            pacientes.map((item) => (
              <ThemedView key={item.id} style={styles.itemRow}>
                <ThemedView style={styles.itemMain}>
                  <ThemedText type="smallBold">{item.nombre}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.tratamiento}
                  </ThemedText>
                </ThemedView>
                
                {/* Indicador de escritura local pendiente */}
                {item.hasPendingWrites ? (
                  <ThemedView style={[styles.badge, styles.pendingBadge]}>
                    <ThemedText style={styles.badgeText}>Pendiente Sinc</ThemedText>
                  </ThemedView>
                ) : (
                  <ThemedView style={[styles.badge, styles.syncedBadge]}>
                    <ThemedText style={styles.badgeText}>Sincronizado</ThemedText>
                  </ThemedView>
                )}
              </ThemedView>
            ))
          )}
        </ThemedView>

        {/* Sección 2: Cloud Storage */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            📁 Cloud Storage (Archivos)
          </ThemedText>
          
          <ThemedText type="small" style={styles.description}>
            Sube una simulación de reporte clínico en formato de texto plano (`.txt`) a la nube.
          </ThemedText>

          {errorStorage && (
            <ThemedText style={styles.errorText}>Error: {errorStorage}</ThemedText>
          )}

          {/* Botón de subida */}
          <Pressable 
            style={[styles.button, isUploading && styles.disabledButton]} 
            onPress={handleUploadFile}
            disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <ThemedText style={styles.buttonText}>📤 Subir Reporte a Storage</ThemedText>
            )}
          </Pressable>

          {/* Progreso */}
          {uploadProgress !== null && (
            <ThemedView style={styles.progressWrapper}>
              <ThemedText type="small">Subiendo: {uploadProgress}%</ThemedText>
              <ThemedView style={styles.progressBarBg}>
                <ThemedView style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
              </ThemedView>
            </ThemedView>
          )}

          {/* URL de Descarga */}
          {downloadUrl && (
            <ThemedView style={styles.successWrapper}>
              <ThemedText type="smallBold" style={styles.successTitle}>
                ¡Subida completada con éxito!
              </ThemedText>
              <ThemedText type="small" style={styles.urlText} numberOfLines={2}>
                URL: {downloadUrl}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginVertical: Spacing.two,
  },
  subtitle: {
    textAlign: 'center',
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  cardTitle: {
    marginBottom: Spacing.one,
  },
  statusBadgeWrapper: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#208AEF',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listTitle: {
    marginTop: Spacing.two,
  },
  loader: {
    marginVertical: Spacing.four,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: Spacing.three,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemMain: {
    flex: 1,
    gap: 2,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.one,
  },
  pendingBadge: {
    backgroundColor: '#FEFCBF',
    borderWidth: 1,
    borderColor: '#D69E2E',
  },
  syncedBadge: {
    backgroundColor: '#C6F6D5',
    borderWidth: 1,
    borderColor: '#38A169',
  },
  badgeText: {
    fontSize: 10,
    color: '#2D3748',
    fontWeight: '600',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
  },
  description: {
    marginBottom: Spacing.one,
  },
  progressWrapper: {
    gap: Spacing.one,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#208AEF',
  },
  successWrapper: {
    backgroundColor: '#E6F4FE',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#BEE3F8',
    gap: 4,
  },
  successTitle: {
    color: '#2B6CB0',
  },
  urlText: {
    color: '#2B6CB0',
    fontSize: 11,
  },
});
