import React, { useState } from 'react';
import { View, Button, Image, StyleSheet, Text, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ImagePickerTest() {
  const [imageUri, setImageUri] = useState<string | null>(null);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la cámara para tomar fotografías intraorales.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // Compresión balanceada para imágenes médicas iniciales
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permiso denegado', 'Se requiere acceso a la galería para subir archivos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spike: Gestión Multimedia</Text>

      <View style={styles.buttonContainer}>
        <Button title="Abrir Cámara" onPress={openCamera} />
        <View style={styles.space} />
        <Button title="Abrir Galería" onPress={openGallery} />
      </View>

      {imageUri ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <Text style={styles.successText}>Imagen cargada en memoria local</Text>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sin imagen seleccionada</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  buttonContainer: { flexDirection: 'row', marginBottom: 20 },
  space: { width: 20 },
  imageContainer: { alignItems: 'center' },
  image: { width: 250, height: 250, borderRadius: 8, resizeMode: 'contain' },
  successText: { marginTop: 8, color: 'green', fontWeight: 'bold' },
  placeholder: { width: 250, height: 250, borderRadius: 8, borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#999' }
});