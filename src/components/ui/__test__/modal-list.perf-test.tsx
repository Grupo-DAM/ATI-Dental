import React from 'react';
import { measureRenders } from 'reassure';
import { ModalOptionList } from '@/components/ui/modal-option-list';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    text: '#111',
    pageTitle: '#111',
    pageSubtitle: '#666',
    backgroundElement: '#FFF',
    accentBackground: '#F3E8FF',
    logo: '#5B2D8B',
    fieldLabel: '#333',
  }),
}));

// Genera una lista de 200+ opciones simulando el selector de países
function generateCountryOptions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    name: `country-${i}`,
    label: `País ${i + 1}`,
    testID: `option-${i}`,
  }));
}

jest.setTimeout(120_000);

describe('ModalOptionList - Rendimiento con listas extensas', () => {
  it('Modal con 50 opciones se monta sin regresión', async () => {
    const options = generateCountryOptions(50);

    await measureRenders(
      <ModalOptionList
        visible={true}
        onRequestClose={jest.fn()}
        title="Seleccionar País"
        options={options}
        selectedOption="country-0"
        onSelectOption={jest.fn()}
      />,
      { runs: 10 },
    );
  });

  it('Modal con 200 opciones (caso real: países) se monta sin regresión', async () => {
    const options = generateCountryOptions(200);

    await measureRenders(
      <ModalOptionList
        visible={true}
        onRequestClose={jest.fn()}
        title="Seleccionar País"
        options={options}
        selectedOption="country-50"
        onSelectOption={jest.fn()}
      />,
      { runs: 10 },
    );
  });
});
