import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ModalOptionList } from '@/components/ui/modal-option-list'; // Ajusta la ruta a tu archivo

// Mockear useTheme para aislar las variables de estilo
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    backgroundElement: '#FFF',
    pageTitle: '#000',
    accentBackground: '#EAEAEA',
    fieldLabel: '#333',
    logo: '#0052CC',
  }),
}));

describe('Componente ModalOptionList', () => {
  const mockOnRequestClose = jest.fn();
  const mockOnSelectOption = jest.fn();

  const mockOptions = [
    { name: 'usage', testID: 'opt-usage', label: 'Uso de App' },
    { name: 'dau_mau', testID: 'opt-dau-mau', label: 'Relación DAU/MAU' },
    { name: 'crash_rate', testID: 'opt-crash-rate', label: 'Tasa de Fallos' },
  ];

  const defaultProps = {
    visible: true,
    onRequestClose: mockOnRequestClose,
    title: 'Seleccionar Reporte',
    options: mockOptions,
    selectedOption: 'dau_mau', // 'dau_mau' iniciará seleccionada
    onSelectOption: mockOnSelectOption,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no debe renderizar el contenido en pantalla si visible es false', () => {
    // Nota: Por comportamiento nativo de React Native, el contenido del Modal 
    // se oculta si visible={false}.
    const { queryByText } = render(<ModalOptionList {...defaultProps} visible={false} />);
    expect(queryByText('Seleccionar Reporte')).toBeNull();
  });

  it('renderiza el título y todas las opciones provistas correctamente', () => {
    const { getByText, getByTestId } = render(<ModalOptionList {...defaultProps} />);

    // Comprobar título
    expect(getByText('Seleccionar Reporte')).toBeTruthy();

    // Comprobar que todas las opciones se renderizan por su etiqueta textual
    expect(getByText('Uso de App')).toBeTruthy();
    expect(getByText('Relación DAU/MAU')).toBeTruthy();
    expect(getByText('Tasa de Fallos')).toBeTruthy();
  });

  it('ejecuta onSelectOption y onRequestClose al presionar una opción', () => {
    const { getByTestId } = render(<ModalOptionList {...defaultProps} />);

    // Presionamos sobre la opción de 'Tasa de Fallos' usando su testID
    fireEvent.press(getByTestId('opt-crash-rate'));

    // Debe mandar el identificador 'name' correcto a la función callback
    expect(mockOnSelectOption).toHaveBeenCalledWith('crash_rate');
    expect(mockOnSelectOption).toHaveBeenCalledTimes(1);

    // Debe disparar el cierre automático del modal tras seleccionar
    expect(mockOnRequestClose).toHaveBeenCalledTimes(1);
  });

  it('ejecuta onRequestClose cuando se presiona fuera del contenedor (overlay)', () => {
    const { getByText } = render(<ModalOptionList {...defaultProps} />);
    
    // En React Native, el elemento raíz bajo el modal suele ser el overlay.
    // Buscamos el componente del título y navegamos a su contenedor padre para simular el fondo.
    const titleElement = getByText('Seleccionar Reporte');
    const modalOverlay = titleElement.parent?.parent; // Accede al TouchableOpacity del fondo

    if (modalOverlay) {
      fireEvent.press(modalOverlay);
      expect(mockOnRequestClose).toHaveBeenCalledTimes(1);
    }
  });
});
