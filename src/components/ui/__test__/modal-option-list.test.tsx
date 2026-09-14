import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModalOptionList, ModalOptionProp } from '@/components/ui/modal-option-list'; // Ajusta la ruta a tu componente

// Mockear useTheme
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#FFF',
    pageTitle: '#000',
    accentBackground: '#EAEAEA',
    fieldLabel: '#333',
    logo: '#0052CC',
  }),
}));

// Mockear @expo/vector-icons para verificar la presencia del checkmark de forma limpia
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(Text, { testID: `icon-${props.name}` }, props.name),
  };
});

describe('Componente ModalOptionList', () => {
  const mockOnRequestClose = jest.fn();
  const mockOnSelectOption = jest.fn();

  const mockOptions: ModalOptionProp[] = [
    { name: 'usage', testID: 'opt-usage', label: 'Uso de App' },
    { name: 'dau_mau', testID: 'opt-dau-mau', label: 'Relación DAU/MAU' },
    { name: 'crash_rate', testID: 'opt-crash-rate', label: 'Tasa de Fallos' },
  ];

  const defaultProps = {
    visible: true,
    onRequestClose: mockOnRequestClose,
    title: 'Seleccionar Reporte',
    options: mockOptions,
    selectedOption: 'dau_mau',
    onSelectOption: mockOnSelectOption,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debe renderizar el contenido en pantalla si visible es false', () => {
    const { queryByText } = render(<ModalOptionList {...defaultProps} visible={false} />);
    expect(queryByText('Seleccionar Reporte')).toBeNull();
  });

  it('renderiza el título y todas las opciones provistas correctamente', () => {
    const { getByText } = render(<ModalOptionList {...defaultProps} />);

    expect(getByText('Seleccionar Reporte')).toBeTruthy();
    expect(getByText('Uso de App')).toBeTruthy();
    expect(getByText('Relación DAU/MAU')).toBeTruthy();
    expect(getByText('Tasa de Fallos')).toBeTruthy();
  });

  it('renderiza el icono de checkmark únicamente en la opción seleccionada', () => {
    const { queryAllByTestId } = render(<ModalOptionList {...defaultProps} />);

    // Solo debe haber 1 checkmark visible (el correspondiente a 'dau_mau')
    const checkmarkIcons = queryAllByTestId('icon-checkmark');
    expect(checkmarkIcons).toHaveLength(1);
  });

  it('ejecuta onSelectOption y onRequestClose al presionar una opción', () => {
    const { getByTestId } = render(<ModalOptionList {...defaultProps} />);

    fireEvent.press(getByTestId('opt-crash-rate'));

    expect(mockOnSelectOption).toHaveBeenCalledWith('crash_rate');
    expect(mockOnSelectOption).toHaveBeenCalledTimes(1);
    expect(mockOnRequestClose).toHaveBeenCalledTimes(1);
  });

  it('ejecuta onRequestClose cuando se presiona fuera del contenedor (overlay)', () => {
    const { getByText } = render(<ModalOptionList {...defaultProps} />);

    const titleElement = getByText('Seleccionar Reporte');
    const modalOverlay = titleElement.parent?.parent;

    if (modalOverlay) {
      fireEvent.press(modalOverlay);
      expect(mockOnRequestClose).toHaveBeenCalledTimes(1);
    }
  });

  it('ejecuta onRequestClose cuando el modal dispara su evento nativo de cierre', () => {
    const { UNSAFE_getByType } = render(<ModalOptionList {...defaultProps} />);
    const { Modal } = require('react-native');

    const modalComponent = UNSAFE_getByType(Modal);
    modalComponent.props.onRequestClose();

    expect(mockOnRequestClose).toHaveBeenCalledTimes(1);
  });

  it('cubre los valores por defecto cuando no se pasan propiedades opcionales o sin seleccionar', () => {
    const minimalProps = {
      onRequestClose: mockOnRequestClose,
      options: [
        { name: 'default_opt', label: 'Opción Defecto' }
      ],
      selectedOption: null,
      onSelectOption: mockOnSelectOption,
    };

    // Asignamos la desestructuración de getByText desde el render
    const { getByText } = render(
      // @ts-ignore para forzar probar los fallbacks por defecto
      <ModalOptionList {...minimalProps} visible={true} />
    );

    expect(getByText('Opción Defecto')).toBeTruthy();
  });
});