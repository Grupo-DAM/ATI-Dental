import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { SectionCard, PersonalDataSection } from '../index';

describe('SectionCard', () => {
  it('renders title and children correctly', () => {
    const { getByText } = render(
      <SectionCard title="Título de Prueba">
        <Text>Contenido Hijo</Text>
      </SectionCard>
    );

    expect(getByText('Título de Prueba')).toBeTruthy();
    expect(getByText('Contenido Hijo')).toBeTruthy();
  });

  it('renders with icon and headerRight', () => {
    const { getByTestId, getByText } = render(
      <SectionCard
        title="Sección con Icono"
        icon={<View testID="test-icon" />}
        headerRight={<Text>Acción</Text>}
      >
        <Text>Contenido</Text>
      </SectionCard>
    );

    expect(getByTestId('test-icon')).toBeTruthy();
    expect(getByText('Acción')).toBeTruthy();
  });

  it('applies cardSpacing and custom styles', () => {
    const { getByTestId } = render(
      <SectionCard
        testID="section-card-spacing"
        title="Con Espaciado"
        cardSpacing
        style={{ padding: 10 }}
      >
        <Text>Contenido</Text>
      </SectionCard>
    );

    const card = getByTestId('section-card-spacing');
    expect(card).toBeTruthy();
  });
});
