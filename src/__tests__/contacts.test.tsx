import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Clipboard, Linking } from 'react-native';
import ContactsScreen from '../app/(tabs)/contacts';
import renderer from 'react-test-renderer';

// Mocking dependencies
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    main: '#5B2D8B',
    text: '#141018',
    textSecondary: '#60646C',
    header: '#52287D',
  }),
}));

describe('ContactsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
  });

  it('debe renderizar correctamente todos los títulos y responsables', () => {
    const { getByText } = render(<ContactsScreen />);
    
    expect(getByText('Información y Contacto')).toBeTruthy();
    expect(getByText('Responsables del Sitio')).toBeTruthy();
    expect(getByText('Dr. Alejandro V.')).toBeTruthy();
    expect(getByText('Dra. Sofia M.')).toBeTruthy();
    expect(getByText('Ing. Carlos R.')).toBeTruthy();
  });

  it('debe ejecutar la llamada por email al presionar el botón correspondiente', async () => {
    const { getByTestId } = render(<ContactsScreen />);
    
    const emailBtn = getByTestId('btn-contact-email');
    fireEvent.press(emailBtn);

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('mailto:admin@ejemplo.com')
      );
    });
  });

  it('debe ejecutar la llamada telefónica al presionar el botón correspondiente', async () => {
    const { getByTestId } = render(<ContactsScreen />);
    
    const phoneBtn = getByTestId('btn-contact-phone');
    fireEvent.press(phoneBtn);

    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('tel:+123456789')
      );
    });
  });

  it('debe abrir la URL de WhatsApp al presionar el botón correspondiente', async () => {
    const { getByTestId } = render(<ContactsScreen />);
    
    const waBtn = getByTestId('btn-contact-whatsapp');
    fireEvent.press(waBtn);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/')
      );
    });
  });

  it('Coincide con la instantánea (Snapshot Test)', () => {
    let tree;
    act(() => {
      tree = renderer.create(<ContactsScreen />).toJSON();
    });
    expect(tree).toMatchSnapshot();
  });
});
