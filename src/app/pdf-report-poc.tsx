import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { generateAndShareClinicalPdf } from '@/lib/generate-and-share-clinical-pdf';

type Status = 'idle' | 'generating' | 'sharing' | 'done' | 'error';

export default function PdfReportPocScreen() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPdfUri, setLastPdfUri] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  const handleGeneratePdf = useCallback(async () => {
    setErrorMessage(null);

    try {
      setStatus('sharing');
      const result = await generateAndShareClinicalPdf();

      setLastPdfUri(result.uri);
      setPageCount(result.numberOfPages);

      if (result.message) {
        setErrorMessage(result.message);
      }

      setStatus('done');
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Error al generar o compartir el PDF.',
      );
    }
  }, []);

  const isBusy = status === 'generating' || status === 'sharing';

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          PoC: Reportes PDF
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Pulsa el botón para generar el PDF y abrir el menú nativo de compartir (enviar a otras
          apps o guardar en el dispositivo).
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">Contenido del reporte (simulado)</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Tabla de accesos clínicos: usuario, acción, paciente y fecha.
          </ThemedText>
        </ThemedView>

        {isBusy ? (
          <ThemedView style={styles.loadingRow}>
            <ActivityIndicator color="#208AEF" />
            <ThemedText type="small" themeColor="textSecondary">
              {status === 'generating' ? 'Generando PDF…' : 'Abriendo menú de compartir…'}
            </ThemedText>
          </ThemedView>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Generar PDF"
            onPress={handleGeneratePdf}
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
            <ThemedText style={styles.buttonLabel}>Generar PDF</ThemedText>
          </Pressable>
        )}

        <ThemedView type="backgroundElement" style={styles.statusBox}>
          <ThemedText type="smallBold">Estado</ThemedText>
          <ThemedText type="small">Plataforma: {Platform.OS}</ThemedText>
          <ThemedText type="small">Fase: {status}</ThemedText>
          {pageCount != null && (
            <ThemedText type="small">Páginas generadas: {pageCount}</ThemedText>
          )}
          {lastPdfUri != null && (
            <ThemedText type="code" style={styles.uri}>
              {lastPdfUri}
            </ThemedText>
          )}
          {errorMessage != null && (
            <ThemedText type="small" style={styles.error}>
              {errorMessage}
            </ThemedText>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.three,
  },
  title: {
    marginTop: Spacing.three,
  },
  subtitle: {
    lineHeight: 20,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 48,
  },
  button: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonLabel: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  statusBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  uri: {
    fontSize: 10,
  },
  error: {
    color: '#c62828',
    marginTop: Spacing.one,
  },
});
