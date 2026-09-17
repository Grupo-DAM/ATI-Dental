import React from 'react';
import renderer from 'react-test-renderer';
import { fireEvent, render, screen } from '@testing-library/react-native';

import {
  FormActionButton,
  FormFieldLabel,
  FormSelectField,
  FormTextField,
} from '@/components/ui/form-field';

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    textNames: '#4A4A4A',
    fieldLabel: '#374151',
    placeholderColor: '#9E8BAC',
    cardSeparator: '#D1D5DB',
    backgroundElement: '#ffffff',
    error: '#BA1A1A',
    main: '#5B2D8B',
    overMain: '#ffffff',
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');
  return {
    Ionicons: (props: { name: string; testID?: string }) => (
      <Text testID={props.testID ?? `icon-${props.name}`}>{props.name}</Text>
    ),
  };
});

describe('FormField components', () => {
  it('marca los campos obligatorios', () => {
    render(<FormFieldLabel label="Nombre" required />);
    expect(screen.getByText(/Nombre/)).toBeTruthy();
    expect(screen.getByText('*')).toBeTruthy();
  });

  it('muestra el estado de error del input', () => {
    render(
      <FormTextField
        testID="field-name"
        label="Nombre"
        required
        errorMessage="Campo requerido"
        value=""
        onChangeText={jest.fn()}
      />,
    );

    expect(screen.getByText('Campo requerido')).toBeTruthy();
  });

  it('dispara onPress del selector', () => {
    const onPress = jest.fn();
    render(
      <FormSelectField
        testID="select-gender"
        label="Género"
        valueLabel="Seleccionar..."
        isPlaceholder
        onPress={onPress}
        iconName="chevron-down"
      />,
    );

    fireEvent.press(screen.getByTestId('select-gender'));
    expect(onPress).toHaveBeenCalled();
  });

  it('muestra carga en el botón primario', () => {
    render(
      <FormActionButton
        testID="btn-save"
        label="Guardar"
        onPress={jest.fn()}
        loading
      />,
    );

    expect(screen.getByTestId('btn-save-loading')).toBeTruthy();
  });

  it('genera snapshot del campo con error', () => {
    const tree = renderer
      .create(
        <FormTextField
          testID="snapshot-field"
          label="Nombre"
          required
          errorMessage="Campo requerido"
          value=""
          onChangeText={jest.fn()}
        />,
      )
      .toJSON();

    expect(tree).toMatchSnapshot();
  });
});
