import React, { useState } from 'react';
import { StyleSheet, Button, Alert } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

//Token JWT ficticio para la prueba (con payload: { usuario: "Valeria", rol: "Dentista", exp: 1811234500 })
const MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c3VhcmlvIjoiVmFsZXJpYSIsInJvbCI6IkRlbnRpc3RhIiwiZXhwIjoxODExMjM0NTAwfQ.mockSignature";

export default function JwtTestScreen() {
  const [userData, setUserData] = useState<any>(null);

  //Función para decodificar el Payload del JWT
  const decodeJWT = (token: string) => {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  };

  const handleDecode = () => {
    try {
      const decoded = decodeJWT(MOCK_JWT);
      setUserData(decoded);

      //Mostrar en consola y con alert()
      console.log("JWT Decodificado:", decoded);
      Alert.alert("Token Decodificado", `Usuario: ${decoded.usuario}\nRol: ${decoded.rol}`);
    } catch (error) {
      Alert.alert("Error", "No se pudo decodificar el token");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Spike: Decodificador JWT
      </ThemedText>

      <ThemedView type="backgroundElement" style={styles.tokenContainer}>
        <ThemedText type="code" style={styles.tokenLabel}>Token JWT Ficticio:</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
          {MOCK_JWT}
        </ThemedText>
      </ThemedView>

      <Button title="Decodificar Token" onPress={handleDecode} />

      {userData && (
        <ThemedView type="backgroundElement" style={styles.resultContainer}>
          <ThemedText type="default" style={styles.resultTitle}>
            Datos Decodificados del Cliente:
          </ThemedText>
          <ThemedText type="small">Usuario: {userData.usuario}</ThemedText>
          <ThemedText type="small">Rol: {userData.rol}</ThemedText>
          <ThemedText type="small">Expiración (exp): {userData.exp}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    justifyContent: 'center',
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  tokenContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  tokenLabel: {
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  resultContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
    gap: Spacing.one,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
});
