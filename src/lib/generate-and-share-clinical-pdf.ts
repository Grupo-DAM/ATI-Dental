import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { buildClinicalReportHtml } from '@/lib/clinical-report-html';

export type GenerateAndShareResult = {
  uri: string;
  numberOfPages: number;
  shared: boolean;
  message?: string;
};

export async function generateAndShareClinicalPdf(
  generatedAt = new Date().toLocaleString('es-ES'),
): Promise<GenerateAndShareResult> {
  const html = buildClinicalReportHtml(generatedAt);
  const { uri, numberOfPages } = await Print.printToFileAsync({
    html,
    width: 612,
    height: 792,
  });

  if (Platform.OS === 'web') {
    return {
      uri,
      numberOfPages,
      shared: false,
      message:
        'En web, printToFileAsync abre el diálogo de impresión del navegador. Compartir el PDF local por URI no está soportado; prueba en Android o iOS.',
    };
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: 'com.adobe.pdf',
    dialogTitle: 'Compartir reporte ATI-Dental',
  });

  return { uri, numberOfPages, shared: true };
}
