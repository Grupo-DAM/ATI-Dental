import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Clipboard, Linking } from 'react-native';
import ContactsScreen from '../app/(tabs)/contacts';
import renderer from 'react-test-renderer';

// Mocking dependencies
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({ isConnected: true }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'es' },
    t: (key: string, options?: any) => {
      if (key === 'contacts.title') return 'Información y Contacto';
      if (key === 'contacts.responsibles') return 'Responsables del Sitio';
      if (key === 'contacts.alerts.emailTitle') return 'Contacto por Email';
      if (key === 'contacts.alerts.emailError') return 'No se pudo abrir el gestor de correo';
      if (key === 'contacts.alerts.phoneTitle') return 'Llamada Telefónica';
      if (key === 'contacts.alerts.phoneError') return 'Este dispositivo no admite llamadas telefónicas';
      if (key === 'contacts.alerts.copyToClipboard') return 'Copiar al Portapapeles';
      if (key === 'contacts.alerts.copiedTitle') return 'Copiado';
      if (key === 'contacts.alerts.copiedEmail') return 'Dirección de correo copiada al portapapeles.';
      if (key === 'contacts.alerts.copiedPhone') return 'Número copiado al portapapeles.';
      if (key === 'contacts.alerts.error') return 'Error';
      if (key === 'contacts.alerts.whatsappError') return 'No se pudo abrir la aplicación de WhatsApp ni el navegador.';
      if (key === 'contacts.alerts.socialError') return `No se pudo abrir el enlace de ${options?.platform}`;
      if (key === 'contacts.socialActivity') return 'Actividad en Redes Sociales';
      if (key === 'contacts.socialFallback') return 'No pudimos cargar las publicaciones recientes.';
      if (key === 'contacts.openInstagram') return 'Abrir Instagram';
      if (key === 'contacts.openFacebook') return 'Abrir Facebook';
      return key;
    }
  }),
}));

export const mockOnSnapshot = jest.fn((onSuccess: any, onError: any) => {
  // Mock for collection('responsibles')
  onSuccess({
    docs: [
      { id: '1', data: () => ({ name: 'Dr. Alejandro V.', role: 'Director Médico', imageUrl: 'http://' }) },
      { id: '2', data: () => ({ name: 'Dra. Sofia M.', role: 'Gerente de Operaciones', imageUrl: 'http://' }) },
      { id: '3', data: () => ({ name: 'Ing. Carlos R.', role: 'Soporte Técnico', imageUrl: 'http://' }) },
    ],
    metadata: { fromCache: false },
  });
  return jest.fn();
});

export const mockDocOnSnapshot = jest.fn((onSuccess: any, onError: any) => {
  // Mock for doc('contacto') — exists is exposed both as a method and property
  // to match the compatibility shim in update-contact-info.tsx
  onSuccess({
    exists: () => true,
    data: () => ({ email: 'admin@ejemplo.com', telefono: '+123456789', whatsapp: '+123456789' }),
  });
  return jest.fn();
});

const socialDocs = [
  { id: 'ig-1', data: () => ({ network: 'instagram', title: '¡Nueva tecnología en clínica!', content: 'Incorporamos escáneres 3D.', publishedAt: 'Hace 2 horas', imageUrl: 'http://ig1', url: 'https://instagram.com/ati_dental' }) },
  { id: 'ig-2', data: () => ({ network: 'instagram', title: 'Sonrisas que inspiran', content: 'Gracias por confiar.', publishedAt: 'Hace 1 día', imageUrl: 'http://ig2', url: 'https://instagram.com/p/2' }) },
  { id: 'ig-3', data: () => ({ network: 'instagram', title: 'Horarios extendidos', content: 'Sábados hasta las 2:00 PM.', publishedAt: 'Hace 3 días', imageUrl: 'http://ig3', url: 'https://instagram.com/p/3' }) },
  { id: 'fb-1', data: () => ({ network: 'facebook', author: 'ATI Dental', content: 'Agenda tu limpieza dental.', publishedAt: 'Hoy', url: 'https://facebook.com/ATIDentalOficial' }) },
  { id: 'fb-2', data: () => ({ network: 'facebook', author: 'ATI Dental', content: 'Feliz día del odontólogo.', publishedAt: 'Ayer', url: 'https://facebook.com/ATIDentalOficial/posts/2' }) },
  { id: 'fb-3', data: () => ({ network: 'facebook', author: 'ATI Dental', content: 'Artículo de salud gingival.', publishedAt: '30 Oct', url: 'https://facebook.com/ATIDentalOficial/posts/3' }) },
];

export const mockSocialOnSnapshot = jest.fn((onSuccess: any) => {
  onSuccess({ docs: socialDocs, metadata: { fromCache: false } });
  return jest.fn();
});

jest.mock('@/config/firebase', () => ({
  firestore: () => ({
    collection: (col: string) => {
      if (col === 'publicaciones_sociales') {
        return { onSnapshot: (...args: any[]) => mockSocialOnSnapshot(...args) };
      }
      return {
        onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
        doc: () => ({
          onSnapshot: (...args: any[]) => mockDocOnSnapshot(...args),
        }),
      };
    },
  }),
}));

describe('ContactsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(true);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ posts: [] }),
    }) as typeof fetch;
  });

  it('debe renderizar correctamente todos los títulos y responsables', () => {
    const { getAllByText, getByText } = render(<ContactsScreen />);
    
    expect(getAllByText('Información y Contacto').length).toBeGreaterThan(0);
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

  it('debe manejar error al abrir email (Linking.canOpenURL = false) y permitir copiar al portapapeles', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    const { getByTestId } = render(<ContactsScreen />);
    const emailBtn = getByTestId('btn-contact-email');
    fireEvent.press(emailBtn);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Contacto por Email',
        expect.stringContaining('No se pudo abrir el gestor de correo'),
        expect.any(Array)
      );
    });

    const buttons = alertSpy.mock.calls[0][2];
    const copyBtn = buttons.find(b => b.text === 'Copiar al Portapapeles');
    expect(copyBtn).toBeDefined();
    
    copyBtn.onPress();
    expect(Clipboard.setString).toHaveBeenCalledWith('admin@ejemplo.com');
    expect(alertSpy).toHaveBeenLastCalledWith('Copiado', 'Dirección de correo copiada al portapapeles.');
  });

  it('debe manejar error al abrir email (Linking.canOpenURL lanza excepcion) y permitir copiar', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockRejectedValue(new Error('error canOpenURL'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    const { getByTestId } = render(<ContactsScreen />);
    const emailBtn = getByTestId('btn-contact-email');
    fireEvent.press(emailBtn);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Contacto por Email',
        expect.stringContaining('No se pudo abrir el gestor de correo'),
        expect.any(Array)
      );
    });
  });

  it('debe manejar error al hacer llamada (Linking.canOpenURL = false) y permitir copiar al portapapeles', async () => {
    jest.spyOn(Linking, 'canOpenURL').mockResolvedValue(false);
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    const { getByTestId } = render(<ContactsScreen />);
    const phoneBtn = getByTestId('btn-contact-phone');
    fireEvent.press(phoneBtn);
    
    await waitFor(() => {
      expect(Linking.canOpenURL).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        'Llamada Telefónica',
        expect.stringContaining('Este dispositivo no admite llamadas telefónicas'),
        expect.any(Array)
      );
    });

    const buttons = alertSpy.mock.calls[0][2];
    const copyBtn = buttons.find(b => b.text === 'Copiar al Portapapeles');
    expect(copyBtn).toBeDefined();
    
    copyBtn.onPress();
    expect(Clipboard.setString).toHaveBeenCalledWith('+123456789');
    expect(alertSpy).toHaveBeenLastCalledWith('Copiado', 'Número copiado al portapapeles.');
  });

  it('debe manejar error al abrir WhatsApp (Linking.openURL lanza error)', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('WhatsApp error'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    const { getByTestId } = render(<ContactsScreen />);
    const waBtn = getByTestId('btn-contact-whatsapp');
    fireEvent.press(waBtn);
    
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Error', 'No se pudo abrir la aplicación de WhatsApp ni el navegador.');
    });
  });

  it('debe abrir la URL de Instagram al presionar el canal de Instagram', async () => {
    const { findAllByText } = render(<ContactsScreen />);
    const instagramBtn = (await findAllByText('Instagram'))[0];
    fireEvent.press(instagramBtn);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('instagram')
      );
    });
  });

  it('debe abrir la URL de Facebook al presionar el canal de Facebook', async () => {
    const { findAllByText } = render(<ContactsScreen />);
    const facebookBtn = (await findAllByText('Facebook'))[0];
    fireEvent.press(facebookBtn);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('facebook')
      );
    });
  });

  it('debe manejar error al abrir redes sociales (Linking.openURL lanza error)', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Social error'));
    const alertSpy = jest.spyOn(Alert, 'alert');
    
    const { findAllByText } = render(<ContactsScreen />);
    const instagramBtn = (await findAllByText('Instagram'))[0];
    fireEvent.press(instagramBtn);

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith('Error', expect.stringContaining('No se pudo abrir el enlace de instagram'));
    });
  });

  it('debe abrir la URL de Instagram al presionar una tarjeta de publicación de Instagram', async () => {
    const { findByTestId } = render(<ContactsScreen />);
    fireEvent.press(await findByTestId('social-instagram-post-0'));

    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('instagram')
      );
    });
  });

  it('debe llamar a handleEmailPress e handlePhonePress desde una tarjeta de responsable', async () => {
    const { getAllByTestId } = render(<ContactsScreen />);
    const emailQuickBtns = getAllByTestId('btn-quick-email');
    const phoneQuickBtns = getAllByTestId('btn-quick-phone');
    
    fireEvent.press(emailQuickBtns[0]);
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('mailto:admin@ejemplo.com')
      );
    });

    fireEvent.press(phoneQuickBtns[0]);
    await waitFor(() => {
      expect(Linking.openURL).toHaveBeenCalledWith(
        expect.stringContaining('tel:+123456789')
      );
    });
  });

  it('muestra fallback de perfiles oficiales si el feed social falla', async () => {
    mockSocialOnSnapshot.mockImplementationOnce((_ok: any, onError: any) => {
      onError?.(new Error('feed down'));
      return jest.fn();
    });

    const { findByTestId } = render(<ContactsScreen />);
    expect(await findByTestId('social-feed-fallback')).toBeTruthy();
    expect(await findByTestId('social-fallback-instagram')).toBeTruthy();
    expect(await findByTestId('social-fallback-facebook')).toBeTruthy();
  });

  it('debe manejar error al obtener responsables desde firestore', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockOnSnapshot.mockImplementationOnce((onSuccess: any, onError: any) => {
      if (onError) {
        onError(new Error('Firestore error'));
      }
      return jest.fn();
    });

    render(<ContactsScreen />);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching responsibles: ", expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('Coincide con la instantánea (Snapshot Test)', async () => {
    let tree;
    await act(async () => {
      tree = renderer.create(<ContactsScreen />);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(tree!.toJSON()).toMatchSnapshot();
  });
});
