import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import auth from '@react-native-firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { OTPModal } from '../components/OTPModal';
import { Image } from 'expo-image';
import { Colors } from '../constants/theme';


export default function ProfileScreen() {
  // Estados del formulario
  const [name, setName] = useState('John');
  const [lastName, setLastName] = useState('Smith');
  const [email, setEmail] = useState('dr.smith@atidental.com');
  const [phone, setPhone] = useState('+34 600 000 000');
  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [language, setLanguage] = useState('es');

  // Lógica de guardado TDD
  const handleSave = async () => {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Formato de correo inválido');
      return;
    }

    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      Alert.alert('Error', 'Sin conexión a internet');
      return;
    }

    try {
      const user = auth().currentUser;
      if (user && email !== user.email) {
        await user.updateEmail(email);
        setShowModal(true);
      }
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado en otra cuenta.');
      }
    }
  };

  const handleConfirmOtp = async (code: string) => {
    if (code === '123456') {
      const token = await auth().currentUser?.getIdToken(true);
      if (token) {
        await SecureStore.setItemAsync('userToken', token);
        setShowModal(false);
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>

      {/* 1. HEADER MORADO */}
      <View style={styles.header}>

        {/* Menú Hamburguesa a la Izquierda */}
        <Ionicons name="menu" size={36} color="white" />

        {/* Logo y Texto Apilados a la Derecha */}
        <View style={{ alignItems: 'center' }}>
          <Image
            source={require('../../assets/expo.icon/Assets/logo-dental.svg')}
            style={{ width: 28, height: 28, marginBottom: 2 }}
            contentFit="contain"
            tintColor="white"
          />
          <Text style={[styles.headerTitle, { fontSize: 14, fontWeight: 'bold' }]}>
            ATI Dental
          </Text>
        </View>

      </View>


      <ScrollView style={{ flex: 1 }}>

        {/* 2. BREADCRUMB */}
        <View style={styles.breadcrumbContainer}>
          <Text style={styles.breadcrumbGray}>Pacientes</Text>
          <Text style={styles.breadcrumbChevron}>   ›   </Text>
          <Text style={styles.breadcrumbPurple}>Perfil e Idioma</Text>
        </View>

        {/* 3. TÍTULO PRINCIPAL */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Perfil e Idioma</Text>
          <Text style={styles.subtitle}>
            Administra tu información personal y las preferencias de idioma del sistema.
          </Text>
        </View>

        {/* 4. TARJETA DE INFORMACIÓN PERSONAL */}
        <View style={styles.cardContainer}>

          <View style={styles.cardHeader}>
            <Ionicons name="person" size={24} color={Colors.light.main} style={{ marginRight: 10 }} />
            <Text style={styles.cardHeaderTitle}>Información Personal</Text>
          </View>

          <View style={styles.cardBody}>
            {/* AVATAR */}
            <View style={styles.avatarRow}>

              {/* Aquí usamos la imagen de tu carpeta assets */}
              <Image
                source={require('../../assets/expo.icon/Assets/avatar.png')}
                style={{ width: 80, height: 80, borderRadius: 40 }}
                contentFit="cover"
              />
              <View style={{ marginLeft: 16 }}>
                <Text style={styles.avatarLabel}>Foto de Perfil</Text>
                <View style={styles.avatarButtonsRow}>
                  <TouchableOpacity style={styles.btnCambiar}>
                    <Text style={styles.btnCambiarText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text style={styles.btnEliminarText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.avatarHelpText}>JPG, GIF o PNG. Max 1MB.</Text>
              </View>
            </View>

            {/* INPUTS */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            <Text style={styles.label}>Apellidos</Text>
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />

            <Text style={styles.label}>Correo Electrónico</Text>
            <View style={[styles.inputWithIcon, error ? { borderColor: '#E53E3E' } : {}]}>
              <Image
                source={require('../../assets/expo.icon/Assets/email.svg')}
                style={{ width: 18, height: 18, marginRight: 10 }}
                contentFit="contain"
                tintColor="#A0AEC0" // Para que quede del gris exacto del diseño
              />
              <TextInput
                testID="input-email"
                value={email}
                onChangeText={setEmail}
                style={{ flex: 1, height: '100%', fontSize: 15, color: '#2D3748' }}
                autoCapitalize="none"
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Teléfono</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} />

            <Text style={styles.label}>Bio Profesional</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Breve descripción para el perfil público."
              placeholderTextColor="#A0AEC0"
              multiline
            />
          </View>{/* ← CIERRA cardBody AQUÍ */}
        </View>
        {/* TARJETA DE IDIOMA */}
        <View style={[styles.cardContainer, { marginTop: 20 }]}>
          <View style={styles.cardHeader}>
            <Image
              source={require('../../assets/expo.icon/Assets/language.svg')}
              style={{ width: 24, height: 24, marginRight: 10 }}
              contentFit="contain"
              tintColor={Colors.light.main}
            />
            <Text style={styles.cardHeaderTitle}>Idioma de la Interfaz</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={{ fontSize: 14, color: '#718096', marginBottom: 20, lineHeight: 20 }}>
              Selecciona el idioma preferido para la interfaz del sistema ATI Dental.
            </Text>

            <TouchableOpacity
              style={[styles.languageOption, language === 'es' && { borderColor: Colors.light.main, borderWidth: 2 }]}
              onPress={() => setLanguage('es')}
            >
              <View>
                <Text style={styles.languageTitle}>Español</Text>
                <Text style={styles.languageSubtitle}>Idioma predeterminado para México y Latam.</Text>
              </View>
              {language === 'es' && (
                <Image
                  source={require('../../assets/expo.icon/Assets/check_circle.svg')}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                  tintColor={Colors.light.main}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && { borderColor: Colors.light.main, borderWidth: 2 }]}
              onPress={() => setLanguage('en')}
            >
              <View>
                <Text style={styles.languageTitle}>English (Inglés)</Text>
                <Text style={styles.languageSubtitle}>Standard interface language.</Text>
              </View>
              {language === 'en' && <Ionicons name="checkmark-circle" size={24} color={Colors.light.header} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* BOTONES FINALES */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 30, marginBottom: 20, paddingHorizontal: 20 }}>
          <TouchableOpacity style={{ borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 6, paddingVertical: 12, paddingHorizontal: 20, marginRight: 15, backgroundColor: 'white' }}>
            <Text style={{ color: '#4A5568', fontWeight: '600', fontSize: 15 }}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-save" onPress={handleSave} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.main, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 20 }}>
            <Image
              source={require('../../assets/expo.icon/Assets/save-icon.svg')}
              style={{ width: 18, height: 18, marginRight: 8 }}
              contentFit="contain"
              tintColor="white"
            />
            <Text style={{ color: 'white', fontWeight: '600', fontSize: 15 }}>Guardar Cambios</Text>
          </TouchableOpacity>
        </View>

    {/* Espaciado al final para que no lo tape la barra de navegación */ }
    < View style = {{ height: 40 }
} />
      </ScrollView >

  <OTPModal visible={showModal} onConfirm={handleConfirmOtp} onCancel={() => setShowModal(false)} />
    </View >
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.light.header, // <-- Usa el Theme
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },
  headerTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  breadcrumbContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  breadcrumbGray: { color: '#718096', fontSize: 14 },
  breadcrumbChevron: { color: '#CBD5E0', fontSize: 14 },
  breadcrumbPurple: { color: Colors.light.header, fontSize: 14, fontWeight: '600' }, // <-- Usa el Theme

  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },

  cardContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EDF2F7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
    backgroundColor: '#F9FAFB',
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  cardBody: {
    padding: 20,
  },

  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarLabel: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginBottom: 8 },
  avatarButtonsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  btnCambiar: {
    borderWidth: 1, borderColor: '#CBD5E0',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6,
    marginRight: 15,
  },
  btnCambiarText: { color: '#4A5568', fontSize: 14 },
  btnEliminarText: { color: '#E53E3E', fontSize: 14 },
  avatarHelpText: { fontSize: 12, color: '#A0AEC0' },

  label: {
    fontSize: 14, fontWeight: '600', color: '#4A5568',
    marginTop: 15, marginBottom: 8,
  },
  input: {
    borderWidth: 1, borderColor: '#CBD5E0',
    borderRadius: 6, paddingHorizontal: 12,
    height: 46, // <--- ALTURA FIJA PARA TODOS
    fontSize: 15, color: '#2D3748',
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#CBD5E0',
    borderRadius: 6, paddingHorizontal: 12,
    height: 46, // <--- EXACTAMENTE LA MISMA ALTURA FIJA
  },

  errorText: { color: '#E53E3E', fontSize: 12, marginTop: 4 },

  saveButton: {
    backgroundColor: Colors.light.header, // <-- Usa el Theme
    paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', marginTop: 30,
  },
  saveButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },

  languageOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 8,
    padding: 15, marginBottom: 15,
  },
  languageTitle: { fontSize: 15, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  languageSubtitle: { fontSize: 13, color: '#718096' },

});

