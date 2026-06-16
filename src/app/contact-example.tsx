import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/app-header';
import { Breadcrumb } from '@/components/breadcrumb';
import { ContactButton } from '@/components/contact/contact-button';
import { ResponsibleCard } from '@/components/contact/responsible-card';

export default function ContactExampleScreen() {
  const insets = useSafeAreaInsets();
  const [testOnline, setTestOnline] = useState(true);

  const mockImage = { uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&h=256&q=80' };

  const handleAction = (type: string, detail: string) => {
    Alert.alert(
      `Acción de ${type}`,
      `Se presionó el botón de contacto para: ${detail}`,
      [
        {
          text: 'Probar Enlace Real',
          onPress: () => {
            if (type === 'Email') {
              Linking.openURL(`mailto:${detail}`);
            } else if (type === 'Teléfono') {
              Linking.openURL(`tel:${detail}`);
            }
          },
        },
        { text: 'Aceptar', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. AppHeader Reutilizable */}
      <AppHeader
        title="ATI Dental (Ejemplo)"
        onMenuPress={() => Alert.alert('Menú', 'Se presionó el menú de la cabecera.')}
      />

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 20 }]}>
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#5B2D8B" />
          <Text style={styles.backBtnText}>Volver al Inicio</Text>
        </TouchableOpacity>

        {/* 2. Breadcrumbs en diferentes configuraciones */}
        <Text style={styles.sectionTitle}>1. Breadcrumbs (Rastros de Navegación)</Text>
        <View style={styles.showcaseBox}>
          <Text style={styles.elementLabel}>Ejemplo 1 (Módulo de Contacto):</Text>
          <Breadcrumb parent="Sistema" current="Contacto" />

          <Text style={styles.elementLabel}>Ejemplo 2 (Perfil):</Text>
          <Breadcrumb parent="Pacientes" current="Perfil e Idioma" />
        </View>

        {/* 3. ContactButton en todos sus canales */}
        <Text style={styles.sectionTitle}>2. ContactButton (Canales de Contacto Grande)</Text>
        <View style={styles.showcaseBox}>
          <Text style={styles.elementLabel}>Canal: Email (Eminence Color)</Text>
          <ContactButton
            type="email"
            onPress={() => handleAction('Email', 'admin@ejemplo.com')}
          />

          <Text style={styles.elementLabel}>Canal: Llamada (Wisteria Color)</Text>
          <ContactButton
            type="phone"
            onPress={() => handleAction('Teléfono', '+123456789')}
          />

          <Text style={styles.elementLabel}>Canal: WhatsApp (WhatsApp Green Color)</Text>
          <ContactButton
            type="whatsapp"
            onPress={() => Linking.openURL('https://wa.me/123456789')}
          />
        </View>

        {/* 4. ResponsibleCard con Toggle del Estado Online */}
        <Text style={styles.sectionTitle}>3. ResponsibleCard (Tarjetas de Responsables)</Text>
        <View style={styles.showcaseBox}>
          <View style={styles.toggleRow}>
            <Text style={styles.elementLabel}>Cambiar estado del primer responsable:</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: testOnline ? '#22C55E' : '#9CA3AF' }]}
              onPress={() => setTestOnline(!testOnline)}
            >
              <Text style={styles.toggleBtnText}>
                {testOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </TouchableOpacity>
          </View>

          <ResponsibleCard
            name="Dr. Alejandro V."
            role="Director Médico"
            description="Responsable de la supervisión clínica y protocolos de atención al paciente."
            imageUrl={mockImage}
            isOnline={testOnline}
            onEmailPress={() => handleAction('Email', 'alejandro@atidental.com')}
            onPhonePress={() => handleAction('Teléfono', '+55501991')}
          />

          <Text style={styles.elementLabel}>Estado desconectado fijo (Dra. Sofia M.):</Text>
          <ResponsibleCard
            name="Dra. Sofia M."
            role="Gerente de Operaciones"
            description="Encargada de la logística diaria, recursos humanos y gestión de citas."
            imageUrl={{ uri: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&w=256&h=256&q=80' }}
            isOnline={false}
            onEmailPress={() => handleAction('Email', 'sofia@atidental.com')}
            onPhonePress={() => handleAction('Teléfono', '+55501992')}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F6F8',
  },
  scroll: {
    padding: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backBtnText: {
    color: '#5B2D8B',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Open Sans',
  },
  showcaseBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 12,
    marginBottom: 16,
  },
  elementLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Open Sans',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});
