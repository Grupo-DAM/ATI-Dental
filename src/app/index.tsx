import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { VoiceCommandDemo } from '@/components/voice-command-demo';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ATI-Dental</Text>
      </View>
      <VoiceCommandDemo />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#208AEF',
  },
});
