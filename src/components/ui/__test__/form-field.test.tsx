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

  it('renderiza etiqueta sin asterisco y selector con error', () => {
    render(<FormFieldLabel label="Notas" />);
    expect(screen.queryByText('*')).toBeNull();

    render(
      <FormSelectField
        testID="select-error"
        label="Género"
        required
        errorMessage="Selecciona una opción"
        valueLabel="Otro"
        onPress={jest.fn()}
        iconName="chevron-down"
      />,
    );
    expect(screen.getByText('Selecciona una opción')).toBeTruthy();
  });

  it('dispara el botón secundario y el primario con icono', () => {
    const onSecondary = jest.fn();
    const onPrimary = jest.fn();
    render(
      <>
        <FormActionButton
          testID="btn-cancel"
          variant="secondary"
          label="Cancelar"
          onPress={onSecondary}
          disabled
        />
        <FormActionButton
          testID="btn-ok"
          label="Guardar"
          onPress={onPrimary}
          iconName="person-add-outline"
        />
      </>,
    );

    fireEvent.press(screen.getByTestId('btn-ok'));
    expect(onPrimary).toHaveBeenCalled();
    expect(onSecondary).not.toHaveBeenCalled();
  });

  it('dispara el botón secundario habilitado y muestra carga secundaria', () => {
    const onSecondary = jest.fn();
    render(
      <>
        <FormActionButton
          testID="btn-cancel-ok"
          variant="secondary"
          label="Cancelar"
          onPress={onSecondary}
        />
        <FormActionButton
          testID="btn-cancel-icon"
          variant="secondary"
          label="Cancelar"
          onPress={jest.fn()}
          iconName="close-outline"
        />
        <FormActionButton
          testID="btn-cancel-loading"
          variant="secondary"
          label="Cancelar"
          onPress={jest.fn()}
          loading
        />
      </>,
    );

    fireEvent.press(screen.getByTestId('btn-cancel-ok'));
    expect(onSecondary).toHaveBeenCalled();
    expect(screen.getByTestId('btn-cancel-loading-loading')).toBeTruthy();
  });

  it('renderiza un textarea con icono', () => {
    render(
      <FormTextField
        testID="field-notes"
        label="Notas"
        multiline
        leadingIcon={<></>}
        value="ok"
        onChangeText={jest.fn()}
      />,
    );
    expect(screen.getByTestId('field-notes').props.value).toBe('ok');
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
