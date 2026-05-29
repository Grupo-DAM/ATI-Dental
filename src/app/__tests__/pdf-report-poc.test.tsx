import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { generateAndShareClinicalPdf } from '@/lib/generate-and-share-clinical-pdf';

import PdfReportPocScreen from '../pdf-report-poc';

jest.mock('@/lib/generate-and-share-clinical-pdf', () => ({
  generateAndShareClinicalPdf: jest.fn(),
}));

describe('PdfReportPocScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (generateAndShareClinicalPdf as jest.Mock).mockResolvedValue({
      uri: 'file:///cache/report.pdf',
      numberOfPages: 1,
      shared: true,
    });
  });

  it('muestra el botón Generar PDF al abrir', () => {
    const { getByLabelText } = render(<PdfReportPocScreen />);
    expect(getByLabelText('Generar PDF')).toBeTruthy();
    expect(generateAndShareClinicalPdf).not.toHaveBeenCalled();
  });

  it('genera el PDF y abre compartir al pulsar el botón', async () => {
    const { getByLabelText, getByText } = render(<PdfReportPocScreen />);

    fireEvent.press(getByLabelText('Generar PDF'));

    await waitFor(() => {
      expect(generateAndShareClinicalPdf).toHaveBeenCalledTimes(1);
      expect(getByText(/Páginas generadas: 1/)).toBeTruthy();
    });
  });
});
