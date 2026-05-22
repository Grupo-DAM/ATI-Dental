import React from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  ScrollView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NetworkBanner } from './components/NetworkBanner';
import { AppointmentForm } from './components/AppointmentForm';

const { width } = Dimensions.get('window');

export default function App() {
  return (
    <View style={styles.container}>
      {/* Premium background gradient effects */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      
      {/* Floating alert banner */}
      <NetworkBanner />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.logoRow}>
                <View style={styles.logoBadge}>
                  <Ionicons name="medical" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.logoText}>
                  ATI <Text style={styles.logoTextHighlight}>Dental</Text>
                </Text>
              </View>
              <Text style={styles.tagline}>Portal de Gestión de Historias Clínicas</Text>
            </View>

            {/* Spike Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoTitleRow}>
                <Ionicons name="git-branch-outline" size={18} color="#60a5fa" />
                <Text style={styles.infoTitle}>Spike: #64 Connectivity PoC</Text>
              </View>
              <Text style={styles.infoText}>
                Esta es una simulación interactiva diseñada para validar el comportamiento sin conexión a internet (offline). 
              </Text>
              
              <View style={styles.instructionBox}>
                <Text style={styles.instructionTitle}>¿Cómo probar el comportamiento?</Text>
                <View style={styles.instructionStep}>
                  <Ionicons name="phone-portrait-outline" size={14} color="#94a3b8" />
                  <Text style={styles.instructionStepText}>
                    Activa el modo avión o desconecta el Wi-Fi en tu dispositivo real o simulador.
                  </Text>
                </View>
                <View style={styles.instructionStep}>
                  <Ionicons name="eye-outline" size={14} color="#94a3b8" />
                  <Text style={styles.instructionStepText}>
                    Observa el banner flotante rojo y el bloqueo instantáneo del botón de agendamiento.
                  </Text>
                </View>
              </View>
            </View>

            {/* Core Interactive Form */}
            <AppointmentForm />

            {/* Footer Info */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Desarrollo de Aplicaciones Móviles • Grupo-DAM
              </Text>
              <Text style={styles.footerSubtext}>
                Integrantes: C. Cao, C. Carios, M. Ciavato, V. Ciccolella, J. Cova, S. Marcano
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16', // Deep space dark blue
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 40,
    paddingBottom: 100, // Large bottom padding for comfortable scrolling past the button
    alignItems: 'center',
  },
  glow1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Glowing blue
    filter: 'blur(50px)',
  },
  glow2: {
    position: 'absolute',
    bottom: 50,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Glowing green
    filter: 'blur(60px)',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  logoTextHighlight: {
    color: '#3b82f6', // Bright Blue
  },
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b', // Slate-500
    marginTop: 6,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoCard: {
    width: width - 40,
    backgroundColor: 'rgba(30, 41, 59, 0.4)', // Translucent Slate-800
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.3)',
    marginBottom: 10,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93c5fd', // Light blue-200
    marginLeft: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
    marginBottom: 14,
  },
  instructionBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.3)',
  },
  instructionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  instructionStepText: {
    fontSize: 11,
    color: '#94a3b8',
    marginLeft: 8,
    flex: 1,
    lineHeight: 14,
  },
  footer: {
    marginTop: 35,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 9,
    color: '#334155',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 12,
  },
});
