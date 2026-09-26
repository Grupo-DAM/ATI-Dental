import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { AppHeader } from '../app-header';
import { Breadcrumb } from '../breadcrumb';
import { ContactButton } from '../contact/contact-button';
import { ResponsibleCard } from '../contact/responsible-card';

// Mock dependencies
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

describe('Módulo de Contacto - Componentes Reutilizables', () => {
  describe('AppHeader Component', () => {
    it('debe renderizar el título de la cabecera por defecto', () => {
      render(<AppHeader />);
      expect(screen.getByText('ATI Dental')).toBeTruthy();
    });

    it('debe renderizar un título personalizado', () => {
      render(<AppHeader title="Mi Cabecera" />);
      expect(screen.getByText('Mi Cabecera')).toBeTruthy();
    });

    it('debe llamar a onMenuPress al presionar el botón de menú', () => {
      const mockMenuPress = jest.fn();
      const { getByTestId } = render(<AppHeader onMenuPress={mockMenuPress} />);
      
      const menuBtn = getByTestId('menu-btn');
      fireEvent.press(menuBtn);
      
      expect(mockMenuPress).toHaveBeenCalledTimes(1);
    });

    it('debe navegar a /contacts si no se proporciona onMenuPress', () => {
      mockPush.mockClear();
      const { getByTestId } = render(<AppHeader />);
      
      const menuBtn = getByTestId('menu-btn');
      fireEvent.press(menuBtn);
      
      expect(mockPush).toHaveBeenCalledWith('/contacts');
    });
  });

  describe('Breadcrumb Component', () => {
    it('debe renderizar las secciones parent y current del rastro de navegación', () => {
      render(<Breadcrumb parent="Sección A" current="Sección B" />);
      expect(screen.getByText('Sección A')).toBeTruthy();
      expect(screen.getByText('Sección B')).toBeTruthy();
    });
  });

  describe('ContactButton Component', () => {
    it.each([
      { type: 'email' as const, label: 'Enviar Correo', testId: 'btn-contact-email' },
      { type: 'phone' as const, label: 'Llamada', testId: 'btn-contact-phone' },
      { type: 'whatsapp' as const, label: 'WhatsApp', testId: 'btn-contact-whatsapp' },
    ])('debe renderizar correctamente según el tipo "$type"', ({ type, label, testId }) => {
      const mockPress = jest.fn();
      render(<ContactButton type={type} onPress={mockPress} />);
      
      expect(screen.getByText(label)).toBeTruthy();
      const btn = screen.getByTestId(testId);
      fireEvent.press(btn);
      expect(mockPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('ResponsibleCard Component', () => {
    const defaultProps = {
      name: 'Dr. John Doe',
      role: 'Cirujano Dentista',
      description: 'Especialista en cirugía maxilofacial.',
      imageUrl: { uri: 'https://example.com/photo.jpg' },
      isOnline: true,
      onEmailPress: jest.fn(),
      onPhonePress: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('debe mostrar el nombre, rol y descripción correctamente', () => {
      render(<ResponsibleCard {...defaultProps} />);
      
      expect(screen.getByText(defaultProps.name)).toBeTruthy();
      expect(screen.getByText(defaultProps.role)).toBeTruthy();
      expect(screen.getByText(defaultProps.description)).toBeTruthy();
    });

    it('debe mostrar el indicador de estado en línea correcto', () => {
      const { getByTestId, rerender } = render(<ResponsibleCard {...defaultProps} />);
      expect(getByTestId('status-online')).toBeTruthy();

      rerender(<ResponsibleCard {...defaultProps} isOnline={false} />);
      expect(getByTestId('status-offline')).toBeTruthy();
    });

    it('debe activar las funciones onEmailPress y onPhonePress al presionar sus respectivos accesos rápidos', () => {
      const { getByTestId } = render(<ResponsibleCard {...defaultProps} />);
      
      const emailBtn = getByTestId('btn-quick-email');
      fireEvent.press(emailBtn);
      expect(defaultProps.onEmailPress).toHaveBeenCalledTimes(1);

      const phoneBtn = getByTestId('btn-quick-phone');
      fireEvent.press(phoneBtn);
      expect(defaultProps.onPhonePress).toHaveBeenCalledTimes(1);
    });
  });
});
