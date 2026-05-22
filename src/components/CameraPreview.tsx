import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function CameraPreview() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  //Estado de carga de los permisos
  if (!permission) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Inicializando cámara nativa...</Text>
      </View>
    );
  }

  //Si no se han concedido los permisos
  if (!permission.granted) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>
          ATI Dental requiere permiso para utilizar la cámara nativa.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Otorgar Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  //Alternar entre cámara trasera y frontal
  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  //Capturar foto
  const takePicture = async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const options = {
          quality: 0.85,
          skipProcessing: false,
        };
        const photo = await cameraRef.current.takePictureAsync(options);

        if (photo?.uri) {
          setPhotoUri(photo.uri);
        }
      } catch (error) {
        console.error('Error al tomar la foto:', error);
        Alert.alert('Error', 'No se pudo capturar la imagen.');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.layout}>
        {/* Contenedor del Preview de Cámara */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Previsualización en Vivo</Text>
          <View style={styles.cameraWrapper}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              mode="picture"
            >
              <View style={styles.overlayControls}>
                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
                  <Text style={styles.flipButtonText}>
                    🔄 {facing === 'back' ? 'Trasera' : 'Frontal'}
                  </Text>
                </TouchableOpacity>
              </View>
            </CameraView>
          </View>
        </View>

        {/* Contenedor de la foto resultante */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Miniatura Capturada</Text>
          <View style={styles.thumbnailWrapper}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.thumbnail} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderThumbnail}>
                <Text style={styles.placeholderText}>Sin Foto</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Botones de acción */}
      <View style={styles.actionControls}>
        <TouchableOpacity
          style={[styles.actionButton, styles.captureButton, isCapturing && styles.disabledButton]}
          onPress={takePicture}
          disabled={isCapturing}
        >
          {isCapturing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>📸 Capturar</Text>
          )}
        </TouchableOpacity>

        {photoUri && (
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={() => setPhotoUri(null)}
          >
            <Text style={styles.buttonText}>Limpiar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 8,
  },
  cameraWrapper: {
    width: 260,
    height: 195,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlayControls: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    alignItems: 'center',
  },
  flipButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  flipButtonText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  thumbnailWrapper: {
    width: 260,
    height: 195,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    backgroundColor: '#3B82F6',
  },
  clearButton: {
    backgroundColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#64748B',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  infoText: {
    color: '#E2E8F0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    maxWidth: 280,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
});
