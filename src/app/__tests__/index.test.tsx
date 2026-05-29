import React from 'react';
import { render } from '@testing-library/react-native';

import { generateAndShareClinicalPdf } from '@/lib/generate-and-share-clinical-pdf';

import HomeScreen from '../index';

jest.mock('@/lib/generate-and-share-clinical-pdf', () => ({
  generateAndShareClinicalPdf: jest.fn(),
}));

describe('HomeScreen', () => {
  it('muestra el PoC de reportes PDF sin generar al abrir', () => {
    const { getByLabelText } = render(<HomeScreen />);
    expect(getByLabelText('Generar PDF')).toBeTruthy();
    expect(generateAndShareClinicalPdf).not.toHaveBeenCalled();
  });
});
