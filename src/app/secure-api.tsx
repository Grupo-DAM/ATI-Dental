import React, { useState } from 'react';
import { StyleSheet, Button, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// URL de tu Worker en internet
const PROXY_URL = "https://secure-proxy.ati-dental-poc.workers.dev";

export default function SecureApiScreen() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const fetchSecureData = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch(PROXY_URL);
      const json = await res.json();
      setResponse(json);
    } catch (error) {
      setResponse({ status: "error", message: "Error al conectar con la capa de orquestación" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Spike: Conexión Segura
      </ThemedText>

      <Button title="Consultar Orquestador" onPress={fetchSecureData} disabled={loading} />

      {loading && <ActivityIndicator size="large" color="#3c87f7" style={{ marginTop: 20 }} />}

      {response && (
        <ThemedView type="backgroundElement" style={styles.resultBox}>
          <ThemedText type="smallBold">Respuesta del Servidor:</ThemedText>
          <ThemedText type="code" style={styles.responseText}>
            {JSON.stringify(response, null, 2)}
          </ThemedText>
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
    marginBottom: Spacing.four,
  },
  resultBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    marginTop: Spacing.three,
  },
  responseText: {
    marginTop: Spacing.two,
    fontSize: 11,
  },
});
