import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FormField } from '@/components/contact/form-field';

// Mock del hook useTheme
jest.mock('@/hooks/use-theme', () => ({
  useTheme: jest.fn(() => ({
    placeholderColor: '#9CA3AF',
    text: '#1F2937',
    error: '#EF4444',
  })),
}));

// Mock del generador de estilos
jest.mock('@/constants/styles/contact.styles', () => ({
  createFormFieldStyles: jest.fn(() => ({
    wrapper: { marginBottom: 12 },
    row: { flexDirection: 'row' },
    iconBox: { padding: 8 },
    input: { flex: 1 },
    rowError: { borderColor: 'red' },
    errorText: { color: 'red' },
  })),
}));

// Mock de Ionicons para verificar props sin renderizar vectores nativos
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('FormField Component', () => {
  const defaultProps = {
    iconName: 'mail-outline' as const,
    iconColor: '#3B82F6',
    value: '',
    onChangeText: jest.fn(),
    placeholder: 'Ingrese su email',
    testID: 'form-field-input',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el placeholder y el valor correctamente', () => {
    const { getByPlaceholderText, getByDisplayValue } = render(
      <FormField {...defaultProps} value="usuario@email.com" />
    );

    expect(getByPlaceholderText('Ingrese su email')).toBeTruthy();
    expect(getByDisplayValue('usuario@email.com')).toBeTruthy();
  });

  it('debe llamar a onChangeText cuando el usuario escribe en el input', () => {
    const onChangeTextMock = jest.fn();
    const { getByTestId } = render(
      <FormField {...defaultProps} onChangeText={onChangeTextMock} />
    );

    const input = getByTestId('form-field-input');
    fireEvent.changeText(input, 'nuevo@email.com');

    expect(onChangeTextMock).toHaveBeenCalledTimes(1);
    expect(onChangeTextMock).toHaveBeenCalledWith('nuevo@email.com');
  });

  it('no debe renderizar el mensaje de error si la prop error es undefined o vacía', () => {
    const { queryByText } = render(<FormField {...defaultProps} />);

    expect(queryByText(/⚠/i)).toBeNull();
  });

  it('debe renderizar el mensaje de error cuando la prop error está presente', () => {
    const errorMessage = 'El campo es obligatorio';
    const { getByText } = render(
      <FormField {...defaultProps} error={errorMessage} />
    );

    expect(getByText(`⚠ ${errorMessage}`)).toBeTruthy();
  });

  it('debe aplicar las props opcionales de teclado y capitalización al TextInput', () => {
    const { getByTestId } = render(
      <FormField
        {...defaultProps}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    );

    const input = getByTestId('form-field-input');

    expect(input.props.keyboardType).toBe('email-address');
    expect(input.props.autoCapitalize).toBe('none');
  });
});