import React from 'react';
import { View, StyleSheet } from 'react-native';
import CameraPreview from '../components/CameraPreview';

export default function CameraTestScreen() {
  return (
    <View style={styles.container}>
      <CameraPreview />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
